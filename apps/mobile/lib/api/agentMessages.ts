import { apiFetch, apiUpload } from './client';
import { appendFile, type PickedFile } from './documents';
import type { Paginated } from './properties';

export interface AgentConversation {
  id: string;
  propertyId?: string | null;
  participantAId: string;
  participantBId: string;
  lastMessage?: string | null;
  lastMessageAt?: string | null;
  createdAt: string;
  client: { id: string; legalName: string };
}

export interface AgentMessageAttachment {
  id: string;
  name: string;
  mimeType: string;
  sizeBytes: number;
}

export interface AgentMessage {
  id: string;
  conversationId: string;
  senderId: string;
  text: string;
  read: boolean;
  createdAt: string;
  sender: { id: string; legalName: string };
  attachments: AgentMessageAttachment[];
}

function toQuery(params: Record<string, string | number | undefined>): string {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === '') continue;
    q.set(k, String(v));
  }
  const s = q.toString();
  return s ? `?${s}` : '';
}

export const agentMessagesApi = {
  list: (page = 1, pageSize = 30, search?: string) =>
    apiFetch<Paginated<AgentConversation>>(`/agent/messages${toQuery({ page, pageSize, search })}`),

  start: (clientId: string, propertyId?: string) =>
    apiFetch<AgentConversation>('/agent/messages', {
      method: 'POST',
      body: { clientId, propertyId },
    }),

  messages: (conversationId: string) =>
    apiFetch<AgentMessage[]>(`/agent/messages/${conversationId}`),

  send: (conversationId: string, text: string, attachment?: PickedFile) => {
    const form = new FormData();
    if (text) form.append('text', text);
    if (attachment) appendFile(form, 'files', attachment);
    return apiUpload<AgentMessage>(`/agent/messages/${conversationId}`, form);
  },
};
