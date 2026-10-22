import { Skill } from '../types/skill';
import { jsonBody, requestJson } from './request';

export interface SkillImportRequest {
  name: string;
  rawMarkdown: string;
  description?: string;
}

export async function listSkills(): Promise<Skill[]> {
  return requestJson<Skill[]>('/api/skills');
}

export async function importSkill(input: SkillImportRequest): Promise<Skill> {
  return requestJson<Skill>('/api/skills/import', jsonBody('POST', input));
}

export async function saveSkill(skill: Skill): Promise<Skill> {
  return requestJson<Skill>(`/api/skills/${encodeURIComponent(skill.id)}`, jsonBody('PUT', skill));
}

export async function setObligationApproval(
  skillId: string,
  obligationId: string,
  approved: boolean
): Promise<Skill> {
  const query = new URLSearchParams({ approved: String(approved) });
  return requestJson<Skill>(
    `/api/skills/${encodeURIComponent(skillId)}/obligations/${encodeURIComponent(obligationId)}?${query}`,
    { method: 'PATCH' }
  );
}

export async function removeSkill(skillId: string): Promise<void> {
  await requestJson<{ deleted: boolean; id: string }>(`/api/skills/${encodeURIComponent(skillId)}`, { method: 'DELETE' });
}
