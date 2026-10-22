import React, { HTMLAttributes } from 'react';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  elevated?: boolean;
  interactive?: boolean;
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({
  children,
  elevated = false,
  interactive = false,
  title,
  subtitle,
  action,
  className = '',
  style,
  ...props
}) => {
  const baseClass = elevated ? 'glass-raised' : 'glass-panel';
  const interactClass = interactive ? 'glass-pressable' : '';

  return (
    <div
      className={`${baseClass} ${interactClass} ${className}`.trim()}
      style={{ padding: '20px', ...style }}
      {...props}
    >
      {(title || action) && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px', gap: '12px' }}>
          <div>
            {title && <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-main)', letterSpacing: '-0.01em' }}>{title}</h3>}
            {subtitle && <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>{subtitle}</p>}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      {children}
    </div>
  );
};
