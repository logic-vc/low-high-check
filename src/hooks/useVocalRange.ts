/**
 * useVocalRange Hook
 *
 * React hook for managing vocal range state and persistence
 */

import { useState, useCallback } from 'react';
import { RangeDataStorage, type VocalRangeRecord } from '../services/storage/RangeDataStorage';
import type { Note } from '../utils/audio/frequencyConverter';

/**
 * Vocal range state
 */
export interface VocalRangeState {
  /** Current lowest note */
  lowestNote: Note | null;
  /** Current highest note */
  highestNote: Note | null;
  /** Current range in semitones */
  rangeInSemitones: number;
  /** Is currently measuring */
  isMeasuring: boolean;
}

/**
 * Hook return type
 */
export interface UseVocalRangeReturn {
  /** Current state */
  state: VocalRangeState;
  /** Update the lowest note */
  updateLowest: (note: Note) => void;
  /** Update the highest note */
  updateHighest: (note: Note) => void;
  /** Reset current measurement */
  reset: () => void;
  /** Save current measurement */
  saveCurrentMeasurement: () => void;
  /** Get measurement history */
  getHistory: (limit?: number) => VocalRangeRecord[];
  /** Clear all saved data */
  clearAllData: () => void;
  /** Load saved measurement */
  loadSaved: () => void;
}

const storage = new RangeDataStorage();

/**
 * Hook for managing vocal range measurements
 *
 * @returns Vocal range state and control functions
 *
 * @example
 * ```typescript
 * function VocalRangeTracker() {
 *   const { state, updateLowest, updateHighest, saveCurrentMeasurement } = useVocalRange();
 *
 *   useEffect(() => {
 *     // When pitch is detected
 *     if (detectedNote) {
 *       if (!state.lowestNote || detectedNote.frequency < state.lowestNote.frequency) {
 *         updateLowest(detectedNote);
 *       }
 *       if (!state.highestNote || detectedNote.frequency > state.highestNote.frequency) {
 *         updateHighest(detectedNote);
 *       }
 *     }
 *   }, [detectedNote]);
 *
 *   return (
 *     <div>
 *       <p>Range: {state.rangeInSemitones} semitones</p>
 *       <button onClick={saveCurrentMeasurement}>Save</button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useVocalRange(): UseVocalRangeReturn {
  const [state, setState] = useState<VocalRangeState>(() => {
    // Load saved data on initialization
    const saved = storage.load();
    if (saved) {
      return {
        lowestNote: saved.lowestNote,
        highestNote: saved.highestNote,
        rangeInSemitones: saved.rangeInSemitones,
        isMeasuring: false,
      };
    }
    return {
      lowestNote: null,
      highestNote: null,
      rangeInSemitones: 0,
      isMeasuring: false,
    };
  });

  /**
   * Loads saved measurement
   */
  const loadSaved = useCallback(() => {
    const saved = storage.load();
    if (saved) {
      setState({
        lowestNote: saved.lowestNote,
        highestNote: saved.highestNote,
        rangeInSemitones: saved.rangeInSemitones,
        isMeasuring: false,
      });
    }
  }, []);

  /**
   * Updates the lowest note
   */
  const updateLowest = useCallback((note: Note) => {
    setState((prev) => {
      const newLowest = !prev.lowestNote || note.frequency < prev.lowestNote.frequency
        ? note
        : prev.lowestNote;

      const rangeInSemitones = prev.highestNote
        ? Math.round(12 * Math.log2(prev.highestNote.frequency / newLowest.frequency))
        : 0;

      return {
        ...prev,
        lowestNote: newLowest,
        rangeInSemitones,
        isMeasuring: true,
      };
    });
  }, []);

  /**
   * Updates the highest note
   */
  const updateHighest = useCallback((note: Note) => {
    setState((prev) => {
      const newHighest = !prev.highestNote || note.frequency > prev.highestNote.frequency
        ? note
        : prev.highestNote;

      const rangeInSemitones = prev.lowestNote
        ? Math.round(12 * Math.log2(newHighest.frequency / prev.lowestNote.frequency))
        : 0;

      return {
        ...prev,
        highestNote: newHighest,
        rangeInSemitones,
        isMeasuring: true,
      };
    });
  }, []);

  /**
   * Resets current measurement
   */
  const reset = useCallback(() => {
    setState({
      lowestNote: null,
      highestNote: null,
      rangeInSemitones: 0,
      isMeasuring: false,
    });
  }, []);

  /**
   * Saves current measurement to storage
   */
  const saveCurrentMeasurement = useCallback(() => {
    if (!state.lowestNote || !state.highestNote) {
      console.warn('Cannot save: no measurement data');
      return;
    }

    const record: VocalRangeRecord = {
      id: crypto.randomUUID(),
      date: new Date(),
      lowestNote: state.lowestNote,
      highestNote: state.highestNote,
      rangeInSemitones: state.rangeInSemitones,
    };

    try {
      storage.save(record);
      console.log('Measurement saved successfully');
    } catch (error) {
      console.error('Failed to save measurement:', error);
    }
  }, [state]);

  /**
   * Gets measurement history
   */
  const getHistory = useCallback((limit: number = 10): VocalRangeRecord[] => {
    return storage.getHistory(limit);
  }, []);

  /**
   * Clears all saved data
   */
  const clearAllData = useCallback(() => {
    storage.clear();
    reset();
  }, [reset]);

  return {
    state,
    updateLowest,
    updateHighest,
    reset,
    saveCurrentMeasurement,
    getHistory,
    clearAllData,
    loadSaved,
  };
}
