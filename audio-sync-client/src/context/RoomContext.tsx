/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useState, useEffect, useRef, useCallback } from 'react';
import type { ConnectionStatus, EventLog } from '../types';
import { signalRService } from '../services/signalrService';
import { apiService } from '../api/apiService';

export interface RoomContextType {
  username: string | null;
  roomCode: string | null;
  connectionStatus: ConnectionStatus;
  participants: string[];
  eventLogs: EventLog[];
  error: string | null;
  isPlaying: boolean;
  playbackPosition: number;
  isHost: boolean;
  
  // Real Audio state
  mediaUrl: string | null;
  duration: number;
  isBuffering: boolean;
  isLoading: boolean;

  // Actions
  setUsername: (username: string) => void;
  setRoomCode: (roomCode: string) => void;
  clearError: () => void;
  addLog: (message: string, type?: EventLog['type']) => void;
  
  // Room Actions
  createRoom: (username: string) => Promise<string>;
  joinRoom: (username: string, roomCode: string) => Promise<string>;
  leaveRoom: () => Promise<void>;
  
  // Real-time synchronization commands
  sendPlay: () => Promise<void>;
  sendPause: () => Promise<void>;
  sendSeek: (position: number) => Promise<void>;
  sendLoadMedia: (mediaUrl: string) => Promise<void>;
  
  // Local Player Sim Updates
  setLocalPlayState: (playing: boolean) => void;
  setLocalPosition: (position: number | ((prev: number) => number)) => void;
}

export const RoomContext = createContext<RoomContextType | undefined>(undefined);

const getFormattedTimestamp = (): string => {
  const now = new Date();
  const pad = (n: number) => n.toString().padStart(2, '0');
  const hh = pad(now.getHours());
  const mm = pad(now.getMinutes());
  const ss = pad(now.getSeconds());
  return `[${hh}:${mm}:${ss}]`;
};

export const RoomProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [username, setUsernameState] = useState<string | null>(() => sessionStorage.getItem('username'));
  const [roomCode, setRoomCodeState] = useState<string | null>(() => sessionStorage.getItem('roomCode'));
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('Disconnected');
  const [participants, setParticipants] = useState<string[]>([]);
  const [eventLogs, setEventLogs] = useState<EventLog[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [isHost, setIsHostState] = useState<boolean>(() => sessionStorage.getItem('isHost') === 'true');

  const setIsHost = (value: boolean) => {
    setIsHostState(value);
    sessionStorage.setItem('isHost', String(value));
  };

  // Audio Playback State
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackPosition, setPlaybackPosition] = useState<number>(0);
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [duration, setDuration] = useState<number>(0);
  const [isBuffering, setIsBuffering] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const activeRoomRef = useRef<string | null>(null);

  useEffect(() => {
    activeRoomRef.current = roomCode;
  }, [roomCode]);

  // Initialize audio and event listeners
  useEffect(() => {
    const audio = new Audio();
    audioRef.current = audio;

    const handleTimeUpdate = () => {
      setPlaybackPosition(audio.currentTime);
    };

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
      setIsLoading(false);
    };

    const handleWaiting = () => {
      setIsBuffering(true);
    };

    const handlePlaying = () => {
      setIsBuffering(false);
      setIsLoading(false);
    };

    const handleCanPlay = () => {
      setIsLoading(false);
      setIsBuffering(false);
    };

    const handleSeeked = () => {
      setIsBuffering(false);
    };

    const handleAudioError = () => {
      setIsLoading(false);
      setIsBuffering(false);
      if (audio.src) {
        setError("Failed to load or play audio source. Please verify the URL.");
      }
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('waiting', handleWaiting);
    audio.addEventListener('playing', handlePlaying);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('seeked', handleSeeked);
    audio.addEventListener('error', handleAudioError);

    return () => {
      audio.pause();
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('waiting', handleWaiting);
      audio.removeEventListener('playing', handlePlaying);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('seeked', handleSeeked);
      audio.removeEventListener('error', handleAudioError);
      audio.src = '';
      audioRef.current = null;
    };
  }, []);

  const setUsername = (name: string) => {
    setUsernameState(name);
    sessionStorage.setItem('username', name);
  };

  const setRoomCode = (code: string) => {
    setRoomCodeState(code);
    sessionStorage.setItem('roomCode', code);
  };

  const clearError = () => setError(null);

  const addLog = useCallback((message: string, type: EventLog['type'] = 'info') => {
    const newLog: EventLog = {
      id: Math.random().toString(36).substring(2, 9),
      timestamp: getFormattedTimestamp(),
      message,
      type,
    };
    setEventLogs((prev) => [newLog, ...prev].slice(0, 100)); // Cap logs at last 100
  }, []);

  const setLocalPlayState = (playing: boolean) => {
    setIsPlaying(playing);
    if (audioRef.current) {
      if (playing) audioRef.current.play().catch(() => {});
      else audioRef.current.pause();
    }
  };

  const setLocalPosition = (position: number | ((prev: number) => number)) => {
    setPlaybackPosition((prev) => {
      const nextPos = typeof position === 'function' ? position(prev) : position;
      if (audioRef.current) {
        audioRef.current.currentTime = nextPos;
      }
      return nextPos;
    });
  };

  const fetchParticipants = useCallback(async (code: string) => {
    try {
      const roomInfo = await apiService.getRoom(code);
      if (roomInfo && roomInfo.participants) {
        setParticipants(roomInfo.participants);
      }
    } catch (err) {
      console.warn('Failed to retrieve participant list from API:', err);
    }
  }, []);

  // SignalR Event Handlers
  const handleUserJoined = useCallback((joinedUser: string) => {
    setParticipants((prev) => {
      if (prev.includes(joinedUser)) return prev;
      return [...prev, joinedUser];
    });
    addLog(`${joinedUser} joined room`, 'success');
    if (activeRoomRef.current) {
      fetchParticipants(activeRoomRef.current);
    }
  }, [addLog, fetchParticipants]);

  const handleUserLeft = useCallback((leftUser: string) => {
    addLog(`User left room (ID/Name: ${leftUser})`, 'warning');
    if (activeRoomRef.current) {
      fetchParticipants(activeRoomRef.current);
    }
  }, [addLog, fetchParticipants]);

  const handlePlayReceived = useCallback(() => {
    setIsPlaying(true);
    addLog('Play received', 'action');
    if (audioRef.current && audioRef.current.src) {
      audioRef.current.play().catch((err) => {
        console.warn('Playback prevented or failed:', err);
      });
    }
  }, [addLog]);

  const handlePauseReceived = useCallback(() => {
    setIsPlaying(false);
    addLog('Pause received', 'action');
    if (audioRef.current) {
      audioRef.current.pause();
    }
  }, [addLog]);

  const handleSeekReceived = useCallback((position: number) => {
    setPlaybackPosition(position);
    addLog(`Seek received: ${position}s`, 'action');
    if (audioRef.current) {
      const diff = Math.abs(audioRef.current.currentTime - position);
      if (diff > 1.2) {
        audioRef.current.currentTime = position;
      }
    }
  }, [addLog]);

  const handleMediaLoaded = useCallback((url: string) => {
    addLog(`Media loaded: ${url}`, 'success');
    setMediaUrl(url);
    setPlaybackPosition(0);
    setIsPlaying(false);
    setIsLoading(true);
    if (audioRef.current) {
      audioRef.current.src = url;
      audioRef.current.currentTime = 0;
      audioRef.current.pause();
    }
  }, [addLog]);

  const handleError = useCallback((msg: string) => {
    setError(msg);
    addLog(`Error: ${msg}`, 'error');
  }, [addLog]);

  // Connect & join helper
  const connectAndJoin = useCallback(async (user: string, code: string) => {
    try {
      addLog(`Initializing SignalR connection for ${user}...`, 'info');
      
      await signalRService.connect(user, {
        onStatusChange: setConnectionStatus,
        onUserJoined: handleUserJoined,
        onUserLeft: handleUserLeft,
        onPlayReceived: handlePlayReceived,
        onPauseReceived: handlePauseReceived,
        onSeekReceived: handleSeekReceived,
        onMediaLoaded: handleMediaLoaded,
        onError: handleError,
      });

      addLog(`Connection established. Buffering state synchronization...`, 'info');
      // 500ms timing delay buffer to ensure the backend is fully updated
      await new Promise((resolve) => setTimeout(resolve, 500));

      addLog(`Joining room ${code}...`, 'info');
      await signalRService.joinRoom(code);
      addLog(`Joined room ${code} successfully!`, 'success');

      // Fetch participants from REST API
      await fetchParticipants(code);

      // Fetch current media state on join to synchronize
      try {
        addLog('Synchronizing room media state...', 'info');
        const mediaState = await apiService.getMediaState(code);
        if (mediaState && mediaState.mediaUrl) {
          addLog(`Sync: Loaded media ${mediaState.mediaUrl}`, 'info');
          setMediaUrl(mediaState.mediaUrl);
          setIsLoading(true);
          
          if (audioRef.current) {
            audioRef.current.src = mediaState.mediaUrl;
            
            // Calculate synced position if playing
            let targetPos = mediaState.currentPositionSeconds;
            if (mediaState.isPlaying && mediaState.lastUpdatedUtc) {
              const elapsed = (Date.now() - new Date(mediaState.lastUpdatedUtc).getTime()) / 1000;
              targetPos = Math.max(0, targetPos + elapsed);
              addLog(`Sync: Adjusted position by +${elapsed.toFixed(1)}s for active playback`, 'info');
            }
            
            audioRef.current.currentTime = targetPos;
            setPlaybackPosition(targetPos);
            
            if (mediaState.isPlaying) {
              setIsPlaying(true);
              audioRef.current.play().catch(err => {
                console.warn("Playback autoplay prevented on join sync:", err);
              });
            } else {
              setIsPlaying(false);
              audioRef.current.pause();
            }
          }
        } else {
          addLog('No active media in room yet.', 'info');
        }
      } catch (err) {
        console.warn('Failed to sync media state on join:', err);
      }

    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Failed to connect to SignalR hub.';
      handleError(errMsg);
      throw err;
    }
  }, [handleUserJoined, handleUserLeft, handlePlayReceived, handlePauseReceived, handleSeekReceived, handleMediaLoaded, handleError, addLog, fetchParticipants]);

  // REST + WebSocket Flow for Create
  const createRoom = async (user: string): Promise<string> => {
    setError(null);
    try {
      setUsername(user);
      addLog(`Creating room via API...`, 'info');
      const data = await apiService.createRoom(user);
      const code = data.roomCode;
      setRoomCode(code);
      
      setIsHost(true);
      await connectAndJoin(user, code);
      return code;
    } catch (err: unknown) {
      let errMsg = 'Failed to create room.';
      if (err instanceof Error) {
        errMsg = err.message;
      }
      const axiosError = err as { response?: { data?: { message?: string } } };
      if (axiosError?.response?.data?.message) {
        errMsg = axiosError.response.data.message;
      }
      setError(errMsg);
      addLog(`Room creation failed: ${errMsg}`, 'error');
      throw new Error(errMsg, { cause: err });
    }
  };

  // REST + WebSocket Flow for Join
  const joinRoom = async (user: string, code: string): Promise<string> => {
    setError(null);
    try {
      setUsername(user);
      addLog(`Validating room joining via API...`, 'info');
      const data = await apiService.joinRoom(user, code);
      const activeCode = data.roomCode || code;
      setRoomCode(activeCode);
   
      setIsHost(false);
      await connectAndJoin(user, activeCode);
      return activeCode;
    } catch (err: unknown) {
      let errMsg = 'Failed to join room.';
      if (err instanceof Error) {
        errMsg = err.message;
      }
      const axiosError = err as { response?: { data?: { message?: string } } };
      if (axiosError?.response?.data?.message) {
        errMsg = axiosError.response.data.message;
      }
      setError(errMsg);
      addLog(`Room joining failed: ${errMsg}`, 'error');
      throw new Error(errMsg, { cause: err });
    }
  };

  // Leave room and reset connection/state
  const leaveRoom = async () => {
    const activeCode = activeRoomRef.current;
    if (activeCode) {
      try {
        addLog(`Leaving room ${activeCode}...`, 'info');
        await signalRService.leaveRoom(activeCode);
      } catch (err) {
        console.warn('Error invoking LeaveRoom on hub', err);
      }
    }
    
    await signalRService.disconnect();

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
    }
    
    setRoomCodeState(null);
    sessionStorage.removeItem('roomCode');
    setParticipants([]);
    setEventLogs([]);
    setIsPlaying(false);
    setPlaybackPosition(0);
    setMediaUrl(null);
    setDuration(0);
    setIsBuffering(false);
    setIsLoading(false);
    setIsHost(false);
    setConnectionStatus('Disconnected');
    addLog('Disconnected from room and cleared state.', 'info');
  };

  // Commands to send to the Hub
  const sendPlay = async () => {
    const code = activeRoomRef.current;
    if (!code) return;
    try {
      addLog('Sending Play command...', 'info');
      await signalRService.play(code);
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Failed to broadcast Play command.';
      handleError(errMsg);
    }
  };

  const sendPause = async () => {
    const code = activeRoomRef.current;
    if (!code) return;
    try {
      addLog('Sending Pause command...', 'info');
      await signalRService.pause(code);
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Failed to broadcast Pause command.';
      handleError(errMsg);
    }
  };

  const sendSeek = async (position: number) => {
    const code = activeRoomRef.current;
    if (!code) return;
    try {
      addLog(`Sending Seek command: ${position}s...`, 'info');
      await signalRService.seek(code, position);
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Failed to broadcast Seek command.';
      handleError(errMsg);
    }
  };

  const sendLoadMedia = async (url: string) => {
    const code = activeRoomRef.current;
    if (!code) return;
    try {
      addLog(`Sending Load Media command: ${url}...`, 'info');
      await signalRService.loadMedia(code, url);
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Failed to broadcast Load Media command.';
      handleError(errMsg);
    }
  };

  // Re-establish connection on browser reload if username & roomCode exist in session
  useEffect(() => {
    const storedUser = sessionStorage.getItem('username');
    const storedRoom = sessionStorage.getItem('roomCode');
    
    if (storedUser && storedRoom && connectionStatus === 'Disconnected') {
      const initConnection = async () => {
        try {
          await connectAndJoin(storedUser, storedRoom);
        } catch {
          // Clear session if connection fails automatically on boot
          sessionStorage.removeItem('roomCode');
          setRoomCodeState(null);
        }
      };
      
      const timer = setTimeout(initConnection, 0);
      return () => clearTimeout(timer);
    }
  }, [connectAndJoin, connectionStatus]);

  return (
    <RoomContext.Provider
      value={{
        username,
        roomCode,
        connectionStatus,
        participants,
        eventLogs,
        error,
        isPlaying,
        playbackPosition,
        isHost,
        mediaUrl,
        duration,
        isBuffering,
        isLoading,
        setUsername,
        setRoomCode,
        clearError,
        addLog,
        createRoom,
        joinRoom,
        leaveRoom,
        sendPlay,
        sendPause,
        sendSeek,
        sendLoadMedia,
        setLocalPlayState,
        setLocalPosition,
      }}
    >
      {children}
    </RoomContext.Provider>
  );
};
