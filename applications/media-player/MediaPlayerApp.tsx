import React, { useState, useEffect } from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Music, Repeat, Shuffle } from 'lucide-react';
import './mediaPlayer.css';

interface Track {
  id: string;
  title: string;
  artist: string;
  album: string;
  durationSec: number;
}

const SAMPLE_TRACKS: Track[] = [
  { id: '1', title: 'Cybernetic Horizon', artist: 'WebOS Synthwave', album: 'Neon Core Vol. 1', durationSec: 215 },
  { id: '2', title: 'Kernel Panics & Coffee', artist: 'Bytecode Orchestra', album: 'Preemptive Slices', durationSec: 184 },
  { id: '3', title: 'Binary Sunrise', artist: 'VFS Ambient Project', album: 'Inode Dreams', durationSec: 242 },
];

export const MediaPlayerApp: React.FC<{ windowId: string; appId: string }> = () => {
  const [tracks] = useState<Track[]>(SAMPLE_TRACKS);
  const [currentTrackIdx, setCurrentTrackIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTimeSec, setCurrentTimeSec] = useState(45);
  const [volume, setVolume] = useState(80);
  const [isMuted, setIsMuted] = useState(false);

  const currentTrack = tracks[currentTrackIdx];

  useEffect(() => {
    let timer: any;
    if (isPlaying) {
      timer = setInterval(() => {
        setCurrentTimeSec((t) => {
          if (t >= currentTrack.durationSec) {
            handleNext();
            return 0;
          }
          return t + 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isPlaying, currentTrack]);

  const handleNext = () => {
    setCurrentTrackIdx((prev) => (prev + 1) % tracks.length);
    setCurrentTimeSec(0);
  };

  const handlePrev = () => {
    setCurrentTrackIdx((prev) => (prev - 1 + tracks.length) % tracks.length);
    setCurrentTimeSec(0);
  };

  const formatTime = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${mins}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="media-player-container">
      {/* Visualizer & Album Art Area */}
      <div className="media-art-area">
        <div className="album-vinyl">
          <div className={`vinyl-disc ${isPlaying ? 'spinning' : ''}`}>
            <Music size={40} className="vinyl-icon" />
          </div>
        </div>

        <div className="track-meta">
          <div className="track-title">{currentTrack.title}</div>
          <div className="track-artist">{currentTrack.artist} — {currentTrack.album}</div>
        </div>

        {/* Audio Waveform Simulator */}
        <div className="audio-wave-bars">
          {Array.from({ length: 24 }).map((_, i) => (
            <div
              key={i}
              className={`wave-bar ${isPlaying ? 'active' : ''}`}
              style={{
                height: isPlaying ? `${Math.floor(Math.random() * 28) + 6}px` : '4px',
                transition: 'height 0.2s ease',
              }}
            />
          ))}
        </div>
      </div>

      {/* Playback Controls & Progress */}
      <div className="media-controls-pane">
        {/* Progress Bar */}
        <div className="progress-row">
          <span className="time-label">{formatTime(currentTimeSec)}</span>
          <input
            type="range"
            min="0"
            max={currentTrack.durationSec}
            value={currentTimeSec}
            onChange={(e) => setCurrentTimeSec(Number(e.target.value))}
            className="time-slider"
          />
          <span className="time-label">{formatTime(currentTrack.durationSec)}</span>
        </div>

        {/* Main Buttons */}
        <div className="control-buttons-row">
          <button className="media-btn secondary" title="Shuffle"><Shuffle size={14} /></button>
          <button className="media-btn" onClick={handlePrev} title="Previous"><SkipBack size={18} /></button>
          <button
            className="media-btn play-main"
            onClick={() => setIsPlaying(!isPlaying)}
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? <Pause size={20} /> : <Play size={20} />}
          </button>
          <button className="media-btn" onClick={handleNext} title="Next"><SkipForward size={18} /></button>
          <button className="media-btn secondary" title="Repeat"><Repeat size={14} /></button>
        </div>

        {/* Volume & Playlist */}
        <div className="volume-row">
          <button className="vol-btn" onClick={() => setIsMuted(!isMuted)}>
            {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
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
            className="volume-slider"
          />
        </div>
      </div>
    </div>
  );
};
