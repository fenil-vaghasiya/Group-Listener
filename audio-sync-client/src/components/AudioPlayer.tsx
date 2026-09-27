import React, { useState } from 'react';
import { useRoom } from '../hooks/useRoom';

export const AudioPlayer: React.FC = () => {
  const {
    isPlaying,
    playbackPosition,
    mediaUrl,
    duration,
    isBuffering,
    isLoading,
    sendPlay,
    sendPause,
    sendSeek,
    sendLoadMedia,
    connectionStatus,
  } = useRoom();

  const [inputUrl, setInputUrl] = useState<string>('');
  const [sliderVal, setSliderVal] = useState<number>(0);
  const [isSeekingLocally, setIsSeekingLocally] = useState<boolean>(false);

  const handleLoad = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputUrl.trim()) return;
    await sendLoadMedia(inputUrl.trim());
  };

  const handlePlay = async () => {
    if (!mediaUrl) return;
    await sendPlay();
  };

  const handlePause = async () => {
    if (!mediaUrl) return;
    await sendPause();
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsSeekingLocally(true);
    setSliderVal(Number(e.target.value));
  };

  const handleSliderRelease = async () => {
    setIsSeekingLocally(false);
    await sendSeek(sliderVal);
  };

  const formatTime = (seconds: number) => {
    if (isNaN(seconds) || seconds === Infinity) return '0:00';
    const min = Math.floor(seconds / 60);
    const sec = Math.floor(seconds % 60);
    return `${min}:${sec.toString().padStart(2, '0')}`;
  };

  // Helper to suggest a demo song for easy testing
  const loadDemoSong = () => {
    const demoUrl = 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3';
    setInputUrl(demoUrl);
  };

  return (
    <div className="player-card">
      {/* Media URL Input Panel */}
      <div className="media-loader-panel" style={{ width: '100%', marginBottom: '24px', textAlign: 'left' }}>
        <form onSubmit={handleLoad} className="room-form" style={{ gap: '12px' }}>
          <div className="form-group" style={{ gap: '6px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label className="form-label" style={{ fontSize: '11px' }}>Media URL Input</label>
              <button 
                type="button" 
                onClick={loadDemoSong} 
                className="btn btn-secondary btn-sm" 
                style={{ padding: '2px 8px', fontSize: '11px', borderRadius: '4px', height: 'auto' }}
              >
                Use Demo URL
              </button>
            </div>
            <input
              type="url"
              className="form-input"
              placeholder="https://example.com/song.mp3"
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              disabled={connectionStatus !== 'Connected'}
              style={{ width: '100%' }}
            />
          </div>
          <button
            type="submit"
            className="btn btn-primary btn-block"
            disabled={connectionStatus !== 'Connected' || !inputUrl.trim()}
          >
            Load Media
          </button>
        </form>
      </div>

      <hr className="divider" style={{ width: '100%', margin: '16px 0 24px' }} />

      {/* Visualizer and Status Overlay */}
      <div style={{ position: 'relative', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div className={`player-visualizer ${(isPlaying && !isBuffering && !isLoading) ? 'playing' : ''}`}>
          <div className="bar bar-1"></div>
          <div className="bar bar-2"></div>
          <div className="bar bar-3"></div>
          <div className="bar bar-4"></div>
          <div className="bar bar-5"></div>
          <div className="bar bar-6"></div>
          <div className="bar bar-7"></div>
          <div className="bar bar-8"></div>
          <div className="bar bar-9"></div>
          <div className="bar bar-10"></div>
        </div>

        {/* Buffering/Loading Indicator */}
        {(isLoading || isBuffering) && (
          <div className="player-loading-overlay" style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '80px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(20, 21, 31, 0.8)',
            borderRadius: '8px',
            gap: '10px'
          }}>
            <span className="spinner" style={{ borderTopColor: 'var(--accent-cyan)' }}></span>
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--accent-cyan)' }}>
              {isLoading ? 'Loading Source...' : 'Buffering...'}
            </span>
          </div>
        )}
      </div>

      {/* Track info */}
      <div className="track-info">
        {mediaUrl ? (
          <>
            <span className="track-tag" style={{ background: 'var(--accent-purple-glow)', color: 'var(--accent-purple)' }}>
              ACTIVE AUDIO SOURCE
            </span>
            <h2 className="track-title" style={{ 
              fontSize: '16px', 
              wordBreak: 'break-all', 
              maxHeight: '48px', 
              overflow: 'hidden', 
              textOverflow: 'ellipsis',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              padding: '0 8px'
            }}>
              {mediaUrl.substring(mediaUrl.lastIndexOf('/') + 1) || 'Audio Stream'}
            </h2>
            <p className="track-artist" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              Synchronized URL: {mediaUrl}
            </p>
          </>
        ) : (
          <>
            <span className="track-tag" style={{ background: 'var(--border-light)', color: 'var(--text-muted)' }}>
              NO MEDIA LOADED
            </span>
            <h2 className="track-title">Paste an audio URL above</h2>
            <p className="track-artist">Host & peers can control synchronized actions.</p>
          </>
        )}
      </div>

      {/* Progress Slider */}
      <div className="player-progress-area" style={{ opacity: mediaUrl ? 1 : 0.5, pointerEvents: mediaUrl ? 'auto' : 'none' }}>
        <div className="time-display">
          <span>{formatTime(isSeekingLocally ? sliderVal : playbackPosition)}</span>
          <span>{formatTime(duration)}</span>
        </div>
        <input
          type="range"
          className="progress-slider"
          min="0"
          max={duration || 100}
          value={isSeekingLocally ? sliderVal : playbackPosition}
          onChange={handleSliderChange}
          onMouseUp={handleSliderRelease}
          onTouchEnd={handleSliderRelease}
          disabled={!mediaUrl}
        />
      </div>

      {/* Controls */}
      <div className="player-controls" style={{ opacity: mediaUrl ? 1 : 0.5, pointerEvents: mediaUrl ? 'auto' : 'none' }}>
        {isPlaying ? (
          <button
            type="button"
            className="btn-player btn-pause"
            onClick={handlePause}
            title="Pause Playback"
            disabled={!mediaUrl}
          >
            <span className="btn-player-icon">⏸</span> Pause
          </button>
        ) : (
          <button
            type="button"
            className="btn-player btn-play"
            onClick={handlePlay}
            title="Play Playback"
            disabled={!mediaUrl}
            style={{ background: 'linear-gradient(135deg, var(--accent-cyan) 0%, #0891b2 100%)', boxShadow: '0 4px 15px rgba(6, 182, 212, 0.4)' }}
          >
            <span className="btn-player-icon">▶</span> Play
          </button>
        )}
      </div>

      {/* Synchronization Information Dashboard */}
      <div className="sync-note" style={{ 
        width: '100%', 
        background: 'rgba(255,255,255,0.02)', 
        border: '1px solid var(--border-light)', 
        borderRadius: '8px', 
        padding: '12px',
        textAlign: 'left',
        fontSize: '12px'
      }}>
        <h4 style={{ color: 'var(--text-secondary)', marginBottom: '8px', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase' }}>
          Room Sync Dashboard
        </h4>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', color: 'var(--text-secondary)' }}>
          <div>
            <span style={{ color: 'var(--text-muted)' }}>Status:</span>{' '}
            <span style={{ color: isPlaying ? 'var(--status-connected)' : 'var(--text-muted)', fontWeight: 600 }}>
              {isPlaying ? '▶ Playing' : '⏸ Paused'}
            </span>
          </div>
          <div>
            <span style={{ color: 'var(--text-muted)' }}>Position:</span>{' '}
            <span style={{ color: 'var(--accent-cyan)', fontFamily: 'var(--mono)' }}>
              {formatTime(playbackPosition)} / {formatTime(duration)}
            </span>
          </div>
          <div style={{ gridColumn: 'span 2', wordBreak: 'break-all' }}>
            <span style={{ color: 'var(--text-muted)' }}>Current Media:</span>{' '}
            <span style={{ color: 'var(--text-primary)', fontSize: '11px' }}>
              {mediaUrl || 'None'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
