import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Skill } from '../types/skill';
import { TestRun } from '../types/run';
import { AppSettings, DEFAULT_SETTINGS } from '../data/defaultSettings';
import { INITIAL_SKILLS } from '../data/sampleSkills';
import { INITIAL_RUNS } from '../data/sampleRuns';
import { SkillRepairProposal } from '../types/repair';
import { checkBackendHealth } from '../api/health';
import { createRepairProposal, executeRun, listRuns } from '../api/runs';
import { checkProviderStatus } from '../api/provider';
import { importSkill as importSkillRequest, listSkills, removeSkill, saveSkill, setObligationApproval } from '../api/skills';

export interface ToastMessage {
  id: string;
  type: 'success' | 'info' | 'warn' | 'error';
  message: string;
}

interface WorkbenchContextType {
  skills: Skill[];
  runs: TestRun[];
  settings: AppSettings;
  activeSkill: Skill | null;
  backendOnline: boolean;
  toasts: ToastMessage[];
  isSimulating: boolean;
  setActiveSkillId: (id: string) => void;
  importSkill: (name: string, rawMarkdown: string, description?: string) => Promise<Skill>;
  updateObligationStatus: (skillId: string, obligationId: string, approved: boolean) => void;
  applySkillRevision: (skillId: string, revisedMarkdown: string) => Promise<void>;
  setAllObligationsApproval: (skillId: string, approved: boolean) => void;
  deleteSkill: (id: string) => void;
  runEvaluation: (skillId: string, scenarioName?: string, taskPrompt?: string, comparisonRunId?: string) => Promise<TestRun>;
  requestRepairProposal: (runId: string) => Promise<SkillRepairProposal>;
  updateSettings: (newSettings: Partial<AppSettings>) => void;
  testProviderConnection: (config?: Partial<AppSettings['provider']>) => Promise<void>;
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

  const [backendOnline, setBackendOnline] = useState<boolean>(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);

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
      setBackendOnline(await checkBackendHealth());
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
        const [serverSkills, serverRuns] = await Promise.all([listSkills(), listRuns()]);
        if (cancelled) return;
        const knownIds = new Set(serverSkills.map(skill => skill.id));
        const localCustomSkills = skills.filter(skill => !skill.isBuiltin && !knownIds.has(skill.id));
        setSkills([...serverSkills, ...localCustomSkills]);
        setRuns(serverRuns);
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
        localStorage.setItem(`${STORAGE_KEY_PREFIX}settings`, JSON.stringify(settings));
      } catch (err) {
        console.warn('LocalStorage error:', err);
      }
    }
  }, [skills, runs, settings]);

  const activeSkill = skills.find(s => s.id === activeSkillId) || skills[0] || null;
  const importSkill = async (name: string, rawMarkdown: string, description?: string): Promise<Skill> => {
    let newSkill: Skill;
    try {
      newSkill = await importSkillRequest({ name, rawMarkdown, description });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Skill import failed.';
      addToast('error', message);
      throw error;
    }
    setSkills(prev => [newSkill, ...prev.filter(skill => skill.id !== newSkill.id)]);
    setActiveSkillId(newSkill.id);
    addToast('success', `Imported ${newSkill.name} with ${newSkill.obligations.length} rules.`);
    return newSkill;
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
    void setObligationApproval(skillId, obligationId, approved)
      .then(saved => {
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
    void saveSkill(updated).then(saved => {
      setSkills(prev => prev.map(skill => skill.id === saved.id ? saved : skill));
    }).catch(error => addToast('error', error instanceof Error ? error.message : 'Could not save rule approvals.'));
    addToast('info', `${approved ? 'Approved' : 'Rejected'} all rules for testing.`);
  };

  const applySkillRevision = async (skillId: string, revisedMarkdown: string) => {
    const current = skills.find(skill => skill.id === skillId);
    if (!current) throw new Error('The skill being repaired is no longer available.');
    const [major, minor, patch] = current.version.split('.').map(part => Number.parseInt(part, 10) || 0);
    const revised = { ...current, rawMarkdown: revisedMarkdown, version: `${major}.${minor}.${patch + 1}` };
    const saved = await saveSkill(revised);
    setSkills(prev => prev.map(skill => skill.id === saved.id ? saved : skill));
    addToast('success', 'Approved revision applied to the workbench copy. No source file was overwritten.');
  };

  const deleteSkill = (id: string) => {
    void removeSkill(id).then(() => {
      const remaining = skills.filter(skill => skill.id !== id);
      setSkills(remaining);
      if (activeSkillId === id) setActiveSkillId(remaining[0]?.id || '');
      addToast('success', 'Skill removed from the workbench.');
    }).catch(error => addToast('error', error instanceof Error ? error.message : 'Could not remove skill.'));
  };

  const runEvaluation = async (skillId: string, scenarioName?: string, taskPrompt?: string, comparisonRunId?: string): Promise<TestRun> => {
    setIsSimulating(true);

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
      const newRun = await executeRun({
        skillId: targetSkill.id,
        skill: targetSkill,
        provider: selectedProvider,
        model: selectedModel,
        endpoint: selectedEndpoint,
        scenarioName: effectiveScenario,
        taskPrompt: effectivePrompt,
        comparisonRunId
      });
      setRuns(prev => [newRun, ...prev]);
      addToast(newRun.status === 'passed' ? 'success' : 'error', `${newRun.provider}/${newRun.model}: ${newRun.passedAssertions}/${newRun.totalAssertions} assertions in ${newRun.durationMs}ms`);
      return newRun;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Evaluation request failed.';
      addToast('error', message);
      throw error;
    } finally {
      setIsSimulating(false);
    }
  };

  const requestRepairProposal = async (runId: string): Promise<SkillRepairProposal> => {
    const run = runs.find(item => item.id === runId);
    const skill = run && skills.find(item => item.id === run.skillId);
    if (!run || !skill) throw new Error('Run or associated skill is not available in this workbench.');
    return createRepairProposal(runId, skill);
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
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    try {
      const controller = new AbortController();
      timeoutId = setTimeout(() => controller.abort(), 12000);

      const data = await checkProviderStatus(selected.provider, selected.endpoint, selected.model, controller.signal);

      const latencyMs = Date.now() - startTime;
      const models = data.models || [];
      setSettings(prev => ({
        ...prev,
        provider: {
          ...selected,
          status: data.status,
          latencyMs: data.latencyMs ?? latencyMs,
          lastCheckedAt: new Date().toISOString(),
          errorMessage: data.errorMessage,
          models
        }
      }));
      if (data.status === 'connected') addToast('success', `${selected.provider} connected. Model: ${selected.model}${data.latencyMs ? ` (${data.latencyMs}ms)` : ''}`);
      else addToast('error', data.errorMessage || `${selected.provider} is not ready.`);
    } catch {
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
    } finally {
      if (timeoutId) clearTimeout(timeoutId);
    }
  };

  return (
    <WorkbenchContext.Provider
      value={{
        skills,
        runs,
        settings,
        activeSkill,
        backendOnline,
        toasts,
        isSimulating,
        setActiveSkillId,
        importSkill,
        updateObligationStatus,
        setAllObligationsApproval,
        applySkillRevision,
        deleteSkill,
        runEvaluation,
        requestRepairProposal,
        updateSettings,
        testProviderConnection,
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
