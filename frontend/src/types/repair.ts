export interface SkillRepairProposal {
  sourceRunId: string;
  skillId: string;
  originalMarkdown: string;
  proposedMarkdown: string;
  rationale: string;
  supportingEvidence: string[];
}
