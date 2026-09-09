import React, { type ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

export function renderOSIcon(
  icon: LucideIcon | string | ReactNode | undefined,
  props: { size?: number; className?: string; color?: string } = {}
): ReactNode {
  if (!icon) return null;

  const { size = 16, className = '', color } = props;

  // React Element
  if (React.isValidElement(icon)) {
    return icon;
  }

  // String (emoji or URL or text)
  if (typeof icon === 'string') {
    if (icon.startsWith('http') || icon.startsWith('/') || icon.startsWith('data:')) {
      return (
        <img
          src={icon}
          alt=""
          className={`os-icon-img ${className}`}
          style={{ width: size, height: size, objectFit: 'contain' }}
        />
      );
    }
    return (
      <span
        className={`os-icon-emoji ${className}`}
        style={{ fontSize: `${size}px`, lineHeight: 1 }}
      >
        {icon}
      </span>
    );
  }

  // Lucide Icon component or Function/ForwardRef component
  if (typeof icon === 'function' || (typeof icon === 'object' && icon !== null && 'render' in (icon as object))) {
    const IconComp = icon as LucideIcon;
    return <IconComp size={size} className={className} color={color} />;
  }

  return null;
}
