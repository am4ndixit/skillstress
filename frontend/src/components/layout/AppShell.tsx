import React, { useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { X, CheckCircle2, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { useWorkbench } from '../../context/WorkbenchContext';

export const AppShell: React.FC = () => {
  const { toasts, dismissToast, activeSkill, runEvaluation, isSimulating } = useWorkbench();
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      if ((e.key === 'r' || e.key === 'R') && !isSimulating && activeSkill) {
        e.preventDefault();
        runEvaluation(activeSkill.id);
      } else if (e.key === '1') navigate('/');
      else if (e.key === '2') navigate('/lab');
      else if (e.key === '3') navigate('/library');
      else if (e.key === '4') navigate('/history');
      else if (e.key === '5') navigate('/settings');
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeSkill, isSimulating, navigate, runEvaluation]);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      <Sidebar
      />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, zIndex: 10, maxWidth: '100%' }}>
        <Header />
        <main style={{
          flex: 1,
          padding: '28px 32px',
          maxWidth: '1500px',
          width: '100%',
          margin: '0 auto'
        }}>
          <Outlet />
        </main>
      </div>

      {/* Toast notifications */}
      <div
        role="region"
        aria-live="polite"
        aria-label="Notifications"
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          zIndex: 1000,
          maxWidth: '380px',
          width: '100%'
        }}
      >
        {toasts.map(toast => {
          const colors = {
            success: 'var(--status-pass)',
            error:   'var(--status-fail)',
            warn:    'var(--status-warn)',
            info:    'var(--cyan-400)'
          };
          const color = colors[toast.type];
          return (
            <div
              key={toast.id}
              className="glass-raised toast-enter"
              style={{
                padding: '12px 14px',
                borderRadius: '10px',
                borderLeft: `3px solid ${color}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
              boxShadow: 'var(--shadow-raised-high)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
                {toast.type === 'success' && <CheckCircle2 size={15} style={{ color, flexShrink: 0 }} />}
                {toast.type === 'error'   && <AlertCircle  size={15} style={{ color, flexShrink: 0 }} />}
                {toast.type === 'warn'    && <AlertTriangle size={15} style={{ color, flexShrink: 0 }} />}
                {toast.type === 'info'    && <Info size={15} style={{ color, flexShrink: 0 }} />}
                <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-main)', lineHeight: 1.4 }}>
                  {toast.message}
                </span>
              </div>
              <button
                onClick={() => dismissToast(toast.id)}
                className="btn btn-ghost btn-xs"
                style={{ padding: '3px', minWidth: 'auto', color: 'var(--text-dim)', flexShrink: 0 }}
                aria-label="Dismiss notification"
              >
                <X size={13} />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
