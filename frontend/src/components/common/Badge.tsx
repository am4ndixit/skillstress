import React from 'react';

export type BadgeVariant = 'pass' | 'fail' | 'warn' | 'info' | 'violet' | 'cyan' | 'muted';

export interface BadgeProps {
  variant?: BadgeVariant;
  dot?: boolean;
  children?: React.ReactNode;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'muted',
  dot,
  children,
  className = ''
}) => {
  return (
    <span className={`badge badge-${variant} ${className}`}>
      {dot && (
        <span style={{
          width: '6px', height: '6px', borderRadius: '50%', flexShrink: 0,
          background: variant === 'pass' ? 'var(--status-pass)'
            : variant === 'fail' ? 'var(--status-fail)'
            : variant === 'warn' ? 'var(--status-warn)'
            : variant === 'cyan' ? 'var(--cyan-400)'
            : variant === 'violet' ? 'var(--violet-400)'
            : 'var(--text-dim)'
        }} />
      )}
      {children}
    </span>
  );
};
