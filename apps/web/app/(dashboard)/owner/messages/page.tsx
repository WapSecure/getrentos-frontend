'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import { ConversationList, type Conversation } from '@/components/owner/messages/ConversationList';
import { MessageThread, type ThreadMessage } from '@/components/owner/messages/MessageThread';
import { cn } from '@/lib/cn';
import { ownerService, type OwnerConversation, type OwnerMessage } from '@/services/ownerService';
import { ownerKeys } from '@/lib/queryKeys';
import { unwrap } from '@/lib/apiHelpers';

const roleLabel = (role: string): Conversation['participantRole'] => {
  if (role === 'realtor') return 'Realtor';
  if (role === 'buyer') return 'Buyer';
  return 'Support';
};

const toConversation = (c: OwnerConversation): Conversation => ({
  id: c.id,
  participantName: c.participantName,
  participantRole: roleLabel(c.participantRole),
  lastMessage: c.lastMessage,
  lastMessageTime: c.lastMessageTime,
  unreadCount: c.unreadCount,
});

const toThreadMessage = (m: OwnerMessage): ThreadMessage => ({
  id: m.id,
  senderId: m.senderRole === 'owner' ? 'owner' : 'contact',
  text: m.text,
  timestamp: m.timestamp,
  read: m.read,
});

export default function OwnerMessagesPage() {
  const queryClient = useQueryClient();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const { data: conversations = [] } = useQuery({
    queryKey: ownerKeys.conversations,
    queryFn: () => unwrap(ownerService.listConversations()),
  });

  const { data: activeMessages = [] } = useQuery({
    queryKey: ownerKeys.messages(activeId ?? ''),
    queryFn: () => unwrap(ownerService.listMessages(activeId!)),
    enabled: !!activeId,
  });

  const sendMutation = useMutation({
    mutationFn: ({ conversationId, text }: { conversationId: string; text: string }) =>
      unwrap(ownerService.sendMessage(conversationId, text)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ownerKeys.conversations });
      queryClient.invalidateQueries({ queryKey: ownerKeys.messages(activeId ?? '') });
    },
  });

  const markReadMutation = useMutation({
    mutationFn: (conversationId: string) =>
      unwrap(ownerService.markConversationRead(conversationId)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ownerKeys.conversations }),
  });

  const handleSelect = (id: string) => {
    setActiveId(id);
    const conv = conversations.find((c) => c.id === id);
    if (conv && conv.unreadCount > 0) markReadMutation.mutate(id);
  };

  const handleSend = (text: string) => {
    if (!activeId) return;
    sendMutation.mutate({ conversationId: activeId, text });
  };

  const filteredConversations = conversations
    .map(toConversation)
    .filter((c) => c.participantName.toLowerCase().includes(searchQuery.toLowerCase()));
  const activeConversation = conversations.find((c) => c.id === activeId);
  const threadMessages: ThreadMessage[] = activeMessages.map(toThreadMessage);

  return (
    <div className="h-[calc(100vh-8rem)]">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Messages</h1>
        <p className="text-muted-foreground mt-1">Communicate with buyers, realtors, and support</p>
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
                messages={threadMessages}
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
