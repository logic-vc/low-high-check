/**
 * Vocal Range Tracker Component
 *
 * Main component that integrates all modules:
 * - Microphone access
 * - Pitch detection
 * - Canvas visualization
 * - Data persistence
 */

import { useEffect, useRef, useState } from 'react';
import { AudioContextManager } from '../core/audio/AudioContextManager';
import { PitchDetector } from '../core/audio/PitchDetector';
import { RangeRenderer } from '../components/visualization/RangeRenderer';
import { frequencyToNote } from '../utils/audio/frequencyConverter';
import { requestMicrophoneAccess } from '../utils/audio/microphoneAccess';
import { useVocalRange } from '../hooks/useVocalRange';

type MeasurementState = 'idle' | 'requesting' | 'measuring' | 'complete' | 'error';

export function VocalRangeTracker() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [measurementState, setMeasurementState] = useState<MeasurementState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [currentFrequency, setCurrentFrequency] = useState<number | null>(null);

  const audioManagerRef = useRef<AudioContextManager | null>(null);
  const pitchDetectorRef = useRef<PitchDetector | null>(null);
  const rendererRef = useRef<RangeRenderer | null>(null);

  const {
    state: vocalRangeState,
    updateLowest,
    updateHighest,
    reset,
    saveCurrentMeasurement,
  } = useVocalRange();

  // Initialize canvas renderer
  useEffect(() => {
    if (canvasRef.current && !rendererRef.current) {
      rendererRef.current = new RangeRenderer(canvasRef.current);
      rendererRef.current.startAnimationLoop();
    }

    return () => {
      rendererRef.current?.destroy();
    };
  }, []);

  // Update visualization when range changes
  useEffect(() => {
    if (rendererRef.current && currentFrequency) {
      rendererRef.current.highlightFrequency(currentFrequency);
    }
  }, [currentFrequency, vocalRangeState]);

  const startMeasurement = async () => {
    console.log('Starting measurement...');
    setMeasurementState('requesting');
    setError(null);
    reset();

    try {
      // Request microphone access
      console.log('Requesting microphone access...');
      const stream = await requestMicrophoneAccess();
      console.log('Microphone access granted');

      // Initialize audio context
      const audioManager = AudioContextManager.getInstance();
      audioManager.connectStream(stream);
      audioManagerRef.current = audioManager;

      console.log('Sample rate:', audioManager.getSampleRate());

      // Initialize pitch detector
      const detector = new PitchDetector(audioManager, {
        confidenceThreshold: 0.85,
        amplitudeThreshold: 0.005,
        updateInterval: 50, // 20 times per second
      });

      detector.onPitchDetected((frequency) => {
        console.log('Pitch detected:', frequency);
        if (frequency) {
          setCurrentFrequency(frequency);

          const note = frequencyToNote(frequency);
          console.log('Note:', note);
          if (note) {
            updateLowest(note);
            updateHighest(note);
          }
        }
      });

      detector.start();
      pitchDetectorRef.current = detector;

      setMeasurementState('measuring');
    } catch (err) {
      console.error('Failed to start measurement:', err);
      setError(err instanceof Error ? err.message : 'Failed to access microphone');
      setMeasurementState('error');
    }
  };

  const stopMeasurement = () => {
    pitchDetectorRef.current?.stop();
    audioManagerRef.current?.disconnectStream();
    setCurrentFrequency(null);
    setMeasurementState('complete');
  };

  const saveMeasurement = () => {
    saveCurrentMeasurement();
    alert('Measurement saved successfully!');
  };

  const resetMeasurement = () => {
    reset();
    setCurrentFrequency(null);
    setMeasurementState('idle');
    rendererRef.current?.clearHighlights();
  };

  const formatNote = (note: { name: string; octave: number }) => {
    return `${note.name}${note.octave}`;
  };

  return (
    <div className="min-h-screen bg-gradient-dark text-white flex flex-col items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        <h1 className="text-5xl font-bold text-center mb-2 bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
          Vocal Range Tracker
        </h1>
        <p className="text-center text-purple-200 mb-8 text-lg">
          Measure your vocal range with real-time pitch detection
        </p>

        <div className="bg-gradient-to-br from-purple-900/30 via-pink-900/20 to-purple-900/30 backdrop-blur-sm rounded-2xl p-6 mb-6 border border-purple-500/30 shadow-glow-lg">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Canvas Visualization */}
            <div className="flex-1">
              <canvas
                ref={canvasRef}
                width={400}
                height={600}
                className="w-full border-2 border-purple-500/50 rounded-xl shadow-glow"
                style={{ maxHeight: '600px' }}
              />
            </div>

            {/* Info Panel */}
            <div className="flex-1 flex flex-col justify-between">
              <div>
                <h2 className="text-2xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">Measurement</h2>

                {measurementState === 'measuring' && currentFrequency && (
                  <div className="mb-4 p-4 bg-gradient-to-br from-purple-800/40 to-pink-800/40 rounded-xl border border-purple-400/30 shadow-glow">
                    <p className="text-sm text-purple-300">Current Note:</p>
                    <p className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                      {frequencyToNote(currentFrequency)?.name}
                      {frequencyToNote(currentFrequency)?.octave}
                    </p>
                  </div>
                )}

                {vocalRangeState.lowestNote && vocalRangeState.highestNote && (
                  <div className="p-6 bg-gradient-to-br from-purple-800/40 to-pink-800/40 rounded-xl border border-purple-400/30 shadow-glow">
                    <p className="text-sm text-purple-300 mb-3">Your Range:</p>
                    <p className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent text-center">
                      {formatNote(vocalRangeState.lowestNote)} ~ {formatNote(vocalRangeState.highestNote)}
                    </p>
                  </div>
                )}
              </div>

              {/* Controls */}
              <div className="mt-6 space-y-3">
                {measurementState === 'idle' && (
                  <button
                    onClick={startMeasurement}
                    className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-xl font-bold transition shadow-glow-lg"
                  >
                    Start Measurement
                  </button>
                )}

                {measurementState === 'requesting' && (
                  <div className="text-center py-3">
                    <p className="text-purple-400">Requesting microphone access...</p>
                  </div>
                )}

                {measurementState === 'measuring' && (
                  <button
                    onClick={stopMeasurement}
                    className="w-full py-3 bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 rounded-xl font-bold transition shadow-glow-pink"
                  >
                    Stop Measurement
                  </button>
                )}

                {measurementState === 'complete' && (
                  <>
                    <button
                      onClick={saveMeasurement}
                      className="w-full py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 rounded-xl font-bold transition shadow-glow"
                    >
                      Save Measurement
                    </button>
                    <button
                      onClick={resetMeasurement}
                      className="w-full py-3 bg-gradient-to-r from-purple-700 to-pink-700 hover:from-purple-800 hover:to-pink-800 rounded-xl font-bold transition"
                    >
                      New Measurement
                    </button>
                  </>
                )}

                {measurementState === 'error' && (
                  <>
                    <div className="p-4 bg-gradient-to-br from-red-900/40 to-pink-900/40 border border-red-500/50 rounded-xl text-red-200 shadow-glow-pink">
                      <p className="font-bold mb-1">Error</p>
                      <p className="text-sm">{error}</p>
                    </div>
                    <button
                      onClick={resetMeasurement}
                      className="w-full py-3 bg-gradient-to-r from-purple-700 to-pink-700 hover:from-purple-800 hover:to-pink-800 rounded-xl font-bold transition"
                    >
                      Try Again
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-gradient-to-br from-purple-900/30 via-pink-900/20 to-purple-900/30 backdrop-blur-sm rounded-2xl p-6 border border-purple-500/30 shadow-glow">
          <h3 className="text-xl font-bold mb-3 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">How to use:</h3>
          <ol className="list-decimal list-inside space-y-2 text-purple-200">
            <li>Click "Start Measurement" and allow microphone access</li>
            <li>Sing your lowest comfortable note and hold it for 2-3 seconds</li>
            <li>Sing your highest comfortable note and hold it for 2-3 seconds</li>
            <li>Click "Stop Measurement" to see your results</li>
            <li>Save your measurement to track your progress over time</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
