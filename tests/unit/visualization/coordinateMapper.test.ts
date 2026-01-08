import { describe, it, expect } from 'vitest';
import { frequencyToYPosition, noteToYPosition, getVocalRangeConfig } from '../../../src/utils/visualization/coordinateMapper';

describe('coordinateMapper', () => {
  const canvasHeight = 600;

  describe('frequencyToYPosition', () => {
    it('should map C1 (32.7Hz) to bottom of canvas', () => {
      // Arrange & Act
      const y = frequencyToYPosition(32.7, canvasHeight);

      // Assert
      expect(y).toBeCloseTo(canvasHeight, 1);
    });

    it('should map C8 (4186Hz) to top of canvas', () => {
      // Arrange & Act
      const y = frequencyToYPosition(4186, canvasHeight);

      // Assert
      expect(y).toBeCloseTo(0, 1);
    });

    it('should map A4 (440Hz) to middle region', () => {
      // Arrange & Act
      const y = frequencyToYPosition(440, canvasHeight);

      // Assert
      // A4 should be roughly in the middle to upper-middle region
      expect(y).toBeGreaterThan(0);
      expect(y).toBeLessThan(canvasHeight);
      expect(y).toBeLessThan(canvasHeight / 2); // Higher frequencies = lower Y values
    });

    it('should use logarithmic scale for perceptual accuracy', () => {
      // Arrange - Test that octave jumps have consistent visual spacing
      const c2 = frequencyToYPosition(65.4, canvasHeight);   // C2
      const c3 = frequencyToYPosition(130.8, canvasHeight);  // C3
      const c4 = frequencyToYPosition(261.6, canvasHeight);  // C4
      const c5 = frequencyToYPosition(523.3, canvasHeight);  // C5

      // Act - Calculate spacing between octaves
      const spacing1 = c2 - c3;
      const spacing2 = c3 - c4;
      const spacing3 = c4 - c5;

      // Assert - Octave spacings should be roughly equal (within 10%)
      expect(Math.abs(spacing1 - spacing2) / spacing1).toBeLessThan(0.1);
      expect(Math.abs(spacing2 - spacing3) / spacing2).toBeLessThan(0.1);
    });

    it('should handle frequencies below minimum range', () => {
      // Arrange & Act
      const y = frequencyToYPosition(20, canvasHeight);

      // Assert - Should clamp to bottom
      expect(y).toBeGreaterThanOrEqual(canvasHeight);
    });

    it('should handle frequencies above maximum range', () => {
      // Arrange & Act
      const y = frequencyToYPosition(5000, canvasHeight);

      // Assert - Should clamp to top
      expect(y).toBeLessThanOrEqual(0);
    });

    it('should work with different canvas heights', () => {
      // Arrange
      const smallHeight = 300;
      const largeHeight = 1200;

      // Act
      const ySmall = frequencyToYPosition(440, smallHeight);
      const yLarge = frequencyToYPosition(440, largeHeight);

      // Assert - Y position should scale proportionally
      expect(yLarge / ySmall).toBeCloseTo(largeHeight / smallHeight, 1);
    });

    it('should return consistent results for same input', () => {
      // Arrange & Act
      const y1 = frequencyToYPosition(440, canvasHeight);
      const y2 = frequencyToYPosition(440, canvasHeight);

      // Assert
      expect(y1).toBe(y2);
    });
  });

  describe('noteToYPosition', () => {
    it('should map note name and octave to Y position', () => {
      // Arrange & Act
      const y = noteToYPosition('A', 4, canvasHeight);

      // Assert
      expect(y).toBeGreaterThan(0);
      expect(y).toBeLessThan(canvasHeight);
    });

    it('should handle C1 at bottom', () => {
      // Arrange & Act
      const y = noteToYPosition('C', 1, canvasHeight);

      // Assert
      expect(y).toBeCloseTo(canvasHeight, 1);
    });

    it('should handle C8 at top', () => {
      // Arrange & Act
      const y = noteToYPosition('C', 8, canvasHeight);

      // Assert
      expect(y).toBeCloseTo(0, 1);
    });

    it('should handle sharps correctly', () => {
      // Arrange & Act
      const y = noteToYPosition('C#', 4, canvasHeight);

      // Assert
      expect(y).toBeDefined();
      expect(typeof y).toBe('number');
    });

    it('should handle flats correctly', () => {
      // Arrange & Act
      const y = noteToYPosition('Bb', 4, canvasHeight);

      // Assert
      expect(y).toBeDefined();
      expect(typeof y).toBe('number');
    });

    it('should return null for invalid note', () => {
      // Arrange & Act
      const y = noteToYPosition('H', 4, canvasHeight);

      // Assert
      expect(y).toBeNull();
    });

    it('should return null for invalid octave', () => {
      // Arrange & Act
      const y = noteToYPosition('A', 10, canvasHeight);

      // Assert
      expect(y).toBeNull();
    });
  });

  describe('getVocalRangeConfig', () => {
    it('should return configuration for vocal range visualization', () => {
      // Act
      const config = getVocalRangeConfig();

      // Assert
      expect(config).toBeDefined();
      expect(config.minFrequency).toBeDefined();
      expect(config.maxFrequency).toBeDefined();
      expect(config.minFrequency).toBeLessThan(config.maxFrequency);
    });

    it('should cover typical vocal range', () => {
      // Act
      const config = getVocalRangeConfig();

      // Assert
      // Typical vocal range: ~80Hz (bass E2) to ~1100Hz (soprano C6)
      expect(config.minFrequency).toBeLessThanOrEqual(80);
      expect(config.maxFrequency).toBeGreaterThanOrEqual(1100);
    });

    it('should include note labels for visualization', () => {
      // Act
      const config = getVocalRangeConfig();

      // Assert
      expect(config.noteLabels).toBeDefined();
      expect(Array.isArray(config.noteLabels)).toBe(true);
      expect(config.noteLabels.length).toBeGreaterThan(0);
    });

    it('should provide gear model ranges', () => {
      // Act
      const config = getVocalRangeConfig();

      // Assert
      expect(config.gearRanges).toBeDefined();
      expect(config.gearRanges.length).toBeGreaterThan(0);
    });
  });

  describe('Coordinate system edge cases', () => {
    it('should handle zero canvas height gracefully', () => {
      // Arrange & Act
      const y = frequencyToYPosition(440, 0);

      // Assert
      expect(y).toBe(0);
    });

    it('should handle negative canvas height gracefully', () => {
      // Arrange & Act
      const y = frequencyToYPosition(440, -100);

      // Assert
      // Should return 0 or handle gracefully
      expect(y).toBeDefined();
    });

    it('should handle very large canvas height', () => {
      // Arrange
      const largeHeight = 10000;

      // Act
      const y = frequencyToYPosition(440, largeHeight);

      // Assert
      expect(y).toBeGreaterThan(0);
      expect(y).toBeLessThan(largeHeight);
    });
  });

  describe('Inverse mapping', () => {
    it('should maintain correct ordering (higher frequency = lower Y)', () => {
      // Arrange
      const freq1 = 100;
      const freq2 = 200;
      const freq3 = 400;

      // Act
      const y1 = frequencyToYPosition(freq1, canvasHeight);
      const y2 = frequencyToYPosition(freq2, canvasHeight);
      const y3 = frequencyToYPosition(freq3, canvasHeight);

      // Assert - Higher frequency should have lower Y value (closer to top)
      expect(y1).toBeGreaterThan(y2);
      expect(y2).toBeGreaterThan(y3);
    });
  });
});
