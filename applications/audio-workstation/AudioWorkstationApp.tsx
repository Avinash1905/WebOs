import React, { useState } from 'react';
import { Play, Square as StopIcon, Music, Sliders } from 'lucide-react';
import './audioWorkstation.css';

const TRACKS = ['Kick 808', 'Snare Clap', 'Hi-Hat Closed', 'Synth Lead (Saw)', 'Sub Bass (Sine)'];
const STEPS = 16;

export const AudioWorkstationApp: React.FC<{ windowId: string; appId: string }> = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [bpm, setBpm] = useState(128);
  const [currentStep] = useState(0);
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
          <button className={`daw-play-btn ${isPlaying ? 'active' : ''}`} onClick={() => setIsPlaying(!isPlaying)}>
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
                    className={`step-btn ${isActive ? 'active' : ''} ${isCurrentBeat ? 'playing' : ''} ${isBeatMarker ? 'marker' : ''}`}
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
