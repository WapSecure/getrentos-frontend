'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import {
  ConversationList,
  type Conversation,
} from '@/components/realtor/messages/ConversationList';
import { MessageThread, type ThreadMessage } from '@/components/realtor/messages/MessageThread';
import { cn } from '@/lib/cn';
import { unwrap } from '@/lib/apiHelpers';
import { realtorKeys } from '@/lib/queryKeys';
import { realtorService } from '@/services/realtorService';

export default function RealtorMessagesPage() {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const queryClient = useQueryClient();
  const { data: conversations = [] } = useQuery({
    queryKey: realtorKeys.conversations,
    queryFn: async () => {
      const items = (await unwrap(realtorService.listConversations())) as Array<{
        id: string;
        client: { legalName: string };
        lastMessage: string | null;
        lastMessageAt: string | null;
        unreadCount: number;
      }>;
      return items.map(
        (item): Conversation => ({
          id: item.id,
          participantName: item.client.legalName,
          participantRole: 'Client',
          lastMessage: item.lastMessage || '',
          lastMessageTime: item.lastMessageAt || '',
          unreadCount: item.unreadCount,
        })
      );
    },
  });
  const { data: messages = [] } = useQuery({
    enabled: !!activeId,
    queryKey: realtorKeys.conversationMessages(activeId || ''),
    queryFn: async () => {
      const items = (await unwrap(realtorService.getConversationMessages(activeId!))) as Array<{
        id: string;
        senderType: 'realtor' | 'contact';
        text: string;
        createdAt: string;
        read: boolean;
      }>;
      return items.map(
        (item): ThreadMessage => ({
          id: item.id,
          senderId: item.senderType,
          text: item.text,
          timestamp: item.createdAt,
          read: item.read,
        })
      );
    },
  });
  const send = useMutation({
    mutationFn: ({ text, files }: { text: string; files: File[] }) =>
      unwrap(realtorService.sendMessage(activeId!, text, files)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: realtorKeys.conversationMessages(activeId || '') });
      queryClient.invalidateQueries({ queryKey: realtorKeys.conversations });
    },
  });
  const filteredConversations = conversations.filter((conversation) =>
    conversation.participantName.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const activeConversation = conversations.find((conversation) => conversation.id === activeId);

  return (
    <div className="h-[calc(100vh-8rem)]">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Messages</h1>
        <p className="text-muted-foreground mt-1">Communicate securely with active clients</p>
      </div>
      <div className="flex gap-4 h-[calc(100%-4.5rem)]">
        <div className={cn(activeId ? 'hidden sm:flex' : 'flex', 'w-full sm:w-auto')}>
          <ConversationList
            conversations={filteredConversations}
            activeId={activeId}
            searchQuery={searchQuery}
            onSearch={setSearchQuery}
            onSelect={setActiveId}
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
                onSend={(text, files) => send.mutate({ text, files })}
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
