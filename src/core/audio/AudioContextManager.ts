/**
 * Singleton class for managing Web Audio API context and nodes
 *
 * This class ensures only one AudioContext is created throughout the app lifecycle,
 * preventing resource leaks and conflicts.
 *
 * @example
 * ```typescript
 * const manager = AudioContextManager.getInstance();
 * const analyser = manager.getAnalyser();
 * const sampleRate = manager.getSampleRate();
 * ```
 */
export class AudioContextManager {
  private static instance: AudioContextManager | null = null;
  private audioContext: AudioContext | null = null;
  private analyserNode: AnalyserNode | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private currentStream: MediaStream | null = null;

  /**
   * FFT size for frequency analysis
   * 2048 provides good balance between resolution and performance
   * Results in 1024 frequency bins (fftSize / 2)
   */
  private static readonly FFT_SIZE = 2048;

  /**
   * Smoothing time constant for frequency data
   * 0.8 provides smooth transitions without too much lag
   * Range: 0 (no smoothing) to 1 (heavy smoothing)
   */
  private static readonly SMOOTHING_TIME_CONSTANT = 0.8;

  /**
   * Private constructor to enforce singleton pattern
   */
  private constructor() {
    this.initialize();
  }

  /**
   * Gets the singleton instance of AudioContextManager
   */
  public static getInstance(): AudioContextManager {
    if (!AudioContextManager.instance) {
      AudioContextManager.instance = new AudioContextManager();
    }
    return AudioContextManager.instance;
  }

  /**
   * Initializes the AudioContext and AnalyserNode
   */
  private initialize(): void {
    try {
      // Create AudioContext (use webkit prefix for older Safari versions)
      const AudioContextClass = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextClass) {
        throw new Error('AudioContext is not supported in this browser');
      }
      this.audioContext = new AudioContextClass();

      // Create and configure AnalyserNode
      this.analyserNode = this.audioContext.createAnalyser();
      this.analyserNode.fftSize = AudioContextManager.FFT_SIZE;
      this.analyserNode.smoothingTimeConstant = AudioContextManager.SMOOTHING_TIME_CONSTANT;

      // Resume context if suspended (some browsers require user interaction)
      if (this.audioContext.state === 'suspended') {
        this.audioContext.resume();
      }
    } catch (error) {
      console.error('Failed to initialize AudioContext:', error);
      throw new Error('Web Audio API is not supported in this browser');
    }
  }

  /**
   * Gets the AudioContext instance
   */
  public getAudioContext(): AudioContext {
    if (!this.audioContext) {
      throw new Error('AudioContext is not initialized');
    }
    return this.audioContext;
  }

  /**
   * Gets the AnalyserNode instance
   */
  public getAnalyser(): AnalyserNode {
    if (!this.analyserNode) {
      throw new Error('AnalyserNode is not initialized');
    }
    return this.analyserNode;
  }

  /**
   * Gets the sample rate from the AudioContext
   */
  public getSampleRate(): number {
    if (!this.audioContext) {
      throw new Error('AudioContext is not initialized');
    }
    return this.audioContext.sampleRate;
  }

  /**
   * Connects a MediaStream to the AnalyserNode
   *
   * @param stream The MediaStream from getUserMedia
   */
  public connectStream(stream: MediaStream): void {
    if (!this.audioContext || !this.analyserNode) {
      throw new Error('AudioContext or AnalyserNode is not initialized');
    }

    // Disconnect previous stream if exists
    if (this.sourceNode) {
      this.sourceNode.disconnect();
    }

    // Store the current stream
    this.currentStream = stream;

    // Create source node from stream
    this.sourceNode = this.audioContext.createMediaStreamSource(stream);

    // Connect source to analyser
    this.sourceNode.connect(this.analyserNode);

    // Note: We don't connect to destination (speakers) to avoid feedback
  }

  /**
   * Disconnects the current stream
   */
  public disconnectStream(): void {
    if (this.sourceNode) {
      this.sourceNode.disconnect();
      this.sourceNode = null;
    }

    if (this.currentStream) {
      this.currentStream.getTracks().forEach(track => track.stop());
      this.currentStream = null;
    }
  }

  /**
   * Cleans up resources and closes the AudioContext
   *
   * Should be called when the app is closing or when audio is no longer needed
   */
  public async cleanup(): Promise<void> {
    // Disconnect stream
    this.disconnectStream();

    // Close AudioContext
    if (this.audioContext) {
      try {
        await this.audioContext.close();
      } catch (error) {
        console.error('Error closing AudioContext:', error);
      }
      this.audioContext = null;
    }

    // Clear analyser node
    this.analyserNode = null;

    // Reset singleton instance
    AudioContextManager.instance = null;
  }

  /**
   * Checks if the AudioContext is running
   */
  public isRunning(): boolean {
    return this.audioContext !== null && this.audioContext.state === 'running';
  }

  /**
   * Resumes the AudioContext if suspended
   */
  public async resume(): Promise<void> {
    if (this.audioContext && this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }
  }
}
