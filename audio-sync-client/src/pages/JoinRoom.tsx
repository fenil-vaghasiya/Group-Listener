import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useRoom } from '../hooks/useRoom';

export const JoinRoom: React.FC = () => {
  const { username, joinRoom, error, clearError } = useRoom();
  const [searchParams] = useSearchParams();
  
  const [nameInput, setNameInput] = useState(username || '');
  const [roomInput, setRoomInput] = useState(() => (searchParams.get('roomCode') || '').toUpperCase());
  const [isLoading, setIsLoading] = useState(false);
  const [validationError, setValidationError] = useState('');
  const navigate = useNavigate();

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const trimmedName = nameInput.trim();
    const trimmedRoom = roomInput.trim().toUpperCase();
    
    if (!trimmedName) {
      setValidationError('Username is required.');
      return;
    }
    if (!trimmedRoom) {
      setValidationError('Room code is required.');
      return;
    }
    
    setIsLoading(true);
    setValidationError('');
    clearError();

    try {
      const code = await joinRoom(trimmedName, trimmedRoom);
      navigate(`/room/${code}`);
    } catch (err) {
      console.error('Failed to join room:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="card-container fade-in">
      <div className="card">
        <div className="card-header-block">
          <Link to="/" className="btn-back">← Back</Link>
          <h2 className="card-title">Join Sync Room</h2>
        </div>
        
        <p className="card-description">
          Enter your nickname and the room code to join your group session.
        </p>

        {error && (
          <div className="alert alert-danger">
            <span className="alert-icon">⚠️</span>
            <span className="alert-message">{error}</span>
          </div>
        )}

        <form onSubmit={handleJoin} className="room-form">
          <div className="form-group">
            <label htmlFor="join-username" className="form-label">
              Your Nickname
            </label>
            <input
              id="join-username"
              type="text"
              className={`form-input ${(validationError && !nameInput.trim()) ? 'input-error' : ''}`}
              placeholder="Enter your name"
              value={nameInput}
              onChange={(e) => {
                setNameInput(e.target.value);
                if (validationError) setValidationError('');
                clearError();
              }}
              disabled={isLoading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="join-roomcode" className="form-label">
              Room Code
            </label>
            <input
              id="join-roomcode"
              type="text"
              className={`form-input ${(validationError && !roomInput.trim()) ? 'input-error' : ''} uppercase-input`}
              placeholder="e.g. ABCD"
              value={roomInput}
              onChange={(e) => {
                setRoomInput(e.target.value);
                if (validationError) setValidationError('');
                clearError();
              }}
              disabled={isLoading}
            />
          </div>

          {validationError && (
            <div className="form-group">
              <span className="error-message">{validationError}</span>
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary btn-block"
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="spinner-container">
                <span className="spinner"></span> Connecting to Room...
              </span>
            ) : (
              'Join Session'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
