import React from 'react';
import { useAudioStream } from '../../hooks/useAudioStream';

export const StreamStatus: React.FC = () => {
  const { isStreaming, currentSequence, lastChunkTimestamp, streamStatus } = useAudioStream();

  return (
    <div className="stream-status-block" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span className="form-label" style={{ fontSize: '11px', fontWeight: 600 }}>Stream Status</span>
        {isStreaming ? (
          <div className="status-badge live" style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#fca5a5',
            padding: '4px 10px',
            borderRadius: '100px',
            fontSize: '11px',
            fontWeight: 700,
            letterSpacing: '0.5px'
          }}>
            <span className="live-indicator-dot" style={{
              width: '8px',
              height: '8px',
              backgroundColor: '#ef4444',
              borderRadius: '50%',
              boxShadow: '0 0 8px #ef4444',
              animation: 'pulse-glow 1.5s infinite'
            }}></span>
            LIVE STREAMING ({streamStatus})
          </div>
        ) : (
          <div className="status-badge stopped" style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid var(--border-light)',
            color: 'var(--text-muted)',
            padding: '4px 10px',
            borderRadius: '100px',
            fontSize: '11px',
            fontWeight: 700,
            letterSpacing: '0.5px'
          }}>
            <span style={{
              width: '8px',
              height: '8px',
              backgroundColor: 'var(--text-muted)',
              borderRadius: '50%'
            }}></span>
            STREAM STOPPED
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <div style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-light)', padding: '10px', borderRadius: '6px' }}>
          <span style={{ display: 'block', fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>
            Current Sequence
          </span>
          <span style={{ fontSize: '15px', fontWeight: 700, fontFamily: 'var(--mono)', color: isStreaming ? 'var(--accent-cyan)' : 'var(--text-secondary)' }}>
            #{currentSequence}
          </span>
        </div>
        <div style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-light)', padding: '10px', borderRadius: '6px' }}>
          <span style={{ display: 'block', fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>
            Last Chunk Recv
          </span>
          <span style={{ fontSize: '15px', fontWeight: 700, fontFamily: 'var(--mono)', color: isStreaming ? 'var(--accent-purple)' : 'var(--text-secondary)' }}>
            {lastChunkTimestamp || '--:--:--'}
          </span>
        </div>
      </div>
    </div>
  );
};
