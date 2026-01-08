/**
 * Coordinate Mapper
 *
 * Maps frequencies and musical notes to canvas Y coordinates
 * Uses logarithmic scale for perceptual accuracy (octaves are evenly spaced)
 */

import { noteToFrequency } from '../audio/frequencyConverter';

/**
 * Configuration for vocal range visualization
 */
export interface VocalRangeConfig {
  /** Minimum frequency to display (Hz) */
  minFrequency: number;
  /** Maximum frequency to display (Hz) */
  maxFrequency: number;
  /** Note labels to display on the canvas */
  noteLabels: Array<{ note: string; octave: number; frequency: number }>;
  /** Gear model ranges (Vocal Logic Gear Model) */
  gearRanges: Array<{ gear: number; name: string; minFreq: number; maxFreq: number; color: string }>;
}

/**
 * Default frequency range for visualization
 * Extended range to cover all vocal types:
 * - Bass: E2 (82Hz) to E4 (330Hz)
 * - Tenor: C3 (130Hz) to C5 (523Hz)
 * - Alto: G3 (196Hz) to G5 (784Hz)
 * - Soprano: C4 (261Hz) to C6 (1046Hz)
 *
 * We extend beyond this to C1-C8 for completeness
 */
const DEFAULT_MIN_FREQUENCY = 32.7;  // C1
const DEFAULT_MAX_FREQUENCY = 4186;  // C8

/**
 * Converts a frequency to a Y position on the canvas
 *
 * Uses logarithmic scale so that octaves are evenly spaced
 * (matches human perception of pitch)
 *
 * @param frequency Frequency in Hz
 * @param canvasHeight Height of the canvas in pixels
 * @param minFreq Minimum frequency (default: 32.7Hz / C1)
 * @param maxFreq Maximum frequency (default: 4186Hz / C8)
 * @returns Y position (0 = top, canvasHeight = bottom)
 *
 * @example
 * ```typescript
 * const y = frequencyToYPosition(440, 600);
 * // Returns Y position for A4 on a 600px canvas
 * ```
 */
export function frequencyToYPosition(
  frequency: number,
  canvasHeight: number,
  minFreq: number = DEFAULT_MIN_FREQUENCY,
  maxFreq: number = DEFAULT_MAX_FREQUENCY
): number {
  // Handle edge cases
  if (canvasHeight <= 0) {
    return 0;
  }

  if (frequency <= 0) {
    return canvasHeight;
  }

  // Clamp frequency to valid range
  const clampedFreq = Math.max(minFreq, Math.min(maxFreq, frequency));

  // Logarithmic mapping: y = height - (log(f) - log(fmin)) / (log(fmax) - log(fmin)) * height
  // Lower frequencies (bass) = higher Y values (bottom of canvas)
  // Higher frequencies (soprano) = lower Y values (top of canvas)
  const logMin = Math.log2(minFreq);
  const logMax = Math.log2(maxFreq);
  const logFreq = Math.log2(clampedFreq);

  const normalizedPosition = (logFreq - logMin) / (logMax - logMin);
  const y = canvasHeight - (normalizedPosition * canvasHeight);

  return y;
}

/**
 * Converts a musical note to a Y position on the canvas
 *
 * @param noteName Note name (e.g., "C", "C#", "Bb")
 * @param octave Octave number (0-8)
 * @param canvasHeight Height of the canvas in pixels
 * @returns Y position or null if invalid note
 *
 * @example
 * ```typescript
 * const y = noteToYPosition('A', 4, 600);
 * // Returns Y position for A4 on a 600px canvas
 * ```
 */
export function noteToYPosition(
  noteName: string,
  octave: number,
  canvasHeight: number
): number | null {
  const frequency = noteToFrequency(noteName, octave);
  if (frequency === null) {
    return null;
  }

  return frequencyToYPosition(frequency, canvasHeight);
}

/**
 * Gets the configuration for vocal range visualization
 *
 * Includes note labels and Vocal Logic Gear Model ranges
 *
 * @returns Vocal range configuration
 *
 * @example
 * ```typescript
 * const config = getVocalRangeConfig();
 * console.log(config.noteLabels); // Array of notes to display
 * console.log(config.gearRanges); // Gear Model ranges
 * ```
 */
export function getVocalRangeConfig(): VocalRangeConfig {
  return {
    minFrequency: DEFAULT_MIN_FREQUENCY,
    maxFrequency: DEFAULT_MAX_FREQUENCY,

    // Note labels for visualization (C notes at each octave)
    noteLabels: [
      { note: 'C', octave: 1, frequency: 32.7 },
      { note: 'C', octave: 2, frequency: 65.4 },
      { note: 'C', octave: 3, frequency: 130.8 },
      { note: 'C', octave: 4, frequency: 261.6 },
      { note: 'C', octave: 5, frequency: 523.3 },
      { note: 'C', octave: 6, frequency: 1046.5 },
      { note: 'C', octave: 7, frequency: 2093 },
      { note: 'C', octave: 8, frequency: 4186 },
    ],

    // Vocal Logic Gear Model ranges
    // Based on typical vocal mechanism transitions
    gearRanges: [
      {
        gear: 1,
        name: 'Chest Voice (Gear 1)',
        minFreq: 80,   // E2 (typical male low)
        maxFreq: 261,  // C4 (chest/mix transition)
        color: '#0066ff', // Deep blue
      },
      {
        gear: 2,
        name: 'Mixed Voice (Gear 2)',
        minFreq: 261,  // C4
        maxFreq: 523,  // C5
        color: '#00aaff', // Medium blue
      },
      {
        gear: 3,
        name: 'Head Voice (Gear 3)',
        minFreq: 523,  // C5
        maxFreq: 1046, // C6
        color: '#00ddff', // Bright blue
      },
      {
        gear: 4,
        name: 'Whistle Register (Gear 4)',
        minFreq: 1046, // C6
        maxFreq: 2093, // C7
        color: '#00ffff', // Cyan
      },
      {
        gear: 5,
        name: 'Super Head Voice (Gear 5)',
        minFreq: 2093, // C7
        maxFreq: 4186, // C8
        color: '#88ffff', // Light cyan
      },
    ],
  };
}

/**
 * Calculates the pixel height for a frequency range
 *
 * @param minFreq Minimum frequency
 * @param maxFreq Maximum frequency
 * @param canvasHeight Canvas height
 * @returns Pixel height of the range
 */
export function getFrequencyRangeHeight(
  minFreq: number,
  maxFreq: number,
  canvasHeight: number
): number {
  const y1 = frequencyToYPosition(minFreq, canvasHeight);
  const y2 = frequencyToYPosition(maxFreq, canvasHeight);
  return Math.abs(y1 - y2);
}

/**
 * Gets the frequency range in semitones
 *
 * @param minFreq Minimum frequency
 * @param maxFreq Maximum frequency
 * @returns Number of semitones
 */
export function getFrequencyRangeInSemitones(minFreq: number, maxFreq: number): number {
  return 12 * Math.log2(maxFreq / minFreq);
}

/**
 * Formats a frequency range as a human-readable string
 *
 * @param minFreq Minimum frequency
 * @param maxFreq Maximum frequency
 * @returns Formatted string (e.g., "A2 to C5 (2.5 octaves)")
 */
export function formatFrequencyRange(minFreq: number, maxFreq: number): string {
  const semitones = getFrequencyRangeInSemitones(minFreq, maxFreq);
  const octaves = (semitones / 12).toFixed(1);

  return `${minFreq.toFixed(1)}Hz to ${maxFreq.toFixed(1)}Hz (${octaves} octaves)`;
}
