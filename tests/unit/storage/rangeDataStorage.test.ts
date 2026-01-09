import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { RangeDataStorage, type VocalRangeRecord } from '../../../src/services/storage/RangeDataStorage';

describe('RangeDataStorage', () => {
  let storage: RangeDataStorage;

  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    storage = new RangeDataStorage();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('save and load', () => {
    it('should save and load a vocal range record', () => {
      // Arrange
      const record: VocalRangeRecord = {
        id: 'test-1',
        date: new Date('2026-01-09'),
        lowestNote: { name: 'C', octave: 2, frequency: 65.4, cents: 0, midiNumber: 36 },
        highestNote: { name: 'C', octave: 5, frequency: 523.3, cents: 0, midiNumber: 72 },
        rangeInSemitones: 36,
      };

      // Act
      storage.save(record);
      const loaded = storage.load();

      // Assert
      expect(loaded).toBeDefined();
      expect(loaded?.id).toBe(record.id);
      expect(loaded?.lowestNote.frequency).toBe(record.lowestNote.frequency);
      expect(loaded?.highestNote.frequency).toBe(record.highestNote.frequency);
    });

    it('should return null when no data is stored', () => {
      // Act
      const loaded = storage.load();

      // Assert
      expect(loaded).toBeNull();
    });

    it('should overwrite existing record when saving', () => {
      // Arrange
      const record1: VocalRangeRecord = {
        id: 'test-1',
        date: new Date('2026-01-08'),
        lowestNote: { name: 'C', octave: 2, frequency: 65.4, cents: 0, midiNumber: 36 },
        highestNote: { name: 'C', octave: 4, frequency: 261.6, cents: 0, midiNumber: 60 },
        rangeInSemitones: 24,
      };

      const record2: VocalRangeRecord = {
        id: 'test-2',
        date: new Date('2026-01-09'),
        lowestNote: { name: 'C', octave: 2, frequency: 65.4, cents: 0, midiNumber: 36 },
        highestNote: { name: 'C', octave: 5, frequency: 523.3, cents: 0, midiNumber: 72 },
        rangeInSemitones: 36,
      };

      // Act
      storage.save(record1);
      storage.save(record2);
      const loaded = storage.load();

      // Assert
      expect(loaded?.id).toBe('test-2');
    });

    it('should handle Date serialization correctly', () => {
      // Arrange
      const record: VocalRangeRecord = {
        id: 'test-1',
        date: new Date('2026-01-09T10:30:00Z'),
        lowestNote: { name: 'C', octave: 2, frequency: 65.4, cents: 0, midiNumber: 36 },
        highestNote: { name: 'C', octave: 5, frequency: 523.3, cents: 0, midiNumber: 72 },
        rangeInSemitones: 36,
      };

      // Act
      storage.save(record);
      const loaded = storage.load();

      // Assert
      expect(loaded?.date).toBeInstanceOf(Date);
      expect(loaded?.date.toISOString()).toBe(record.date.toISOString());
    });
  });

  describe('getHistory', () => {
    it('should return empty array when no history exists', () => {
      // Act
      const history = storage.getHistory();

      // Assert
      expect(history).toEqual([]);
    });

    it('should store multiple records in history', () => {
      // Arrange
      const records: VocalRangeRecord[] = [
        {
          id: 'test-1',
          date: new Date('2026-01-07'),
          lowestNote: { name: 'C', octave: 2, frequency: 65.4, cents: 0, midiNumber: 36 },
          highestNote: { name: 'C', octave: 4, frequency: 261.6, cents: 0, midiNumber: 60 },
          rangeInSemitones: 24,
        },
        {
          id: 'test-2',
          date: new Date('2026-01-08'),
          lowestNote: { name: 'C', octave: 2, frequency: 65.4, cents: 0, midiNumber: 36 },
          highestNote: { name: 'C', octave: 5, frequency: 523.3, cents: 0, midiNumber: 72 },
          rangeInSemitones: 36,
        },
      ];

      // Act
      records.forEach(r => storage.save(r));
      const history = storage.getHistory();

      // Assert
      expect(history.length).toBe(2);
    });

    it('should return history sorted by date (newest first)', () => {
      // Arrange
      const records: VocalRangeRecord[] = [
        {
          id: 'test-1',
          date: new Date('2026-01-07'),
          lowestNote: { name: 'C', octave: 2, frequency: 65.4, cents: 0, midiNumber: 36 },
          highestNote: { name: 'C', octave: 4, frequency: 261.6, cents: 0, midiNumber: 60 },
          rangeInSemitones: 24,
        },
        {
          id: 'test-2',
          date: new Date('2026-01-09'),
          lowestNote: { name: 'C', octave: 2, frequency: 65.4, cents: 0, midiNumber: 36 },
          highestNote: { name: 'C', octave: 5, frequency: 523.3, cents: 0, midiNumber: 72 },
          rangeInSemitones: 36,
        },
        {
          id: 'test-3',
          date: new Date('2026-01-08'),
          lowestNote: { name: 'C', octave: 2, frequency: 65.4, cents: 0, midiNumber: 36 },
          highestNote: { name: 'C', octave: 4, frequency: 329.6, cents: 0, midiNumber: 64 },
          rangeInSemitones: 28,
        },
      ];

      // Act
      records.forEach(r => storage.save(r));
      const history = storage.getHistory();

      // Assert
      expect(history[0].id).toBe('test-2'); // Newest (2026-01-09)
      expect(history[1].id).toBe('test-3'); // Middle (2026-01-08)
      expect(history[2].id).toBe('test-1'); // Oldest (2026-01-07)
    });

    it('should limit history to specified number of records', () => {
      // Arrange
      const records: VocalRangeRecord[] = [];
      for (let i = 0; i < 15; i++) {
        records.push({
          id: `test-${i}`,
          date: new Date(`2026-01-${(i + 1).toString().padStart(2, '0')}`),
          lowestNote: { name: 'C', octave: 2, frequency: 65.4, cents: 0, midiNumber: 36 },
          highestNote: { name: 'C', octave: 4, frequency: 261.6, cents: 0, midiNumber: 60 },
          rangeInSemitones: 24,
        });
      }

      // Act
      records.forEach(r => storage.save(r));
      const history = storage.getHistory(10);

      // Assert
      expect(history.length).toBe(10);
    });

    it('should keep only the most recent records when limit is exceeded', () => {
      // Arrange
      const records: VocalRangeRecord[] = [];
      for (let i = 0; i < 12; i++) {
        records.push({
          id: `test-${i}`,
          date: new Date(`2026-01-${(i + 1).toString().padStart(2, '0')}`),
          lowestNote: { name: 'C', octave: 2, frequency: 65.4, cents: 0, midiNumber: 36 },
          highestNote: { name: 'C', octave: 4, frequency: 261.6, cents: 0, midiNumber: 60 },
          rangeInSemitones: 24,
        });
      }

      // Act
      records.forEach(r => storage.save(r));
      const history = storage.getHistory(10);

      // Assert
      expect(history.length).toBe(10);
      expect(history[0].id).toBe('test-11'); // Most recent
      expect(history[9].id).toBe('test-2');  // 10th most recent
    });
  });

  describe('clear', () => {
    it('should clear all stored data', () => {
      // Arrange
      const record: VocalRangeRecord = {
        id: 'test-1',
        date: new Date('2026-01-09'),
        lowestNote: { name: 'C', octave: 2, frequency: 65.4, cents: 0, midiNumber: 36 },
        highestNote: { name: 'C', octave: 5, frequency: 523.3, cents: 0, midiNumber: 72 },
        rangeInSemitones: 36,
      };

      storage.save(record);

      // Act
      storage.clear();
      const loaded = storage.load();
      const history = storage.getHistory();

      // Assert
      expect(loaded).toBeNull();
      expect(history).toEqual([]);
    });
  });

  describe('Error handling', () => {
    it('should handle corrupted data gracefully', () => {
      // Arrange
      localStorage.setItem('vocalRange_current', 'invalid json');

      // Act
      const loaded = storage.load();

      // Assert
      expect(loaded).toBeNull();
    });

    it('should handle missing fields in stored data', () => {
      // Arrange
      const incompleteData = {
        id: 'test-1',
        // Missing other fields
      };
      localStorage.setItem('vocalRange_current', JSON.stringify(incompleteData));

      // Act
      const loaded = storage.load();

      // Assert
      // Should either return null or fill in defaults
      expect(loaded).toBeDefined();
    });
  });

  describe('LocalStorage integration', () => {
    it('should persist data across storage instances', () => {
      // Arrange
      const record: VocalRangeRecord = {
        id: 'test-1',
        date: new Date('2026-01-09'),
        lowestNote: { name: 'C', octave: 2, frequency: 65.4, cents: 0, midiNumber: 36 },
        highestNote: { name: 'C', octave: 5, frequency: 523.3, cents: 0, midiNumber: 72 },
        rangeInSemitones: 36,
      };

      // Act
      storage.save(record);
      const newStorage = new RangeDataStorage();
      const loaded = newStorage.load();

      // Assert
      expect(loaded?.id).toBe(record.id);
    });
  });

  describe('Data validation', () => {
    it('should validate frequency values', () => {
      // Arrange
      const invalidRecord: VocalRangeRecord = {
        id: 'test-1',
        date: new Date('2026-01-09'),
        lowestNote: { name: 'C', octave: 2, frequency: -100, cents: 0, midiNumber: 36 },
        highestNote: { name: 'C', octave: 5, frequency: 523.3, cents: 0, midiNumber: 72 },
        rangeInSemitones: 36,
      };

      // Act & Assert
      expect(() => storage.save(invalidRecord)).toThrow();
    });

    it('should validate that highest > lowest', () => {
      // Arrange
      const invalidRecord: VocalRangeRecord = {
        id: 'test-1',
        date: new Date('2026-01-09'),
        lowestNote: { name: 'C', octave: 5, frequency: 523.3, cents: 0, midiNumber: 72 },
        highestNote: { name: 'C', octave: 2, frequency: 65.4, cents: 0, midiNumber: 36 },
        rangeInSemitones: -36,
      };

      // Act & Assert
      expect(() => storage.save(invalidRecord)).toThrow();
    });
  });
});
