import { apiFetch } from './client';

export type SupportThreadStatus = 'OPEN' | 'RESOLVED';

export const SUPPORT_CATEGORIES = [
  { value: 'payments', label: 'Payments & rent' },
  { value: 'property', label: 'Property & maintenance' },
  { value: 'account', label: 'Account & verification' },
  { value: 'lease', label: 'Lease & tenancy' },
  { value: 'other', label: 'Something else' },
] as const;

export interface SupportThread {
  id: string;
  status: SupportThreadStatus;
  source: string;
  category?: string | null;
  lastMessage?: string | null;
  lastMessageAt?: string | null;
  unreadCount: number;
  createdAt: string;
}

export interface SupportMessage {
  id: string;
  senderType: 'admin' | 'contact';
  text: string;
  createdAt: string;
}

export const supportApi = {
  listThreads: () => apiFetch<SupportThread[]>('/renter/support/threads'),

  createThread: (subject: string, category?: string) =>
    apiFetch<SupportThread>('/renter/support/threads', {
      method: 'POST',
      body: { subject, category },
    }),

  getMessages: (threadId: string) =>
    apiFetch<SupportMessage[]>(`/renter/support/threads/${threadId}/messages`),

  sendMessage: (threadId: string, text: string) =>
    apiFetch<SupportMessage>(`/renter/support/threads/${threadId}/messages`, {
      method: 'POST',
      body: { text },
    }),

  resolveThread: (threadId: string) =>
    apiFetch<SupportThread>(`/renter/support/threads/${threadId}/resolve`, { method: 'POST' }),
};
