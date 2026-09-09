import { useDndStore } from '../stores/dndStore';
import './dnd.css';

export const DragPreviewLayer = () => {
  const activeItem = useDndStore((state) => state.activeItem);
  const currentPosition = useDndStore((state) => state.currentPosition);
  const state = useDndStore((state) => state.state);

  if (!activeItem || (state !== 'dragging' && state !== 'overdroptarget')) {
    return null;
  }

  return (
    <div
      className="os-drag-preview-layer"
      style={{
        transform: `translate3d(${currentPosition.x}px, ${currentPosition.y}px, 0)`,
      }}
      aria-hidden="true"
    >
      <div className="os-drag-preview-badge">
        <span className="os-drag-preview-title">
          {(activeItem.data as { title?: string })?.title || activeItem.type}
        </span>
      </div>
    </div>
  );
};
