import { useContext } from 'react';
import { AudioStreamContext } from '../context/AudioStreamContext';
import type { AudioStreamContextType } from '../context/AudioStreamContext';

export const useAudioStream = (): AudioStreamContextType => {
  const context = useContext(AudioStreamContext);
  if (context === undefined) {
    throw new Error('useAudioStream must be used within an AudioStreamProvider');
  }
  return context;
};
