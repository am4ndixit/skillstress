import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, ArrowLeft } from 'lucide-react';
import { Button } from '../components/common/Button';

export const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      minHeight: '60vh', textAlign: 'center', gap: '16px'
    }}>
      <div style={{
        width: '64px', height: '64px',
        background: 'var(--status-fail-bg)',
        border: '2px solid var(--status-fail-border)',
        borderRadius: '16px',
        display: 'flex', alignItems: 'center', justifyContent: 'center'
      }}>
        <AlertTriangle size={28} style={{ color: 'var(--status-fail)' }} />
      </div>
      <div>
        <h1 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.03em', marginBottom: '6px' }}>
          404 — Page Not Found
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
          This route doesn't exist in the workbench.
        </p>
      </div>
      <Button variant="secondary" onClick={() => navigate('/')} icon={<ArrowLeft size={13} />}>
        Back to Overview
      </Button>
    </div>
  );
};
