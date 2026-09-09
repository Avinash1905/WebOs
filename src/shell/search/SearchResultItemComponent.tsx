import type { SearchResultItem } from '../../types/search';
import { renderOSIcon } from '../../utils/iconUtils';

interface SearchResultItemProps {
  item: SearchResultItem;
  isSelected: boolean;
  onSelect: () => void;
  onExecute: () => void;
}

export const SearchResultItemComponent = ({
  item,
  isSelected,
  onSelect,
  onExecute,
}: SearchResultItemProps) => {
  return (
    <div
      className={`os-search-item ${isSelected ? 'selected' : ''}`}
      onMouseEnter={onSelect}
      onClick={onExecute}
      role="option"
      aria-selected={isSelected}
    >
      <div className="os-search-item-icon">
        {renderOSIcon(item.icon, { size: 18, color: item.iconColor })}
      </div>
      <div className="os-search-item-content">
        <div className="os-search-item-title-row">
          <span className="os-search-item-title">{item.title}</span>
          {item.shortcut ? (
            <span className="os-search-item-shortcut">{item.shortcut}</span>
          ) : (
            <span className="os-search-item-cat-badge">{item.category}</span>
          )}
        </div>
        {item.subtitle && <div className="os-search-item-sub">{item.subtitle}</div>}
      </div>
    </div>
  );
};
