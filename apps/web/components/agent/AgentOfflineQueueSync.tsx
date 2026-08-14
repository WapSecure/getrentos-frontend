'use client';

import { useEffect } from 'react';
import { agentOfflineQueue, replayAgentOfflineQueue, type AgentOfflineOperation } from '@/lib/agentOfflineQueue';
import { agentService } from '@/services/agentService';
import { listAgentBinaryOperations, removeAgentBinaryOperation } from '@/lib/agentBinaryQueue';

async function dispatch(item: AgentOfflineOperation) {
  const payload = item.payload as any;
  if (item.type === 'inspection') await agentService.submitInspection(payload);
  if (item.type === 'verification') await agentService.submitVerification(payload);
  if (item.type === 'document') await agentService.uploadDocument(payload);
  if (item.type === 'message') await agentService.sendMessage(payload.id, payload.text, payload.files || []);
}

export function AgentOfflineQueueSync() {
  useEffect(() => { const sync = async () => { await replayAgentOfflineQueue(dispatch); for (const item of await listAgentBinaryOperations()) { try { if (item.type === 'document') await agentService.uploadDocument({ ...(item.payload as { name: string; category: string }), file: item.files[0] }); if (item.type === 'message') await agentService.sendMessage((item.payload as { id: string }).id, (item.payload as { text: string }).text, item.files); await removeAgentBinaryOperation(item.id); } catch { break; } } }; void sync(); window.addEventListener('online', sync); return () => window.removeEventListener('online', sync); }, []);
  return null;
}
