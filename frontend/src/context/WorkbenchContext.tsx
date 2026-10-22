import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Skill } from '../types/skill';
import { TestRun } from '../types/run';
import { SkillMutation } from '../types/mutation';
import { AppSettings, DEFAULT_SETTINGS } from '../data/defaultSettings';
import { INITIAL_SKILLS } from '../data/sampleSkills';
import { INITIAL_RUNS } from '../data/sampleRuns';
import { INITIAL_MUTATIONS } from '../data/sampleMutations';
import { SkillRepairProposal } from '../types/repair';

export interface ToastMessage {
  id: string;
  type: 'success' | 'info' | 'warn' | 'error';
  message: string;
}

interface WorkbenchContextType {
  skills: Skill[];
  runs: TestRun[];
  mutations: SkillMutation[];
  settings: AppSettings;
  activeSkill: Skill | null;
  activeRun: TestRun | null;
  backendOnline: boolean;
  toasts: ToastMessage[];
  isSimulating: boolean;
  simulationStepIndex: number;
  setActiveSkillId: (id: string) => void;
  setActiveRunId: (id: string) => void;
  importSkill: (name: string, rawMarkdown: string, description?: string) => Promise<Skill>;
  loadSkillPreset: (presetKey: 'ui-ux' | 'data-loss' | 'schema') => void;
  updateObligationStatus: (skillId: string, obligationId: string, approved: boolean) => void;
  applySkillRevision: (skillId: string, revisedMarkdown: string) => Promise<void>;
  setAllObligationsApproval: (skillId: string, approved: boolean) => void;
  deleteSkill: (id: string) => void;
  runEvaluation: (skillId: string, scenarioName?: string, taskPrompt?: string, comparisonRunId?: string) => Promise<TestRun>;
  requestRepairProposal: (runId: string) => Promise<SkillRepairProposal>;
  runMutationCheck: (mutationId: string) => Promise<void>;
  runAllMutations: () => Promise<void>;
  updateSettings: (newSettings: Partial<AppSettings>) => void;
  testProviderConnection: (config?: Partial<AppSettings['provider']>) => Promise<void>;
  resetToSampleData: () => void;
  dismissToast: (id: string) => void;
  addToast: (type: 'success' | 'info' | 'warn' | 'error', message: string) => void;
}

// A new namespace starts with honest empty run history; previous local browser data remains untouched.
const STORAGE_KEY_PREFIX = 'skillstress_workbench_v3_';

const WorkbenchContext = createContext<WorkbenchContextType | undefined>(undefined);

export const WorkbenchProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [skills, setSkills] = useState<Skill[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}skills`);
      return saved ? JSON.parse(saved) : INITIAL_SKILLS;
    } catch {
      return INITIAL_SKILLS;
    }
  });

  const [runs, setRuns] = useState<TestRun[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}runs`);
      return saved ? JSON.parse(saved) : INITIAL_RUNS;
    } catch {
      return INITIAL_RUNS;
    }
  });

  const [mutations, setMutations] = useState<SkillMutation[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}mutations`);
      return saved ? JSON.parse(saved) : INITIAL_MUTATIONS;
    } catch {
      return INITIAL_MUTATIONS;
    }
  });

  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}settings`);
      if (!saved) return DEFAULT_SETTINGS;
      const parsed = JSON.parse(saved) as Partial<AppSettings>;
      return {
        ...DEFAULT_SETTINGS,
        ...parsed,
        provider: { ...DEFAULT_SETTINGS.provider, ...(parsed.provider || {}) }
      };
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

  const [activeSkillId, setActiveSkillId] = useState<string>(() => {
    return skills[0]?.id || 'skill-ui-ux-pro-max';
  });

  const [activeRunId, setActiveRunId] = useState<string>(() => {
    return runs[0]?.id || '';
  });

  const [backendOnline, setBackendOnline] = useState<boolean>(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [simulationStepIndex, setSimulationStepIndex] = useState<number>(0);

  const addToast = (type: 'success' | 'info' | 'warn' | 'error', message: string) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    setToasts(prev => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  const dismissToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Check backend health periodically
  useEffect(() => {
    const checkBackend = async () => {
      try {
        const res = await fetch('/api/health');
        setBackendOnline(res.ok);
      } catch {
        setBackendOnline(false);
      }
    };
    checkBackend();
    const interval = setInterval(checkBackend, 15000);
    return () => clearInterval(interval);
  }, []);

  // The API is authoritative when available. Browser storage remains a useful offline view.
  useEffect(() => {
    let cancelled = false;
    const hydrateFromApi = async () => {
      try {
        const [skillsResponse, runsResponse] = await Promise.all([
          fetch('/api/skills'),
          fetch('/api/runs')
        ]);
        if (!skillsResponse.ok || !runsResponse.ok) return;
        const [serverSkills, serverRuns] = await Promise.all([
          skillsResponse.json() as Promise<Skill[]>,
          runsResponse.json() as Promise<TestRun[]>
        ]);
        if (cancelled) return;
        const knownIds = new Set(serverSkills.map(skill => skill.id));
        const localCustomSkills = skills.filter(skill => !skill.isBuiltin && !knownIds.has(skill.id));
        setSkills([...serverSkills, ...localCustomSkills]);
        setRuns(serverRuns);
        setActiveRunId(serverRuns[0]?.id || '');
      } catch {
        // Keep the saved workbench state visible while the API is unavailable.
      }
    };
    void hydrateFromApi();
    return () => { cancelled = true; };
  }, []);

  // Save to LocalStorage
  useEffect(() => {
    if (settings.autoSaveToLocalStorage) {
      try {
        localStorage.setItem(`${STORAGE_KEY_PREFIX}skills`, JSON.stringify(skills));
        localStorage.setItem(`${STORAGE_KEY_PREFIX}runs`, JSON.stringify(runs));
        localStorage.setItem(`${STORAGE_KEY_PREFIX}mutations`, JSON.stringify(mutations));
        localStorage.setItem(`${STORAGE_KEY_PREFIX}settings`, JSON.stringify(settings));
      } catch (err) {
        console.warn('LocalStorage error:', err);
      }
    }
  }, [skills, runs, mutations, settings]);

  const activeSkill = skills.find(s => s.id === activeSkillId) || skills[0] || null;
  const activeRun = runs.find(r => r.id === activeRunId) || runs[0] || null;

  const importSkill = async (name: string, rawMarkdown: string, description?: string): Promise<Skill> => {
    const response = await fetch('/api/skills/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, rawMarkdown, description })
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      const message = typeof payload.detail === 'string' ? payload.detail : `Skill import failed (HTTP ${response.status}).`;
      addToast('error', message);
      throw new Error(message);
    }
    const newSkill = payload as Skill;
    setSkills(prev => [newSkill, ...prev.filter(skill => skill.id !== newSkill.id)]);
    setActiveSkillId(newSkill.id);
    addToast('success', `Imported ${newSkill.name} with ${newSkill.obligations.length} rules.`);
    return newSkill;
  };

  const loadSkillPreset = (presetKey: 'ui-ux' | 'data-loss' | 'schema') => {
    if (presetKey === 'ui-ux') {
      const s = INITIAL_SKILLS.find(x => x.name === 'ui-ux-pro-max');
      if (s) { setActiveSkillId(s.id); addToast('info', 'Loaded UI/UX Pro Max preset'); }
    } else if (presetKey === 'data-loss') {
      const s = INITIAL_SKILLS.find(x => x.name === 'accidental-data-loss-prevention');
      if (s) { setActiveSkillId(s.id); addToast('info', 'Loaded Data Loss Prevention preset'); }
    } else {
      void importSkill('schema-mapping-v2', '# Schema Mapping Contract\n1. Generate Mapping Manifesto for >3 tables.\n2. Verify nullability on primary keys.\n3. Halt on implicit column type coercions.');
    }
  };

  const updateObligationStatus = (skillId: string, obligationId: string, approved: boolean) => {
    setSkills(prev => prev.map(s => {
      if (s.id !== skillId) return s;
      const changed = {
        ...s,
        obligations: s.obligations.map(ob => {
          if (ob.id !== obligationId) return ob;
          return { ...ob, approved };
        })
      };
      return changed;
    }));
    void fetch(`/api/skills/${encodeURIComponent(skillId)}/obligations/${encodeURIComponent(obligationId)}?approved=${approved}`, { method: 'PATCH' })
      .then(async response => {
        if (!response.ok) throw new Error(`Could not save rule approval (HTTP ${response.status}).`);
        const saved = await response.json() as Skill;
        setSkills(prev => prev.map(skill => skill.id === saved.id ? saved : skill));
      })
      .catch(error => addToast('error', error instanceof Error ? error.message : 'Could not save rule approval.'));
  };

  const setAllObligationsApproval = (skillId: string, approved: boolean) => {
    const current = skills.find(skill => skill.id === skillId);
    if (!current) return;
    const updated = { ...current, obligations: current.obligations.map(ob => ({ ...ob, approved })) };
    setSkills(prev => prev.map(s => {
      if (s.id !== skillId) return s;
      return updated;
    }));
    void fetch(`/api/skills/${encodeURIComponent(skillId)}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updated)
    }).then(async response => {
      if (!response.ok) throw new Error(`Could not save rule approvals (HTTP ${response.status}).`);
      const saved = await response.json() as Skill;
      setSkills(prev => prev.map(skill => skill.id === saved.id ? saved : skill));
    }).catch(error => addToast('error', error instanceof Error ? error.message : 'Could not save rule approvals.'));
    addToast('info', `${approved ? 'Approved' : 'Rejected'} all rules for testing.`);
  };

  const applySkillRevision = async (skillId: string, revisedMarkdown: string) => {
    const current = skills.find(skill => skill.id === skillId);
    if (!current) throw new Error('The skill being repaired is no longer available.');
    const [major, minor, patch] = current.version.split('.').map(part => Number.parseInt(part, 10) || 0);
    const revised = { ...current, rawMarkdown: revisedMarkdown, version: `${major}.${minor}.${patch + 1}` };
    const response = await fetch(`/api/skills/${encodeURIComponent(skillId)}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(revised)
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(typeof payload.detail === 'string' ? payload.detail : `Could not save the approved repair (HTTP ${response.status}).`);
    const saved = payload as Skill;
    setSkills(prev => prev.map(skill => skill.id === saved.id ? saved : skill));
    addToast('success', 'Approved revision applied to the workbench copy. No source file was overwritten.');
  };

  const deleteSkill = (id: string) => {
    void fetch(`/api/skills/${encodeURIComponent(id)}`, { method: 'DELETE' }).then(async response => {
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(typeof payload.detail === 'string' ? payload.detail : `Could not remove skill (HTTP ${response.status}).`);
      const remaining = skills.filter(skill => skill.id !== id);
      setSkills(remaining);
      if (activeSkillId === id) setActiveSkillId(remaining[0]?.id || '');
      addToast('success', 'Skill removed from the workbench.');
    }).catch(error => addToast('error', error instanceof Error ? error.message : 'Could not remove skill.'));
  };

  const runEvaluation = async (skillId: string, scenarioName?: string, taskPrompt?: string, comparisonRunId?: string): Promise<TestRun> => {
    setIsSimulating(true);
    setSimulationStepIndex(1);

    try {
      const targetSkill = skills.find(s => s.id === skillId) || activeSkill || skills[0];
      if (!targetSkill) throw new Error('Select a skill before starting an evaluation.');
      const baseline = comparisonRunId ? runs.find(run => run.id === comparisonRunId) : undefined;
      if (comparisonRunId && !baseline) throw new Error('The original run is unavailable in local history; cannot compare safely.');
      if (comparisonRunId && (!baseline?.provider || baseline.provider === 'mock' || !baseline.model)) {
        throw new Error('Only a provider-backed run can be rerun for a measured comparison.');
      }
      const selectedProvider = baseline?.provider === 'openai' || baseline?.provider === 'ollama' ? baseline.provider : settings.provider.provider;
      const selectedModel = baseline?.model || settings.provider.model;
      const selectedEndpoint = baseline?.providerEndpoint || settings.provider.endpoint;
      const effectiveScenario = scenarioName || baseline?.scenarioName || `${targetSkill.name} test`;
      const effectivePrompt = taskPrompt || baseline?.taskPrompt || 'Describe how you would complete a representative task while following the skill instructions.';
      const response = await fetch('/api/runs/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          skillId: targetSkill.id,
          skill: targetSkill,
          provider: selectedProvider,
          model: selectedModel,
          endpoint: selectedEndpoint,
          scenarioName: effectiveScenario,
          taskPrompt: effectivePrompt,
          comparisonRunId
        })
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        const detail = typeof payload.detail === 'string' ? payload.detail : `Evaluation failed (HTTP ${response.status}).`;
        throw new Error(detail);
      }
      const newRun = payload as TestRun;
      setRuns(prev => [newRun, ...prev]);
      setActiveRunId(newRun.id);
      addToast(newRun.status === 'passed' ? 'success' : 'error', `${newRun.provider}/${newRun.model}: ${newRun.passedAssertions}/${newRun.totalAssertions} assertions in ${newRun.durationMs}ms`);
      return newRun;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Evaluation request failed.';
      addToast('error', message);
      throw error;
    } finally {
      setIsSimulating(false);
      setSimulationStepIndex(0);
    }
  };

  const requestRepairProposal = async (runId: string): Promise<SkillRepairProposal> => {
    const run = runs.find(item => item.id === runId);
    const skill = run && skills.find(item => item.id === run.skillId);
    if (!run || !skill) throw new Error('Run or associated skill is not available in this workbench.');
    const response = await fetch(`/api/runs/${encodeURIComponent(runId)}/repair-proposal`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ skill })
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(typeof payload.detail === 'string' ? payload.detail : `Repair proposal failed (HTTP ${response.status}).`);
    return payload as SkillRepairProposal;
  };

  const runMutationCheck = async (mutationId: string) => {
    void mutationId;
    addToast('info', 'Mutation runs are unavailable until a mutation suite can be executed and measured.');
  };

  const runAllMutations = async () => {
    addToast('info', 'Mutation runs are unavailable until a mutation suite can be executed and measured.');
  };

  const updateSettings = (newSettings: Partial<AppSettings>) => {
    setSettings(prev => ({
      ...prev,
      ...newSettings,
      provider: {
        ...prev.provider,
        ...(newSettings.provider || {})
      }
    }));
    addToast('info', 'Preferences updated successfully');
  };

  const testProviderConnection = async (config: Partial<AppSettings['provider']> = {}) => {
    const selected = { ...settings.provider, ...config };
    setSettings(prev => ({
      ...prev,
      provider: { ...prev.provider, status: 'checking', errorMessage: undefined }
    }));

    const startTime = Date.now();
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000);

      const query = new URLSearchParams({ provider: selected.provider, endpoint: selected.endpoint, model: selected.model });
      const res = await fetch(`/api/provider/status?${query}`, { method: 'GET', signal: controller.signal });
      clearTimeout(timeoutId);

      const latencyMs = Date.now() - startTime;
    if (res.ok) {
        const data = await res.json().catch(() => ({}));
      const models = (data.models || []).map((m: unknown) => typeof m === 'string' ? m : (m as { name?: string; model?: string }).name || (m as { model?: string }).model).filter(Boolean);
        setSettings(prev => ({
          ...prev,
          provider: {
            ...selected,
            status: data.status || 'connected',
            latencyMs: data.latencyMs ?? latencyMs,
            lastCheckedAt: new Date().toISOString(),
            errorMessage: data.errorMessage,
            models
          }
        }));
        if (data.status === 'connected') addToast('success', `${selected.provider} connected. Model: ${selected.model}${data.latencyMs ? ` (${data.latencyMs}ms)` : ''}`);
        else addToast('error', data.errorMessage || `${selected.provider} is not ready.`);
      } else {
        setSettings(prev => ({
          ...prev,
          provider: {
            ...selected,
            status: 'error',
            latencyMs,
            errorMessage: `${selected.provider} status request failed (HTTP ${res.status})`
          }
        }));
        addToast('warn', `${selected.provider} status check failed (HTTP ${res.status})`);
      }
    } catch (err: unknown) {
      const latencyMs = Date.now() - startTime;
      setSettings(prev => ({
        ...prev,
        provider: {
          ...prev.provider,
          status: 'disconnected',
          latencyMs,
          errorMessage: selected.provider === 'ollama'
            ? 'Cannot connect to Ollama. Ensure `ollama serve` is running.'
            : 'Cannot reach the backend. Start the SkillStress backend and try again.'
        }
      }));
      addToast('error', selected.provider === 'ollama' ? 'Ollama is offline.' : 'Backend is unavailable.');
    }
  };

  const resetToSampleData = () => {
    setSkills(INITIAL_SKILLS);
    setRuns(INITIAL_RUNS);
    setMutations(INITIAL_MUTATIONS);
    setSettings(DEFAULT_SETTINGS);
    setActiveSkillId(INITIAL_SKILLS[0].id);
    setActiveRunId(INITIAL_RUNS[0]?.id || '');
    addToast('info', 'Reset this workbench to its initial skills.');
  };

  return (
    <WorkbenchContext.Provider
      value={{
        skills,
        runs,
        mutations,
        settings,
        activeSkill,
        activeRun,
        backendOnline,
        toasts,
        isSimulating,
        simulationStepIndex,
        setActiveSkillId,
        setActiveRunId,
        importSkill,
        loadSkillPreset,
        updateObligationStatus,
        setAllObligationsApproval,
        applySkillRevision,
        deleteSkill,
        runEvaluation,
        requestRepairProposal,
        runMutationCheck,
        runAllMutations,
        updateSettings,
        testProviderConnection,
        resetToSampleData,
        dismissToast,
        addToast
      }}
    >
      {children}
    </WorkbenchContext.Provider>
  );
};

export const useWorkbench = () => {
  const context = useContext(WorkbenchContext);
  if (!context) throw new Error('useWorkbench must be used within WorkbenchProvider');
  return context;
};
