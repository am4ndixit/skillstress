import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Play, Server, CheckCircle2 } from 'lucide-react';
import { useWorkbench } from '../../context/WorkbenchContext';
import { Button } from '../common/Button';

const ROUTE_META: Record<string, { breadcrumb: string[]; desc?: string }> = {
  '/':          { breadcrumb: ['SkillStress', 'Home'] },
  '/lab':       { breadcrumb: ['SkillStress', 'Test'] },
  '/library':   { breadcrumb: ['SkillStress', 'Skills'] },
  '/history':   { breadcrumb: ['SkillStress', 'History'] },
  '/settings':  { breadcrumb: ['SkillStress', 'Settings'] },
};

export const Header: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { activeSkill, skills, setActiveSkillId, runEvaluation, isSimulating, backendOnline } = useWorkbench();

  const meta = ROUTE_META[location.pathname] || { breadcrumb: ['SkillStress', 'Page'] };

  const handleQuickRun = async () => {
    if (activeSkill) {
      try {
        const run = await runEvaluation(activeSkill.id);
        navigate('/history', { state: { runId: run.id } });
      } catch {
        // Provider errors are shown by the workbench context.
      }
    }
  };

  return (
    <header
      style={{
        height: '60px',
        padding: '0 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid var(--border-edge)',
        position: 'sticky',
        top: 0,
        zIndex: 80,
        backgroundColor: 'var(--bg-canvas)',
        backdropFilter: 'blur(18px) saturate(145%)',
        WebkitBackdropFilter: 'blur(18px) saturate(145%)',
        boxShadow: 'var(--shadow-raised)',
        flexShrink: 0
      }}
    >
      {/* Page and workspace controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <nav aria-label="Page" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '13px', color: 'var(--text-main)', fontWeight: 600, letterSpacing: '-0.01em' }}>
            {meta.breadcrumb[1]}
          </span>
          {meta.desc && (
            <span className="hide-mobile" style={{
              marginLeft: '6px',
              padding: '2px 8px',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-edge)',
              borderRadius: '99px',
              boxShadow: 'var(--shadow-inset)',
              fontSize: '11px',
              color: 'var(--text-dim)'
            }}>
              {meta.desc}
            </span>
          )}
        </nav>
      </div>

      {/* Right: Status + Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {/* Backend Ping */}
        <div
          className="hide-mobile"
          title={backendOnline ? 'FastAPI backend online' : 'FastAPI backend offline; provider-backed runs are unavailable'}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 10px',
            borderRadius: '99px',
            border: `1px solid ${backendOnline ? 'var(--status-pass-border)' : 'var(--border-edge)'}`,
            background: backendOnline ? 'var(--status-pass-bg)' : 'var(--bg-surface)',
            boxShadow: 'var(--shadow-inset)',
            fontSize: '11px',
            fontWeight: 600,
            color: backendOnline ? 'var(--status-pass)' : 'var(--text-dim)',
            cursor: 'default'
          }}
        >
          {backendOnline
            ? <><CheckCircle2 size={11} /> Online</>
            : <><Server size={11} /> Offline</>
          }
        </div>

        {/* Active Skill Selector */}
        <select
          value={activeSkill?.id || ''}
          onChange={(e) => setActiveSkillId(e.target.value)}
          className="select"
          style={{
            padding: '5px 10px',
            fontSize: '12px',
            width: 'auto',
            minWidth: '160px',
            maxWidth: '220px',
            borderRadius: '10px',
            height: '32px'
          }}
          aria-label="Select target skill"
        >
          {skills.map(s => (
            <option key={s.id} value={s.id}>{s.name} v{s.version}</option>
          ))}
        </select>

        <Button
          variant="primary"
          size="sm"
          onClick={handleQuickRun}
          loading={isSimulating}
          icon={<Play size={13} />}
          title="Keyboard shortcut: R"
        >
          Test <kbd style={{ marginLeft: '3px', opacity: 0.55, fontSize: '10px', fontFamily: 'var(--font-mono)' }}>R</kbd>
        </Button>
      </div>
    </header>
  );
};
