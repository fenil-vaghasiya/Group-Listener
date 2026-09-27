export type ConnectionStatus = 'Connected' | 'Connecting' | 'Reconnecting' | 'Disconnected';

export interface EventLog {
  id: string;
  timestamp: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'action';
}

export interface RoomDetails {
  roomCode: string;
  participants: string[];
}

export interface JoinRoomRequest {
  username: string;
  roomCode: string;
}

export interface CreateRoomRequest {
  username: string;
}

export interface MediaStateDto {
  mediaUrl: string | null;
  currentPositionSeconds: number;
  isPlaying: boolean;
  lastUpdatedUtc?: string;
  hostConnectionId?: string | null;
}

export interface AudioChunkDto {
  sequenceNumber: number;
  timestampUtc: string;
  data: string; // Base64 encoded audio byte array
}

export interface IAudioPlayer {
  start(): void;
  stop(): void;
  isPlaying(): boolean;
  getVolume(): number;
  setVolume(volume: number): void;
}

export interface IAudioBufferQueue {
  enqueue(chunk: ArrayBuffer): void;
  dequeue(): ArrayBuffer | null;
  clear(): void;
  size(): number;
}


