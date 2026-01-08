/**
 * Pitch Detector
 *
 * Real-time pitch detection using autocorrelation-based algorithms.
 * Optimized for vocal frequency range and robust against noise.
 */

import Pitchfinder from 'pitchfinder';
import { AudioContextManager } from './AudioContextManager';

/**
 * Configuration options for pitch detection
 */
export interface PitchDetectorOptions {
  /**
   * Minimum confidence threshold for accepting a detection (0-1)
   * Higher values reduce false positives but may miss quiet notes
   * Default: 0.9
   */
  confidenceThreshold?: number;

  /**
   * Minimum amplitude threshold (0-1)
   * Signals below this are considered silence
   * Default: 0.01 (about -40dB)
   */
  amplitudeThreshold?: number;

  /**
   * Buffer size for pitch detection
   * Larger = more accurate but higher latency
   * Must be power of 2
   * Default: 2048
   */
  bufferSize?: number;

  /**
   * Update interval in milliseconds
   * How often to detect pitch
   * Default: 100ms (10 times per second)
   */
  updateInterval?: number;
}

/**
 * Callback function type for pitch detection
 */
export type PitchDetectionCallback = (frequency: number | null) => void;

/**
 * Default configuration
 */
const DEFAULT_OPTIONS: Required<PitchDetectorOptions> = {
  confidenceThreshold: 0.9,
  amplitudeThreshold: 0.01,
  bufferSize: 2048,
  updateInterval: 100,
};

/**
 * PitchDetector class for real-time pitch detection
 *
 * @example
 * ```typescript
 * const audioManager = AudioContextManager.getInstance();
 * const detector = new PitchDetector(audioManager);
 *
 * detector.onPitchDetected((frequency) => {
 *   if (frequency) {
 *     console.log(`Detected: ${frequency}Hz`);
 *   }
 * });
 *
 * detector.start();
 * ```
 */
export class PitchDetector {
  private audioManager: AudioContextManager;
  private options: Required<PitchDetectorOptions>;
  private detecting: boolean = false;
  private animationFrameId: number | null = null;
  private callback: PitchDetectionCallback | null = null;
  private pitchDetectAlgorithm: (buffer: Float32Array) => number | null;
  private buffer: Float32Array;
  private lastUpdateTime: number = 0;

  /**
   * Creates a new PitchDetector
   *
   * @param audioManager AudioContextManager instance
   * @param options Configuration options
   */
  constructor(audioManager: AudioContextManager, options: PitchDetectorOptions = {}) {
    this.audioManager = audioManager;
    this.options = { ...DEFAULT_OPTIONS, ...options };

    // Initialize buffer
    this.buffer = new Float32Array(this.options.bufferSize);

    // Initialize pitch detection algorithm (YIN)
    // YIN is robust for vocal pitch detection with harmonics
    const sampleRate = this.audioManager.getSampleRate();
    this.pitchDetectAlgorithm = Pitchfinder.YIN({
      sampleRate,
      threshold: 1 - this.options.confidenceThreshold, // YIN uses inverted threshold
    });
  }

  /**
   * Registers a callback for pitch detection events
   *
   * @param callback Function to call when pitch is detected
   */
  public onPitchDetected(callback: PitchDetectionCallback): void {
    this.callback = callback;
  }

  /**
   * Starts pitch detection
   */
  public start(): void {
    if (this.detecting) {
      return; // Already detecting
    }

    this.detecting = true;
    this.lastUpdateTime = performance.now();
    this.detectPitch();
  }

  /**
   * Stops pitch detection
   */
  public stop(): void {
    this.detecting = false;

    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  /**
   * Checks if currently detecting
   *
   * @returns True if detecting
   */
  public isDetecting(): boolean {
    return this.detecting;
  }

  /**
   * Main detection loop
   */
  private detectPitch(): void {
    if (!this.detecting) {
      return;
    }

    const currentTime = performance.now();
    const timeSinceLastUpdate = currentTime - this.lastUpdateTime;

    // Only update at the specified interval to reduce CPU usage
    if (timeSinceLastUpdate >= this.options.updateInterval) {
      this.lastUpdateTime = currentTime;

      // Get audio data from analyser
      const analyser = this.audioManager.getAnalyser();
      analyser.getFloatTimeDomainData(this.buffer as unknown as Float32Array<ArrayBuffer>);

      // Process the buffer
      this.processBuffer(this.buffer);
    }

    // Schedule next detection
    this.animationFrameId = requestAnimationFrame(() => this.detectPitch());
  }

  /**
   * Processes an audio buffer and detects pitch
   *
   * @param buffer Audio buffer to process
   */
  public processBuffer(buffer: Float32Array): void {
    // Don't process if not detecting
    if (!this.detecting) {
      return;
    }

    // Check if signal is loud enough (RMS amplitude)
    const amplitude = this.calculateRMS(buffer);
    if (amplitude < this.options.amplitudeThreshold) {
      // Signal too quiet - likely silence
      this.emitPitch(null);
      return;
    }

    // Detect pitch using the algorithm
    const frequency = this.pitchDetectAlgorithm(buffer);

    // Validate detected frequency
    if (frequency && this.isValidVocalFrequency(frequency)) {
      this.emitPitch(frequency);
    } else {
      this.emitPitch(null);
    }
  }

  /**
   * Calculates RMS (Root Mean Square) amplitude of a buffer
   *
   * @param buffer Audio buffer
   * @returns RMS amplitude (0-1)
   */
  private calculateRMS(buffer: Float32Array): number {
    let sum = 0;
    for (let i = 0; i < buffer.length; i++) {
      sum += buffer[i] * buffer[i];
    }
    return Math.sqrt(sum / buffer.length);
  }

  /**
   * Validates if a frequency is within vocal range
   *
   * Human vocal range: approximately 80Hz (low bass) to 1100Hz (high soprano)
   * Extended range: 65Hz (C2) to 1400Hz (F6) to be safe
   *
   * @param frequency Frequency to validate
   * @returns True if valid
   */
  private isValidVocalFrequency(frequency: number): boolean {
    return frequency >= 65 && frequency <= 1400;
  }

  /**
   * Emits pitch detection result to callback
   *
   * @param frequency Detected frequency or null
   */
  private emitPitch(frequency: number | null): void {
    if (this.callback) {
      this.callback(frequency);
    }
  }

  /**
   * Gets current configuration
   *
   * @returns Current options
   */
  public getOptions(): Readonly<Required<PitchDetectorOptions>> {
    return { ...this.options };
  }

  /**
   * Updates configuration
   *
   * Note: Some options (like bufferSize) require restarting detection
   *
   * @param options New options
   */
  public updateOptions(options: Partial<PitchDetectorOptions>): void {
    const oldBufferSize = this.options.bufferSize;
    this.options = { ...this.options, ...options };

    // Recreate buffer if size changed
    if (oldBufferSize !== this.options.bufferSize) {
      this.buffer = new Float32Array(this.options.bufferSize);
    }

    // Recreate algorithm if relevant options changed
    if (options.confidenceThreshold !== undefined || options.bufferSize !== undefined) {
      const sampleRate = this.audioManager.getSampleRate();
      this.pitchDetectAlgorithm = Pitchfinder.YIN({
        sampleRate,
        threshold: 1 - this.options.confidenceThreshold,
      });
    }
  }
}
