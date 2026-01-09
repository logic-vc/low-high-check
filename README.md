# 보컬 음역대 측정 앱 (Vocal Range Tracker)

A real-time vocal range measurement application built with React, TypeScript, and Web Audio API. Visualize your vocal range with a stunning vertical neon blue gradient display.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue)
![React](https://img.shields.io/badge/React-18.3-blue)
![Test Coverage](https://img.shields.io/badge/coverage-80.29%25-green)

## Features

- **Real-time Pitch Detection**: Advanced YIN algorithm for accurate pitch detection
- **Visual Feedback**: Stunning vertical gradient visualization (low notes at bottom, high notes at top)
- **Range Tracking**: Automatically tracks your lowest and highest notes
- **Data Persistence**: Save and review your measurement history
- **Responsive Design**: Works on desktop and mobile devices
- **High Performance**: 60 FPS rendering with optimized Canvas drawing
- **Accessibility**: Full keyboard navigation and ARIA support

## Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd low-high-check

# Install dependencies
npm install

# Start development server
npm run dev
```

Visit `http://localhost:5173` to see the app in action.

### Building for Production

```bash
# Create production build
npm run build

# Preview production build
npm run preview
```

## How to Use

1. **Grant Microphone Access**: Click "Start Measurement" and allow microphone access when prompted
2. **Sing or Play**: Vocalize across your range - from your lowest to highest comfortable note
3. **Watch the Visualization**: See the neon blue gradient expand as you explore your range
4. **View Results**: Your current range in semitones is displayed in real-time
5. **Save Your Progress**: Click "Save Measurement" to store your results
6. **Review History**: Access your measurement history to track progress over time

## Architecture

### Project Structure

```
src/
├── components/
│   └── visualization/
│       └── RangeRenderer.ts       # Canvas rendering engine
├── core/
│   └── audio/
│       ├── AudioContextManager.ts # Web Audio API manager (Singleton)
│       └── PitchDetector.ts       # YIN algorithm pitch detection
├── hooks/
│   └── useVocalRange.ts           # React hook for state management
├── pages/
│   └── VocalRangeTracker.tsx      # Main application component
├── services/
│   └── storage/
│       └── RangeDataStorage.ts    # LocalStorage persistence
├── utils/
│   ├── audio/
│   │   ├── frequencyConverter.ts  # 12-TET frequency conversion
│   │   └── microphoneAccess.ts    # Microphone permission handling
│   └── visualization/
│       └── coordinateMapper.ts    # Logarithmic scale mapping
└── test/
    └── setup.ts                   # Test environment setup
```

### Technology Stack

- **Frontend**: React 18.3 + TypeScript 5.6
- **Build Tool**: Vite 6.0
- **Styling**: Tailwind CSS 4.0
- **Testing**: Vitest + React Testing Library
- **Audio**: Web Audio API + pitchfinder (YIN algorithm)
- **Persistence**: LocalStorage API

### Key Algorithms

#### Pitch Detection (YIN Algorithm)
The YIN algorithm is used for its superior performance with vocal harmonics:
- Confidence threshold: 0.9 (90% certainty)
- Sample rate: 48000 Hz
- Update interval: 50ms (20 Hz update rate)
- Amplitude threshold: 0.01 (filters out noise)

#### Frequency to Note Conversion (12-TET)
Uses 12-tone equal temperament with A4 = 440 Hz reference:
```
MIDI number = 12 × log₂(f / 440) + 69
```

#### Logarithmic Visualization Mapping
Frequencies map to Y-position using logarithmic scale for perceptual accuracy:
```
y = canvasHeight × (1 - (log₂(f) - log₂(fₘᵢₙ)) / (log₂(fₘₐₓ) - log₂(fₘᵢₙ)))
```

## API Reference

### `useVocalRange` Hook

```typescript
const {
  state,                    // Current measurement state
  updateLowest,            // Update lowest note
  updateHighest,           // Update highest note
  reset,                   // Reset measurement
  saveCurrentMeasurement,  // Save to history
  getHistory,              // Get past measurements
  clearAllData,            // Clear all data
  loadSaved,              // Load saved measurement
} = useVocalRange();
```

### `RangeRenderer` Class

```typescript
const renderer = new RangeRenderer(canvas, {
  backgroundColor: '#001a33',
  gradientColors: ['#003d66', '#0080ff', '#00ccff'],
  animationDuration: 300,
  showLabels: true,
});

renderer.highlightFrequency(440);  // Highlight A4
renderer.render();                  // Render frame
renderer.startAnimationLoop();      // Start 60 FPS loop
```

### `PitchDetector` Class

```typescript
const detector = new PitchDetector(audioManager, {
  confidenceThreshold: 0.9,
  amplitudeThreshold: 0.01,
  updateInterval: 50,
});

detector.onPitchDetected((frequency) => {
  console.log(`Detected: ${frequency} Hz`);
});

detector.start();
```

## Testing

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Test Coverage

Current coverage: **80.29%** (116 tests passing)

```
✓ Microphone Access (13 tests)
✓ AudioContext Manager (16 tests)
✓ Pitch Detector (24 tests)
✓ Frequency Converter (17 tests)
✓ Coordinate Mapper (8 tests)
✓ Range Renderer (32 tests)
✓ Storage (6 tests)
```

### Test-Driven Development

This project was built following strict TDD principles with Red-Green-Refactor cycles:
1. **Red**: Write failing test first
2. **Green**: Implement minimal code to pass
3. **Refactor**: Optimize while keeping tests green

## Development Guidelines

### Code Style

- **TypeScript Strict Mode**: Enabled with full type safety
- **ESLint**: Configured with React and TypeScript rules
- **Prettier**: Code formatting (run `npm run format`)
- **Naming Conventions**:
  - Components: PascalCase
  - Hooks: camelCase with `use` prefix
  - Utilities: camelCase
  - Constants: UPPER_SNAKE_CASE

### Git Workflow

```bash
# Branch naming
feature/<feature-name>
bugfix/<bug-description>
refactor/<refactor-scope>

# Commit message format
<type>: <description>

# Types: feat, fix, docs, style, refactor, test, chore
```

### Performance Optimization

- **Memoization**: React.memo for expensive components
- **Debouncing**: Canvas rendering limited to 60 FPS
- **Web Workers**: (Roadmap) Offload pitch detection
- **Code Splitting**: Lazy loading for route components

## Vocal Logic Gear Model Integration

The app integrates the 5-register vocal model:

| Register | Frequency Range | Description |
|----------|----------------|-------------|
| Vocal Fry | 20-80 Hz | Lowest vocal register |
| Chest Voice | 80-350 Hz | Primary speaking voice |
| Mixed Voice | 350-700 Hz | Blended chest/head |
| Head Voice | 700-1400 Hz | Higher resonance |
| Whistle Register | 1400+ Hz | Highest vocal register |

## Browser Compatibility

- Chrome/Edge 88+
- Firefox 85+
- Safari 14.1+
- Opera 74+

**Required APIs:**
- Web Audio API
- MediaDevices.getUserMedia()
- Canvas 2D Context
- LocalStorage

## Roadmap

### Phase 1-5: Core Features ✅
- [x] Audio foundation (microphone + AudioContext)
- [x] Pitch detection engine (YIN algorithm)
- [x] Vertical range visualization
- [x] Data persistence and history
- [x] Integration and polish

### Future Enhancements 🚀
- [ ] Cloud synchronization (Firebase/Supabase)
- [ ] Social sharing and comparison
- [ ] Training exercises and vocal warm-ups
- [ ] Multi-language support (i18n)
- [ ] Voice type classification (soprano, tenor, etc.)
- [ ] Recording and playback
- [ ] Export data as PDF/CSV

## Performance Metrics

- **Bundle Size**: 219 KB (69 KB gzipped)
- **First Contentful Paint**: < 1.5s
- **Time to Interactive**: < 3s
- **Rendering**: 60 FPS stable
- **Memory Usage**: < 50 MB typical

## Troubleshooting

### Microphone not working
- Check browser permissions in settings
- Ensure HTTPS (required for getUserMedia)
- Try different browser if issues persist

### Inaccurate pitch detection
- Reduce background noise
- Sing/speak louder (amplitude threshold)
- Check microphone quality
- Adjust confidence threshold in settings

### Canvas not rendering
- Check browser Canvas API support
- Disable hardware acceleration if issues
- Clear browser cache

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Write tests for your changes
4. Ensure all tests pass (`npm test`)
5. Commit your changes (`git commit -m 'feat: add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- **pitchfinder**: YIN algorithm implementation by @peterkhayes
- **Vocal Logic Gear Model**: Vocal pedagogy framework
- **Web Audio API**: Mozilla Developer Network documentation
- **Tailwind CSS**: Utility-first CSS framework

## Contact

For questions, issues, or feature requests, please open an issue on GitHub.

---

**Built with ❤️ using React, TypeScript, and Web Audio API**
