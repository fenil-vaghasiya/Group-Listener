import axios from 'axios';
import type { CreateRoomRequest, JoinRoomRequest, RoomDetails, MediaStateDto } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://localhost:7001';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  // Ensure we allow credentials if the server requires them
  withCredentials: true,
});

const extractParticipants = (data: Record<string, unknown>): string[] => {
  const rawList = (data.participants || data.Participants || []) as unknown[];
  if (!Array.isArray(rawList)) return [];
  return rawList
    .map((item: unknown) => {
      if (typeof item === 'string') return item;
      if (item && typeof item === 'object') {
        const obj = item as Record<string, unknown>;
        return (obj.username || obj.Username || obj.name || obj.Name || '') as string;
      }
      return '';
    })
    .filter((name: string) => name !== '');
};

export const apiService = {
  /**
   * Call POST /api/rooms/create
   */
  createRoom: async (username: string): Promise<RoomDetails> => {
    console.log('[API] POST /api/rooms/create - Request username:', username);
    const response = await api.post<Record<string, unknown>>('/api/rooms/create', { username } as CreateRoomRequest);
    console.log('[API] POST /api/rooms/create - Response raw data:', response.data);
    return {
      roomCode: (response.data?.roomCode as string) || (response.data?.RoomCode as string) || (response.data?.code as string) || '',
      participants: extractParticipants(response.data),
    };
  },

  /**
   * Call POST /api/rooms/join
   */
  joinRoom: async (username: string, roomCode: string): Promise<RoomDetails> => {
    console.log('[API] POST /api/rooms/join - Request:', { username, roomCode });
    const response = await api.post<Record<string, unknown>>('/api/rooms/join', { username, roomCode } as JoinRoomRequest);
    console.log('[API] POST /api/rooms/join - Response raw data:', response.data);
    return {
      roomCode: (response.data?.roomCode as string) || (response.data?.RoomCode as string) || (response.data?.code as string) || '',
      participants: extractParticipants(response.data),
    };
  },

  /**
   * Call GET /api/rooms/{roomCode}
   */
  getRoom: async (roomCode: string): Promise<RoomDetails> => {
    console.log('[API] GET /api/rooms - Request code:', roomCode);
    const response = await api.get<Record<string, unknown>>(`/api/rooms/${encodeURIComponent(roomCode)}`);
    console.log('[API] GET /api/rooms - Response raw data:', response.data);
    return {
      roomCode: (response.data?.roomCode as string) || (response.data?.RoomCode as string) || (response.data?.code as string) || '',
      participants: extractParticipants(response.data),
    };
  },

  /**
   * Call GET /api/rooms/{roomCode}/media-state
   */
  getMediaState: async (roomCode: string): Promise<MediaStateDto | null> => {
    try {
      console.log('[API] GET /api/rooms/media-state - Request code:', roomCode);
      const response = await api.get<Record<string, unknown>>(`/api/rooms/${encodeURIComponent(roomCode)}/media-state`);
      console.log('[API] GET /api/rooms/media-state - Response raw data:', response.data);
      const data = response.data;
      if (!data) return null;
      return {
        mediaUrl: (data.mediaUrl ?? data.MediaUrl ?? null) as string | null,
        currentPositionSeconds: Number(data.currentPositionSeconds ?? data.CurrentPositionSeconds ?? 0),
        isPlaying: Boolean(data.isPlaying ?? data.IsPlaying ?? false),
        lastUpdatedUtc: (data.lastUpdatedUtc ?? data.LastUpdatedUtc ?? undefined) as string | undefined,
        hostConnectionId: (data.hostConnectionId ?? data.HostConnectionId ?? null) as string | null,
      };
    } catch (err) {
      console.warn('Failed to fetch media state:', err);
      return null;
    }
  },
};
