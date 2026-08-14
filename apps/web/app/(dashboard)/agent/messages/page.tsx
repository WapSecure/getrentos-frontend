'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import { ConversationList, type Conversation } from '@/components/agent/messages/ConversationList';
import { MessageThread, type ThreadMessage } from '@/components/agent/messages/MessageThread';
import { cn } from '@/lib/cn';
import { agentKeys } from '@/lib/queryKeys';
import { agentService } from '@/services/agentService';
import { unwrap } from '@/lib/apiHelpers';

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
  const queryClient = useQueryClient();
  const { data: conversationApi = [] } = useQuery({
    queryKey: agentKeys.conversations,
    queryFn: () => unwrap(agentService.listConversations()),
  });
  const conversations: Conversation[] = conversationApi.map((item) => ({
    id: item.id,
    participantName: item.client.legalName || 'Client',
    participantRole: 'Client',
    lastMessage: item.lastMessage || '',
    lastMessageTime: item.lastMessageAt || new Date().toISOString(),
    unreadCount: 0,
  }));
  const [activeId, setActiveId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const { data: messageApi = [] } = useQuery({
    queryKey: agentKeys.conversationMessages(activeId || 'none'),
    queryFn: () => unwrap(agentService.getMessages(activeId!)),
    enabled: Boolean(activeId),
  });
  const messages: ThreadMessage[] = messageApi.map((item) => ({
    id: item.id,
    senderId: item.senderId === 'agent' ? 'agent' : 'contact',
    text: item.text,
    timestamp: item.createdAt,
    read: item.read,
  }));
  const send = useMutation({
    mutationFn: (text: string) => unwrap(agentService.sendMessage(activeId!, text)),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: agentKeys.conversationMessages(activeId || 'none'),
      });
      queryClient.invalidateQueries({ queryKey: agentKeys.conversations });
    },
  });

  const handleSelect = (id: string) => {
    setActiveId(id);
  };

  const handleSend = (text: string) => {
    if (!activeId) return;
    send.mutate(text);
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
                messages={messages}
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
