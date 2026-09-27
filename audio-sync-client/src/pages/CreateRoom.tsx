// Component for creating private synchronized rooms
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useRoom } from '../hooks/useRoom';

export const CreateRoom: React.FC = () => {
  const { username, createRoom, error, clearError } = useRoom();
  const [nameInput, setNameInput] = useState(username || '');
  const [isLoading, setIsLoading] = useState(false);
  const [validationError, setValidationError] = useState('');
  const navigate = useNavigate();

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const trimmed = nameInput.trim();
    if (!trimmed) {
      setValidationError('Username is required to create a room.');
      return;
    }
    
    setIsLoading(true);
    setValidationError('');
    clearError();

    try {
      const code = await createRoom(trimmed);
      navigate(`/room/${code}`);
    } catch (err) {
      // Error is already logged & put into RoomContext state, so we just reset loader
      console.error('Failed to create room:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="card-container fade-in">
      <div className="card">
        <div className="card-header-block">
          <Link to="/" className="btn-back">← Back</Link>
          <h2 className="card-title">Create New Room</h2>
        </div>
        
        <p className="card-description">
          Set up a new synchronized audio room. You will be designated as the host.
        </p>

        {error && (
          <div className="alert alert-danger">
            <span className="alert-icon">⚠️</span>
            <span className="alert-message">{error}</span>
          </div>
        )}

        <form onSubmit={handleCreate} className="room-form">
          <div className="form-group">
            <label htmlFor="create-username" className="form-label">
              Your Nickname
            </label>
            <input
              id="create-username"
              type="text"
              className={`form-input ${validationError ? 'input-error' : ''}`}
              placeholder="Enter your name"
              value={nameInput}
              onChange={(e) => {
                setNameInput(e.target.value);
                if (validationError) setValidationError('');
                clearError();
              }}
              disabled={isLoading}
            />
            {validationError && <span className="error-message">{validationError}</span>}
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-block"
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="spinner-container">
                <span className="spinner"></span> Creating Room...
              </span>
            ) : (
              'Generate Sync Room'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
