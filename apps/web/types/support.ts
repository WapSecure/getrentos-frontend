export interface SupportThread {
  id: string;
  status: 'OPEN' | 'RESOLVED';
  source: string;
  category: string | null;
  lastMessage: string | null;
  lastMessageAt: string | null;
  unreadCount: number;
  createdAt: string;
}

export interface SupportMessage {
  id: string;
  senderType: 'admin' | 'contact';
  text: string;
  createdAt: string;
}
