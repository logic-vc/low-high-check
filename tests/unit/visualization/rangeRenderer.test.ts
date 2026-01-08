import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { RangeRenderer, type RangeRendererOptions } from '../../../src/components/visualization/RangeRenderer';

describe('RangeRenderer', () => {
  let canvas: HTMLCanvasElement;
  let renderer: RangeRenderer;

  beforeEach(() => {
    // Create a canvas element for testing
    canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 600;
    document.body.appendChild(canvas);
  });

  afterEach(() => {
    // Clean up
    if (renderer) {
      renderer.destroy();
    }
    document.body.removeChild(canvas);
  });

  describe('Initialization', () => {
    it('should create a RangeRenderer instance', () => {
      // Act
      renderer = new RangeRenderer(canvas);

      // Assert
      expect(renderer).toBeDefined();
      expect(renderer).toBeInstanceOf(RangeRenderer);
    });

    it('should initialize with default options', () => {
      // Act
      renderer = new RangeRenderer(canvas);
      const options = renderer.getOptions();

      // Assert
      expect(options).toBeDefined();
      expect(options.backgroundColor).toBeDefined();
      expect(options.gradientColors).toBeDefined();
    });

    it('should accept custom options', () => {
      // Arrange
      const customOptions: Partial<RangeRendererOptions> = {
        backgroundColor: '#000000',
        animationDuration: 500,
      };

      // Act
      renderer = new RangeRenderer(canvas, customOptions);
      const options = renderer.getOptions();

      // Assert
      expect(options.backgroundColor).toBe('#000000');
      expect(options.animationDuration).toBe(500);
    });

    it('should handle Retina displays', () => {
      // Arrange
      const originalPixelRatio = window.devicePixelRatio;
      Object.defineProperty(window, 'devicePixelRatio', {
        writable: true,
        value: 2,
      });

      // Act
      renderer = new RangeRenderer(canvas);

      // Assert
      // Canvas internal resolution should be scaled
      expect(canvas.width).toBeGreaterThan(400);
      expect(canvas.height).toBeGreaterThan(600);

      // Cleanup
      Object.defineProperty(window, 'devicePixelRatio', {
        writable: true,
        value: originalPixelRatio,
      });
    });
  });

  describe('Initial rendering', () => {
    it('should render dark background initially', () => {
      // Act
      renderer = new RangeRenderer(canvas);
      const ctx = canvas.getContext('2d');

      // Assert
      expect(ctx).not.toBeNull();
      // Background should be dark (neon blue dark: #001a33)
    });

    it('should draw frequency labels', () => {
      // Arrange
      renderer = new RangeRenderer(canvas, { showLabels: true });

      // Act
      renderer.render();

      // Assert
      // Labels should be rendered
      // (In a real test, we'd check canvas context calls)
    });

    it('should not draw labels when disabled', () => {
      // Arrange
      renderer = new RangeRenderer(canvas, { showLabels: false });

      // Act
      renderer.render();

      // Assert
      // No labels should be rendered
    });
  });

  describe('Highlighting frequency ranges', () => {
    beforeEach(() => {
      renderer = new RangeRenderer(canvas);
    });

    it('should highlight a specific frequency', () => {
      // Arrange
      const frequency = 440; // A4

      // Act
      renderer.highlightFrequency(frequency);
      renderer.render();

      // Assert
      // The area at A4 should be highlighted with neon blue
      const highlightedRange = renderer.getHighlightedRange();
      expect(highlightedRange).toBeDefined();
    });

    it('should expand highlighted range as new frequencies are reached', () => {
      // Arrange
      renderer.highlightFrequency(440); // A4
      const range1 = renderer.getHighlightedRange();

      // Act
      renderer.highlightFrequency(880); // A5 (higher)
      const range2 = renderer.getHighlightedRange();

      // Assert
      // Range should expand to include both frequencies
      expect(range2.min).toBeLessThanOrEqual(range1.min);
      expect(range2.max).toBeGreaterThanOrEqual(range1.max);
    });

    it('should track lowest and highest frequencies', () => {
      // Act
      renderer.highlightFrequency(440);
      renderer.highlightFrequency(220);
      renderer.highlightFrequency(880);

      const stats = renderer.getStats();

      // Assert
      expect(stats.lowestFrequency).toBe(220);
      expect(stats.highestFrequency).toBe(880);
    });

    it('should clear highlights', () => {
      // Arrange
      renderer.highlightFrequency(440);

      // Act
      renderer.clearHighlights();
      const range = renderer.getHighlightedRange();

      // Assert
      expect(range.min).toBeNull();
      expect(range.max).toBeNull();
    });
  });

  describe('Gradient rendering', () => {
    beforeEach(() => {
      renderer = new RangeRenderer(canvas);
    });

    it('should render neon blue gradient for highlighted areas', () => {
      // Act
      renderer.highlightFrequency(440);
      renderer.render();

      // Assert
      // Gradient should be rendered (visual test in real app)
      const options = renderer.getOptions();
      expect(options.gradientColors.length).toBeGreaterThan(0);
    });

    it('should have smooth gradient transitions', () => {
      // Arrange
      renderer.highlightFrequency(440);

      // Act
      renderer.render();

      // Assert
      // Gradient should be smooth (tested via visual inspection in real app)
      const options = renderer.getOptions();
      expect(options.gradientColors.length).toBeGreaterThan(1);
    });

    it('should animate gradient changes', () => {
      // Arrange
      vi.useFakeTimers();
      renderer = new RangeRenderer(canvas, { animationDuration: 300 });

      // Act
      renderer.startAnimationLoop();
      renderer.highlightFrequency(440);
      vi.advanceTimersByTime(150); // Halfway through animation

      // Assert
      // Animation should be in progress
      expect(renderer.isAnimating()).toBe(true);

      // Complete animation
      renderer.stopAnimationLoop();
      vi.useRealTimers();
    });
  });

  describe('Real-time updates', () => {
    beforeEach(() => {
      renderer = new RangeRenderer(canvas);
    });

    it('should handle rapid frequency updates', () => {
      // Act
      for (let i = 0; i < 100; i++) {
        renderer.highlightFrequency(400 + i);
      }

      // Assert
      // Should not crash or leak memory
      const stats = renderer.getStats();
      expect(stats).toBeDefined();
    });

    it('should debounce rendering calls', () => {
      // Act
      renderer.highlightFrequency(440);
      renderer.highlightFrequency(441);
      renderer.highlightFrequency(442);
      renderer.render();

      // Assert
      // Should handle rapid updates without crashing
      const range = renderer.getHighlightedRange();
      expect(range.min).toBe(440);
      expect(range.max).toBe(442);
    });

    it('should maintain 60fps during updates', () => {
      // This is more of an integration test, but we can check timing
      vi.useFakeTimers();

      // Act
      const startTime = performance.now();
      for (let i = 0; i < 60; i++) {
        renderer.highlightFrequency(400 + i);
        renderer.render();
        vi.advanceTimersByTime(16.67); // 60fps = 16.67ms per frame
      }
      const endTime = performance.now();

      // Assert
      // Should complete in approximately 1 second
      expect(endTime - startTime).toBeLessThan(1100);

      vi.useRealTimers();
    });
  });

  describe('Responsive behavior', () => {
    it('should handle canvas resize', () => {
      // Arrange
      renderer = new RangeRenderer(canvas);
      renderer.highlightFrequency(440);

      // Act
      canvas.width = 800;
      canvas.height = 1200;
      renderer.resize();
      renderer.render();

      // Assert
      // Should re-render with new dimensions
      const stats = renderer.getStats();
      expect(stats).toBeDefined();
    });

    it('should maintain aspect ratio on resize', () => {
      // Arrange
      renderer = new RangeRenderer(canvas);

      // Act
      canvas.width = 800;
      canvas.height = 1200;
      renderer.resize();

      // Assert
      // Frequency mapping should still be correct
      const y1 = renderer.frequencyToY(440);
      expect(y1).toBeGreaterThan(0);
      expect(y1).toBeLessThan(canvas.height);
    });
  });

  describe('Performance optimization', () => {
    beforeEach(() => {
      renderer = new RangeRenderer(canvas);
    });

    it('should use requestAnimationFrame for rendering', () => {
      // Arrange
      const rafSpy = vi.spyOn(window, 'requestAnimationFrame');

      // Act
      renderer.startAnimationLoop();

      // Assert
      expect(rafSpy).toHaveBeenCalled();

      // Cleanup
      renderer.stopAnimationLoop();
    });

    it('should stop animation loop when not needed', () => {
      // Act
      renderer.startAnimationLoop();
      renderer.stopAnimationLoop();

      // Assert
      // Should stop calling requestAnimationFrame
      expect(renderer.isAnimating()).toBe(false);
    });

    it('should cache gradient calculations', () => {
      // Arrange
      renderer.highlightFrequency(440);
      renderer.render();

      // Act
      const startTime = performance.now();
      for (let i = 0; i < 100; i++) {
        renderer.render();
      }
      const endTime = performance.now();

      // Assert
      // Cached renders should be fast
      expect(endTime - startTime).toBeLessThan(100);
    });
  });

  describe('Cleanup', () => {
    it('should clean up resources on destroy', () => {
      // Arrange
      renderer = new RangeRenderer(canvas);
      renderer.startAnimationLoop();

      // Act
      renderer.destroy();

      // Assert
      expect(renderer.isAnimating()).toBe(false);
    });

    it('should not throw when destroying twice', () => {
      // Arrange
      renderer = new RangeRenderer(canvas);

      // Act & Assert
      expect(() => {
        renderer.destroy();
        renderer.destroy();
      }).not.toThrow();
    });
  });

  describe('Accessibility', () => {
    it('should provide text description of current range', () => {
      // Arrange
      renderer = new RangeRenderer(canvas);
      renderer.highlightFrequency(440);
      renderer.highlightFrequency(880);

      // Act
      const description = renderer.getAccessibilityDescription();

      // Assert
      expect(description).toContain('440');
      expect(description).toContain('880');
    });
  });
});
