import { apiFetch } from './client';

export interface OfficeMessage {
  id: string;
  body: string;
  fromOffice: boolean;
  senderName: string;
  createdAt: string;
}

export interface ResidentOfficeThread {
  estateName: string;
  messages: OfficeMessage[];
}

export interface OfficeThreadSummary {
  id: string;
  householdId: string;
  unitLabel: string;
  residentName?: string;
  lastMessagePreview?: string;
  lastMessageAt: string;
  lastFromOffice: boolean;
  unread: boolean;
}

export interface OfficeThread {
  id: string;
  unitLabel: string;
  residentName?: string;
  messages: OfficeMessage[];
}

export const residentOfficeApi = {
  thread: () => apiFetch<ResidentOfficeThread>('/estate/resident/office-messages'),
  send: (body: string) =>
    apiFetch<OfficeMessage>('/estate/resident/office-messages', { method: 'POST', body: { body } }),
};

export const estateOfficeApi = {
  threads: (estateId: string) =>
    apiFetch<OfficeThreadSummary[]>(`/estate/${encodeURIComponent(estateId)}/resident-messages`),
  thread: (estateId: string, threadId: string) =>
    apiFetch<OfficeThread>(
      `/estate/${encodeURIComponent(estateId)}/resident-messages/${encodeURIComponent(threadId)}`
    ),
  reply: (estateId: string, threadId: string, body: string) =>
    apiFetch<OfficeMessage>(
      `/estate/${encodeURIComponent(estateId)}/resident-messages/${encodeURIComponent(threadId)}`,
      { method: 'POST', body: { body } }
    ),
};
