import React from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useRoom } from '../hooks/useRoom';

export const RootLayout: React.FC = () => {
  const { connectionStatus, roomCode, leaveRoom } = useRoom();
  const navigate = useNavigate();

  const handleExit = async () => {
    if (window.confirm('Are you sure you want to leave the sync session?')) {
      await leaveRoom();
      navigate('/');
    }
  };

  const getStatusClass = () => {
    switch (connectionStatus) {
      case 'Connected': return 'status-connected';
      case 'Connecting': return 'status-connecting';
      case 'Reconnecting': return 'status-reconnecting';
      case 'Disconnected': return 'status-disconnected';
      default: return '';
    }
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="header-logo">
          <Link to="/" className="logo-link">
            <span className="logo-icon">🎧</span>
            <span className="logo-text">AudioSync</span>
          </Link>
        </div>

        <div className="header-status-bar">
          {roomCode && (
            <div className="active-room-pill">
              <span className="pill-label">Room:</span>
              <span className="pill-code">{roomCode}</span>
            </div>
          )}
          
          <div className={`connection-pill ${getStatusClass()}`}>
            <span className="status-indicator"></span>
            <span className="status-label">{connectionStatus}</span>
          </div>

          {roomCode && (
            <button className="btn-exit" onClick={handleExit} title="Leave Session">
              Leave Room
            </button>
          )}
        </div>
      </header>

      <main className="app-main">
        <Outlet />
      </main>

      <footer className="app-footer">
        <p>© 2026 AudioSync Platform • Real-time Playback Synchronization Demo</p>
      </footer>
    </div>
  );
};
