import { describe, it, expect } from 'vitest';
import { frequencyToNote, noteToFrequency } from '../../../src/utils/audio/frequencyConverter';

describe('frequencyConverter', () => {
  describe('frequencyToNote', () => {
    it('should convert 440Hz to A4', () => {
      // Arrange & Act
      const result = frequencyToNote(440);

      // Assert
      expect(result).toBeDefined();
      expect(result?.name).toBe('A');
      expect(result?.octave).toBe(4);
      expect(result?.frequency).toBeCloseTo(440, 2);
      expect(Math.abs(result?.cents || 0)).toBeLessThan(5);
    });

    it('should convert 261.63Hz to C4 (Middle C)', () => {
      // Arrange & Act
      const result = frequencyToNote(261.63);

      // Assert
      expect(result).toBeDefined();
      expect(result?.name).toBe('C');
      expect(result?.octave).toBe(4);
      expect(result?.frequency).toBeCloseTo(261.63, 2);
      expect(Math.abs(result?.cents || 0)).toBeLessThan(5);
    });

    it('should convert 880Hz to A5', () => {
      // Arrange & Act
      const result = frequencyToNote(880);

      // Assert
      expect(result).toBeDefined();
      expect(result?.name).toBe('A');
      expect(result?.octave).toBe(5);
    });

    it('should handle sharps/flats correctly for 466.16Hz (A#4/Bb4)', () => {
      // Arrange & Act
      const result = frequencyToNote(466.16);

      // Assert
      expect(result).toBeDefined();
      expect(['A#', 'Bb']).toContain(result?.name);
      expect(result?.octave).toBe(4);
    });

    it('should return null for 0Hz', () => {
      // Arrange & Act
      const result = frequencyToNote(0);

      // Assert
      expect(result).toBeNull();
    });

    it('should return null for negative frequencies', () => {
      // Arrange & Act
      const result = frequencyToNote(-100);

      // Assert
      expect(result).toBeNull();
    });

    it('should handle very low frequency (C1, 32.7Hz)', () => {
      // Arrange & Act
      const result = frequencyToNote(32.7);

      // Assert
      expect(result).toBeDefined();
      expect(result?.name).toBe('C');
      expect(result?.octave).toBe(1);
    });

    it('should handle very high frequency (C8, 4186Hz)', () => {
      // Arrange & Act
      const result = frequencyToNote(4186);

      // Assert
      expect(result).toBeDefined();
      expect(result?.name).toBe('C');
      expect(result?.octave).toBe(8);
    });

    it('should calculate cents accurately for slightly sharp note', () => {
      // Arrange - 442Hz is slightly sharp of A4 (440Hz)
      const result = frequencyToNote(442);

      // Assert
      expect(result).toBeDefined();
      expect(result?.name).toBe('A');
      expect(result?.octave).toBe(4);
      expect(result?.cents).toBeGreaterThan(0);
      expect(result?.cents).toBeLessThan(50);
    });

    it('should calculate cents accurately for slightly flat note', () => {
      // Arrange - 438Hz is slightly flat of A4 (440Hz)
      const result = frequencyToNote(438);

      // Assert
      expect(result).toBeDefined();
      expect(result?.name).toBe('A');
      expect(result?.octave).toBe(4);
      expect(result?.cents).toBeLessThan(0);
      expect(result?.cents).toBeGreaterThan(-50);
    });

    it('should handle frequency at semitone boundary', () => {
      // Arrange - frequency exactly between two notes
      // Should snap to the closer note
      const result = frequencyToNote(452); // Between A4 (440) and A#4 (466.16)

      // Assert
      expect(result).toBeDefined();
      expect(result?.name).toBeDefined();
      expect(result?.octave).toBe(4);
    });
  });

  describe('noteToFrequency', () => {
    it('should convert A4 to 440Hz', () => {
      // Arrange & Act
      const result = noteToFrequency('A', 4);

      // Assert
      expect(result).toBeCloseTo(440, 2);
    });

    it('should convert C4 to 261.63Hz', () => {
      // Arrange & Act
      const result = noteToFrequency('C', 4);

      // Assert
      expect(result).toBeCloseTo(261.63, 2);
    });

    it('should handle sharp notes (A#4)', () => {
      // Arrange & Act
      const result = noteToFrequency('A#', 4);

      // Assert
      expect(result).toBeCloseTo(466.16, 2);
    });

    it('should handle flat notes (Bb4)', () => {
      // Arrange & Act
      const result = noteToFrequency('Bb', 4);

      // Assert
      expect(result).toBeCloseTo(466.16, 2);
    });

    it('should convert C1 to 32.7Hz', () => {
      // Arrange & Act
      const result = noteToFrequency('C', 1);

      // Assert
      expect(result).toBeCloseTo(32.7, 2);
    });

    it('should convert C8 to 4186Hz', () => {
      // Arrange & Act
      const result = noteToFrequency('C', 8);

      // Assert
      expect(result).toBeCloseTo(4186, 0);
    });

    it('should return null for invalid note name', () => {
      // Arrange & Act
      const result = noteToFrequency('H', 4);

      // Assert
      expect(result).toBeNull();
    });

    it('should return null for invalid octave (too low)', () => {
      // Arrange & Act
      const result = noteToFrequency('A', -1);

      // Assert
      expect(result).toBeNull();
    });

    it('should return null for invalid octave (too high)', () => {
      // Arrange & Act
      const result = noteToFrequency('A', 10);

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('Round-trip conversion', () => {
    it('should maintain accuracy through frequency -> note -> frequency conversion', () => {
      // Arrange
      const originalFreq = 440;

      // Act
      const note = frequencyToNote(originalFreq);
      const backToFreq = note ? noteToFrequency(note.name, note.octave) : null;

      // Assert
      expect(backToFreq).not.toBeNull();
      expect(backToFreq).toBeCloseTo(originalFreq, 1);
    });

    it('should handle multiple frequencies accurately', () => {
      // Arrange
      const frequencies = [261.63, 440, 880, 1760];

      // Act & Assert
      frequencies.forEach(freq => {
        const note = frequencyToNote(freq);
        expect(note).not.toBeNull();

        const backToFreq = note ? noteToFrequency(note.name, note.octave) : null;
        expect(backToFreq).toBeCloseTo(freq, 1);
      });
    });
  });
});
