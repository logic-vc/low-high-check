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
    this.drawFrequencyGuides(); // This now draws the piano keyboard
  }

  private clearCanvas(): void {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  private drawBackground(): void {
    this.ctx.fillStyle = this.options.backgroundColor;
    this.ctx.fillRect(0, 0, this.canvas.width / this.pixelRatio, this.canvas.height / this.pixelRatio);
  }


  private drawFrequencyGuides(): void {
    const height = this.canvas.height / this.pixelRatio;
    const width = this.canvas.width / this.pixelRatio;

    // Draw piano keyboard
    this.drawPianoKeyboard(width, height);
  }

  private drawPianoKeyboard(width: number, height: number): void {
    // Piano keyboard configuration
    const startOctave = 2; // C2
    const endOctave = 6;   // C6
    const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const blackKeys = ['C#', 'D#', 'F#', 'G#', 'A#'];

    // Calculate frequencies for each note
    const notes: Array<{name: string, octave: number, freq: number, isBlack: boolean}> = [];
    for (let octave = startOctave; octave <= endOctave; octave++) {
      for (const noteName of noteNames) {
        const freq = this.getNoteFrequency(noteName, octave);
        if (freq >= 60 && freq <= 1100) { // Filter to vocal range
          notes.push({
            name: noteName,
            octave,
            freq,
            isBlack: blackKeys.includes(noteName)
          });
        }
      }
    }

    // Key dimensions
    const keyWidth = width * 0.85;
    const keyHeight = height / notes.filter(n => !n.isBlack).length * 1.4;
    const blackKeyWidth = keyWidth * 0.6;

    // Draw white keys first
    notes.filter(n => !n.isBlack).forEach((note) => {
      const y = frequencyToYPosition(note.freq, height, this.options.minFrequency, this.options.maxFrequency);
      this.drawPianoKey(5, y - keyHeight / 2, keyWidth, keyHeight, note, false);
    });

    // Draw black keys on top
    notes.filter(n => n.isBlack).forEach((note) => {
      const y = frequencyToYPosition(note.freq, height, this.options.minFrequency, this.options.maxFrequency);
      this.drawPianoKey(5, y - keyHeight / 2, blackKeyWidth, keyHeight * 0.65, note, true);
    });
  }

  private drawPianoKey(x: number, y: number, width: number, height: number, note: {name: string, octave: number, freq: number}, isBlack: boolean): void {
    const isHighlighted = this.highlightedMin !== null &&
                         this.highlightedMax !== null &&
                         note.freq >= this.highlightedMin &&
                         note.freq <= this.highlightedMax;

    // Draw key background
    if (isBlack) {
      this.ctx.fillStyle = isHighlighted ? '#00ccff' : '#1a1a1a';
    } else {
      this.ctx.fillStyle = isHighlighted ? '#66e0ff' : '#ffffff';
    }

    this.ctx.fillRect(x, y, width, height);

    // Draw key border
    this.ctx.strokeStyle = isBlack ? '#000000' : '#333333';
    this.ctx.lineWidth = 1;
    this.ctx.strokeRect(x, y, width, height);

    // Draw label for C notes
    if (note.name === 'C' && !isBlack) {
      this.ctx.fillStyle = isHighlighted ? '#ffffff' : '#666666';
      this.ctx.font = 'bold 10px sans-serif';
      this.ctx.fillText(`${note.name}${note.octave}`, x + 5, y + height - 5);
    }
  }

  private getNoteFrequency(noteName: string, octave: number): number {
    const noteOffsets: {[key: string]: number} = {
      'C': 0, 'C#': 1, 'D': 2, 'D#': 3, 'E': 4, 'F': 5,
      'F#': 6, 'G': 7, 'G#': 8, 'A': 9, 'A#': 10, 'B': 11
    };

    // A4 = 440 Hz, MIDI note 69
    const A4 = 440;
    const midiNote = (octave + 1) * 12 + noteOffsets[noteName];
    const A4MidiNote = 69;

    return A4 * Math.pow(2, (midiNote - A4MidiNote) / 12);
  }


  public highlightFrequency(frequency: number): void {
    console.log('highlightFrequency called with:', frequency);
    if (this.highlightedMin === null || frequency < this.highlightedMin) {
      this.highlightedMin = frequency;
      console.log('Updated highlightedMin:', this.highlightedMin);
    }
    if (this.highlightedMax === null || frequency > this.highlightedMax) {
      this.highlightedMax = frequency;
      console.log('Updated highlightedMax:', this.highlightedMax);
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
