import React, { useEffect, useState } from 'react';
import { Check, RotateCcw, X } from 'lucide-react';
import { useWorkbench } from '../context/WorkbenchContext';
import { SkillRepairProposal } from '../types/repair';
import { TestRun } from '../types/run';
import { Button } from './common/Button';

interface RepairPanelProps {
  proposal: SkillRepairProposal;
  onCancel: () => void;
  onRerun: (run: TestRun) => void;
}

export const RepairPanel: React.FC<RepairPanelProps> = ({ proposal, onCancel, onRerun }) => {
  const { skills, runs, applySkillRevision, runEvaluation, isSimulating } = useWorkbench();
  const sourceRun = runs.find(run => run.id === proposal.sourceRunId);
  const skill = skills.find(item => item.id === proposal.skillId);
  const [draft, setDraft] = useState(proposal.proposedMarkdown);
  const [approved, setApproved] = useState(false);

  useEffect(() => {
    setDraft(proposal.proposedMarkdown);
    setApproved(false);
  }, [proposal.sourceRunId, proposal.proposedMarkdown]);

  if (!sourceRun || !skill) return null;

  const [savingApproval, setSavingApproval] = useState(false);

  const approve = async () => {
    if (!draft.trim()) return;
    setSavingApproval(true);
    try {
      await applySkillRevision(skill.id, draft);
      setApproved(true);
    } catch {
      // The workbench toast reports why the reviewed change could not be saved.
    } finally {
      setSavingApproval(false);
    }
  };

  const rerun = async () => {
    if (!approved) return;
    try {
      const result = await runEvaluation(skill.id, sourceRun.scenarioName, sourceRun.taskPrompt, sourceRun.id);
      onRerun(result);
    } catch {
      // The workbench shows provider and comparison errors in its notification area.
    }
  };

  return (
    <section className="glass-raised" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '14px', alignItems: 'flex-start' }}>
        <div>
          <h2 style={{ fontSize: '17px' }}>Review suggested change</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '12px', marginTop: '3px' }}>{skill.name} · run {sourceRun.id} · {sourceRun.provider} {sourceRun.model}</p>
        </div>
        <Button variant="ghost" size="sm" onClick={onCancel} icon={<X size={14} />}>Close</Button>
      </div>
      <p style={{ color: 'var(--text-sub)', fontSize: '13px' }}>{proposal.rationale}</p>
      {proposal.supportingEvidence.length > 0 && <div className="glass-panel" style={{ padding: '12px 16px' }}>
        <strong style={{ fontSize: '12px' }}>Evidence from the failed run</strong>
        <ul style={{ paddingLeft: '18px', marginTop: '6px', color: 'var(--text-muted)', fontSize: '12px' }}>
          {proposal.supportingEvidence.map((item, index) => <li key={`${index}-${item}`}>{item}</li>)}
        </ul>
      </div>}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: '12px' }}>
        <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px', fontWeight: 700 }}>
          Current skill text
          <textarea className="textarea" rows={14} value={proposal.originalMarkdown} readOnly style={{ fontFamily: 'var(--font-mono)', fontSize: '11px' }} />
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px', fontWeight: 700 }}>
          Suggested text · editable
          <textarea className="textarea" rows={14} value={draft} onChange={event => { setDraft(event.target.value); setApproved(false); }} maxLength={24000} style={{ fontFamily: 'var(--font-mono)', fontSize: '11px' }} />
        </label>
      </div>
      <p style={{ color: 'var(--text-dim)', fontSize: '11px' }}>Approval changes the workbench copy only. The selected model judges the rerun, so compare the response and evidence yourself.</p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
        {!approved ? <Button variant="primary" onClick={() => void approve()} loading={savingApproval} disabled={!draft.trim()} icon={<Check size={14} />}>Approve change</Button> : <Button variant="primary" onClick={() => void rerun()} loading={isSimulating} icon={<RotateCcw size={14} />}>Run same task again</Button>}
        {!approved && <Button variant="secondary" onClick={onCancel} icon={<X size={14} />}>Reject</Button>}
      </div>
    </section>
  );
};
