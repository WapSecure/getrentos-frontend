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

/** A saved reply the renter can drop into a conversation. */
export interface MessageTemplate {
  id: string;
  title: string;
  content: string;
  category?: string;
  useCount: number;
  createdAt: string;
}

/** A `/shortcut` that expands to a longer response while composing. */
export interface QuickReply {
  id: string;
  shortcut: string;
  response: string;
  createdAt: string;
}

/** A nudge to follow up on a conversation, at a calendar date and time. */
export interface MessageReminder {
  id: string;
  message: string;
  /** `yyyy-MM-dd` */
  date: string;
  /** `HH:mm` */
  time: string;
  active: boolean;
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

  toggleArchive: (conversationId: string) =>
    apiFetch<Conversation>(`/renter/messages/${conversationId}/archive`, { method: 'PATCH' }),

  /* ------------------------------ templates ----------------------------- */

  listTemplates: () => apiFetch<MessageTemplate[]>('/renter/messages/templates'),

  createTemplate: (input: { title: string; content: string; category?: string }) =>
    apiFetch<MessageTemplate>('/renter/messages/templates', { method: 'POST', body: input }),

  updateTemplate: (
    id: string,
    patch: Partial<Pick<MessageTemplate, 'title' | 'content' | 'category' | 'useCount'>>
  ) =>
    apiFetch<MessageTemplate>(`/renter/messages/templates/${id}`, {
      method: 'PATCH',
      body: patch,
    }),

  deleteTemplate: (id: string) =>
    apiFetch<void>(`/renter/messages/templates/${id}`, { method: 'DELETE' }),

  /* ---------------------------- quick replies --------------------------- */

  listQuickReplies: () => apiFetch<QuickReply[]>('/renter/messages/quick-replies'),

  createQuickReply: (input: { shortcut: string; response: string }) =>
    apiFetch<QuickReply>('/renter/messages/quick-replies', { method: 'POST', body: input }),

  updateQuickReply: (id: string, patch: Partial<Pick<QuickReply, 'shortcut' | 'response'>>) =>
    apiFetch<QuickReply>(`/renter/messages/quick-replies/${id}`, { method: 'PATCH', body: patch }),

  deleteQuickReply: (id: string) =>
    apiFetch<void>(`/renter/messages/quick-replies/${id}`, { method: 'DELETE' }),

  /* ------------------------------ reminders ----------------------------- */

  listReminders: () => apiFetch<MessageReminder[]>('/renter/messages/reminders'),

  createReminder: (input: { message: string; date: string; time: string }) =>
    apiFetch<MessageReminder>('/renter/messages/reminders', { method: 'POST', body: input }),

  toggleReminder: (id: string) =>
    apiFetch<MessageReminder>(`/renter/messages/reminders/${id}/toggle`, { method: 'PATCH' }),

  deleteReminder: (id: string) =>
    apiFetch<void>(`/renter/messages/reminders/${id}`, { method: 'DELETE' }),
};
