import { ScenarioStep } from './trace';

export type RunStatus = 'passed' | 'failed' | 'running' | 'cancelled';

export interface TestRun {
  id: string;
  skillId: string;
  skillName: string;
  scenarioName: string;
  status: RunStatus;
  startedAt: string;
  durationMs: number;
  totalAssertions: number;
  passedAssertions: number;
  failedAssertions: number;
  steps: ScenarioStep[];
  obligationCoveragePct: number;
  honestNotice?: string;
  provider?: 'openai' | 'ollama' | 'mock';
  model?: string;
  providerEndpoint?: string;
  taskPrompt?: string;
  evaluatedObligationIds?: string[];
  skillVersion?: string;
  skillMarkdown?: string;
  comparisonRunId?: string;
}
