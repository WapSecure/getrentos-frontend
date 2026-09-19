import { apiFetch } from './client';
import type { Paginated } from './buyer';

export interface BuyerConversation {
  id: string;
  propertyId?: string;
  propertyName?: string;
  participantId: string;
  participantName: string;
  participantRole: string;
  participantAvatar?: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  isPinned: boolean;
  isArchived: boolean;
}

export interface BuyerMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  text: string;
  timestamp: string;
  read: boolean;
}

export const buyerMessagesApi = {
  list: (page = 1, pageSize = 30) =>
    apiFetch<Paginated<BuyerConversation>>(
      `/buyer/messages/conversations?page=${page}&pageSize=${pageSize}`
    ),

  send: (conversationId: string, text: string) =>
    apiFetch<BuyerMessage>(`/buyer/messages/conversations/${conversationId}/messages`, {
      method: 'POST',
      body: { text },
    }),

  messages: (conversationId: string) =>
    apiFetch<BuyerMessage[]>(`/buyer/messages/conversations/${conversationId}/messages`),

  markRead: (conversationId: string) =>
    apiFetch<{ read: boolean }>(`/buyer/messages/conversations/${conversationId}/read`, {
      method: 'PATCH',
    }),

  togglePinned: (conversationId: string) =>
    apiFetch<{ isPinned: boolean }>(`/buyer/messages/conversations/${conversationId}/pin`, {
      method: 'PATCH',
    }),
};
