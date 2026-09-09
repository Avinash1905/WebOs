import clsx from 'clsx';

export interface SeparatorProps {
  orientation?: 'horizontal' | 'vertical';
  className?: string;
}

export const Separator = ({
  orientation = 'horizontal',
  className,
}: SeparatorProps) => {
  return (
    <div
      role="separator"
      aria-orientation={orientation}
      className={clsx(
        orientation === 'horizontal' ? 'w-full h-px my-2' : 'h-full w-px mx-2',
        className
      )}
      style={{
        backgroundColor: 'var(--os-border-subtle)',
        flexShrink: 0,
        ...(orientation === 'horizontal'
          ? { height: '1px', width: '100%', margin: '4px 0' }
          : { width: '1px', height: '100%', margin: '0 4px' }),
      }}
    />
  );
};
