import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

// Cleanup after each test case
afterEach(() => {
  cleanup();
});

// Mock Web Audio API
globalThis.AudioContext = class MockAudioContext {
  createAnalyser() {
    return {
      fftSize: 2048,
      smoothingTimeConstant: 0.8,
      frequencyBinCount: 1024,
      getByteTimeDomainData: () => {},
      getByteFrequencyData: () => {},
      connect: () => {},
      disconnect: () => {},
    };
  }

  createMediaStreamSource() {
    return {
      connect: () => {},
      disconnect: () => {},
    };
  }

  close() {
    return Promise.resolve();
  }

  resume() {
    return Promise.resolve();
  }

  get state() {
    return 'running';
  }

  get sampleRate() {
    return 48000;
  }
} as unknown as typeof AudioContext;

// Mock MediaDevices
Object.defineProperty(globalThis.navigator, 'mediaDevices', {
  value: {
    getUserMedia: () => Promise.resolve({
      getTracks: () => [{
        stop: () => {},
        kind: 'audio',
        enabled: true,
      }],
      getAudioTracks: () => [{
        stop: () => {},
        kind: 'audio',
        enabled: true,
      }],
    }),
  },
  writable: true,
});
