import React, { useState } from 'react';
import './HexEditorApp.css';

export const HexEditorApp: React.FC = () => {
  const [data, setData] = useState<Uint8Array>(() => {
    const bytes = new Uint8Array(256);
    // Standard ELF header magic & bytes
    bytes[0] = 0x7f; bytes[1] = 0x45; bytes[2] = 0x4c; bytes[3] = 0x46; // .ELF
    bytes[4] = 0x02; // 64-bit
    bytes[5] = 0x01; // Little endian
    for (let i = 6; i < 256; i++) {
      bytes[i] = Math.floor(Math.random() * 256);
    }
    return bytes;
  });
  const [selectedOffset, setSelectedOffset] = useState<number | null>(0);

  const rows: number[][] = [];
  for (let i = 0; i < data.length; i += 16) {
    const row: number[] = [];
    for (let j = 0; j < 16 && i + j < data.length; j++) {
      row.push(data[i + j]);
    }
    rows.push(row);
  }

  const toHex = (n: number, pad = 2) => n.toString(16).toUpperCase().padStart(pad, '0');

  return (
    <div className="hex-editor-app">
      <div className="hex-toolbar">
        <span className="hex-file-title">binary_blob.elf (256 bytes)</span>
        <button className="hex-btn" onClick={() => {
          const fresh = new Uint8Array(256);
          for (let i = 0; i < 256; i++) fresh[i] = Math.floor(Math.random() * 256);
          setData(fresh);
        }}>Generate Random</button>
      </div>

      <div className="hex-view-container">
        <div className="hex-grid">
          {rows.map((row, rowIdx) => {
            const offset = rowIdx * 16;
            return (
              <div key={rowIdx} className="hex-row">
                <span className="hex-offset">{toHex(offset, 8)}</span>
                <div className="hex-bytes">
                  {row.map((b, bIdx) => {
                    const absOffset = offset + bIdx;
                    return (
                      <span
                        key={bIdx}
                        className={`hex-byte ${selectedOffset === absOffset ? 'selected' : ''}`}
                        onClick={() => setSelectedOffset(absOffset)}
                      >
                        {toHex(b)}
                      </span>
                    );
                  })}
                </div>
                <div className="hex-ascii">
                  {row.map((b, bIdx) => {
                    const char = b >= 32 && b <= 126 ? String.fromCharCode(b) : '.';
                    const absOffset = offset + bIdx;
                    return (
                      <span
                        key={bIdx}
                        className={`hex-ascii-char ${selectedOffset === absOffset ? 'selected' : ''}`}
                        onClick={() => setSelectedOffset(absOffset)}
                      >
                        {char}
                      </span>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="hex-status-bar">
        <span>Offset: {selectedOffset !== null ? `0x${toHex(selectedOffset, 4)} (${selectedOffset})` : 'None'}</span>
        <span>Byte: {selectedOffset !== null ? `0x${toHex(data[selectedOffset])} (${data[selectedOffset]})` : '-'}</span>
      </div>
    </div>
  );
};
