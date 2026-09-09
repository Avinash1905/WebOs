import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

function writeCode(relPath, content) {
  const fullPath = path.join(rootDir, relPath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, content.trim() + '\n', 'utf8');
}

console.log('Generating WebOS Complete Desktop Applications Suite...');

// 1. Video Player
let videoPlayerTsx = `import React, { useState } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize2, SkipForward, SkipBack, Film, RotateCcw } from 'lucide-react';
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
    return \`\${m}:\${s.toString().padStart(2, '0')}\`;
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
                  className={\`v-rate-btn \${playbackRate === rate ? 'active' : ''}\`}
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
`;
let videoPlayerCss = `.video-player-container {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  background: #000000;
  color: #f8fafc;
  overflow: hidden;
}

.video-screen-viewport {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: radial-gradient(circle at center, #1e293b 0%, #020617 100%);
  position: relative;
}

.video-media-canvas {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  color: #64748b;
}

.video-placeholder-icon {
  color: #3b82f6;
  opacity: 0.8;
}

.video-title-overlay {
  font-size: 13px;
  color: #94a3b8;
  background: rgba(0, 0, 0, 0.6);
  padding: 6px 14px;
  border-radius: 20px;
  backdrop-filter: blur(8px);
}

.video-controls-bar {
  display: flex;
  flex-direction: column;
  background: rgba(15, 23, 42, 0.95);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  padding: 8px 16px;
  gap: 6px;
}

.video-progress-row {
  width: 100%;
}

.video-seek-slider {
  width: 100%;
  height: 4px;
  border-radius: 2px;
  accent-color: #3b82f6;
  cursor: pointer;
}

.video-buttons-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.btn-group-left, .btn-group-right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.v-btn {
  background: transparent;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  padding: 6px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.v-btn:hover {
  color: #ffffff;
  background: rgba(255, 255, 255, 0.1);
}

.v-btn.play-btn {
  background: #3b82f6;
  color: #ffffff;
  border-radius: 50%;
  padding: 8px;
}

.v-time-display {
  font-size: 11px;
  color: #64748b;
}

.v-speed-select {
  display: flex;
  gap: 3px;
  background: rgba(255, 255, 255, 0.05);
  padding: 2px;
  border-radius: 4px;
}

.v-rate-btn {
  background: transparent;
  border: none;
  color: #94a3b8;
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 3px;
  cursor: pointer;
}

.v-rate-btn.active {
  background: #3b82f6;
  color: #ffffff;
}

.v-volume-group {
  display: flex;
  align-items: center;
  gap: 6px;
}

.v-volume-slider {
  width: 70px;
  height: 4px;
  accent-color: #3b82f6;
}
`;
writeCode('applications/video-player/VideoPlayerApp.tsx', videoPlayerTsx);
writeCode('applications/video-player/videoPlayer.css', videoPlayerCss);

// 2. Audio Workstation / Synthesizer (DAW)
let dawTsx = `import React, { useState } from 'react';
import { Play, Square as StopIcon, Volume2, Music, Sliders, Activity, Disc } from 'lucide-react';
import './audioWorkstation.css';

const TRACKS = ['Kick 808', 'Snare Clap', 'Hi-Hat Closed', 'Synth Lead (Saw)', 'Sub Bass (Sine)'];
const STEPS = 16;

export const AudioWorkstationApp: React.FC<{ windowId: string; appId: string }> = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [bpm, setBpm] = useState(128);
  const [currentStep, setCurrentStep] = useState(0);
  const [grid, setGrid] = useState<boolean[][]>(
    Array(TRACKS.length).fill(null).map((_, tIdx) => {
      const row = Array(STEPS).fill(false);
      if (tIdx === 0) row[0] = row[4] = row[8] = row[12] = true; // 4-on-the-floor
      if (tIdx === 1) row[4] = row[12] = true; // Backbeat snare
      if (tIdx === 2) row.fill(true); // Hi-hats
      return row;
    })
  );

  const toggleCell = (tIdx: number, sIdx: number) => {
    setGrid((prev) => {
      const next = prev.map((row) => [...row]);
      next[tIdx][sIdx] = !next[tIdx][sIdx];
      return next;
    });
  };

  return (
    <div className="daw-container">
      {/* DAW Header Transport Controls */}
      <div className="daw-transport">
        <div className="transport-btns">
          <button className={\`daw-play-btn \${isPlaying ? 'active' : ''}\`} onClick={() => setIsPlaying(!isPlaying)}>
            {isPlaying ? <StopIcon size={14} /> : <Play size={14} />}
            <span>{isPlaying ? 'Stop' : 'Play'}</span>
          </button>
        </div>

        <div className="daw-tempo">
          <span className="tempo-label">BPM</span>
          <input
            type="number"
            value={bpm}
            onChange={(e) => setBpm(Number(e.target.value))}
            className="tempo-input"
            min="60"
            max="220"
          />
        </div>

        <div className="daw-presets">
          <span className="preset-label">Kit: Cyberpunk Electro 2026</span>
        </div>
      </div>

      {/* Sequencer Grid */}
      <div className="daw-sequencer">
        <div className="tracks-column">
          {TRACKS.map((tName, tIdx) => (
            <div key={tName} className="track-header">
              <Music size={13} className="text-cyan" />
              <span>{tName}</span>
            </div>
          ))}
        </div>

        <div className="steps-matrix">
          {grid.map((row, tIdx) => (
            <div key={tIdx} className="step-row">
              {row.map((isActive, sIdx) => {
                const isCurrentBeat = currentStep === sIdx && isPlaying;
                const isBeatMarker = sIdx % 4 === 0;
                return (
                  <button
                    key={sIdx}
                    className={\`step-btn \${isActive ? 'active' : ''} \${isCurrentBeat ? 'playing' : ''} \${isBeatMarker ? 'marker' : ''}\`}
                    onClick={() => toggleCell(tIdx, sIdx)}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Synthesizer Envelope Rack */}
      <div className="daw-synth-rack">
        <div className="rack-header">
          <Sliders size={13} />
          <span>Analog Synthesizer Filters (ADSR)</span>
        </div>
        <div className="knob-group">
          {['Attack', 'Decay', 'Sustain', 'Release', 'Cutoff', 'Resonance'].map((param) => (
            <div key={param} className="knob-item">
              <div className="knob-dial" />
              <span className="knob-label">{param}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
`;
let dawCss = `.daw-container {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  background: #090d16;
  color: #f8fafc;
  overflow: hidden;
  user-select: none;
}

.daw-transport {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 10px 16px;
  background: rgba(15, 23, 42, 0.95);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.daw-play-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  background: #10b981;
  border: none;
  border-radius: 6px;
  color: #ffffff;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}

.daw-play-btn.active {
  background: #ef4444;
}

.daw-tempo {
  display: flex;
  align-items: center;
  gap: 6px;
  background: rgba(255, 255, 255, 0.05);
  padding: 4px 8px;
  border-radius: 4px;
}

.tempo-label {
  font-size: 11px;
  color: #64748b;
  font-weight: 600;
}

.tempo-input {
  width: 45px;
  background: transparent;
  border: none;
  color: #38bdf8;
  font-size: 13px;
  font-weight: 700;
  text-align: center;
}

.daw-presets {
  margin-left: auto;
  font-size: 12px;
  color: #94a3b8;
}

.daw-sequencer {
  display: flex;
  flex: 1;
  padding: 16px;
  gap: 12px;
  overflow-x: auto;
}

.tracks-column {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 150px;
}

.track-header {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 38px;
  padding: 0 10px;
  background: rgba(30, 41, 59, 0.6);
  border-radius: 6px;
  font-size: 12px;
  color: #cbd5e1;
}

.steps-matrix {
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1;
}

.step-row {
  display: flex;
  gap: 6px;
  height: 38px;
}

.step-btn {
  flex: 1;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.1s ease;
}

.step-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}

.step-btn.marker {
  border-left-color: rgba(56, 189, 248, 0.4);
}

.step-btn.active {
  background: #06b6d4;
  box-shadow: 0 0 10px rgba(6, 182, 212, 0.5);
  border-color: #22d3ee;
}

.step-btn.playing {
  border-color: #f59e0b;
}

.daw-synth-rack {
  padding: 12px 16px;
  background: rgba(15, 23, 42, 0.95);
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}

.rack-header {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  font-weight: 600;
  color: #94a3b8;
  margin-bottom: 8px;
}

.knob-group {
  display: flex;
  gap: 24px;
}

.knob-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.knob-dial {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: conic-gradient(#38bdf8 0% 65%, #1e293b 65% 100%);
  border: 2px solid rgba(255, 255, 255, 0.2);
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.6);
}

.knob-label {
  font-size: 10px;
  color: #64748b;
}
`;
writeCode('applications/audio-workstation/AudioWorkstationApp.tsx', dawTsx);
writeCode('applications/audio-workstation/audioWorkstation.css', dawCss);

// 3. WebOS Game Center (Minesweeper & 2048 & Snake)
let gameCenterTsx = `import React, { useState } from 'react';
import { Gamepad2, Trophy, RotateCcw, Flame } from 'lucide-react';
import './gameCenter.css';

export const GameCenterApp: React.FC<{ windowId: string; appId: string }> = () => {
  const [activeGame, setActiveGame] = useState<'minesweeper' | '2048' | 'snake'>('minesweeper');
  const [score, setScore] = useState(0);
  const [highScore] = useState(1480);

  // Minesweeper mini state
  const [mineGrid, setMineGrid] = useState<Array<{ revealed: boolean; hasMine: boolean; count: number }>>(
    Array(25).fill(null).map((_, i) => ({
      revealed: false,
      hasMine: i === 4 || i === 12 || i === 19,
      count: i === 3 || i === 5 || i === 11 || i === 13 ? 1 : 0,
    }))
  );

  const clickMineCell = (idx: number) => {
    setMineGrid((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], revealed: true };
      return next;
    });
    setScore((s) => s + 50);
  };

  return (
    <div className="game-center-container">
      {/* Games Navigation Sidebar */}
      <div className="games-sidebar">
        <div className="games-header">
          <Gamepad2 size={16} className="text-amber" />
          <span>Arcade Studio</span>
        </div>

        <div className="game-nav-list">
          <button
            className={\`game-nav-item \${activeGame === 'minesweeper' ? 'active' : ''}\`}
            onClick={() => setActiveGame('minesweeper')}
          >
            <span>💣 Minesweeper</span>
          </button>
          <button
            className={\`game-nav-item \${activeGame === '2048' ? 'active' : ''}\`}
            onClick={() => setActiveGame('2048')}
          >
            <span>🔢 2048 Puzzle</span>
          </button>
          <button
            className={\`game-nav-item \${activeGame === 'snake' ? 'active' : ''}\`}
            onClick={() => setActiveGame('snake')}
          >
            <span>🐍 Retro Snake</span>
          </button>
        </div>

        <div className="high-score-card">
          <Trophy size={14} className="text-yellow-400" />
          <div className="score-details">
            <span className="score-lbl">Personal Best</span>
            <span className="score-val">{highScore} pts</span>
          </div>
        </div>
      </div>

      {/* Main Game Stage */}
      <div className="game-stage">
        <div className="game-stage-header">
          <span className="game-name">{activeGame.toUpperCase()}</span>
          <div className="score-pill">Score: {score}</div>
          <button className="reset-game-btn" onClick={() => setScore(0)}>
            <RotateCcw size={13} />
            <span>Restart</span>
          </button>
        </div>

        <div className="game-canvas-area">
          {activeGame === 'minesweeper' && (
            <div className="minesweeper-board">
              {mineGrid.map((cell, idx) => (
                <button
                  key={idx}
                  className={\`mine-tile \${cell.revealed ? 'revealed' : ''} \${cell.revealed && cell.hasMine ? 'mine' : ''}\`}
                  onClick={() => clickMineCell(idx)}
                >
                  {cell.revealed ? (cell.hasMine ? '💣' : cell.count || '') : ''}
                </button>
              ))}
            </div>
          )}
          {activeGame === '2048' && (
            <div className="puzzle-2048-board">
              {[2, 4, 8, 16, 32, 64, 128, 256, 512, 1024, 2048, null, 2, 4, null, null].map((val, i) => (
                <div key={i} className={\`tile-2048 val-\${val || 'empty'}\`}>
                  {val || ''}
                </div>
              ))}
            </div>
          )}
          {activeGame === 'snake' && (
            <div className="snake-board-placeholder">
              <Flame size={32} className="text-green-400" />
              <span>Snake Arcade Ready - Use Arrow Keys</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
`;
let gameCenterCss = `.game-center-container {
  display: flex;
  width: 100%;
  height: 100%;
  background: #090d16;
  color: #f8fafc;
  overflow: hidden;
}

.games-sidebar {
  width: 180px;
  background: rgba(15, 23, 42, 0.95);
  border-right: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  flex-direction: column;
  padding: 12px;
  gap: 12px;
}

.games-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 700;
  color: #f8fafc;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.game-nav-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.game-nav-item {
  display: flex;
  align-items: center;
  padding: 8px 10px;
  background: transparent;
  border: none;
  border-radius: 6px;
  color: #94a3b8;
  font-size: 12px;
  cursor: pointer;
  text-align: left;
}

.game-nav-item.active {
  background: #3b82f6;
  color: #ffffff;
}

.high-score-card {
  margin-top: auto;
  display: flex;
  align-items: center;
  gap: 10px;
  background: rgba(255, 255, 255, 0.04);
  padding: 8px 10px;
  border-radius: 6px;
}

.score-details {
  display: flex;
  flex-direction: column;
}

.score-lbl {
  font-size: 10px;
  color: #64748b;
}

.score-val {
  font-size: 12px;
  font-weight: 700;
  color: #facc15;
}

.game-stage {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.game-stage-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px;
  background: rgba(30, 41, 59, 0.5);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.game-name {
  font-size: 13px;
  font-weight: 700;
  color: #38bdf8;
}

.score-pill {
  background: rgba(255, 255, 255, 0.1);
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
}

.reset-game-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  background: rgba(255, 255, 255, 0.06);
  border: none;
  border-radius: 4px;
  color: #94a3b8;
  padding: 4px 8px;
  font-size: 11px;
  cursor: pointer;
}

.game-canvas-area {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.minesweeper-board {
  display: grid;
  grid-template-columns: repeat(5, 50px);
  gap: 4px;
}

.mine-tile {
  width: 50px;
  height: 50px;
  background: #334155;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  font-size: 18px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #38bdf8;
}

.mine-tile.revealed {
  background: #1e293b;
}

.mine-tile.mine {
  background: #ef4444;
}

.puzzle-2048-board {
  display: grid;
  grid-template-columns: repeat(4, 60px);
  gap: 6px;
  background: #1e293b;
  padding: 8px;
  border-radius: 8px;
}

.tile-2048 {
  width: 60px;
  height: 60px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 700;
}

.tile-2048.val-2048 {
  background: #eab308;
  color: #000;
}

.snake-board-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  color: #94a3b8;
}
`;
writeCode('applications/game-center/GameCenterApp.tsx', gameCenterTsx);
writeCode('applications/game-center/gameCenter.css', gameCenterCss);

// 4. Weather App
let weatherTsx = `import React, { useState } from 'react';
import { Cloud, Sun, CloudRain, Wind, Droplets, Compass, Search } from 'lucide-react';
import './weather.css';

export const WeatherApp: React.FC<{ windowId: string; appId: string }> = () => {
  const [city, setCity] = useState('San Francisco, CA');
  const [temp] = useState(68);

  const forecast = [
    { day: 'Mon', high: 70, low: 54, condition: 'Sunny' },
    { day: 'Tue', high: 66, low: 52, condition: 'Partly Cloudy' },
    { day: 'Wed', high: 64, low: 50, condition: 'Rain' },
    { day: 'Thu', high: 68, low: 53, condition: 'Sunny' },
    { day: 'Fri', high: 72, low: 55, condition: 'Sunny' },
    { day: 'Sat', high: 75, low: 58, condition: 'Partly Cloudy' },
    { day: 'Sun', high: 69, low: 54, condition: 'Cloudy' },
  ];

  return (
    <div className="weather-container">
      {/* Search Header */}
      <div className="weather-header">
        <div className="weather-search">
          <Search size={14} />
          <input
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="Search city..."
          />
        </div>
      </div>

      {/* Main Temperature Hero */}
      <div className="weather-hero">
        <Sun size={64} className="weather-sun-icon" />
        <div className="weather-temp-main">{temp}°F</div>
        <div className="weather-condition-txt">Clear Sky & Sunny</div>
        <div className="weather-city-txt">{city}</div>
      </div>

      {/* Details Grid */}
      <div className="weather-details-grid">
        <div className="weather-stat-card">
          <Wind size={16} className="text-cyan" />
          <div className="stat-content">
            <span className="stat-lbl">Wind Speed</span>
            <span className="stat-val">9 mph NW</span>
          </div>
        </div>
        <div className="weather-stat-card">
          <Droplets size={16} className="text-blue-400" />
          <div className="stat-content">
            <span className="stat-lbl">Humidity</span>
            <span className="stat-val">62%</span>
          </div>
        </div>
        <div className="weather-stat-card">
          <Compass size={16} className="text-purple-400" />
          <div className="stat-content">
            <span className="stat-lbl">Pressure</span>
            <span className="stat-val">1014 hPa</span>
          </div>
        </div>
      </div>

      {/* 7-Day Forecast Row */}
      <div className="weather-forecast-row">
        {forecast.map((f) => (
          <div key={f.day} className="forecast-card">
            <span className="f-day">{f.day}</span>
            {f.condition === 'Rain' ? <CloudRain size={20} className="text-blue-400" /> : <Sun size={20} className="text-amber-400" />}
            <span className="f-high">{f.high}°</span>
            <span className="f-low">{f.low}°</span>
          </div>
        ))}
      </div>
    </div>
  );
};
`;
let weatherCss = `.weather-container {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  background: linear-gradient(180deg, #0284c7 0%, #0369a1 40%, #0f172a 100%);
  color: #ffffff;
  padding: 16px;
  overflow-y: auto;
  gap: 16px;
}

.weather-header {
  display: flex;
}

.weather-search {
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(0, 0, 0, 0.25);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 20px;
  padding: 6px 14px;
  width: 100%;
}

.weather-search input {
  background: transparent;
  border: none;
  color: #ffffff;
  outline: none;
  font-size: 12px;
  width: 100%;
}

.weather-hero {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 10px 0;
}

.weather-sun-icon {
  color: #facc15;
  filter: drop-shadow(0 0 16px rgba(250, 204, 21, 0.6));
}

.weather-temp-main {
  font-size: 48px;
  font-weight: 800;
}

.weather-condition-txt {
  font-size: 14px;
  color: #e0f2fe;
}

.weather-city-txt {
  font-size: 12px;
  color: #bae6fd;
}

.weather-details-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}

.weather-stat-card {
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(8px);
  padding: 10px;
  border-radius: 8px;
}

.stat-content {
  display: flex;
  flex-direction: column;
}

.stat-lbl {
  font-size: 10px;
  color: #94a3b8;
}

.stat-val {
  font-size: 12px;
  font-weight: 600;
}

.weather-forecast-row {
  display: flex;
  gap: 8px;
  overflow-x: auto;
}

.forecast-card {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  background: rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(8px);
  padding: 10px 6px;
  border-radius: 8px;
  min-width: 50px;
}

.f-day {
  font-size: 11px;
  color: #cbd5e1;
}

.f-high {
  font-size: 12px;
  font-weight: 700;
}

.f-low {
  font-size: 11px;
  color: #94a3b8;
}
`;
writeCode('applications/weather/WeatherApp.tsx', weatherTsx);
writeCode('applications/weather/weather.css', weatherCss);

// 5. Clock / World Time / Stopwatch
let clockTsx = `import React, { useState, useEffect } from 'react';
import { Clock as ClockIcon, Timer, Hourglass, Globe } from 'lucide-react';
import './clock.css';

export const ClockApp: React.FC<{ windowId: string; appId: string }> = () => {
  const [tab, setTab] = useState<'world' | 'stopwatch' | 'timer'>('world');
  const [now, setNow] = useState(new Date());
  const [stopwatchMs, setStopwatchMs] = useState(0);
  const [isSwRunning, setIsSwRunning] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    let interval: any;
    if (isSwRunning) {
      interval = setInterval(() => setStopwatchMs((m) => m + 10), 10);
    }
    return () => clearInterval(interval);
  }, [isSwRunning]);

  const worldCities = [
    { city: 'San Francisco', tz: 'America/Los_Angeles' },
    { city: 'New York', tz: 'America/New_York' },
    { city: 'London', tz: 'Europe/London' },
    { city: 'Tokyo', tz: 'Asia/Tokyo' },
    { city: 'Sydney', tz: 'Australia/Sydney' },
  ];

  return (
    <div className="clock-app-container">
      <div className="clock-nav-tabs">
        <button className={\`clock-tab \${tab === 'world' ? 'active' : ''}\`} onClick={() => setTab('world')}>
          <Globe size={14} />
          <span>World Clock</span>
        </button>
        <button className={\`clock-tab \${tab === 'stopwatch' ? 'active' : ''}\`} onClick={() => setTab('stopwatch')}>
          <Timer size={14} />
          <span>Stopwatch</span>
        </button>
        <button className={\`clock-tab \${tab === 'timer' ? 'active' : ''}\`} onClick={() => setTab('timer')}>
          <Hourglass size={14} />
          <span>Timer</span>
        </button>
      </div>

      <div className="clock-content-area">
        {tab === 'world' && (
          <div className="world-clock-grid">
            {worldCities.map((c) => {
              const timeStr = now.toLocaleTimeString('en-US', { timeZone: c.tz, hour: '2-digit', minute: '2-digit', second: '2-digit' });
              return (
                <div key={c.city} className="city-clock-card">
                  <span className="city-name">{c.city}</span>
                  <span className="city-time">{timeStr}</span>
                </div>
              );
            })}
          </div>
        )}

        {tab === 'stopwatch' && (
          <div className="stopwatch-view">
            <div className="sw-display">{(stopwatchMs / 1000).toFixed(2)}s</div>
            <div className="sw-controls">
              <button className="sw-btn" onClick={() => setIsSwRunning(!isSwRunning)}>
                {isSwRunning ? 'Stop' : 'Start'}
              </button>
              <button className="sw-btn reset" onClick={() => { setIsSwRunning(false); setStopwatchMs(0); }}>
                Reset
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
`;
let clockCss = `.clock-app-container {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  background: #0f172a;
  color: #f8fafc;
}

.clock-nav-tabs {
  display: flex;
  background: rgba(0, 0, 0, 0.3);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.clock-tab {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px;
  background: transparent;
  border: none;
  color: #94a3b8;
  font-size: 12px;
  cursor: pointer;
}

.clock-tab.active {
  color: #38bdf8;
  border-bottom: 2px solid #38bdf8;
}

.clock-content-area {
  flex: 1;
  padding: 16px;
  overflow-y: auto;
}

.world-clock-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.city-clock-card {
  background: rgba(255, 255, 255, 0.04);
  padding: 14px;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.city-name {
  font-size: 12px;
  color: #94a3b8;
}

.city-time {
  font-size: 20px;
  font-weight: 700;
  color: #38bdf8;
}

.stopwatch-view {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  gap: 20px;
}

.sw-display {
  font-size: 48px;
  font-weight: 800;
  color: #38bdf8;
  font-family: monospace;
}

.sw-controls {
  display: flex;
  gap: 12px;
}

.sw-btn {
  padding: 8px 24px;
  background: #3b82f6;
  border: none;
  border-radius: 6px;
  color: #ffffff;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}

.sw-btn.reset {
  background: rgba(255, 255, 255, 0.1);
  color: #cbd5e1;
}
`;
writeCode('applications/clock/ClockApp.tsx', clockTsx);
writeCode('applications/clock/clock.css', clockCss);

// 6. Master Applications Index Update
let appCatalog = `/**
 * WebOS Master Applications Catalog
 */

export * from './terminal/TerminalApp';
export * from './file-explorer/FileExplorerApp';
export * from './code-editor/CodeEditorApp';
export * from './calculator/CalculatorApp';
export * from './system-monitor/SystemMonitorApp';
export * from './notes/NotesApp';
export * from './drawing/DrawingStudioApp';
export * from './spreadsheet/SpreadsheetApp';
export * from './db-studio/DbStudioApp';
export * from './calendar/CalendarApp';
export * from './media-player/MediaPlayerApp';

export * from './paint/PaintApp';
export * from './pdf-viewer/PdfViewerApp';
export * from './video-player/VideoPlayerApp';
export * from './audio-workstation/AudioWorkstationApp';
export * from './game-center/GameCenterApp';
export * from './weather/WeatherApp';
export * from './clock/ClockApp';
`;
writeCode('applications/index.ts', appCatalog);

console.log('Applications suite generated successfully.');
