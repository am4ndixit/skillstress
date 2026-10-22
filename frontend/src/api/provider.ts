import { ProviderConfig } from '../types/provider';
import { requestJson } from './request';

export async function checkProviderStatus(
  provider: ProviderConfig['provider'],
  endpoint: string,
  model: string,
  signal?: AbortSignal
): Promise<ProviderConfig> {
  const query = new URLSearchParams({ provider, endpoint, model });
  return requestJson<ProviderConfig>(`/api/provider/status?${query}`, { signal });
}
