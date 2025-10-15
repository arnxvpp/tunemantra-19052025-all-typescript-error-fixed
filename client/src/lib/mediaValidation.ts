
export interface AudioSpecs {
  sampleRate: number;
  bitDepth: number;
  format: string;
}

export interface VideoSpecs {
  width: number;
  height: number;
  frameRate: number;
  format: string;
  bitRate: number;
}

export const validateAudioFile = async (file: File): Promise<{ isValid: boolean; error?: string }> => {
  if (!file.name.toLowerCase().endsWith('.wav')) {
    return { isValid: false, error: 'Only WAV files are accepted' };
  }

  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  const arrayBuffer = await file.arrayBuffer();
  const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

  const isValidSampleRate = [44100, 48000].includes(audioBuffer.sampleRate);
  
  if (!isValidSampleRate) {
    return { isValid: false, error: 'Sample rate must be either 44.1kHz or 48kHz' };
  }

  // Check for silence longer than 5 seconds
  const channelData = audioBuffer.getChannelData(0);
  const sampleRate = audioBuffer.sampleRate;
  let silenceCount = 0;
  const silenceThreshold = 0.001;
  
  for (let i = 0; i < channelData.length; i++) {
    if (Math.abs(channelData[i]) < silenceThreshold) {
      silenceCount++;
      if (silenceCount >= sampleRate * 5) {
        return { isValid: false, error: 'Audio contains silence longer than 5 seconds' };
      }
    } else {
      silenceCount = 0;
    }
  }

  return { isValid: true };
};

export const validateVideoFile = async (file: File): Promise<{ isValid: boolean; error?: string }> => {
  if (!['video/quicktime', 'video/mp4'].includes(file.type)) {
    return { isValid: false, error: 'Only .mov (ProRes) or .mp4 (H.264) files are accepted' };
  }

  const video = document.createElement('video');
  video.preload = 'metadata';

  return new Promise((resolve) => {
    video.onloadedmetadata = () => {
      const isValidResolution = video.videoWidth >= 1280 && video.videoHeight >= 720;
      const isValidDuration = video.duration <= 600; // 10 minutes in seconds

      if (!isValidResolution) {
        resolve({ isValid: false, error: 'Minimum resolution required is 1280x720' });
      } else if (!isValidDuration) {
        resolve({ isValid: false, error: 'Video cannot exceed 10 minutes' });
      } else {
        resolve({ isValid: true });
      }
    };

    video.onerror = () => {
      resolve({ isValid: false, error: 'Unable to validate video file' });
    };

    video.src = URL.createObjectURL(file);
  });
};
