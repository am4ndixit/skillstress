import { requestJson } from './request';

interface HealthStatus {
  status: 'healthy' | 'unavailable';
}

export async function checkBackendHealth(): Promise<boolean> {
  try {
    const health = await requestJson<HealthStatus>('/api/health');
    return health.status === 'healthy';
  } catch {
    return false;
  }
}
