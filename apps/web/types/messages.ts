export interface Attachment {
  name: string;
  type: string;
  url: string;
  size: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderRole: 'renter' | 'landlord' | 'agent';
  text: string;
  timestamp: string;
  read: boolean;
  attachments?: Attachment[];
}

export interface Conversation {
  id: string;
  propertyId?: string;
  propertyName?: string;
  propertyImage?: string;
  participantId: string;
  participantName: string;
  participantRole: 'renter' | 'landlord' | 'agent';
  participantAvatar?: string;
  lastMessage?: string;
  lastMessageTime: string;
  unreadCount: number;
  isPinned: boolean;
  isArchived: boolean;
  messages?: Message[];
}

export interface Reminder {
  id: string;
  message: string;
  date: string;
  time: string;
  active: boolean;
}

export interface ReminderData {
  message: string;
  date: string;
  time: string;
}

export interface FilterState {
  type: string;
  property: string;
  sortBy: string;
}
