'use client';

import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { ConversationList, type Conversation } from '@/components/agent/messages/ConversationList';
import { MessageThread, type ThreadMessage } from '@/components/agent/messages/MessageThread';
import { cn } from '@/lib/cn';

const mockConversations: Conversation[] = [
  {
    id: 'conv_001',
    participantName: 'GetRentos Dispatch',
    participantRole: 'Dispatcher',
    lastMessage: 'New inspection assigned for Ocean View Towers.',
    lastMessageTime: '2026-08-08T09:20:00.000Z',
    unreadCount: 1,
  },
  {
    id: 'conv_002',
    participantName: 'Adaeze Okafor',
    participantRole: 'Client',
    lastMessage: 'Please let me know once the tenant verification is done.',
    lastMessageTime: '2026-08-07T16:00:00.000Z',
    unreadCount: 0,
  },
  {
    id: 'conv_003',
    participantName: 'GetRentos Support',
    participantRole: 'Support',
    lastMessage: 'Your offline sync completed successfully.',
    lastMessageTime: '2026-08-07T18:00:00.000Z',
    unreadCount: 0,
  },
];

const mockMessages: Record<string, ThreadMessage[]> = {
  conv_001: [
    {
      id: 'm1',
      senderId: 'contact',
      text: 'New inspection assigned for Ocean View Towers.',
      timestamp: '2026-08-08T09:20:00.000Z',
      read: false,
    },
  ],
  conv_002: [
    {
      id: 'm1',
      senderId: 'agent',
      text: 'On my way to verify the tenant now.',
      timestamp: '2026-08-07T15:50:00.000Z',
      read: true,
    },
    {
      id: 'm2',
      senderId: 'contact',
      text: 'Please let me know once the tenant verification is done.',
      timestamp: '2026-08-07T16:00:00.000Z',
      read: true,
    },
  ],
  conv_003: [
    {
      id: 'm1',
      senderId: 'contact',
      text: 'Your offline sync completed successfully.',
      timestamp: '2026-08-07T18:00:00.000Z',
      read: true,
    },
  ],
};

export default function AgentMessagesPage() {
  const [conversations, setConversations] = useState<Conversation[]>(mockConversations);
  const [messagesByConversation, setMessagesByConversation] =
    useState<Record<string, ThreadMessage[]>>(mockMessages);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const handleSelect = (id: string) => {
    setActiveId(id);
    setConversations((prev) => prev.map((c) => (c.id === id ? { ...c, unreadCount: 0 } : c)));
    setMessagesByConversation((prev) => ({
      ...prev,
      [id]: (prev[id] || []).map((m) => ({ ...m, read: true })),
    }));
  };

  const handleSend = (text: string) => {
    if (!activeId) return;
    const newMessage: ThreadMessage = {
      id: `m_${Date.now()}`,
      senderId: 'agent',
      text,
      timestamp: new Date().toISOString(),
      read: false,
    };
    setMessagesByConversation((prev) => ({
      ...prev,
      [activeId]: [...(prev[activeId] || []), newMessage],
    }));
    setConversations((prev) =>
      prev.map((c) =>
        c.id === activeId ? { ...c, lastMessage: text, lastMessageTime: newMessage.timestamp } : c
      )
    );
  };

  const filteredConversations = conversations.filter((c) =>
    c.participantName.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const activeConversation = conversations.find((c) => c.id === activeId);

  return (
    <div className="h-[calc(100vh-8rem)]">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Messages</h1>
        <p className="text-muted-foreground mt-1">
          Communicate with dispatch, clients, and support
        </p>
      </div>

      <div className="flex gap-4 h-[calc(100%-4.5rem)]">
        <div className={cn(activeId ? 'hidden sm:flex' : 'flex', 'w-full sm:w-auto')}>
          <ConversationList
            conversations={filteredConversations}
            activeId={activeId}
            searchQuery={searchQuery}
            onSearch={setSearchQuery}
            onSelect={handleSelect}
          />
        </div>

        <div className={cn(activeId ? 'flex' : 'hidden sm:flex', 'flex-1 flex-col')}>
          {activeConversation ? (
            <>
              <button
                onClick={() => setActiveId(null)}
                className="sm:hidden flex items-center gap-1.5 text-sm text-muted-foreground mb-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to conversations
              </button>
              <MessageThread
                contactName={activeConversation.participantName}
                contactRole={activeConversation.participantRole}
                messages={messagesByConversation[activeConversation.id] || []}
                onSend={handleSend}
              />
            </>
          ) : (
            <div className="flex-1 bg-card border border-border rounded-lg flex items-center justify-center">
              <p className="text-sm text-muted-foreground">
                Select a conversation to start messaging
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
