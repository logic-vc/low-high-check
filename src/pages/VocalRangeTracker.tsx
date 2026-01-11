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
    <div className="min-h-screen bg-neon-blue-950 text-white flex flex-col items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        <h1 className="text-4xl font-bold text-center mb-2">
          Vocal Range Tracker
        </h1>
        <p className="text-center text-neon-blue-300 mb-8">
          Measure your vocal range with real-time pitch detection
        </p>

        <div className="bg-neon-blue-900 rounded-lg p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Canvas Visualization */}
            <div className="flex-1">
              <canvas
                ref={canvasRef}
                width={400}
                height={600}
                className="w-full border-2 border-neon-blue-500 rounded"
                style={{ maxHeight: '600px' }}
              />
            </div>

            {/* Info Panel */}
            <div className="flex-1 flex flex-col justify-between">
              <div>
                <h2 className="text-2xl font-bold mb-4">Measurement</h2>

                {measurementState === 'measuring' && currentFrequency && (
                  <div className="mb-4 p-4 bg-neon-blue-800 rounded">
                    <p className="text-sm text-neon-blue-300">Current Note:</p>
                    <p className="text-3xl font-bold text-neon-blue-500">
                      {frequencyToNote(currentFrequency)?.name}
                      {frequencyToNote(currentFrequency)?.octave}
                    </p>
                    <p className="text-sm text-neon-blue-400">
                      {currentFrequency.toFixed(1)} Hz
                    </p>
                  </div>
                )}

                {vocalRangeState.lowestNote && vocalRangeState.highestNote && (
                  <div className="space-y-4">
                    <div className="p-4 bg-neon-blue-800 rounded">
                      <p className="text-sm text-neon-blue-300">Lowest Note:</p>
                      <p className="text-2xl font-bold">
                        {formatNote(vocalRangeState.lowestNote)}
                      </p>
                      <p className="text-sm text-neon-blue-400">
                        {vocalRangeState.lowestNote.frequency.toFixed(1)} Hz
                      </p>
                    </div>

                    <div className="p-4 bg-neon-blue-800 rounded">
                      <p className="text-sm text-neon-blue-300">Highest Note:</p>
                      <p className="text-2xl font-bold">
                        {formatNote(vocalRangeState.highestNote)}
                      </p>
                      <p className="text-sm text-neon-blue-400">
                        {vocalRangeState.highestNote.frequency.toFixed(1)} Hz
                      </p>
                    </div>

                    <div className="p-4 bg-neon-blue-800 rounded">
                      <p className="text-sm text-neon-blue-300">Range:</p>
                      <p className="text-3xl font-bold text-neon-blue-500">
                        {vocalRangeState.rangeInSemitones} semitones
                      </p>
                      <p className="text-sm text-neon-blue-400">
                        ({(vocalRangeState.rangeInSemitones / 12).toFixed(1)} octaves)
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Controls */}
              <div className="mt-6 space-y-3">
                {measurementState === 'idle' && (
                  <button
                    onClick={startMeasurement}
                    className="w-full py-3 bg-neon-blue-500 hover:bg-neon-blue-600 rounded-lg font-bold transition"
                  >
                    Start Measurement
                  </button>
                )}

                {measurementState === 'requesting' && (
                  <div className="text-center py-3">
                    <p className="text-neon-blue-400">Requesting microphone access...</p>
                  </div>
                )}

                {measurementState === 'measuring' && (
                  <button
                    onClick={stopMeasurement}
                    className="w-full py-3 bg-red-500 hover:bg-red-600 rounded-lg font-bold transition"
                  >
                    Stop Measurement
                  </button>
                )}

                {measurementState === 'complete' && (
                  <>
                    <button
                      onClick={saveMeasurement}
                      className="w-full py-3 bg-green-500 hover:bg-green-600 rounded-lg font-bold transition"
                    >
                      Save Measurement
                    </button>
                    <button
                      onClick={resetMeasurement}
                      className="w-full py-3 bg-neon-blue-700 hover:bg-neon-blue-800 rounded-lg font-bold transition"
                    >
                      New Measurement
                    </button>
                  </>
                )}

                {measurementState === 'error' && (
                  <>
                    <div className="p-4 bg-red-900 border border-red-500 rounded text-red-200">
                      <p className="font-bold mb-1">Error</p>
                      <p className="text-sm">{error}</p>
                    </div>
                    <button
                      onClick={resetMeasurement}
                      className="w-full py-3 bg-neon-blue-700 hover:bg-neon-blue-800 rounded-lg font-bold transition"
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
        <div className="bg-neon-blue-900 rounded-lg p-6">
          <h3 className="text-xl font-bold mb-3">How to use:</h3>
          <ol className="list-decimal list-inside space-y-2 text-neon-blue-300">
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
