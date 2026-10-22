export type ObligationCategory =
  | 'accessibility'
  | 'touch-interaction'
  | 'performance'
  | 'style-selection'
  | 'layout-responsive'
  | 'typography-color'
  | 'animation'
  | 'forms-feedback'
  | 'navigation'
  | 'data-loss-prevention'
  | 'schema-integrity'
  | 'general-rule';

export type ObligationImpact = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export interface InstructionObligation {
  id: string;
  category: ObligationCategory;
  impact: ObligationImpact;
  summary: string;
  sourceText: string;
  mustHaveCheck: string;
  antiPattern: string;
  approved: boolean;
  notes?: string;
}
