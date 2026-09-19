import { apiFetch } from './client';

export interface AgentSyncItem {
  id: string;
  recordType: 'inspection' | 'verification';
  recordLabel: string;
  capturedAt: string;
  syncStatus: 'pending' | 'failed' | 'synced';
}

export const agentSyncApi = {
  list: () => apiFetch<AgentSyncItem[]>('/agent/sync'),
};
