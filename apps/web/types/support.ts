export interface SupportThread {
  id: string;
  status: 'OPEN' | 'RESOLVED';
  source: string;
  category: string | null;
  lastMessage: string | null;
  lastMessageAt: string | null;
  /** Platform replies not yet read by the customer. */
  unreadCount: number;
  createdAt: string;
}

export interface SupportMessage {
  id: string;
  senderType: 'admin' | 'contact';
  text: string;
  createdAt: string;
}
