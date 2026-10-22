export interface MockToolCall {
  id: string;
  toolName: string;
  timestamp: string;
  durationMs: number;
  inputPayload: Record<string, unknown>;
  outputPayload: Record<string, unknown>;
  status: 'success' | 'error' | 'intercepted';
}

export interface AssertionResult {
  id: string;
  name: string;
  obligationId: string;
  expected: string;
  actual: string;
  passed: boolean;
  errorDetail?: string;
}

export interface StepEvidence {
  type: 'fs-state' | 'sql-intercept' | 'dom-snapshot' | 'terminal-log' | 'diff';
  title: string;
  content: string;
  format?: 'json' | 'sql' | 'diff' | 'text';
}

export interface ScenarioStep {
  stepNumber: number;
  name: string;
  description: string;
  status: 'passed' | 'failed' | 'running' | 'pending';
  toolCalls: MockToolCall[];
  assertions: AssertionResult[];
  evidence: StepEvidence[];
}
