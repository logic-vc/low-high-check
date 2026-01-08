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

// Mock Canvas API
class MockCanvasRenderingContext2D {
  fillStyle: string | CanvasGradient | CanvasPattern = '#000000';
  strokeStyle: string | CanvasGradient | CanvasPattern = '#000000';
  lineWidth: number = 1;
  font: string = '10px sans-serif';

  clearRect() {}
  fillRect() {}
  strokeRect() {}
  fillText() {}
  strokeText() {}
  beginPath() {}
  closePath() {}
  moveTo() {}
  lineTo() {}
  arc() {}
  stroke() {}
  fill() {}
  scale() {}
  translate() {}
  rotate() {}
  save() {}
  restore() {}

  createLinearGradient() {
    return {
      addColorStop: () => {},
    } as CanvasGradient;
  }

  createRadialGradient() {
    return {
      addColorStop: () => {},
    } as CanvasGradient;
  }

  measureText(text: string) {
    return { width: text.length * 8 } as TextMetrics;
  }
}

HTMLCanvasElement.prototype.getContext = function(contextId: string) {
  if (contextId === '2d') {
    return new MockCanvasRenderingContext2D() as unknown as CanvasRenderingContext2D;
  }
  return null;
} as unknown as typeof HTMLCanvasElement.prototype.getContext;
