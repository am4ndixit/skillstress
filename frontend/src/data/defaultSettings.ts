import { ProviderConfig } from '../types/provider';

export interface AppSettings {
  provider: ProviderConfig;
  autoSaveToLocalStorage: boolean;
  deterministicSimulationSpeedMs: number;
}

export const DEFAULT_SETTINGS: AppSettings = {
  provider: {
    provider: 'ollama',
    endpoint: 'http://localhost:11434',
    model: 'qwen2.5-coder:7b',
    temperature: 0.2,
    timeoutSeconds: 15,
    status: 'idle'
  },
  autoSaveToLocalStorage: true,
  deterministicSimulationSpeedMs: 400
};
