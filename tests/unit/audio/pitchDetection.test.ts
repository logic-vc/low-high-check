import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { PitchDetector } from '../../../src/core/audio/PitchDetector';
import { AudioContextManager } from '../../../src/core/audio/AudioContextManager';

describe('PitchDetector', () => {
  let detector: PitchDetector;
  let audioManager: AudioContextManager;

  beforeEach(() => {
    audioManager = AudioContextManager.getInstance();
    detector = new PitchDetector(audioManager);
  });

  afterEach(() => {
    detector.stop();
    audioManager.cleanup();
  });

  describe('Initialization', () => {
    it('should create a PitchDetector instance', () => {
      // Assert
      expect(detector).toBeDefined();
      expect(detector).toBeInstanceOf(PitchDetector);
    });

    it('should not be detecting initially', () => {
      // Assert
      expect(detector.isDetecting()).toBe(false);
    });
  });

  describe('Start and Stop', () => {
    it('should start pitch detection', () => {
      // Act
      detector.start();

      // Assert
      expect(detector.isDetecting()).toBe(true);
    });

    it('should stop pitch detection', () => {
      // Arrange
      detector.start();

      // Act
      detector.stop();

      // Assert
      expect(detector.isDetecting()).toBe(false);
    });

    it('should handle multiple start calls gracefully', () => {
      // Act & Assert
      expect(() => {
        detector.start();
        detector.start();
      }).not.toThrow();
    });

    it('should handle multiple stop calls gracefully', () => {
      // Arrange
      detector.start();

      // Act & Assert
      expect(() => {
        detector.stop();
        detector.stop();
      }).not.toThrow();
    });
  });

  describe('Pitch Detection with Pure Sine Wave', () => {
    it('should detect A4 (440Hz) from sine wave', () => {
      // Arrange
      const mockBuffer = createSineWaveBuffer(440, 48000, 2048);
      let detectedFrequency: number | null = null;

      detector.onPitchDetected((freq) => {
        detectedFrequency = freq;
      });

      // Act
      detector.start();
      // Simulate processing the buffer
      simulateAudioProcessing(detector, mockBuffer);

      // Assert
      expect(detectedFrequency).not.toBeNull();
      if (detectedFrequency) {
        expect(detectedFrequency).toBeGreaterThan(435); // Within ±5Hz
        expect(detectedFrequency).toBeLessThan(445);
      }
    });

    it('should detect C4 (261.63Hz) from sine wave', () => {
      // Arrange
      const mockBuffer = createSineWaveBuffer(261.63, 48000, 2048);
      let detectedFrequency: number | null = null;

      detector.onPitchDetected((freq) => {
        detectedFrequency = freq;
      });

      // Act
      detector.start();
      simulateAudioProcessing(detector, mockBuffer);

      // Assert
      expect(detectedFrequency).not.toBeNull();
      if (detectedFrequency) {
        expect(detectedFrequency).toBeGreaterThan(258);
        expect(detectedFrequency).toBeLessThan(265);
      }
    });

    it('should detect high frequency (C6, 1046.5Hz)', () => {
      // Arrange
      const mockBuffer = createSineWaveBuffer(1046.5, 48000, 2048);
      let detectedFrequency: number | null = null;

      detector.onPitchDetected((freq) => {
        detectedFrequency = freq;
      });

      // Act
      detector.start();
      simulateAudioProcessing(detector, mockBuffer);

      // Assert
      expect(detectedFrequency).not.toBeNull();
      if (detectedFrequency) {
        expect(detectedFrequency).toBeGreaterThan(1040);
        expect(detectedFrequency).toBeLessThan(1053);
      }
    });
  });

  describe('Silence Detection', () => {
    it('should return null for silence (all zeros)', () => {
      // Arrange
      const silentBuffer = new Float32Array(2048).fill(0);
      let detectedFrequency: number | null = 999; // Non-null initial value

      detector.onPitchDetected((freq) => {
        detectedFrequency = freq;
      });

      // Act
      detector.start();
      simulateAudioProcessing(detector, silentBuffer);

      // Assert
      expect(detectedFrequency).toBeNull();
    });

    it('should return null for very low amplitude (-50dB)', () => {
      // Arrange
      const quietBuffer = createSineWaveBuffer(440, 48000, 2048, 0.001); // Very quiet
      let detectedFrequency: number | null = 999;

      detector.onPitchDetected((freq) => {
        detectedFrequency = freq;
      });

      // Act
      detector.start();
      simulateAudioProcessing(detector, quietBuffer);

      // Assert
      expect(detectedFrequency).toBeNull();
    });
  });

  describe('Noisy Signal Handling', () => {
    it('should handle signal with white noise', () => {
      // Arrange
      const noisyBuffer = createNoisySineWave(440, 48000, 2048, 0.1); // 10% noise
      let detectedFrequency: number | null = null;

      detector.onPitchDetected((freq) => {
        detectedFrequency = freq;
      });

      // Act
      detector.start();
      simulateAudioProcessing(detector, noisyBuffer);

      // Assert
      // Should still detect the fundamental frequency despite noise
      if (detectedFrequency) {
        expect(detectedFrequency).toBeGreaterThan(420);
        expect(detectedFrequency).toBeLessThan(460);
      }
    });
  });

  describe('Complex Waveform with Harmonics', () => {
    it('should detect fundamental frequency from complex waveform', () => {
      // Arrange - Create a waveform with fundamental + harmonics (like a real voice)
      const complexBuffer = createComplexWaveform(440, 48000, 2048);
      let detectedFrequency: number | null = null;

      detector.onPitchDetected((freq) => {
        detectedFrequency = freq;
      });

      // Act
      detector.start();
      simulateAudioProcessing(detector, complexBuffer);

      // Assert
      // Should detect fundamental (440Hz), not harmonics (880, 1320, etc.)
      expect(detectedFrequency).not.toBeNull();
      if (detectedFrequency) {
        expect(detectedFrequency).toBeGreaterThan(430);
        expect(detectedFrequency).toBeLessThan(450);
      }
    });
  });

  describe('Confidence Threshold', () => {
    it('should have configurable confidence threshold', () => {
      // Arrange
      const customDetector = new PitchDetector(audioManager, {
        confidenceThreshold: 0.95,
      });

      // Assert
      expect(customDetector).toBeDefined();
    });

    it('should filter out low-confidence detections', () => {
      // Arrange - Very noisy signal with low confidence
      const noisyBuffer = createNoisySineWave(440, 48000, 2048, 0.8); // 80% noise
      let detectedFrequency: number | null = 999;

      const strictDetector = new PitchDetector(audioManager, {
        confidenceThreshold: 0.95,
      });

      strictDetector.onPitchDetected((freq) => {
        detectedFrequency = freq;
      });

      // Act
      strictDetector.start();
      simulateAudioProcessing(strictDetector, noisyBuffer);

      // Assert
      // Should return null for low confidence detection
      expect(detectedFrequency).toBeNull();
    });
  });

  describe('Callback mechanism', () => {
    it('should call callback when pitch is detected', () => {
      // Arrange
      const callback = vi.fn();
      const buffer = createSineWaveBuffer(440, 48000, 2048);

      detector.onPitchDetected(callback);

      // Act
      detector.start();
      simulateAudioProcessing(detector, buffer);

      // Assert
      expect(callback).toHaveBeenCalled();
    });

    it('should pass frequency to callback', () => {
      // Arrange
      const callback = vi.fn();
      const buffer = createSineWaveBuffer(440, 48000, 2048);

      detector.onPitchDetected(callback);

      // Act
      detector.start();
      simulateAudioProcessing(detector, buffer);

      // Assert
      expect(callback).toHaveBeenCalledWith(expect.any(Number));
    });

    it('should not call callback when stopped', () => {
      // Arrange
      const callback = vi.fn();
      const buffer = createSineWaveBuffer(440, 48000, 2048);

      detector.onPitchDetected(callback);
      detector.start();
      detector.stop();

      // Act
      simulateAudioProcessing(detector, buffer);

      // Assert
      expect(callback).not.toHaveBeenCalled();
    });
  });
});

// Helper functions for creating test audio buffers

function createSineWaveBuffer(
  frequency: number,
  sampleRate: number,
  bufferSize: number,
  amplitude: number = 1.0
): Float32Array {
  const buffer = new Float32Array(bufferSize);
  for (let i = 0; i < bufferSize; i++) {
    buffer[i] = amplitude * Math.sin(2 * Math.PI * frequency * i / sampleRate);
  }
  return buffer;
}

function createNoisySineWave(
  frequency: number,
  sampleRate: number,
  bufferSize: number,
  noiseLevel: number
): Float32Array {
  const buffer = createSineWaveBuffer(frequency, sampleRate, bufferSize);
  for (let i = 0; i < bufferSize; i++) {
    buffer[i] += (Math.random() * 2 - 1) * noiseLevel;
  }
  return buffer;
}

function createComplexWaveform(
  fundamental: number,
  sampleRate: number,
  bufferSize: number
): Float32Array {
  const buffer = new Float32Array(bufferSize);

  // Add fundamental + harmonics (simulating a real vocal sound)
  const harmonics = [
    { freq: fundamental, amp: 1.0 },      // Fundamental
    { freq: fundamental * 2, amp: 0.5 },  // 2nd harmonic
    { freq: fundamental * 3, amp: 0.25 }, // 3rd harmonic
    { freq: fundamental * 4, amp: 0.125 }, // 4th harmonic
  ];

  for (let i = 0; i < bufferSize; i++) {
    let sample = 0;
    for (const harmonic of harmonics) {
      sample += harmonic.amp * Math.sin(2 * Math.PI * harmonic.freq * i / sampleRate);
    }
    buffer[i] = sample / harmonics.length; // Normalize
  }

  return buffer;
}

function simulateAudioProcessing(detector: PitchDetector, buffer: Float32Array): void {
  // This is a simplified simulation
  // In reality, the detector would process audio from the AnalyserNode
  // For testing, we directly provide the buffer to the processing method
  detector.processBuffer(buffer);
}
