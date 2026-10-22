import { InstructionObligation } from './obligation';

export interface Skill {
  id: string;
  name: string;
  version: string;
  description: string;
  tags: string[];
  rawMarkdown: string;
  obligations: InstructionObligation[];
  importedAt: string;
  isBuiltin: boolean;
  path?: string;
}
