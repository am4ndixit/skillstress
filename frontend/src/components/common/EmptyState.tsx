import React from 'react';
import { LucideIcon } from 'lucide-react';
import { Button } from './Button';

export interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
  honestNote?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  actionText,
  onAction,
  honestNote
}) => {
  return (
    <div
      className="glass-panel"
      style={{
        padding: '48px 24px',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        maxWidth: '560px',
        margin: '32px auto'
      }}
    >
      <div
        style={{
          width: '56px',
          height: '56px',
          borderRadius: '16px',
          backgroundColor: 'var(--bg-surface)',
          border: '2px solid var(--border-edge)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--cyan-400)',
          marginBottom: '16px'
        }}
      >
        <Icon size={28} aria-hidden="true" />
      </div>
      <h3 style={{ fontSize: '17px', fontWeight: 600, color: 'var(--text-main)', marginBottom: '8px' }}>
        {title}
      </h3>
      <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.6', marginBottom: '20px', maxWidth: '420px' }}>
        {description}
      </p>
      {actionText && onAction && (
        <Button variant="primary" onClick={onAction}>
          {actionText}
        </Button>
      )}
      {honestNote && (
        <div style={{ marginTop: '24px', padding: '8px 14px', borderRadius: '6px', background: '#f2eee6', border: '1px solid var(--border-edge)', fontSize: '11px', color: 'var(--text-dim)' }}>
          <strong style={{ color: 'var(--cyan-400)' }}>Honest System Note:</strong> {honestNote}
        </div>
      )}
    </div>
  );
};
