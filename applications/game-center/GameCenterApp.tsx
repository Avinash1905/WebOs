import React, { useState } from 'react';
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
            className={`game-nav-item ${activeGame === 'minesweeper' ? 'active' : ''}`}
            onClick={() => setActiveGame('minesweeper')}
          >
            <span>💣 Minesweeper</span>
          </button>
          <button
            className={`game-nav-item ${activeGame === '2048' ? 'active' : ''}`}
            onClick={() => setActiveGame('2048')}
          >
            <span>🔢 2048 Puzzle</span>
          </button>
          <button
            className={`game-nav-item ${activeGame === 'snake' ? 'active' : ''}`}
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
                  className={`mine-tile ${cell.revealed ? 'revealed' : ''} ${cell.revealed && cell.hasMine ? 'mine' : ''}`}
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
                <div key={i} className={`tile-2048 val-${val || 'empty'}`}>
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
