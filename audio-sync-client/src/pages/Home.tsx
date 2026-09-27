import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRoom } from '../hooks/useRoom';

export const Home: React.FC = () => {
  const { username, setUsername } = useRoom();
  const [nameInput, setNameInput] = useState(username || '');
  const [validationError, setValidationError] = useState('');
  const navigate = useNavigate();

  const validateAndNavigate = (targetPath: string) => {
    const trimmed = nameInput.trim();
    if (!trimmed) {
      setValidationError('Username is required to proceed.');
      return;
    }
    if (trimmed.length < 2) {
      setValidationError('Username must be at least 2 characters long.');
      return;
    }
    
    setUsername(trimmed);
    setValidationError('');
    
    // If we're going to join, check if we have a roomCode in session/query and append it
    navigate(targetPath);
  };

  return (
    <div className="card-container fade-in">
      <div className="card hero-card">
        <div className="hero-visual">
          <div className="pulse-ring"></div>
          <span className="hero-emoji">🎧</span>
        </div>
        
        <h1 className="hero-title">Synchronized Listening</h1>
        <p className="hero-subtitle">
          Connect with friends and listen in perfect real-time sync.
        </p>

        <div className="form-group">
          <label htmlFor="username-input" className="form-label">
            Choose your nickname
          </label>
          <input
            id="username-input"
            type="text"
            className={`form-input ${validationError ? 'input-error' : ''}`}
            placeholder="e.g. Rahul, John, Alice"
            value={nameInput}
            onChange={(e) => {
              setNameInput(e.target.value);
              if (validationError) setValidationError('');
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                validateAndNavigate('/join');
              }
            }}
          />
          {validationError && <span className="error-message">{validationError}</span>}
        </div>

        <div className="action-buttons-stack">
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => validateAndNavigate('/create')}
          >
            Create Private Room
          </button>
          
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => validateAndNavigate('/join')}
          >
            Join Existing Room
          </button>
        </div>
      </div>
    </div>
  );
};
