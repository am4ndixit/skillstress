import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FileClock, CheckCircle2, XCircle, ChevronDown, ChevronUp, Terminal, Code2, Wrench } from 'lucide-react';
import { useWorkbench } from '../context/WorkbenchContext';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { RepairPanel } from '../components/RepairPanel';
import { SkillRepairProposal } from '../types/repair';

export const HistoryPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { runs, requestRepairProposal, addToast } = useWorkbench();
  const initialRunId = (location.state as { runId?: string })?.runId || runs[0]?.id;
  const [selectedRunId, setSelectedRunId] = useState<string>(initialRunId || '');
  const [expandedSteps, setExpandedSteps] = useState<Set<number>>(new Set([1]));
  const [requestingRepair, setRequestingRepair] = useState(false);
  const [repairProposal, setRepairProposal] = useState<SkillRepairProposal | null>(null);

  useEffect(() => {
    const requestedId = (location.state as { runId?: string } | null)?.runId;
    if (requestedId) setSelectedRunId(requestedId);
  }, [location.key, location.state]);

  useEffect(() => {
    if (!selectedRunId && runs.length > 0) setSelectedRunId(runs[0].id);
  }, [runs, selectedRunId]);

  const run = runs.find(r => r.id === selectedRunId) || runs[0];

  const toggleStep = (n: number) => {
    setExpandedSteps(prev => {
      const next = new Set(prev);
      if (next.has(n)) next.delete(n);
      else next.add(n);
      return next;
    });
  };

  if (!run) {
    return (
      <div className="glass-panel" style={{ padding: '48px', textAlign: 'center' }}>
        <FileClock size={32} style={{ color: 'var(--text-dim)', margin: '0 auto 12px' }} />
        <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-muted)' }}>No history yet</p>
        <p style={{ fontSize: '12px', color: 'var(--text-dim)', marginTop: '4px' }}>
          Run a test to see its result here.
        </p>
        <Button variant="primary" onClick={() => navigate('/lab')} style={{ marginTop: '14px' }}>Go to Test</Button>
      </div>
    );
  }

  const coveragePct = Math.round((run.passedAssertions / run.totalAssertions) * 100);
  const baseline = run.comparisonRunId ? runs.find(item => item.id === run.comparisonRunId) : undefined;
  const resultsByObligation = (item: typeof run) => new Map(
    item.steps.flatMap(step => step.assertions.map(assertion => [assertion.obligationId, assertion.passed] as const))
  );
  const currentResults = resultsByObligation(run);
  const baselineResults = baseline ? resultsByObligation(baseline) : new Map<string, boolean>();
  const newlyPassing = baseline ? [...currentResults].filter(([id, passed]) => passed && baselineResults.get(id) === false).map(([id]) => id) : [];
  const regressions = baseline ? [...currentResults].filter(([id, passed]) => !passed && baselineResults.get(id) === true).map(([id]) => id) : [];
  const repairAvailable = run.status === 'failed' && (run.provider === 'openai' || run.provider === 'ollama');

  const proposeRepair = async () => {
    setRequestingRepair(true);
    try {
      const repairProposal = await requestRepairProposal(run.id);
      setRepairProposal(repairProposal);
    } catch (error) {
      addToast('error', error instanceof Error ? error.message : 'Could not request a repair proposal.');
    } finally {
      setRequestingRepair(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }} className="animate-fade-up">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FileClock size={22} style={{ color: 'var(--cyan-400)' }} />
            History
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Past tests, answers, and results.
          </p>
        </div>
        <select
          value={selectedRunId}
          onChange={e => setSelectedRunId(e.target.value)}
          className="select"
          aria-label="Choose a test"
          style={{ width: 'auto', minWidth: '240px', fontSize: '12px' }}
        >
          {runs.map(r => (
            <option key={r.id} value={r.id}>{r.id} — {r.skillName}</option>
          ))}
        </select>
      </div>

      {/* Run overview card */}
      <div className="glass-raised" style={{
        padding: '20px',
        borderColor: 'var(--border-edge)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <Badge variant={run.status === 'passed' ? 'pass' : 'fail'}>
                {run.status === 'passed'
                  ? <><CheckCircle2 size={11} /> PASSED</>
                  : <><XCircle size={11} /> FAILED</>}
              </Badge>
              <code style={{ fontSize: '11px', color: 'var(--cyan-400)', fontFamily: 'var(--font-mono)' }}>
                {run.id}
              </code>
              <Badge variant="info">{run.provider || 'unknown'}{run.model ? ` · ${run.model}` : ''}</Badge>
            </div>
            <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
              {run.scenarioName}
            </h2>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '3px' }}>
              Skill: <code style={{ color: 'var(--cyan-400)' }}>{run.skillName}</code>
            </p>
            {run.taskPrompt && <p style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '5px', maxWidth: '620px' }}>Task: {run.taskPrompt}</p>}
          </div>
          <div style={{ display: 'flex', gap: '24px', textAlign: 'right' }}>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginBottom: '2px' }}>Duration</div>
              <div style={{ fontSize: '18px', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--text-main)' }}>
                {run.durationMs}ms
              </div>
            </div>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginBottom: '2px' }}>Success rate</div>
              <div style={{ fontSize: '18px', fontWeight: 800, fontFamily: 'var(--font-mono)', color: coveragePct >= 80 ? 'var(--status-pass)' : 'var(--status-warn)' }}>
                {coveragePct}%
              </div>
            </div>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginBottom: '2px' }}>Passed</div>
              <div style={{ fontSize: '18px', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--text-main)' }}>
                {run.passedAssertions}/{run.totalAssertions}
              </div>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '10px', marginTop: '14px', alignItems: 'center', flexWrap: 'wrap' }}>
          {repairAvailable && !repairProposal && <Button variant="secondary" onClick={() => void proposeRepair()} loading={requestingRepair} icon={<Wrench size={13} />}>Suggest a fix</Button>}
          {run.honestNotice && <span style={{ color: 'var(--text-dim)', fontSize: '11px', flex: 1 }}>{run.honestNotice}</span>}
        </div>
      </div>

      {repairProposal && <RepairPanel
        proposal={repairProposal}
        onCancel={() => setRepairProposal(null)}
        onRerun={result => { setSelectedRunId(result.id); setRepairProposal(null); setExpandedSteps(new Set([1])); }}
      />}

      {run.comparisonRunId && <section className="glass-panel" style={{ padding: '18px' }}>
        <h2 style={{ fontSize: '14px', marginBottom: '6px' }}>Before and after</h2>
        {baseline ? <>
          <p style={{ color: 'var(--text-sub)', fontSize: '12px' }}>
            Before <code>{baseline.id}</code>: {baseline.passedAssertions}/{baseline.totalAssertions} passed. After <code>{run.id}</code>: {run.passedAssertions}/{run.totalAssertions} passed. Both used the same model, task, and rules with the reviewed skill text.
          </p>
          <p style={{ color: 'var(--text-dim)', fontSize: '11px', marginTop: '5px' }}>The same model checked both answers. Review the answers and quotes; this score is not independent proof.</p>
          <div style={{ display: 'flex', gap: '18px', marginTop: '12px', fontSize: '12px' }}>
            <span style={{ color: 'var(--status-pass)' }}>Now pass: {newlyPassing.length ? newlyPassing.join(', ') : 'none'}</span>
            <span style={{ color: 'var(--status-fail)' }}>Now fail: {regressions.length ? regressions.join(', ') : 'none'}</span>
          </div>
        </> : <p style={{ color: 'var(--status-warn)', fontSize: '12px' }}>Cannot compare: baseline run <code>{run.comparisonRunId}</code> is unavailable in this browser history.</p>}
      </section>}

      {/* Steps */}
      {run.steps.map(step => {
        const isOpen = expandedSteps.has(step.stepNumber);
        const stepPassed = step.assertions.every(a => a.passed);
        return (
          <div key={step.stepNumber} className="glass-panel" style={{ overflow: 'hidden' }}>
            {/* Step header */}
            <button
              onClick={() => toggleStep(step.stepNumber)}
              style={{
                width: '100%', background: 'none', border: 'none', cursor: 'pointer',
                padding: '16px 20px',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                textAlign: 'left', color: 'var(--text-main)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '28px', height: '28px', borderRadius: '7px', flexShrink: 0,
                  background: stepPassed ? 'var(--status-pass-bg)' : 'var(--status-fail-bg)',
                  border: `1px solid ${stepPassed ? 'var(--status-pass-border)' : 'var(--status-fail-border)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '11px', fontWeight: 800, fontFamily: 'var(--font-mono)',
                  color: stepPassed ? 'var(--status-pass)' : 'var(--status-fail)'
                }}>
                  {step.stepNumber}
                </div>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 700, letterSpacing: '-0.02em' }}>
                    {step.name}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
                    {step.assertions.length} rule checks · {step.toolCalls?.length || 0} {run.provider === 'mock' ? 'mock calls' : 'model requests'}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Badge variant={stepPassed ? 'pass' : 'fail'}>
                  {step.assertions.filter(a => a.passed).length}/{step.assertions.length}
                </Badge>
                {isOpen ? <ChevronUp size={16} style={{ color: 'var(--text-dim)' }} /> : <ChevronDown size={16} style={{ color: 'var(--text-dim)' }} />}
              </div>
            </button>

            {isOpen && (
              <div style={{ padding: '0 20px 20px', display: 'flex', flexDirection: 'column', gap: '14px', borderTop: '1px solid var(--border-edge)' }}>
                {/* Tool calls */}
                {step.toolCalls && step.toolCalls.length > 0 && (
                  <div style={{ marginTop: '14px' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <Terminal size={11} /> {run.provider === 'mock' ? 'Mock Calls' : 'Model Requests'}
                    </div>
                    {step.toolCalls.map(tc => (
                      <div key={tc.id} className="code-block" style={{ marginBottom: '8px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                          <span style={{ color: 'var(--violet-300)', fontWeight: 700 }}>{tc.toolName}()</span>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <Badge variant={tc.status === 'success' ? 'pass' : 'warn'}>{tc.status}</Badge>
                            <span style={{ fontSize: '10px', color: 'var(--text-dim)' }}>{tc.durationMs}ms</span>
                          </div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '11px' }}>
                          <div>
                            <div style={{ color: 'var(--text-dim)', marginBottom: '2px' }}>Input:</div>
                            <pre style={{ color: 'var(--cyan-300)', margin: 0 }}>{JSON.stringify(tc.inputPayload, null, 1)}</pre>
                          </div>
                          <div>
                            <div style={{ color: 'var(--text-dim)', marginBottom: '2px' }}>Output:</div>
                            <pre style={{ color: 'var(--status-pass)', margin: 0 }}>{JSON.stringify(tc.outputPayload, null, 1)}</pre>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Assertions */}
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <Code2 size={11} /> Rule checks
                  </div>
                  {step.assertions.map(a => (
                    <div
                      key={a.id}
                      style={{
                        padding: '10px 14px',
                        borderRadius: '8px',
                        background: a.passed ? 'var(--status-pass-bg)' : 'var(--status-fail-bg)',
                        border: `1px solid ${a.passed ? 'var(--status-pass-border)' : 'var(--status-fail-border)'}`,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        gap: '12px',
                        marginBottom: '8px'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', flex: 1 }}>
                        {a.passed
                          ? <CheckCircle2 size={14} style={{ color: 'var(--status-pass)', flexShrink: 0, marginTop: '1px' }} />
                          : <XCircle     size={14} style={{ color: 'var(--status-fail)', flexShrink: 0, marginTop: '1px' }} />}
                        <div>
                          <div style={{ fontSize: '13px', color: 'var(--text-main)', fontWeight: 500, lineHeight: 1.4 }}>{a.name}</div>
                          {a.errorDetail && (
                            <div style={{ fontSize: '11px', color: 'var(--status-fail)', marginTop: '3px', fontFamily: 'var(--font-mono)' }}>
                              {a.errorDetail}
                            </div>
                          )}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div style={{ fontSize: '10px', color: 'var(--text-dim)', marginBottom: '1px' }}>Actual</div>
                        <code style={{
                          fontSize: '11px',
                          color: a.passed ? 'var(--status-pass)' : 'var(--status-fail)',
                          fontFamily: 'var(--font-mono)'
                        }}>
                          {a.actual}
                        </code>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Evidence */}
                {step.evidence && step.evidence.length > 0 && (
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '8px' }}>
                      Answer excerpts
                    </div>
                    {step.evidence.map((ev, idx) => (
                      <div key={idx} className="code-block" style={{ marginBottom: '8px' }}>
                        <div style={{ fontSize: '10px', color: 'var(--text-dim)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.07em', fontFamily: 'var(--font-sans)', display: 'flex', justifyContent: 'space-between' }}>
                          <span>{ev.title}</span>
                          <span>{ev.format}</span>
                        </div>
                        <pre style={{ fontSize: '11px', color: 'var(--cyan-300)', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                          {ev.content}
                        </pre>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
