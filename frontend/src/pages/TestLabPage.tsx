import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FlaskConical, Upload, Check, X, Play, FileCode,
  ChevronDown, ChevronUp, Sparkles, AlertCircle,
  CheckSquare, Square, ArrowRight
} from 'lucide-react';
import { useWorkbench } from '../context/WorkbenchContext';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';

export const TestLabPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    activeSkill, skills, setActiveSkillId, importSkill,
    updateObligationStatus, setAllObligationsApproval,
    runEvaluation, isSimulating
  } = useWorkbench();

  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importName, setImportName]       = useState('');
  const [importContent, setImportContent] = useState('');
  const [taskPrompt, setTaskPrompt] = useState('Design a settings form with one Save action. Describe keyboard operation, visible focus, and clear success feedback.');
  const [expandedOb, setExpandedOb]       = useState<string | null>(null);
  const [isDragOver, setIsDragOver]       = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const rules   = activeSkill?.obligations || [];
  const approvedCount = rules.filter(o => o.approved).length;
  const criticalCount = rules.filter(o => o.impact === 'CRITICAL').length;
  const coveragePct   = rules.length > 0 ? Math.round((approvedCount / rules.length) * 100) : 0;

  const handleImport = async () => {
    if (importName && importContent) {
      try {
        await importSkill(importName, importContent);
        setIsImportModalOpen(false);
        setImportName('');
        setImportContent('');
      } catch {
        // The workbench toast reports the API error; keep the import draft open.
      }
    }
  };

  const handleRun = async () => {
    if (activeSkill) {
      try {
        const run = await runEvaluation(activeSkill.id, `${activeSkill.name} instruction compliance`, taskPrompt);
        navigate('/history', { state: { runId: run.id } });
      } catch {
        // The context reports provider and backend errors to the workbench toast region.
      }
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && (file.name.endsWith('.md') || file.type === 'text/markdown' || file.type === 'text/plain')) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const content = ev.target?.result as string;
        setImportContent(content);
        setImportName(file.name.replace(/\.(md|txt)$/, ''));
        setIsImportModalOpen(true);
      };
      reader.readAsText(file);
    }
  };

  const impactColor = (impact: string) => {
    if (impact === 'CRITICAL') return 'var(--status-fail)';
    if (impact === 'HIGH') return 'var(--status-warn)';
    return 'var(--status-info)';
  };
  const impactBackground = (impact: string) => impact === 'CRITICAL' ? 'var(--status-fail-bg)' : impact === 'HIGH' ? 'var(--status-warn-bg)' : 'var(--status-info-bg)';
  const impactBadge = (impact: string) => {
    if (impact === 'CRITICAL') return 'fail';
    if (impact === 'HIGH') return 'warn';
    return 'info';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }} className="animate-fade-up">
      {/* Page header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{
            fontSize: '22px', fontWeight: 800, color: 'var(--text-main)',
            letterSpacing: '-0.03em',
            display: 'flex', alignItems: 'center', gap: '10px'
          }}>
            <FlaskConical size={22} style={{ color: 'var(--cyan-400)' }} />
            Test
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Review rules, enter a task, and run it with the selected model.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <Button variant="secondary" onClick={() => setIsImportModalOpen(true)} icon={<Upload size={13} />}>
            Import SKILL.md
          </Button>
          <Button
            variant="primary"
            onClick={handleRun}
            loading={isSimulating}
            disabled={!activeSkill || rules.filter(o => o.approved).length === 0}
            icon={<Play size={13} />}
          >
            Run test
          </Button>
        </div>
      </div>

      {/* Drop Zone (when no active skill) */}
      {!activeSkill && (
        <div
          onDragOver={e => { e.preventDefault(); setIsDragOver(true); }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
          onClick={() => setIsImportModalOpen(true)}
          className="glass-panel"
          style={{
            padding: '48px 32px',
            textAlign: 'center',
            border: isDragOver ? '2px dashed var(--cyan-400)' : '2px dashed var(--border-highlight)',
            background: isDragOver ? 'var(--bg-surface)' : 'transparent',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
        >
          <div style={{
            width: '52px', height: '52px',
            background: 'var(--bg-surface)',
            border: '2px solid var(--border-edge)',
            borderRadius: '14px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 14px'
          }}>
            <Upload size={22} style={{ color: 'var(--cyan-400)' }} />
          </div>
          <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-main)', marginBottom: '6px' }}>
            Drop a SKILL.md file here
          </p>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            Or click to paste markdown content. Rules will be listed for review.
          </p>
        </div>
      )}

      {/* Active skill summary */}
      {activeSkill && (
        <div className="glass-raised" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{
                width: '42px', height: '42px',
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-highlight)',
                borderRadius: '10px',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <FileCode size={20} style={{ color: 'var(--cyan-400)' }} />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
                  <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
                    {activeSkill.name}
                  </h2>
                  <Badge variant="violet">v{activeSkill.version}</Badge>
                  {criticalCount > 0 && <Badge variant="fail">{criticalCount} Critical</Badge>}
                </div>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{activeSkill.description}</p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexShrink: 0 }}>
              {/* Rules approved ring */}
              <div style={{ textAlign: 'center' }}>
                <div style={{ position: 'relative', width: '52px', height: '52px', margin: '0 auto' }}>
                  <svg width="52" height="52" viewBox="0 0 52 52" style={{ transform: 'rotate(-90deg)' }}>
                    <circle cx="26" cy="26" r="22" fill="none" stroke="#e4dccf" strokeWidth="4" />
                    <circle cx="26" cy="26" r="22" fill="none"
                      stroke={coveragePct === 100 ? 'var(--status-pass)' : coveragePct > 50 ? 'var(--cyan-400)' : 'var(--status-warn)'}
                      strokeWidth="4"
                      strokeLinecap="round"
                      strokeDasharray={`${2 * Math.PI * 22}`}
                      strokeDashoffset={`${2 * Math.PI * 22 * (1 - coveragePct / 100)}`}
                      style={{ transition: 'stroke-dashoffset 0.6s cubic-bezier(0.16,1,0.3,1)' }}
                    />
                  </svg>
                  <div style={{
                    position: 'absolute', inset: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '11px', fontWeight: 800, fontFamily: 'var(--font-mono)',
                    color: coveragePct === 100 ? 'var(--status-pass)' : 'var(--text-main)'
                  }}>
                    {coveragePct}%
                  </div>
                </div>
                <div style={{ fontSize: '10px', color: 'var(--text-dim)', marginTop: '3px' }}>Rules approved</div>
              </div>

              <div>
                <select
                  value={activeSkill.id}
                  onChange={e => setActiveSkillId(e.target.value)}
                  className="select"
                  style={{ width: 'auto', minWidth: '160px', fontSize: '12px' }}
                >
                  {skills.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
                <div style={{ fontSize: '10px', color: 'var(--text-dim)', marginTop: '4px', textAlign: 'right' }}>
                  {approvedCount}/{rules.length} rules approved
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeSkill && <div className="glass-raised" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <label htmlFor="evaluation-task" style={{ fontSize: '13px', color: 'var(--text-main)', fontWeight: 700 }}>Task</label>
        <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>The selected model answers this task. The same model checks its answer against each approved rule.</p>
        <textarea id="evaluation-task" value={taskPrompt} onChange={event => setTaskPrompt(event.target.value)} className="textarea" rows={4} maxLength={8000} />
        <span style={{ fontSize: '11px', color: 'var(--text-dim)', alignSelf: 'flex-end' }}>{taskPrompt.length}/8000</span>
      </div>}

      {/* Rules list */}
      {activeSkill && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles size={14} style={{ color: 'var(--cyan-400)' }} />
              <h2 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
                Skill rules
              </h2>
              <span style={{
                padding: '2px 8px', borderRadius: '8px',
                background: 'var(--bg-input)', boxShadow: 'var(--shadow-inset)',
                fontSize: '11px', color: 'var(--text-dim)', fontWeight: 600
              }}>
                {rules.length}
              </span>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <Button variant="ghost" size="sm" onClick={() => setAllObligationsApproval(activeSkill.id, true)} icon={<CheckSquare size={13} />}>
                Approve all
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setAllObligationsApproval(activeSkill.id, false)} icon={<Square size={13} />}>
                Clear all
              </Button>
            </div>
          </div>

          {rules.map(ob => {
            const isExpanded = expandedOb === ob.id;
            return (
              <div
                key={ob.id}
                className="glass-panel"
                style={{
                  borderColor: 'var(--border-edge)',
                  overflow: 'hidden',
                  transition: 'border-color 0.2s ease'
                }}
              >
                <div style={{ padding: '16px 20px', display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                  {/* Left accent */}
                  <div style={{
                    width: '3px',
                    alignSelf: 'stretch',
                    borderRadius: '2px',
                    background: ob.approved ? impactColor(ob.impact) : 'var(--border-highlight)',
                    flexShrink: 0,
                    minHeight: '24px',
                    transition: 'background 0.2s ease'
                  }} />

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' }}>
                      <Badge variant={impactBadge(ob.impact) as any}>{ob.impact}</Badge>
                      <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--text-dim)' }}>{ob.id}</span>
                      <span style={{ fontSize: '10px', color: 'var(--text-dim)', padding: '1px 6px', background: '#f2eee6', borderRadius: '99px' }}>
                        {ob.category}
                      </span>
                    </div>
                    <h3 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)', lineHeight: 1.4, letterSpacing: '-0.01em' }}>
                      {ob.summary}
                    </h3>

                    {isExpanded && (
                      <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div className="code-block" style={{ padding: '10px 14px' }}>
                          <div style={{ fontSize: '10px', color: 'var(--text-dim)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: 'var(--font-sans)' }}>
                            Check
                          </div>
                          <code style={{ fontSize: '12px' }}>{ob.mustHaveCheck}</code>
                        </div>
                        {ob.antiPattern && (
                          <div style={{ padding: '10px 14px', background: 'var(--status-fail-bg)', border: '2px solid var(--status-fail-border)', borderRadius: '8px' }}>
                            <div style={{ fontSize: '10px', color: 'var(--status-fail)', marginBottom: '4px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                              Bad example
                            </div>
                            <p style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{ob.antiPattern}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                    <button
                      onClick={() => setExpandedOb(isExpanded ? null : ob.id)}
                      className="btn btn-ghost btn-xs"
                      style={{ padding: '4px', color: 'var(--text-dim)' }}
                      aria-label={isExpanded ? 'Collapse' : 'Expand'}
                    >
                      {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                    <button
                      onClick={() => updateObligationStatus(activeSkill.id, ob.id, !ob.approved)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '5px',
                        padding: '5px 12px',
                        borderRadius: '7px',
                        fontSize: '11px',
                        fontWeight: 600,
                        border: `1px solid ${ob.approved ? impactColor(ob.impact) + '40' : 'var(--border-highlight)'}`,
                        background: ob.approved ? impactBackground(ob.impact) : '#ffffff',
                        color: ob.approved ? impactColor(ob.impact) : 'var(--text-muted)',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {ob.approved ? <><Check size={11} /> Approved</> : <><X size={11} /> Rejected</>}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          {rules.length > 0 && (
            <div style={{ paddingTop: '4px', display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                variant="primary"
                onClick={handleRun}
                loading={isSimulating}
                disabled={approvedCount === 0}
                icon={<ArrowRight size={13} />}
              >
                Run {approvedCount} approved rules
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Import Modal */}
      <Modal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        title="Add skill"
        footer={
          <div style={{ display: 'flex', gap: '10px' }}>
            <Button variant="secondary" onClick={() => setIsImportModalOpen(false)}>Cancel</Button>
              <Button variant="primary" onClick={() => void handleImport()} disabled={!importName || !importContent}>
              Parse & Import
            </Button>
          </div>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {importContent && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '10px 14px',
              background: 'var(--status-pass-bg)', border: '1px solid var(--status-pass-border)', borderRadius: '8px'
            }}>
              <AlertCircle size={14} style={{ color: 'var(--status-pass)', flexShrink: 0 }} />
              <span style={{ fontSize: '12px', color: 'var(--status-pass)' }}>
                Content loaded · {importContent.split('\n').length} lines
              </span>
            </div>
          )}
          <div>
            <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px', fontWeight: 500 }}>
              Skill Name
            </label>
            <input
              type="text"
              value={importName}
              onChange={e => setImportName(e.target.value)}
              className="input"
              placeholder="e.g. my-custom-skill"
            />
          </div>
          <div>
            <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px', fontWeight: 500 }}>
              SKILL.md Content
            </label>
            <textarea
              ref={textareaRef}
              value={importContent}
              onChange={e => setImportContent(e.target.value)}
              className="textarea"
              rows={10}
              style={{ fontFamily: 'var(--font-mono)', fontSize: '12px' }}
              placeholder={`---
name: my-skill
---

# My Skill

1. Always verify consent before destructive actions.
2. Use accessible color contrast ratios ≥ 4.5:1.`}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
};
