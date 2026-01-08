/**
 * Frequency to Note Converter
 *
 * Implements 12-TET (12-Tone Equal Temperament) conversion between
 * frequency (Hz) and musical notes.
 *
 * Reference: https://en.wikipedia.org/wiki/Equal_temperament
 */

/**
 * Represents a musical note with frequency information
 */
export interface Note {
  /** Note name (e.g., "C", "C#", "D", "Eb") */
  name: string;
  /** Octave number (e.g., 4 for middle C) */
  octave: number;
  /** Exact frequency in Hz */
  frequency: number;
  /** Deviation from the note in cents (-50 to +50) */
  cents: number;
  /** MIDI note number (0-127) */
  midiNumber: number;
}

/**
 * Note names in chromatic scale
 * Using sharps (#) for black keys
 */
const NOTE_NAMES = [
  'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'
];

/**
 * Alternative note names using flats (b)
 */
const NOTE_NAMES_FLAT: Record<string, string> = {
  'C#': 'Db',
  'D#': 'Eb',
  'F#': 'Gb',
  'G#': 'Ab',
  'A#': 'Bb',
};

/**
 * Reference frequency: A4 = 440 Hz
 */
const A4_FREQUENCY = 440;

/**
 * MIDI note number for A4
 */
const A4_MIDI = 69;

/**
 * Minimum valid frequency (C0, ~16.35 Hz)
 */
const MIN_FREQUENCY = 16.35;

/**
 * Maximum valid frequency (B8, ~7902 Hz)
 */
const MAX_FREQUENCY = 7902;

/**
 * Converts a frequency to the closest musical note
 *
 * @param frequency Frequency in Hz
 * @returns Note object or null if frequency is invalid
 *
 * @example
 * ```typescript
 * const note = frequencyToNote(440);
 * console.log(note); // { name: 'A', octave: 4, frequency: 440, cents: 0, midiNumber: 69 }
 * ```
 */
export function frequencyToNote(frequency: number): Note | null {
  // Validate frequency
  if (!frequency || frequency <= 0 || frequency < MIN_FREQUENCY || frequency > MAX_FREQUENCY) {
    return null;
  }

  // Calculate MIDI note number (fractional)
  // Formula: n = 12 * log2(f / 440) + 69
  const midiNumberFloat = 12 * Math.log2(frequency / A4_FREQUENCY) + A4_MIDI;

  // Round to nearest MIDI note
  const midiNumber = Math.round(midiNumberFloat);

  // Calculate cents deviation from the nearest note
  // 1 cent = 1/100 of a semitone
  const cents = Math.round((midiNumberFloat - midiNumber) * 100);

  // Get note name and octave from MIDI number
  const noteIndex = midiNumber % 12;
  const octave = Math.floor(midiNumber / 12) - 1;
  const noteName = NOTE_NAMES[noteIndex];

  // Calculate the exact frequency of the detected note
  const exactFrequency = noteToFrequency(noteName, octave);

  return {
    name: noteName,
    octave,
    frequency: exactFrequency || frequency,
    cents,
    midiNumber,
  };
}

/**
 * Converts a note name and octave to its frequency
 *
 * @param noteName Note name (e.g., "A", "C#", "Bb")
 * @param octave Octave number (0-8)
 * @returns Frequency in Hz or null if invalid
 *
 * @example
 * ```typescript
 * const freq = noteToFrequency('A', 4);
 * console.log(freq); // 440
 * ```
 */
export function noteToFrequency(noteName: string, octave: number): number | null {
  // Validate octave range
  if (octave < 0 || octave > 8) {
    return null;
  }

  // Normalize note name (handle flats)
  let normalizedName = noteName;
  for (const [sharp, flat] of Object.entries(NOTE_NAMES_FLAT)) {
    if (noteName === flat) {
      normalizedName = sharp;
      break;
    }
  }

  // Find note index
  const noteIndex = NOTE_NAMES.indexOf(normalizedName);
  if (noteIndex === -1) {
    return null;
  }

  // Calculate MIDI note number
  const midiNumber = (octave + 1) * 12 + noteIndex;

  // Calculate frequency from MIDI note number
  // Formula: f = 440 * 2^((n - 69) / 12)
  const frequency = A4_FREQUENCY * Math.pow(2, (midiNumber - A4_MIDI) / 12);

  return frequency;
}

/**
 * Gets the note name with optional flat notation
 *
 * @param noteName Note name
 * @param useFlats Whether to use flat notation for black keys
 * @returns Note name (sharp or flat)
 *
 * @example
 * ```typescript
 * const note = getNoteName('C#', true);
 * console.log(note); // 'Db'
 * ```
 */
export function getNoteName(noteName: string, useFlats: boolean = false): string {
  if (useFlats && NOTE_NAMES_FLAT[noteName]) {
    return NOTE_NAMES_FLAT[noteName];
  }
  return noteName;
}

/**
 * Formats a note as a string
 *
 * @param note Note object
 * @param useFlats Whether to use flat notation
 * @returns Formatted note string (e.g., "A4", "C#5")
 *
 * @example
 * ```typescript
 * const note = frequencyToNote(440);
 * console.log(formatNote(note)); // 'A4'
 * ```
 */
export function formatNote(note: Note, useFlats: boolean = false): string {
  const noteName = getNoteName(note.name, useFlats);
  return `${noteName}${note.octave}`;
}

/**
 * Calculates the interval in semitones between two frequencies
 *
 * @param freq1 First frequency
 * @param freq2 Second frequency
 * @returns Number of semitones (can be fractional)
 *
 * @example
 * ```typescript
 * const semitones = getInterval(440, 880);
 * console.log(semitones); // 12 (one octave)
 * ```
 */
export function getInterval(freq1: number, freq2: number): number {
  return 12 * Math.log2(freq2 / freq1);
}

/**
 * Checks if a frequency is in tune (within ±10 cents)
 *
 * @param frequency Frequency to check
 * @param tolerance Tolerance in cents (default: 10)
 * @returns True if in tune
 *
 * @example
 * ```typescript
 * const inTune = isInTune(442); // A4 is 440Hz
 * console.log(inTune); // true (within ±10 cents)
 * ```
 */
export function isInTune(frequency: number, tolerance: number = 10): boolean {
  const note = frequencyToNote(frequency);
  if (!note) return false;
  return Math.abs(note.cents) <= tolerance;
}
