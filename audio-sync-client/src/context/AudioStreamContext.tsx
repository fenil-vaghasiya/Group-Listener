import React, { createContext, useState, useEffect, useRef, useCallback } from 'react';
import { signalRService } from '../services/signalrService';
import { useRoom } from '../hooks/useRoom';
import { AudioBufferManager } from '../services/AudioBufferManager';

export interface AudioStreamContextType {
  isStreaming: boolean;
  currentSequence: number;
  lastChunkTimestamp: string | null;
  streamStatus: 'Stopped' | 'Streaming' | 'Buffering';
  receivedChunksCount: number;
  missingChunksCount: number;
  streamHealth: number;
  startStreaming: () => Promise<void>;
  stopStreaming: () => Promise<void>;
  resetStream: () => void;
}

export const AudioStreamContext = createContext<AudioStreamContextType | undefined>(undefined);

export const AudioStreamProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { roomCode, addLog } = useRoom();

  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [currentSequence, setCurrentSequence] = useState<number>(0);
  const [lastChunkTimestamp, setLastChunkTimestamp] = useState<string | null>(null);
  const [streamStatus, setStreamStatus] = useState<'Stopped' | 'Streaming' | 'Buffering'>('Stopped');

  const [receivedChunksCount, setReceivedChunksCount] = useState<number>(0);
  const [missingChunksCount, setMissingChunksCount] = useState<number>(0);
  const [streamHealth, setStreamHealth] = useState<number>(100);

  const bufferManagerRef = useRef(new AudioBufferManager());

  const syncDiagnostics = useCallback(() => {
    const manager = bufferManagerRef.current;
    setReceivedChunksCount(manager.getReceivedCount());
    setMissingChunksCount(manager.getMissingCount());
    setStreamHealth(manager.getStreamHealth());
    // Use maximum of 0 and expected sequence - 1 to represent current sequence index
    setCurrentSequence(Math.max(0, manager.getExpectedSequence() - 1));
  }, []);

  const resetStream = useCallback(() => {
    bufferManagerRef.current.clear();
    syncDiagnostics();
    setLastChunkTimestamp(null);
  }, [syncDiagnostics]);

  useEffect(() => {
    signalRService.registerStreamCallbacks({
      onStreamStarted: (rCode, startedBy) => {
        setIsStreaming(true);
        setStreamStatus('Streaming');
        resetStream();
        if (addLog) {
          addLog(`Stream started in room ${rCode} by ${startedBy}`, 'success');
        }
      },
      onStreamStopped: (rCode, stoppedBy) => {
        setIsStreaming(false);
        setStreamStatus('Stopped');
        if (addLog) {
          addLog(`Stream stopped in room ${rCode} by ${stoppedBy}`, 'warning');
        }
      },
      onAudioChunkReceived: (sequenceNumber, timestampUtc, base64Data) => {
        bufferManagerRef.current.addChunk(sequenceNumber, base64Data);
        setLastChunkTimestamp(new Date(timestampUtc).toLocaleTimeString());
        syncDiagnostics();
        setStreamStatus('Streaming');

        if (addLog) {
          addLog(`Audio chunk received: seq #${sequenceNumber} (${base64Data.length} bytes)`, 'action');
        }
      }
    });

    return () => {
      signalRService.registerStreamCallbacks({});
    };
  }, [addLog, resetStream, syncDiagnostics]);

  const startStreaming = async () => {
    if (!roomCode) return;
    try {
      if (addLog) addLog('Starting live audio stream...', 'info');
      await signalRService.startStreaming(roomCode);
    } catch (err) {
      console.error('Failed to start stream:', err);
      if (addLog) addLog(`Failed to start stream: ${err instanceof Error ? err.message : err}`, 'error');
    }
  };

  const stopStreaming = async () => {
    if (!roomCode) return;
    try {
      if (addLog) addLog('Stopping live audio stream...', 'info');
      await signalRService.stopStreaming(roomCode);
    } catch (err) {
      console.error('Failed to stop stream:', err);
      if (addLog) addLog(`Failed to stop stream: ${err instanceof Error ? err.message : err}`, 'error');
    }
  };

  return (
    <AudioStreamContext.Provider
      value={{
        isStreaming,
        currentSequence,
        lastChunkTimestamp,
        streamStatus,
        receivedChunksCount,
        missingChunksCount,
        streamHealth,
        startStreaming,
        stopStreaming,
        resetStream,
      }}
    >
      {children}
    </AudioStreamContext.Provider>
  );
};
