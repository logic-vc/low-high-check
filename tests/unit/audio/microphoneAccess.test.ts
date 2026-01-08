import { describe, it, expect, beforeEach, vi } from 'vitest';
import { requestMicrophoneAccess, MicrophoneError } from '../../../src/utils/audio/microphoneAccess';

describe('requestMicrophoneAccess', () => {
  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks();
  });

  it('should return MediaStream when permission is granted', async () => {
    // Arrange
    const mockStream = {
      getTracks: () => [{ stop: vi.fn(), kind: 'audio', enabled: true }],
      getAudioTracks: () => [{ stop: vi.fn(), kind: 'audio', enabled: true }],
    } as unknown as MediaStream;

    vi.spyOn(navigator.mediaDevices, 'getUserMedia').mockResolvedValue(mockStream);

    // Act
    const result = await requestMicrophoneAccess();

    // Assert
    expect(result).toBe(mockStream);
    expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalledWith({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: false,
      },
    });
  });

  it('should throw MicrophoneError when permission is denied', async () => {
    // Arrange
    const notAllowedError = new Error('Permission denied');
    notAllowedError.name = 'NotAllowedError';

    vi.spyOn(navigator.mediaDevices, 'getUserMedia').mockRejectedValue(notAllowedError);

    // Act & Assert
    await expect(requestMicrophoneAccess()).rejects.toThrow(MicrophoneError);
    await expect(requestMicrophoneAccess()).rejects.toThrow('Microphone permission was denied');
  });

  it('should throw MicrophoneError when no microphone is found', async () => {
    // Arrange
    const notFoundError = new Error('Device not found');
    notFoundError.name = 'NotFoundError';

    vi.spyOn(navigator.mediaDevices, 'getUserMedia').mockRejectedValue(notFoundError);

    // Act & Assert
    await expect(requestMicrophoneAccess()).rejects.toThrow(MicrophoneError);
    await expect(requestMicrophoneAccess()).rejects.toThrow('No microphone device found');
  });

  it('should throw MicrophoneError when getUserMedia is not supported', async () => {
    // Arrange
    const originalGetUserMedia = navigator.mediaDevices.getUserMedia;
    // @ts-expect-error - Testing unsupported scenario
    navigator.mediaDevices.getUserMedia = undefined;

    // Act & Assert
    await expect(requestMicrophoneAccess()).rejects.toThrow(MicrophoneError);
    await expect(requestMicrophoneAccess()).rejects.toThrow('getUserMedia is not supported');

    // Cleanup
    navigator.mediaDevices.getUserMedia = originalGetUserMedia;
  });

  it('should handle generic errors gracefully', async () => {
    // Arrange
    const genericError = new Error('Unknown error');
    vi.spyOn(navigator.mediaDevices, 'getUserMedia').mockRejectedValue(genericError);

    // Act & Assert
    await expect(requestMicrophoneAccess()).rejects.toThrow(MicrophoneError);
  });
});
