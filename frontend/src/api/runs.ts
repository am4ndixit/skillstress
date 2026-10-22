import { SkillRepairProposal } from '../types/repair';
import { TestRun } from '../types/run';
import { Skill } from '../types/skill';
import { jsonBody, requestJson } from './request';

export interface ExecuteRunRequest {
  skillId: string;
  skill: Skill;
  provider: 'openai' | 'ollama';
  model: string;
  endpoint: string;
  scenarioName: string;
  taskPrompt: string;
  comparisonRunId?: string;
}

export async function listRuns(): Promise<TestRun[]> {
  return requestJson<TestRun[]>('/api/runs');
}

export async function executeRun(input: ExecuteRunRequest): Promise<TestRun> {
  return requestJson<TestRun>('/api/runs/execute', jsonBody('POST', input));
}

export async function createRepairProposal(runId: string, skill: Skill): Promise<SkillRepairProposal> {
  return requestJson<SkillRepairProposal>(
    `/api/runs/${encodeURIComponent(runId)}/repair-proposal`,
    jsonBody('POST', { skill })
  );
}
