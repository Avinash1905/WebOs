import React, { useState } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize2, SkipForward, SkipBack, Film } from 'lucide-react';
import './videoPlayer.css';

export const VideoPlayerApp: React.FC<{ windowId: string; appId: string }> = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(45);
  const [duration] = useState(320);
  const [volume, setVolume] = useState(80);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isMuted, setIsMuted] = useState(false);

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="video-player-container">
      <div className="video-screen-viewport">
        <div className="video-media-canvas">
          <Film size={64} className="video-placeholder-icon" />
          <div className="video-title-overlay">WebOS 4K Demo Reel - Nature & Architecture (H.265 / AV1)</div>
        </div>
      </div>

      <div className="video-controls-bar">
        <div className="video-progress-row">
          <input
            type="range"
            min="0"
            max={duration}
            value={currentTime}
            onChange={(e) => setCurrentTime(Number(e.target.value))}
            className="video-seek-slider"
          />
        </div>

        <div className="video-buttons-row">
          <div className="btn-group-left">
            <button className="v-btn" onClick={() => setCurrentTime((t) => Math.max(0, t - 10))} title="Back 10s">
              <SkipBack size={15} />
            </button>
            <button className="v-btn play-btn" onClick={() => setIsPlaying(!isPlaying)}>
              {isPlaying ? <Pause size={18} /> : <Play size={18} />}
            </button>
            <button className="v-btn" onClick={() => setCurrentTime((t) => Math.min(duration, t + 10))} title="Forward 10s">
              <SkipForward size={15} />
            </button>
            <span className="v-time-display">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          <div className="btn-group-right">
            <div className="v-speed-select">
              {[0.5, 1, 1.5, 2].map((rate) => (
                <button
                  key={rate}
                  className={`v-rate-btn ${playbackRate === rate ? 'active' : ''}`}
                  onClick={() => setPlaybackRate(rate)}
                >
                  {rate}x
                </button>
              ))}
            </div>

            <div className="v-volume-group">
              <button className="v-btn" onClick={() => setIsMuted(!isMuted)}>
                {isMuted || volume === 0 ? <VolumeX size={15} /> : <Volume2 size={15} />}
              </button>
              <input
                type="range"
                min="0"
                max="100"
                value={isMuted ? 0 : volume}
                onChange={(e) => {
                  setVolume(Number(e.target.value));
                  setIsMuted(false);
                }}
                className="v-volume-slider"
              />
            </div>

            <button className="v-btn" title="Fullscreen">
              <Maximize2 size={15} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
