export type ProviderStatus = 'idle' | 'checking' | 'connected' | 'disconnected' | 'error';

export interface ProviderConfig {
  provider: 'openai' | 'ollama';
  endpoint: string;
  model: string;
  temperature: number;
  timeoutSeconds: number;
  status: ProviderStatus;
  lastCheckedAt?: string;
  latencyMs?: number;
  errorMessage?: string;
  models?: string[];
}
