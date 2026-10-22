import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Play, Upload, CheckCircle2, XCircle, Clock,
  ShieldCheck, ArrowRight, Activity, Terminal, Cpu,
  TrendingUp, Zap, Target, BookOpen
} from 'lucide-react';
import { useWorkbench } from '../context/WorkbenchContext';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';

/* Animated counter */
function AnimatedCount({ value, suffix = '' }: { value: number | string; suffix?: string }) {
  const [displayed, setDisplayed] = useState(0);
  useEffect(() => {
    if (typeof value !== 'number') { setDisplayed(0); return; }
    let start = 0;
    const duration = 600;
    const step = value / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= value) { setDisplayed(value); clearInterval(timer); }
      else setDisplayed(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [value]);
  return <>{typeof value === 'number' ? displayed : value}{suffix}</>;
}

/* Mini bar chart */
function MiniBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div style={{ height: '3px', background: 'var(--bg-input)', borderRadius: '3px', overflow: 'hidden', marginTop: '8px' }}>
      <div style={{
        width: `${pct}%`,
        height: '100%',
        borderRadius: '3px',
        background: color,
        boxShadow: 'inset 0 1px rgba(255,255,255,.35)',
        transition: 'width 0.7s cubic-bezier(0.16,1,0.3,1)'
      }} />
    </div>
  );
}

export const OverviewPage: React.FC = () => {
  const navigate = useNavigate();
  const { skills, runs, activeSkill, runEvaluation, isSimulating, backendOnline } = useWorkbench();

  const passedRunsCount  = runs.filter(r => r.status === 'passed').length;
  const failedRunsCount  = runs.filter(r => r.status === 'failed').length;
  const passRate         = runs.length > 0 ? Math.round((passedRunsCount / runs.length) * 100) : 0;
  const totalRules = skills.reduce((a, s) => a + s.obligations.length, 0);
  const approvedRules = skills.reduce((a, s) => a + s.obligations.filter(o => o.approved).length, 0);
  const latestRun         = runs[0] || null;
  const avgDuration       = runs.length > 0
    ? Math.round(runs.reduce((a, r) => a + r.durationMs, 0) / runs.length)
    : 0;

  const statsCards = [
    {
      label: 'Test success rate',
      value: runs.length ? passRate : '—',
      suffix: runs.length ? '%' : '',
      sub: runs.length ? `${passedRunsCount} passed · ${failedRunsCount} failed` : 'No measured runs yet',
      icon: TrendingUp,
      color: passRate >= 80 ? 'var(--status-pass)' : passRate >= 50 ? 'var(--status-warn)' : 'var(--status-fail)',
      bar: passRate,
    },
    {
      label: 'Rules approved',
      value: approvedRules,
      suffix: '',
      sub: `of ${totalRules} rules`,
      icon: ShieldCheck,
      color: 'var(--cyan-400)',
      bar: totalRules > 0 ? (approvedRules / totalRules) * 100 : 0,
    },
    {
      label: 'Skills',
      value: skills.length,
      suffix: '',
      sub: runs.length ? `Average run: ${avgDuration} ms` : 'No tests yet',
      icon: BookOpen,
      color: 'var(--indigo-400)',
      bar: Math.min(100, skills.length * 20),
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }} className="animate-fade-up">
      {/* Hero header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <div style={{
              width: '36px', height: '36px',
              background: 'var(--cyan-400)',
              borderRadius: '10px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: 'var(--shadow-raised)'
            }}>
              <Activity size={18} style={{ color: 'var(--on-accent)' }} />
            </div>
            <h1 style={{ fontSize: '22px', fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--text-main)' }}>
              Home
            </h1>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', letterSpacing: '-0.005em' }}>
            Test how a model follows your skill instructions.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexShrink: 0 }}>
          <Button variant="secondary" onClick={() => navigate('/lab')} icon={<Upload size={13} />}>
            Add skill
          </Button>
          <Button
            variant="primary"
            onClick={() => activeSkill && void runEvaluation(activeSkill.id).catch(() => {})}
            loading={isSimulating}
            icon={<Play size={13} />}
          >
            Run test
          </Button>
        </div>
      </div>

      {/* Engine status banner */}
      <div className="glass-panel" style={{
        padding: '14px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: '14px',
          borderColor: 'var(--border-edge)',
        background: 'var(--bg-surface)'
      }}>
        <div style={{
          width: '32px', height: '32px',
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-edge)',
          borderRadius: '8px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0
        }}>
          <Cpu size={16} style={{ color: 'var(--cyan-400)' }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '12px', fontWeight: 600, color: backendOnline ? 'var(--status-pass)' : 'var(--status-warn)', marginBottom: '1px' }}>
            {backendOnline ? 'Ready to test' : 'Test service is offline'}
          </div>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.4 }}>
            Your selected model answers the task; the same model checks it against approved rules. Set it up in{' '}
            <button onClick={() => navigate('/settings')} style={{ color: 'var(--cyan-400)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px', textDecoration: 'underline' }}>
              Settings
            </button>.
          </p>
        </div>
      </div>

      {/* Stats grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '16px' }}>
        {statsCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <div key={i} className="glass-panel stat-card" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500, letterSpacing: '-0.005em' }}>
                  {card.label}
                </span>
                <div style={{
                  width: '28px', height: '28px',
                  background: `${card.color}18`,
                  border: `1px solid ${card.color}30`,
                  borderRadius: '7px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <Icon size={14} style={{ color: card.color }} />
                </div>
              </div>
              <div style={{ fontSize: '32px', fontWeight: 800, fontFamily: 'var(--font-mono)', letterSpacing: '-0.04em', color: 'var(--text-main)', lineHeight: 1 }}>
                <AnimatedCount value={card.value} suffix={card.suffix} />
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '6px' }}>{card.sub}</div>
              <MiniBar value={card.bar} max={100} color={card.color} />
            </div>
          );
        })}
      </div>

      {/* Main content row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.45fr 1fr', gap: '24px', alignItems: 'start' }}>
        {/* Left: Latest run + quick actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Clock size={15} style={{ color: 'var(--cyan-400)' }} />
            <h2 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>Latest test</h2>
          </div>

          {latestRun ? (
            <div className="glass-raised" style={{
              padding: '20px',
              borderColor: 'var(--border-edge)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
                    <Badge variant={latestRun.status === 'passed' ? 'pass' : 'fail'}>
                      {latestRun.status === 'passed'
                        ? <><CheckCircle2 size={11} /> PASSED</>
                        : <><XCircle size={11} /> FAILED</>}
                    </Badge>
                    <code style={{ fontSize: '11px', color: 'var(--cyan-400)', fontFamily: 'var(--font-mono)' }}>
                      {latestRun.id}
                    </code>
                    <span style={{ fontSize: '11px', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
                      {latestRun.durationMs}ms
                    </span>
                  </div>
                  <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-main)', letterSpacing: '-0.02em', marginBottom: '5px' }}>
                    {latestRun.scenarioName}
                  </h3>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    Skill: <code style={{ color: 'var(--cyan-400)' }}>{latestRun.skillName}</code>{' '}
                    · {latestRun.passedAssertions} of {latestRun.totalAssertions} checks passed
                  </div>
                  {/* Run result bar */}
                  <div style={{ marginTop: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                      <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>Rules passed</span>
                      <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: latestRun.status === 'passed' ? 'var(--status-pass)' : 'var(--status-fail)' }}>
                        {Math.round((latestRun.passedAssertions / latestRun.totalAssertions) * 100)}%
                      </span>
                    </div>
                    <MiniBar
                      value={latestRun.passedAssertions}
                      max={latestRun.totalAssertions}
                      color={latestRun.status === 'passed' ? 'var(--status-pass)' : 'var(--status-fail)'}
                    />
                  </div>
                </div>
                <Button variant="secondary" size="sm" onClick={() => navigate('/history', { state: { runId: latestRun.id } })} icon={<ArrowRight size={13} />}>
                  History
                </Button>
              </div>
            </div>
          ) : (
            <div className="glass-panel" style={{ padding: '28px', textAlign: 'center' }}>
              <Terminal size={28} style={{ color: 'var(--text-dim)', margin: '0 auto 10px' }} />
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 500 }}>No runs yet</p>
              <p style={{ fontSize: '12px', color: 'var(--text-dim)', marginTop: '4px' }}>Choose a skill, then run a test.</p>
            </div>
          )}

          {/* Quick action cards */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            {[
              {
                to: '/lab',
                title: 'Test',
                desc: 'Review rules and run a task',
                icon: <Zap size={16} />,
                color: 'var(--cyan-400)'
              },
              {
                to: '/history',
                title: 'History',
                desc: 'Review results and comparisons',
                icon: <Clock size={16} />,
                color: 'var(--violet-400)'
              }
            ].map(card => (
              <div
                key={card.to}
                className="glass-panel glass-pressable"
                style={{ padding: '16px', cursor: 'pointer' }}
                onClick={() => navigate(card.to)}
                role="button"
                tabIndex={0}
                onKeyDown={e => e.key === 'Enter' && navigate(card.to)}
              >
                <div style={{ color: card.color, marginBottom: '8px' }}>{card.icon}</div>
                <h4 style={{ fontSize: '13px', fontWeight: 700, color: card.color, marginBottom: '4px', letterSpacing: '-0.02em' }}>
                  {card.title}
                </h4>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: 1.4 }}>{card.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Recent activity feed */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Target size={15} style={{ color: 'var(--cyan-400)' }} />
              <h2 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>Recent tests</h2>
            </div>
            <button
              onClick={() => navigate('/history')}
              style={{
                fontSize: '11px', color: 'var(--cyan-400)',
                background: 'none', border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600
              }}
            >
              All <ArrowRight size={11} />
            </button>
          </div>

          <div className="glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
            {runs.length === 0 ? (
              <div style={{ padding: '28px', textAlign: 'center' }}>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>No tests yet. Run a test to get started.</p>
              </div>
            ) : (
              runs.slice(0, 6).map((run, i) => (
                <div
                  key={run.id}
                  onClick={() => navigate('/history', { state: { runId: run.id } })}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px 16px',
                    borderBottom: i < Math.min(runs.length, 6) - 1 ? '1px solid var(--border-edge)' : 'none',
                    cursor: 'pointer',
                    transition: 'background 0.15s',
                    gap: '10px'
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-surface-hover)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 }}>
                    <div style={{
                      width: '28px', height: '28px', borderRadius: '7px', flexShrink: 0,
                      background: run.status === 'passed' ? 'var(--status-pass-bg)' : 'var(--status-fail-bg)',
                      border: `1px solid ${run.status === 'passed' ? 'var(--status-pass-border)' : 'var(--status-fail-border)'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                      {run.status === 'passed'
                        ? <CheckCircle2 size={14} style={{ color: 'var(--status-pass)' }} />
                        : <XCircle size={14} style={{ color: 'var(--status-fail)' }} />}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div className="truncate" style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-main)' }}>
                        {run.skillName}
                      </div>
                      <div className="truncate" style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
                        {run.scenarioName}
                      </div>
                    </div>
                  </div>
                  <div style={{ flexShrink: 0, textAlign: 'right' }}>
                    <div style={{
                      fontSize: '11px', fontFamily: 'var(--font-mono)', fontWeight: 700,
                      color: run.status === 'passed' ? 'var(--status-pass)' : 'var(--status-fail)'
                    }}>
                      {run.passedAssertions}/{run.totalAssertions}
                    </div>
                    <div style={{ fontSize: '10px', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
                      {run.durationMs}ms
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Skills summary */}
          <div className="glass-panel" style={{ padding: '16px' }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <BookOpen size={13} />
              Skills
            </div>
            {skills.slice(0, 3).map(skill => (
              <div
                key={skill.id}
                onClick={() => navigate('/library')}
                style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '8px 0',
                  borderBottom: '1px solid var(--border-edge)',
                  cursor: 'pointer'
                }}
              >
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-main)' }}>{skill.name}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>v{skill.version} · {skill.obligations.length} rules</div>
                </div>
                <Badge variant="violet">{skill.obligations.filter(o => o.approved).length} ✓</Badge>
              </div>
            ))}
            {skills.length > 3 && (
              <button
                onClick={() => navigate('/library')}
                style={{
                  marginTop: '8px', fontSize: '11px', color: 'var(--cyan-400)',
                  background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600
                }}
              >
                + {skills.length - 3} more skills
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
