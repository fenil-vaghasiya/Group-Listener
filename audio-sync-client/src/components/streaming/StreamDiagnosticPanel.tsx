import React from 'react';
import { useAudioStream } from '../../hooks/useAudioStream';

export const StreamDiagnosticPanel: React.FC = () => {
  const { receivedChunksCount, missingChunksCount, streamHealth } = useAudioStream();

  const getHealthColor = (health: number) => {
    if (health >= 90) return 'var(--status-connected)';
    if (health >= 70) return 'var(--status-connecting)';
    return 'var(--status-disconnected)';
  };

  return (
    <div className="stream-diagnostics-panel" style={{ display: 'flex', flexDirection: 'column', gap: '12px', textAlign: 'left' }}>
      <span className="form-label" style={{ fontSize: '11px', fontWeight: 600 }}>Stream Diagnostics</span>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
        <div style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-light)', padding: '8px', borderRadius: '6px' }}>
          <span style={{ display: 'block', fontSize: '9px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            Chunks Recv
          </span>
          <span style={{ fontSize: '14px', fontWeight: 700, fontFamily: 'var(--mono)', color: 'var(--text-primary)' }}>
            {receivedChunksCount}
          </span>
        </div>

        <div style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-light)', padding: '8px', borderRadius: '6px' }}>
          <span style={{ display: 'block', fontSize: '9px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            Chunks Lost
          </span>
          <span style={{ fontSize: '14px', fontWeight: 700, fontFamily: 'var(--mono)', color: missingChunksCount > 0 ? '#fca5a5' : 'var(--text-secondary)' }}>
            {missingChunksCount}
          </span>
        </div>

        <div style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-light)', padding: '8px', borderRadius: '6px' }}>
          <span style={{ display: 'block', fontSize: '9px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            Diagnostics
          </span>
          <span style={{ fontSize: '14px', fontWeight: 700, color: getHealthColor(streamHealth) }}>
            {streamHealth}%
          </span>
        </div>
      </div>

      {/* Stream Health Progress Bar */}
      <div className="stream-health-progress" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-muted)' }}>
          <span>Stream Health Index</span>
          <span style={{ color: getHealthColor(streamHealth), fontWeight: 700 }}>{streamHealth}%</span>
        </div>
        <div style={{ width: '100%', height: '6px', background: 'var(--bg-primary)', borderRadius: '3px', overflow: 'hidden', border: '1px solid var(--border-light)' }}>
          <div style={{
            width: `${streamHealth}%`,
            height: '100%',
            background: getHealthColor(streamHealth),
            borderRadius: '3px',
            transition: 'width 0.5s ease-out'
          }}></div>
        </div>
      </div>
    </div>
  );
};
