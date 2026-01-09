/**
 * Range Data Storage
 *
 * Manages vocal range data persistence using LocalStorage
 */

import type { Note } from '../../utils/audio/frequencyConverter';

/**
 * Vocal range measurement record
 */
export interface VocalRangeRecord {
  /** Unique identifier */
  id: string;
  /** Measurement date */
  date: Date;
  /** Lowest note detected */
  lowestNote: Note;
  /** Highest note detected */
  highestNote: Note;
  /** Range in semitones */
  rangeInSemitones: number;
}

/**
 * Storage keys
 */
const STORAGE_KEYS = {
  CURRENT: 'vocalRange_current',
  HISTORY: 'vocalRange_history',
} as const;

/**
 * Maximum number of history records to keep
 */
const MAX_HISTORY_RECORDS = 50;

/**
 * RangeDataStorage class for persisting vocal range data
 *
 * @example
 * ```typescript
 * const storage = new RangeDataStorage();
 *
 * const record: VocalRangeRecord = {
 *   id: crypto.randomUUID(),
 *   date: new Date(),
 *   lowestNote: { name: 'C', octave: 2, frequency: 65.4, cents: 0, midiNumber: 36 },
 *   highestNote: { name: 'C', octave: 5, frequency: 523.3, cents: 0, midiNumber: 72 },
 *   rangeInSemitones: 36,
 * };
 *
 * storage.save(record);
 * const loaded = storage.load();
 * ```
 */
export class RangeDataStorage {
  /**
   * Saves a vocal range record
   *
   * @param record Record to save
   * @throws {Error} If validation fails
   */
  public save(record: VocalRangeRecord): void {
    // Validate record
    this.validate(record);

    // Save current record
    const serialized = this.serialize(record);
    localStorage.setItem(STORAGE_KEYS.CURRENT, serialized);

    // Add to history
    this.addToHistory(record);
  }

  /**
   * Loads the current vocal range record
   *
   * @returns Current record or null if none exists
   */
  public load(): VocalRangeRecord | null {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CURRENT);
      if (!data) {
        return null;
      }

      return this.deserialize(data);
    } catch (error) {
      console.error('Failed to load vocal range data:', error);
      return null;
    }
  }

  /**
   * Gets measurement history
   *
   * @param limit Maximum number of records to return (default: 10)
   * @returns Array of records, sorted by date (newest first)
   */
  public getHistory(limit: number = 10): VocalRangeRecord[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.HISTORY);
      if (!data) {
        return [];
      }

      const parsed = JSON.parse(data) as Array<Omit<VocalRangeRecord, 'date'> & { date: string }>;
      const history: VocalRangeRecord[] = parsed.map((item) => ({
        ...item,
        date: new Date(item.date),
      }));

      // Sort by date (newest first)
      history.sort((a, b) => b.date.getTime() - a.date.getTime());

      // Return limited results
      return history.slice(0, limit);
    } catch (error) {
      console.error('Failed to load history:', error);
      return [];
    }
  }

  /**
   * Clears all stored data
   */
  public clear(): void {
    localStorage.removeItem(STORAGE_KEYS.CURRENT);
    localStorage.removeItem(STORAGE_KEYS.HISTORY);
  }

  /**
   * Adds a record to history
   *
   * @param record Record to add
   */
  private addToHistory(record: VocalRangeRecord): void {
    try {
      let history: VocalRangeRecord[] = [];

      const data = localStorage.getItem(STORAGE_KEYS.HISTORY);
      if (data) {
        const parsed = JSON.parse(data) as Array<Omit<VocalRangeRecord, 'date'> & { date: string }>;
        history = parsed.map((item) => ({
          ...item,
          date: new Date(item.date),
        }));
      }

      // Add new record
      history.push(record);

      // Keep only the most recent records
      history.sort((a, b) => b.date.getTime() - a.date.getTime());
      history = history.slice(0, MAX_HISTORY_RECORDS);

      // Save back
      localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(history));
    } catch (error) {
      console.error('Failed to add to history:', error);
    }
  }

  /**
   * Validates a vocal range record
   *
   * @param record Record to validate
   * @throws {Error} If validation fails
   */
  private validate(record: VocalRangeRecord): void {
    // Check required fields
    if (!record.id || !record.date || !record.lowestNote || !record.highestNote) {
      throw new Error('Missing required fields in vocal range record');
    }

    // Validate frequencies
    if (record.lowestNote.frequency <= 0) {
      throw new Error('Lowest frequency must be positive');
    }

    if (record.highestNote.frequency <= 0) {
      throw new Error('Highest frequency must be positive');
    }

    // Validate range
    if (record.lowestNote.frequency >= record.highestNote.frequency) {
      throw new Error('Lowest frequency must be less than highest frequency');
    }

    // Validate semitones
    if (record.rangeInSemitones < 0) {
      throw new Error('Range in semitones must be non-negative');
    }
  }

  /**
   * Serializes a record to JSON string
   *
   * @param record Record to serialize
   * @returns JSON string
   */
  private serialize(record: VocalRangeRecord): string {
    return JSON.stringify(record);
  }

  /**
   * Deserializes a JSON string to a record
   *
   * @param data JSON string
   * @returns Deserialized record
   */
  private deserialize(data: string): VocalRangeRecord {
    const parsed = JSON.parse(data);
    return {
      ...parsed,
      date: new Date(parsed.date),
    };
  }
}
