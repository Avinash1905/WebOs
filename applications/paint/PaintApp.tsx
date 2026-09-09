import React, { useRef, useState, useEffect } from 'react';
import {
  PenTool,
  Eraser,
  Square,
  Circle,
  PaintBucket,
  Download,
  Undo2,
  ZoomIn,
  ZoomOut,
  Layers,
  Sparkles,
} from 'lucide-react';
import './paint.css';

interface Layer {
  id: string;
  name: string;
  visible: boolean;
  opacity: number;
}

export const PaintApp: React.FC<{ windowId: string; appId: string }> = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [tool, setTool] = useState<'brush' | 'eraser' | 'rect' | 'circle' | 'fill'>('brush');
  const [color, setColor] = useState('#3b82f6');
  const [brushSize, setBrushSize] = useState(4);
  const [zoom, setZoom] = useState(100);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState<{ x: number; y: number } | null>(null);
  const [history, setHistory] = useState<ImageData[]>([]);
  const [layers, setLayers] = useState<Layer[]>([
    { id: 'layer-1', name: 'Background', visible: true, opacity: 1 },
    { id: 'layer-2', name: 'Layer 1', visible: true, opacity: 1 },
  ]);
  const [activeLayerId, setActiveLayerId] = useState<string>('layer-2');

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.width = 900;
      canvas.height = 550;
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
      setHistory((prev) => [...prev.slice(-20), imgData]);
    }
  };

  const handleUndo = () => {
    if (history.length <= 1) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const nextHistory = [...history];
      nextHistory.pop(); // current state
      const prevState = nextHistory[nextHistory.length - 1];
      ctx.putImageData(prevState, 0, 0);
      setHistory(nextHistory);
    }
  };

  const getCanvasCoords = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const startDraw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const pos = getCanvasCoords(e);
    setIsDrawing(true);
    setStartPos(pos);

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (tool === 'brush' || tool === 'eraser') {
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);
    } else if (tool === 'fill') {
      ctx.fillStyle = color;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      saveState();
      setIsDrawing(false);
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const pos = getCanvasCoords(e);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (tool === 'brush') {
      ctx.strokeStyle = color;
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
    } else if (tool === 'eraser') {
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = brushSize * 3;
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
    }
  };

  const endDraw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const pos = getCanvasCoords(e);
    const canvas = canvasRef.current;
    if (!canvas || !startPos) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (tool === 'rect') {
      ctx.strokeStyle = color;
      ctx.lineWidth = brushSize;
      ctx.strokeRect(
        startPos.x,
        startPos.y,
        pos.x - startPos.x,
        pos.y - startPos.y
      );
    } else if (tool === 'circle') {
      const radius = Math.hypot(pos.x - startPos.x, pos.y - startPos.y);
      ctx.strokeStyle = color;
      ctx.lineWidth = brushSize;
      ctx.beginPath();
      ctx.arc(startPos.x, startPos.y, radius, 0, Math.PI * 2);
      ctx.stroke();
    }

    setIsDrawing(false);
    setStartPos(null);
    saveState();
  };

  const applyFilter = (filterType: 'invert' | 'grayscale' | 'sepia') => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const d = imgData.data;

    for (let i = 0; i < d.length; i += 4) {
      const r = d[i];
      const g = d[i + 1];
      const b = d[i + 2];

      if (filterType === 'invert') {
        d[i] = 255 - r;
        d[i + 1] = 255 - g;
        d[i + 2] = 255 - b;
      } else if (filterType === 'grayscale') {
        const v = 0.299 * r + 0.587 * g + 0.114 * b;
        d[i] = v;
        d[i + 1] = v;
        d[i + 2] = v;
      } else if (filterType === 'sepia') {
        d[i] = Math.min(255, r * 0.393 + g * 0.769 + b * 0.189);
        d[i + 1] = Math.min(255, r * 0.349 + g * 0.686 + b * 0.168);
        d[i + 2] = Math.min(255, r * 0.272 + g * 0.534 + b * 0.131);
      }
    }

    ctx.putImageData(imgData, 0, 0);
    saveState();
  };

  const handleExport = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `paint_artwork_${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  return (
    <div className="paint-app-container">
      {/* Top Main Toolbar */}
      <div className="paint-toolbar">
        <div className="paint-tool-group">
          <button
            className={`paint-btn ${tool === 'brush' ? 'active' : ''}`}
            onClick={() => setTool('brush')}
            title="Brush"
          >
            <PenTool size={15} />
          </button>
          <button
            className={`paint-btn ${tool === 'eraser' ? 'active' : ''}`}
            onClick={() => setTool('eraser')}
            title="Eraser"
          >
            <Eraser size={15} />
          </button>
          <button
            className={`paint-btn ${tool === 'rect' ? 'active' : ''}`}
            onClick={() => setTool('rect')}
            title="Rectangle"
          >
            <Square size={15} />
          </button>
          <button
            className={`paint-btn ${tool === 'circle' ? 'active' : ''}`}
            onClick={() => setTool('circle')}
            title="Circle"
          >
            <Circle size={15} />
          </button>
          <button
            className={`paint-btn ${tool === 'fill' ? 'active' : ''}`}
            onClick={() => setTool('fill')}
            title="Fill Canvas"
          >
            <PaintBucket size={15} />
          </button>
        </div>

        <div className="paint-color-palette">
          <input
            type="color"
            className="paint-native-picker"
            value={color}
            onChange={(e) => setColor(e.target.value)}
          />
          {['#000000', '#ffffff', '#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#3b82f6', '#a855f7', '#ec4899'].map((c) => (
            <button
              key={c}
              className={`color-swatch ${color === c ? 'selected' : ''}`}
              style={{ backgroundColor: c }}
              onClick={() => setColor(c)}
            />
          ))}
        </div>

        <div className="paint-slider-group">
          <span className="slider-txt">Size: {brushSize}px</span>
          <input
            type="range"
            min="1"
            max="40"
            value={brushSize}
            onChange={(e) => setBrushSize(Number(e.target.value))}
          />
        </div>

        <div className="paint-actions-group">
          <button className="paint-btn" onClick={handleUndo} title="Undo">
            <Undo2 size={15} />
          </button>
          <button className="paint-btn" onClick={() => applyFilter('invert')} title="Invert Filter">
            <Sparkles size={15} />
            <span>Invert</span>
          </button>
          <button className="paint-btn" onClick={() => applyFilter('sepia')} title="Sepia Filter">
            <span>Sepia</span>
          </button>
          <button className="paint-btn" onClick={() => applyFilter('grayscale')} title="Grayscale">
            <span>B&W</span>
          </button>
          <button className="paint-btn highlight" onClick={handleExport} title="Export PNG">
            <Download size={15} />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Main Canvas Workspace */}
      <div className="paint-workspace">
        <div className="canvas-scroller" style={{ transform: `scale(${zoom / 100})` }}>
          <canvas
            ref={canvasRef}
            className="paint-canvas-surface"
            onMouseDown={startDraw}
            onMouseMove={draw}
            onMouseUp={endDraw}
            onMouseLeave={endDraw}
          />
        </div>

        {/* Floating Layer Inspector */}
        <div className="paint-layer-panel">
          <div className="layer-panel-header">
            <Layers size={13} />
            <span>Layers</span>
          </div>
          <div className="layer-items">
            {layers.map((l) => (
              <div
                key={l.id}
                className={`layer-item ${activeLayerId === l.id ? 'active' : ''}`}
                onClick={() => setActiveLayerId(l.id)}
              >
                <span>{l.name}</span>
                <span className="layer-opacity">{Math.round(l.opacity * 100)}%</span>
              </div>
            ))}
          </div>
          <div className="layer-panel-footer">
            <button
              className="layer-add-btn"
              onClick={() => {
                const newId = `layer-${layers.length + 1}`;
                setLayers([...layers, { id: newId, name: `Layer ${layers.length}`, visible: true, opacity: 1 }]);
                setActiveLayerId(newId);
              }}
            >
              + New Layer
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Status Bar */}
      <div className="paint-status-bar">
        <div className="status-info">Canvas: 900 x 550 px | Tool: {tool.toUpperCase()}</div>
        <div className="zoom-controls">
          <button onClick={() => setZoom((z) => Math.max(50, z - 25))}><ZoomOut size={13} /></button>
          <span>{zoom}%</span>
          <button onClick={() => setZoom((z) => Math.min(200, z + 25))}><ZoomIn size={13} /></button>
        </div>
      </div>
    </div>
  );
};
