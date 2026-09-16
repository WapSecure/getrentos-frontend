import { apiFetch, apiUpload } from './client';
import { appendFile, type PickedFile } from './documents';
import type { Paginated } from './properties';

export interface MessageAttachment {
  name: string;
  type: string;
  url: string;
  size: string;
}

export type ParticipantRole = 'renter' | 'landlord' | 'agent';

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderRole: ParticipantRole;
  text: string;
  timestamp: string;
  read: boolean;
  attachments?: MessageAttachment[];
}

export interface Conversation {
  id: string;
  propertyId?: string;
  propertyName?: string;
  propertyImage?: string;
  participantId: string;
  participantName: string;
  participantRole: ParticipantRole;
  participantAvatar?: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  isPinned: boolean;
  isArchived: boolean;
  messages: Message[];
}

export const messagesApi = {
  list: (page = 1, pageSize = 30) =>
    apiFetch<Paginated<Conversation>>(`/renter/messages?page=${page}&pageSize=${pageSize}`),

  start: (participantId: string, propertyId?: string) =>
    apiFetch<Conversation>('/renter/messages', {
      method: 'POST',
      body: { participantId, propertyId },
    }),

  send: (conversationId: string, text: string, attachment?: PickedFile) => {
    const form = new FormData();
    if (text) form.append('text', text);
    if (attachment) appendFile(form, 'files', attachment);
    return apiUpload<Conversation>(`/renter/messages/${conversationId}/messages`, form);
  },

  markRead: (conversationId: string) =>
    apiFetch<Conversation>(`/renter/messages/${conversationId}/read`, { method: 'PATCH' }),

  togglePin: (conversationId: string) =>
    apiFetch<Conversation>(`/renter/messages/${conversationId}/pin`, { method: 'PATCH' }),
};
