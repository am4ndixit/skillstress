import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Play, Code2, Search, Tag, Star, Trash2 } from 'lucide-react';
import { useWorkbench } from '../context/WorkbenchContext';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { Skill } from '../types/skill';

export const SkillLibraryPage: React.FC = () => {
  const navigate = useNavigate();
  const { skills, activeSkill, setActiveSkillId, deleteSkill } = useWorkbench();
  const [search, setSearch] = useState('');
  const [viewSkill, setViewSkill] = useState<Skill | null>(null);

  const filtered = skills.filter(
    s => s.name.toLowerCase().includes(search.toLowerCase()) ||
         s.description.toLowerCase().includes(search.toLowerCase()) ||
         (s.tags || []).some(t => t.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }} className="animate-fade-up">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <BookOpen size={22} style={{ color: 'var(--cyan-400)' }} />
            Skills
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Browse and manage registered agent skill definitions. {skills.length} skill{skills.length !== 1 ? 's' : ''} loaded.
          </p>
        </div>
        <div style={{ position: 'relative' }}>
          <Search size={14} style={{
            position: 'absolute', left: '10px', top: '50%',
            transform: 'translateY(-50%)', color: 'var(--text-dim)', pointerEvents: 'none'
          }} />
          <input
            type="search"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search skills, tags…"
            className="input"
            style={{ width: '240px', paddingLeft: '32px', height: '36px', fontSize: '12px' }}
          />
        </div>
      </div>

      {/* Skills grid */}
      {filtered.length === 0 ? (
        <div className="glass-panel" style={{ padding: '48px', textAlign: 'center' }}>
          <BookOpen size={32} style={{ color: 'var(--text-dim)', margin: '0 auto 12px' }} />
          <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-muted)' }}>No skills found</p>
          <p style={{ fontSize: '12px', color: 'var(--text-dim)', marginTop: '4px' }}>
            {search ? `No results for "${search}".` : 'Import a SKILL.md in Test to get started.'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '18px' }}>
          {filtered.map(skill => {
            const isActive = activeSkill?.id === skill.id;
            const approvedCount = skill.obligations.filter(o => o.approved).length;
            const coveragePct = skill.obligations.length > 0
              ? Math.round((approvedCount / skill.obligations.length) * 100) : 0;

            return (
              <div
                key={skill.id}
                className={isActive ? 'glass-raised' : 'glass-panel'}
                style={{
                  padding: '20px',
                  borderColor: isActive ? 'rgba(6,182,212,0.35)' : undefined,
                  display: 'flex', flexDirection: 'column', gap: '16px',
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                {/* Active indicator glow */}
                {isActive && (
                  <div style={{
                    position: 'absolute', top: 0, left: 0, right: 0, height: '2px',
                    background: 'var(--cyan-400)'
                  }} />
                )}

                {/* Top row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
                      {isActive && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', color: 'var(--cyan-400)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                          <Star size={10} /> Active
                        </div>
                      )}
                      <Badge variant="violet">v{skill.version}</Badge>
                      {(skill.isBuiltin) && <Badge variant="muted">built-in</Badge>}
                    </div>
                    <h2 className="truncate" style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
                      {skill.name}
                    </h2>
                  </div>
                </div>

                <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                  {skill.description}
                </p>

                {/* Tags */}
                {skill.tags && skill.tags.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                    {skill.tags.map(t => (
                      <span key={t} style={{
                        display: 'inline-flex', alignItems: 'center', gap: '3px',
                        padding: '2px 7px', borderRadius: '7px', fontSize: '10px',
                        background: 'var(--bg-surface)', border: '1px solid var(--border-edge)', boxShadow: 'var(--shadow-inset)',
                        color: 'var(--text-dim)'
                      }}>
                        <Tag size={8} /> {t}
                      </span>
                    ))}
                  </div>
                )}

                {/* Rules coverage */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
                      {approvedCount}/{skill.obligations.length} rules approved
                    </span>
                    <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', fontWeight: 700 }}>
                      {coveragePct}%
                    </span>
                  </div>
                  <div className="progress-bar-track">
                    <div className="progress-bar-fill" style={{ width: `${coveragePct}%` }} />
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '8px' }}>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setViewSkill(skill)}
                    icon={<Code2 size={13} />}
                    style={{ flex: 1 }}
                  >
                    View Markdown
                  </Button>
                  <Button
                    variant={isActive ? 'primary' : 'secondary'}
                    size="sm"
                    onClick={() => { setActiveSkillId(skill.id); navigate('/lab'); }}
                    icon={<Play size={13} />}
                    style={{ flex: 1 }}
                  >
                    {isActive ? 'Go to Test' : 'Activate'}
                  </Button>
                  {!skill.isBuiltin && (
                    <button
                      onClick={() => deleteSkill(skill.id)}
                      className="btn btn-ghost btn-sm"
                      style={{ padding: '6px', color: 'var(--status-fail)', opacity: 0.6 }}
                      title="Remove skill"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Markdown viewer modal */}
      {viewSkill && (
        <Modal isOpen={true} onClose={() => setViewSkill(null)} title={`SKILL.md — ${viewSkill.name}`}>
          <div className="code-block" style={{ maxHeight: '440px', overflowY: 'auto' }}>
            <pre style={{ fontSize: '12px', color: 'var(--cyan-300)', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
              {viewSkill.rawMarkdown}
            </pre>
          </div>
        </Modal>
      )}
    </div>
  );
};
