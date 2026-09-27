import React from 'react';
import { useAudioStream } from '../../hooks/useAudioStream';
import { useRoom } from '../../hooks/useRoom';

export const HostControls: React.FC = () => {
  const { isHost } = useRoom();
  const { isStreaming, startStreaming, stopStreaming } = useAudioStream();

  // HostControls are only visible to the designated host
  if (!isHost) return null;

  return (
    <div className="host-stream-controls" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <span className="form-label" style={{ fontSize: '11px', fontWeight: 600, display: 'block', textAlign: 'left' }}>
        Host Streaming Controls
      </span>
      {isStreaming ? (
        <button
          type="button"
          onClick={stopStreaming}
          className="btn btn-exit btn-block"
          style={{ height: '40px', padding: '0 16px', fontSize: '13px' }}
        >
          🛑 Stop Streaming Audio
        </button>
      ) : (
        <button
          type="button"
          onClick={startStreaming}
          className="btn btn-primary btn-block"
          style={{
            height: '40px',
            padding: '0 16px',
            fontSize: '13px',
            background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
            boxShadow: '0 4px 15px rgba(239, 68, 68, 0.3)'
          }}
        >
          🎙️ Start Streaming Audio
        </button>
      )}
    </div>
  );
};
