import React from 'react';

export interface IconProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
  color?: string;
  strokeWidth?: number | string;
}

const createIcon = (name: string, pathContent?: React.ReactNode) => {
  const IconComponent: React.FC<IconProps> = ({
    size = 24,
    color = 'currentColor',
    strokeWidth = 2,
    className = '',
    ...props
  }) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`lucide lucide-${name} ${className}`}
      {...props}
    >
      {pathContent || <circle cx="12" cy="12" r="10" />}
    </svg>
  );
  IconComponent.displayName = name;
  return IconComponent;
};

export const Home = createIcon('home');
export const Code = createIcon('code');
export const ChevronUp = createIcon('chevron-up', <polyline points="18 15 12 9 6 15" />);
export const Folder = createIcon('folder', <path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L8.6 3.3A2 2 0 0 0 6.9 2.5H4a2 2 0 0 0-2 2v13.5a2 2 0 0 0 2 2z" />);
export const FolderOpen = createIcon('folder-open');
export const FolderPlus = createIcon('folder-plus');
export const File = createIcon('file', <><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" /><polyline points="14 2 14 8 20 8" /></>);
export const FileText = createIcon('file-text', <><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><line x1="10" y1="9" x2="8" y2="9" /></>);
export const FilePlus = createIcon('file-plus');
export const Settings = createIcon('settings');
export const Terminal = createIcon('terminal');
export const Globe = createIcon('globe');
export const Image = createIcon('image');
export const Music = createIcon('music');
export const Video = createIcon('video');
export const Trash2 = createIcon('trash-2');
export const Search = createIcon('search');
export const Plus = createIcon('plus');
export const X = createIcon('x');
export const Minus = createIcon('minus');
export const Square = createIcon('square');
export const Copy = createIcon('copy');
export const Scissors = createIcon('scissors');
export const Clipboard = createIcon('clipboard');
export const RefreshCw = createIcon('refresh-cw');
export const Grid = createIcon('grid');
export const List = createIcon('list');
export const Star = createIcon('star');
export const Clock = createIcon('clock');
export const Edit = createIcon('edit');
export const Info = createIcon('info');
export const ArrowLeft = createIcon('arrow-left');
export const ArrowRight = createIcon('arrow-right');
export const ArrowUp = createIcon('arrow-up');
export const ChevronRight = createIcon('chevron-right');
export const ChevronDown = createIcon('chevron-down');
export const Check = createIcon('check');
export const Pin = createIcon('pin');
export const Archive = createIcon('archive');
export const Tag = createIcon('tag');
export const Save = createIcon('save');
export const Bold = createIcon('bold');
export const Italic = createIcon('italic');
export const Underline = createIcon('underline');
export const Strikethrough = createIcon('strikethrough');
export const AlignLeft = createIcon('align-left');
export const AlignCenter = createIcon('align-center');
export const AlignRight = createIcon('align-right');
export const AlignJustify = createIcon('align-justify');
export const ListOrdered = createIcon('list-ordered');
export const Table = createIcon('table');
export const Undo = createIcon('undo');
export const Redo = createIcon('redo');
export const Undo2 = createIcon('undo-2');
export const Redo2 = createIcon('redo-2');
export const Monitor = createIcon('monitor');
export const Activity = createIcon('activity');
export const Calculator = createIcon('calculator');
export const RotateCw = createIcon('rotate-cw');
export const Palette = createIcon('palette');
export const Rocket = createIcon('rocket');
export const LayoutGrid = createIcon('layout-grid');
export const Play = createIcon('play');
export const Lock = createIcon('lock');
export const LogOut = createIcon('log-out');
export const RotateCcw = createIcon('rotate-ccw');
export const Power = createIcon('power');
export const User = createIcon('user');
export const Wifi = createIcon('wifi');
export const Volume2 = createIcon('volume-2');
export const VolumeX = createIcon('volume-x');
export const BatteryCharging = createIcon('battery-charging');
export const Battery = createIcon('battery');
export const Bell = createIcon('bell');
export const PinOff = createIcon('pin-off');
export const Layers = createIcon('layers');
export const Maximize2 = createIcon('maximize-2');
export const Minimize2 = createIcon('minimize-2');
export const Heading1 = createIcon('heading-1');
export const Heading2 = createIcon('heading-2');
export const CheckSquare = createIcon('check-square');
export const History = createIcon('history');
export const Eye = createIcon('eye');
export const Download = createIcon('download');
export const Edit2 = createIcon('edit-2');
export const ShieldCheck = createIcon('shield-check');
export const Replace = createIcon('replace');
export const ReplaceAll = createIcon('replace-all');
export const HardDrive = createIcon('hard-drive');
export const SortAsc = createIcon('sort-asc');
export const SortDesc = createIcon('sort-desc');
export const CornerLeftUp = createIcon('corner-left-up');
export const MoreVertical = createIcon('more-vertical');
export const BookOpen = createIcon('book-open');
export const WrapText = createIcon('wrap-text');
export const Sliders = createIcon('sliders');
export const Columns = createIcon('columns');
export const Rows = createIcon('rows');
export const AppWindow = createIcon('app-window');
export const FileCode = createIcon('file-code');
