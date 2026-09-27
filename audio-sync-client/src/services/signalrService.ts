import { HubConnection, HubConnectionBuilder, HubConnectionState, LogLevel } from '@microsoft/signalr';
import type { ConnectionStatus } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://localhost:7001';

export interface SignalRCallbacks {
  onStatusChange: (status: ConnectionStatus) => void;
  onUserJoined: (username: string) => void;
  onUserLeft: (username: string) => void;
  onPlayReceived: () => void;
  onPauseReceived: () => void;
  onSeekReceived: (position: number) => void;
  onMediaLoaded: (mediaUrl: string) => void;
  onError: (message: string) => void;
}

export interface SignalRStreamCallbacks {
  onStreamStarted: (roomCode: string, startedBy: string, timestamp: string) => void;
  onStreamStopped: (roomCode: string, stoppedBy: string, timestamp: string) => void;
  onAudioChunkReceived: (sequenceNumber: number, timestampUtc: string, base64Data: string) => void;
}

class SignalRService {
  private connection: HubConnection | null = null;
  private streamCallbacks: Partial<SignalRStreamCallbacks> = {};

  public registerStreamCallbacks(callbacks: Partial<SignalRStreamCallbacks>) {
    this.streamCallbacks = callbacks;
  }

  /**
   * Connect to the SignalR hub
   */
  public async connect(username: string, callbacks: SignalRCallbacks): Promise<void> {
    if (this.connection) {
      await this.disconnect();
    }

    const hubUrl = `${API_BASE_URL}/hubs/room?username=${encodeURIComponent(username)}`;

    callbacks.onStatusChange('Connecting');

    try {
      this.connection = new HubConnectionBuilder()
        .withUrl(hubUrl)
        .withAutomaticReconnect({
          nextRetryDelayInMilliseconds: (retryContext) => {
            // Reconnect logic: retry at 2s, 5s, 10s, 30s, then stop
            if (retryContext.previousRetryCount === 0) return 2000;
            if (retryContext.previousRetryCount === 1) return 5000;
            if (retryContext.previousRetryCount === 2) return 10000;
            return 30000;
          }
        })
        .configureLogging(LogLevel.Information)
        .build();

      // Register Connection Status Listeners
      this.connection.onclose((error) => {
        callbacks.onStatusChange('Disconnected');
        if (error) {
          callbacks.onError(`Connection closed with error: ${error.message}`);
        }
      });

      this.connection.onreconnecting((error) => {
        callbacks.onStatusChange('Reconnecting');
        if (error) {
          callbacks.onError(`Connection reconnecting: ${error.message}`);
        }
      });

      this.connection.onreconnected(() => {
        callbacks.onStatusChange('Connected');
      });

      // Register Event Listeners
      this.connection.on('UserJoined', (payload: unknown) => {
        const data = payload as Record<string, unknown> | null | undefined;
        const username = typeof payload === 'string' ? payload : ((data?.userName ?? data?.UserName ?? 'Guest') as string);
        callbacks.onUserJoined(username);
      });

      this.connection.on('UserLeft', (payload: unknown) => {
        const data = payload as Record<string, unknown> | null | undefined;
        const usernameOrId = typeof payload === 'string' ? payload : ((data?.connectionId ?? data?.ConnectionId ?? 'Someone') as string);
        callbacks.onUserLeft(usernameOrId);
      });

      this.connection.on('PlayReceived', () => {
        callbacks.onPlayReceived();
      });

      this.connection.on('PauseReceived', () => {
        callbacks.onPauseReceived();
      });

      this.connection.on('SeekReceived', (payload: unknown) => {
        const data = payload as Record<string, unknown> | null | undefined;
        const position = typeof payload === 'number' ? payload : Number(data?.position ?? data?.Position ?? 0);
        callbacks.onSeekReceived(position);
      });

      this.connection.on('MediaLoaded', (payload: unknown) => {
        const data = payload as Record<string, unknown> | null | undefined;
        const mediaUrl = typeof payload === 'string' ? payload : ((data?.mediaUrl ?? data?.MediaUrl ?? '') as string);
        callbacks.onMediaLoaded(mediaUrl);
      });

      this.connection.on('StreamStarted', (payload: unknown) => {
        const data = payload as Record<string, unknown> | null | undefined;
        const rCode = (data?.roomCode ?? data?.RoomCode ?? '') as string;
        const startedBy = (data?.startedBy ?? data?.StartedBy ?? '') as string;
        const timestamp = (data?.timestamp ?? data?.Timestamp ?? '') as string;
        this.streamCallbacks.onStreamStarted?.(rCode, startedBy, timestamp);
      });

      this.connection.on('StreamStopped', (payload: unknown) => {
        const data = payload as Record<string, unknown> | null | undefined;
        const rCode = (data?.roomCode ?? data?.RoomCode ?? '') as string;
        const stoppedBy = (data?.stoppedBy ?? data?.StoppedBy ?? '') as string;
        const timestamp = (data?.timestamp ?? data?.Timestamp ?? '') as string;
        this.streamCallbacks.onStreamStopped?.(rCode, stoppedBy, timestamp);
      });

      this.connection.on('AudioChunkReceived', (payload: unknown) => {
        const data = payload as Record<string, unknown> | null | undefined;
        const sequenceNumber = Number(data?.sequenceNumber ?? data?.SequenceNumber ?? 0);
        const timestampUtc = (data?.timestampUtc ?? data?.TimestampUtc ?? '') as string;
        const chunkData = (data?.data ?? data?.Data ?? '') as string;
        this.streamCallbacks.onAudioChunkReceived?.(sequenceNumber, timestampUtc, chunkData);
      });

      // Start the connection
      await this.connection.start();
      callbacks.onStatusChange('Connected');
    } catch (error: unknown) {
      callbacks.onStatusChange('Disconnected');
      const errMsg = error instanceof Error ? error.message : 'Failed to establish SignalR connection.';
      callbacks.onError(errMsg);
      throw error;
    }
  }

  /**
   * Disconnect from the hub
   */
  public async disconnect(): Promise<void> {
    if (!this.connection) return;

    try {
      if (this.connection.state !== HubConnectionState.Disconnected) {
        await this.connection.stop();
      }
    } catch (error) {
      console.error('Error during SignalR disconnect:', error);
    } finally {
      this.connection = null;
    }
  }

  /**
   * Join a specific room
   */
  public async joinRoom(roomCode: string): Promise<void> {
    this.ensureConnected();
    await this.connection!.invoke('JoinRoom', roomCode);
  }

  /**
   * Leave a specific room
   */
  public async leaveRoom(roomCode: string): Promise<void> {
    this.ensureConnected();
    await this.connection!.invoke('LeaveRoom', roomCode);
  }

  /**
   * Broadcast play event to the room
   */
  public async play(roomCode: string): Promise<void> {
    this.ensureConnected();
    await this.connection!.invoke('Play', roomCode);
  }

  /**
   * Broadcast pause event to the room
   */
  public async pause(roomCode: string): Promise<void> {
    this.ensureConnected();
    await this.connection!.invoke('Pause', roomCode);
  }

  /**
   * Broadcast seek event to the room
   */
  public async seek(roomCode: string, position: number): Promise<void> {
    this.ensureConnected();
    await this.connection!.invoke('Seek', roomCode, position);
  }

  /**
   * Broadcast load media event to the room
   */
  public async loadMedia(roomCode: string, mediaUrl: string): Promise<void> {
    this.ensureConnected();
    await this.connection!.invoke('LoadMedia', roomCode, mediaUrl);
  }

  /**
   * Start live streaming
   */
  public async startStreaming(roomCode: string): Promise<void> {
    this.ensureConnected();
    await this.connection!.invoke('StartStreaming', roomCode);
  }

  /**
   * Stop live streaming
   */
  public async stopStreaming(roomCode: string): Promise<void> {
    this.ensureConnected();
    await this.connection!.invoke('StopStreaming', roomCode);
  }

  /**
   * Get active connection ID
   */
  public getConnectionId(): string | null {
    return this.connection ? this.connection.connectionId : null;
  }

  /**
   * Helper to ensure connection is active before invocation
   */
  private ensureConnected() {
    if (!this.connection || this.connection.state !== HubConnectionState.Connected) {
      throw new Error('SignalR Hub Connection is not currently Connected.');
    }
  }
}

export const signalRService = new SignalRService();
