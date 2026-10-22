export type MutationType = 'weakened' | 'removed' | 'inverted';

export interface SkillMutation {
  id: string;
  skillId: string;
  skillName: string;
  targetObligationId: string;
  targetRuleName: string;
  mutationType: MutationType;
  originalClause: string;
  mutatedClause: string;
  behaviorChanged: boolean;
  regressionDetected: boolean;
  detectionConfidence: number;
  deterministicFailureLog: string;
  timestamp: string;
}
