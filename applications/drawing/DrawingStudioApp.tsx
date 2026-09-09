import React, { useRef, useState, useEffect } from 'react';
import {
  PenTool,
  Eraser,
  Download,
  Trash2,
  Undo,
} from 'lucide-react';
import './drawing.css';

export const DrawingStudioApp: React.FC<{ windowId: string; appId: string }> = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [tool, setTool] = useState<'pen' | 'eraser'>('pen');
  const [color, setColor] = useState('#38bdf8');
  const [lineWidth, setLineWidth] = useState(3);
  const [isDrawing, setIsDrawing] = useState(false);
  const [undoStack, setUndoStack] = useState<ImageData[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.width = canvas.parentElement?.clientWidth || 800;
      canvas.height = canvas.parentElement?.clientHeight || 500;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        saveState();
      }
    }
  }, []);

  const saveState = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      setUndoStack((prev) => [...prev.slice(-15), imgData]);
    }
  };

  const handleUndo = () => {
    if (undoStack.length <= 1) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const nextStack = [...undoStack];
      nextStack.pop(); // Remove current
      const prevState = nextStack[nextStack.length - 1];
      if (prevState) {
        ctx.putImageData(prevState, 0, 0);
        setUndoStack(nextStack);
      }
    }
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      saveState();
    }
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `webos_drawing_${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.lineWidth = lineWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (tool === 'pen') {
      ctx.strokeStyle = color;
      ctx.lineTo(x, y);
      ctx.stroke();
    } else if (tool === 'eraser') {
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = lineWidth * 3;
      ctx.lineTo(x, y);
      ctx.stroke();
    }
  };

  const stopDrawing = () => {
    if (isDrawing) {
      setIsDrawing(false);
      saveState();
    }
  };

  return (
    <div className="drawing-app-container">
      {/* Tools Header */}
      <div className="drawing-toolbar">
        <div className="tool-group">
          <button
            className={`draw-tool-btn ${tool === 'pen' ? 'active' : ''}`}
            onClick={() => setTool('pen')}
            title="Pen Tool"
          >
            <PenTool size={15} />
          </button>
          <button
            className={`draw-tool-btn ${tool === 'eraser' ? 'active' : ''}`}
            onClick={() => setTool('eraser')}
            title="Eraser Tool"
          >
            <Eraser size={15} />
          </button>
        </div>

        <div className="color-picker-group">
          <input
            type="color"
            className="native-color-picker"
            value={color}
            onChange={(e) => setColor(e.target.value)}
          />
          {['#000000', '#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6'].map((c) => (
            <button
              key={c}
              className={`preset-color-dot ${color === c ? 'selected' : ''}`}
              style={{ background: c }}
              onClick={() => setColor(c)}
            />
          ))}
        </div>

        <div className="width-slider-group">
          <span className="slider-label">Size:</span>
          <input
            type="range"
            min="1"
            max="30"
            value={lineWidth}
            onChange={(e) => setLineWidth(Number(e.target.value))}
          />
        </div>

        <div className="action-group">
          <button className="draw-tool-btn" onClick={handleUndo} title="Undo">
            <Undo size={15} />
          </button>
          <button className="draw-tool-btn danger" onClick={handleClear} title="Clear Canvas">
            <Trash2 size={15} />
          </button>
          <button className="draw-tool-btn primary" onClick={handleDownload} title="Export PNG">
            <Download size={15} />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Canvas Area */}
      <div className="canvas-wrapper">
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
        />
      </div>
    </div>
  );
};
