/**
 * Custom error class for microphone access issues
 */
export class MicrophoneError extends Error {
  public readonly code?: string;

  constructor(message: string, code?: string) {
    super(message);
    this.name = 'MicrophoneError';
    this.code = code;
  }
}

/**
 * Audio constraints for optimal vocal recording
 * - echoCancellation: Reduces echo feedback
 * - noiseSuppression: Reduces background noise
 * - autoGainControl: Disabled to preserve natural vocal dynamics
 */
const AUDIO_CONSTRAINTS: MediaStreamConstraints = {
  audio: {
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: false,
  },
};

/**
 * Requests microphone access from the user
 *
 * @returns Promise<MediaStream> The audio stream from the microphone
 * @throws {MicrophoneError} When permission is denied, device not found, or getUserMedia not supported
 *
 * @example
 * ```typescript
 * try {
 *   const stream = await requestMicrophoneAccess();
 *   // Use stream...
 * } catch (error) {
 *   if (error instanceof MicrophoneError) {
 *     console.error('Microphone error:', error.message);
 *   }
 * }
 * ```
 *
 * Browser Compatibility:
 * - Chrome/Edge: Full support
 * - Firefox: Full support
 * - Safari: Requires HTTPS (except localhost)
 */
export async function requestMicrophoneAccess(): Promise<MediaStream> {
  // Check if getUserMedia is supported
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    throw new MicrophoneError(
      'getUserMedia is not supported in this browser. Please use a modern browser like Chrome, Firefox, or Safari.',
      'NOT_SUPPORTED'
    );
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia(AUDIO_CONSTRAINTS);
    return stream;
  } catch (error) {
    // Handle specific error types
    if (error instanceof Error) {
      switch (error.name) {
        case 'NotAllowedError':
          throw new MicrophoneError(
            'Microphone permission was denied. Please allow microphone access in your browser settings.',
            'PERMISSION_DENIED'
          );

        case 'NotFoundError':
          throw new MicrophoneError(
            'No microphone device found. Please connect a microphone and try again.',
            'NO_DEVICE'
          );

        case 'NotReadableError':
          throw new MicrophoneError(
            'Microphone is already in use by another application.',
            'DEVICE_IN_USE'
          );

        case 'OverconstrainedError':
          throw new MicrophoneError(
            'The requested audio settings are not supported by your device.',
            'CONSTRAINTS_NOT_SATISFIED'
          );

        case 'SecurityError':
          throw new MicrophoneError(
            'Microphone access blocked for security reasons. Ensure you are using HTTPS.',
            'SECURITY_ERROR'
          );

        default:
          throw new MicrophoneError(
            `Failed to access microphone: ${error.message}`,
            'UNKNOWN_ERROR'
          );
      }
    }

    // If error is not an Error instance (unlikely, but handle it)
    throw new MicrophoneError(
      'An unexpected error occurred while accessing the microphone.',
      'UNKNOWN_ERROR'
    );
  }
}

/**
 * Stops all tracks in a MediaStream and releases the microphone
 *
 * @param stream The MediaStream to stop
 *
 * @example
 * ```typescript
 * const stream = await requestMicrophoneAccess();
 * // ... use stream ...
 * stopMicrophoneStream(stream);
 * ```
 */
export function stopMicrophoneStream(stream: MediaStream): void {
  stream.getTracks().forEach(track => {
    track.stop();
  });
}
