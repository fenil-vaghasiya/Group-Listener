// Synchronized Room Sync Control Panel Dashboard
import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useRoom } from '../hooks/useRoom';
import { AudioPlayer } from '../components/AudioPlayer';

export const Room: React.FC = () => {
  const { roomCode: routeRoomCode } = useParams<{ roomCode: string }>();
  const navigate = useNavigate();
  
  const {
    username,
    roomCode,
    connectionStatus,
    participants,
    eventLogs,
    error,
  } = useRoom();

  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const logsEndRef = useRef<HTMLDivElement>(null);

  // Redirect if username or roomCode is missing/mismatched
  useEffect(() => {
    if (!username) {
      // Redirect to join page with this room code prefilled
      navigate(`/join?roomCode=${routeRoomCode || ''}`);
      return;
    }
  }, [username, routeRoomCode, navigate]);

  // Auto-scroll the logs to the bottom
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [eventLogs]);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  };

  const handleCopyCode = async () => {
    if (!roomCode) return;
    try {
      await navigator.clipboard.writeText(roomCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } catch (err) {
      console.error('Failed to copy room code:', err);
    }
  };


  // Helper to color user avatar based on initials
  const getAvatarColor = (name: string) => {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const colors = [
      '#ec4899', '#f43f5e', '#e11d48', '#d946ef', '#a855f7', 
      '#8b5cf6', '#6366f1', '#3b82f6', '#0ea5e9', '#06b6d4', 
      '#14b8a6', '#10b981', '#f59e0b', '#f97316'
    ];
    const index = Math.abs(hash) % colors.length;
    return colors[index];
  };

  if (!username) {
    return (
      <div className="loading-container">
        <span className="spinner"></span>
        <p>Redirecting to sign-in...</p>
      </div>
    );
  }

  return (
    <div className="room-layout fade-in">
      {/* Top Banner Alert if API/WebSocket throws error */}
      {error && (
        <div className="alert alert-danger global-room-alert">
          <span className="alert-icon">⚠️</span>
          <span className="alert-message">{error}</span>
        </div>
      )}

      <div className="room-grid">
        
        {/* Left Column: Room Info & Participants */}
        <section className="room-sidebar card">
          <div className="sidebar-section">
            <h3 className="sidebar-title">Room Info</h3>
            <div className="room-code-display">
              <span className="room-label">Active Code:</span>
              <div className="code-copy-row">
                <span className="room-code-text">{roomCode || '---'}</span>
                <button
                  type="button"
                  className="btn-icon-copy"
                  onClick={handleCopyCode}
                  title="Copy Code"
                >
                  {copiedCode ? '✅' : '📋'}
                </button>
              </div>
            </div>
            
            <button
              type="button"
              className="btn btn-secondary btn-block btn-sm"
              onClick={handleCopyLink}
            >
              {copiedLink ? 'Copied Link! ✅' : 'Copy Invite Link'}
            </button>
          </div>

          <hr className="divider" />

          <div className="sidebar-section">
            <h3 className="sidebar-title">
              Listeners <span className="badge">{participants.length}</span>
            </h3>
            <div className="participants-list">
              {participants.map((p, idx) => {
                let name = 'Guest';
                if (typeof p === 'string') {
                  name = p;
                } else if (p && typeof p === 'object') {
                  const obj = p as Record<string, unknown>;
                  name = (obj.username || obj.Username || obj.name || obj.Name || 'Guest') as string;
                }
                return (
                  <div key={idx} className={`participant-item ${name === username ? 'participant-self' : ''}`}>
                    <div
                      className="user-avatar"
                      style={{ backgroundColor: getAvatarColor(name) }}
                    >
                      {name.charAt(0).toUpperCase()}
                    </div>
                    <span className="participant-name">
                      {name} {name === username && <span className="self-tag">(You)</span>}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Center Column: Audio Player */}
        <section className="room-player-container card">
          <AudioPlayer />
        </section>

        {/* Right Column: Event Log Panel */}
        <section className="room-logs card">
          <div className="logs-header">
            <h3 className="logs-title">Event Log</h3>
            <span className="connection-tag">{connectionStatus}</span>
          </div>
          
          <div className="logs-body">
            {eventLogs.length === 0 ? (
              <div className="empty-logs">
                <p>Waiting for synchronization events...</p>
              </div>
            ) : (
              eventLogs.slice().reverse().map((log) => (
                <div key={log.id} className={`log-entry log-${log.type}`}>
                  <span className="log-timestamp">{log.timestamp}</span>
                  <span className="log-message">{log.message}</span>
                </div>
              ))
            )}
            <div ref={logsEndRef} />
          </div>
        </section>
      </div>
    </div>
  );
};
