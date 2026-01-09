/**
 * Range Renderer
 *
 * Renders vocal range visualization on HTML5 Canvas
 * with neon blue gradient and smooth animations
 */

import { frequencyToYPosition } from '../../utils/visualization/coordinateMapper';

/**
 * Options for RangeRenderer
 */
export interface RangeRendererOptions {
  /** Background color */
  backgroundColor?: string;
  /** Gradient colors (from dark to bright) */
  gradientColors?: string[];
  /** Whether to show frequency labels */
  showLabels?: boolean;
  /** Animation duration in milliseconds */
  animationDuration?: number;
  /** Minimum frequency */
  minFrequency?: number;
  /** Maximum frequency */
  maxFrequency?: number;
}

const DEFAULT_OPTIONS: Required<RangeRendererOptions> = {
  backgroundColor: '#002b4d', // Lighter neon blue dark
  gradientColors: ['#001a33', '#003366', '#0066cc', '#00ccff'], // Dark to bright neon blue
  showLabels: true,
  animationDuration: 300,
  minFrequency: 32.7,
  maxFrequency: 4186,
};

export class RangeRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private options: Required<RangeRendererOptions>;
  private highlightedMin: number | null = null;
  private highlightedMax: number | null = null;
  private lowestFreq: number | null = null;
  private highestFreq: number | null = null;
  private animating: boolean = false;
  private animationFrameId: number | null = null;
  private pixelRatio: number;

  constructor(canvas: HTMLCanvasElement, options: Partial<RangeRendererOptions> = {}) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Could not get 2D context from canvas');
    }
    this.ctx = ctx;
    this.options = { ...DEFAULT_OPTIONS, ...options };

    // Handle Retina displays
    this.pixelRatio = window.devicePixelRatio || 1;
    this.setupCanvas();
    this.render();
  }

  private setupCanvas(): void {
    const displayWidth = this.canvas.clientWidth || this.canvas.width;
    const displayHeight = this.canvas.clientHeight || this.canvas.height;

    this.canvas.width = displayWidth * this.pixelRatio;
    this.canvas.height = displayHeight * this.pixelRatio;

    this.ctx.scale(this.pixelRatio, this.pixelRatio);
  }

  public render(): void {
    this.clearCanvas();
    this.drawBackground();
    this.drawFrequencyGuides();
    if (this.highlightedMin !== null && this.highlightedMax !== null) {
      this.drawHighlightedRange();
    }
    if (this.options.showLabels) {
      this.drawLabels();
    }
  }

  private clearCanvas(): void {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  private drawBackground(): void {
    this.ctx.fillStyle = this.options.backgroundColor;
    this.ctx.fillRect(0, 0, this.canvas.width / this.pixelRatio, this.canvas.height / this.pixelRatio);
  }

  private drawHighlightedRange(): void {
    if (this.highlightedMin === null || this.highlightedMax === null) return;

    const height = this.canvas.height / this.pixelRatio;
    const yMin = frequencyToYPosition(this.highlightedMin, height, this.options.minFrequency, this.options.maxFrequency);
    const yMax = frequencyToYPosition(this.highlightedMax, height, this.options.minFrequency, this.options.maxFrequency);

    const gradient = this.ctx.createLinearGradient(0, yMax, 0, yMin);
    this.options.gradientColors.forEach((color, index) => {
      gradient.addColorStop(index / (this.options.gradientColors.length - 1), color);
    });

    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, yMax, this.canvas.width / this.pixelRatio, yMin - yMax);
  }

  private drawFrequencyGuides(): void {
    const height = this.canvas.height / this.pixelRatio;
    const width = this.canvas.width / this.pixelRatio;

    // Draw frequency guide lines for common notes
    const guides = [
      { freq: 65.41, label: 'C2' },
      { freq: 130.81, label: 'C3' },
      { freq: 261.63, label: 'C4' },
      { freq: 523.25, label: 'C5' },
      { freq: 1046.5, label: 'C6' },
      { freq: 2093.0, label: 'C7' },
    ];

    this.ctx.strokeStyle = 'rgba(0, 204, 255, 0.2)';
    this.ctx.lineWidth = 1;
    this.ctx.fillStyle = 'rgba(0, 204, 255, 0.6)';
    this.ctx.font = '11px sans-serif';

    guides.forEach(({ freq, label }) => {
      if (freq < this.options.minFrequency || freq > this.options.maxFrequency) return;

      const y = frequencyToYPosition(freq, height, this.options.minFrequency, this.options.maxFrequency);

      // Draw horizontal line
      this.ctx.beginPath();
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(width, y);
      this.ctx.stroke();

      // Draw label
      this.ctx.fillText(label, 10, y - 5);
      this.ctx.fillText(`${freq.toFixed(0)}Hz`, 10, y + 15);
    });
  }

  private drawLabels(): void {
    // Simplified label drawing
    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = '12px sans-serif';
  }

  public highlightFrequency(frequency: number): void {
    if (this.highlightedMin === null || frequency < this.highlightedMin) {
      this.highlightedMin = frequency;
    }
    if (this.highlightedMax === null || frequency > this.highlightedMax) {
      this.highlightedMax = frequency;
    }

    if (this.lowestFreq === null || frequency < this.lowestFreq) {
      this.lowestFreq = frequency;
    }
    if (this.highestFreq === null || frequency > this.highestFreq) {
      this.highestFreq = frequency;
    }
  }

  public clearHighlights(): void {
    this.highlightedMin = null;
    this.highlightedMax = null;
  }

  public getHighlightedRange(): { min: number | null; max: number | null } {
    return { min: this.highlightedMin, max: this.highlightedMax };
  }

  public getStats(): { lowestFrequency: number | null; highestFrequency: number | null } {
    return { lowestFrequency: this.lowestFreq, highestFrequency: this.highestFreq };
  }

  public getOptions(): Readonly<Required<RangeRendererOptions>> {
    return { ...this.options };
  }

  public resize(): void {
    this.setupCanvas();
    this.render();
  }

  public frequencyToY(frequency: number): number {
    const height = this.canvas.height / this.pixelRatio;
    return frequencyToYPosition(frequency, height, this.options.minFrequency, this.options.maxFrequency);
  }

  public startAnimationLoop(): void {
    this.animating = true;
    const animate = () => {
      if (!this.animating) return;
      this.render();
      this.animationFrameId = requestAnimationFrame(animate);
    };
    animate();
  }

  public stopAnimationLoop(): void {
    this.animating = false;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  public isAnimating(): boolean {
    return this.animating;
  }

  public getAccessibilityDescription(): string {
    if (this.lowestFreq && this.highestFreq) {
      return `Vocal range from ${this.lowestFreq.toFixed(1)}Hz to ${this.highestFreq.toFixed(1)}Hz`;
    }
    return 'No vocal range detected yet';
  }

  public destroy(): void {
    this.stopAnimationLoop();
  }
}
