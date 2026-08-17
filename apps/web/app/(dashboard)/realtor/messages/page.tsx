'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';
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
import { Toast, type ToastVariant } from '@getrentos/ui';

function RealtorMessagesPageContent() {
  const searchParams = useSearchParams();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [toast, setToast] = useState<{ message: string; variant: ToastVariant } | null>(null);
  const handledClientRef = useRef<string | null>(null);
  const queryClient = useQueryClient();
  const { data: conversations = [], isLoading: conversationsLoading } = useQuery({
    queryKey: realtorKeys.conversations,
    queryFn: async () => {
      const items = (await unwrap(realtorService.listConversations())) as Array<{
        id: string;
        client: { id: string; legalName: string };
        lastMessage: string | null;
        lastMessageAt: string | null;
        unreadCount: number;
      }>;
      return items.map(
        (item): Conversation => ({
          id: item.id,
          clientId: item.client.id,
          participantName: item.client.legalName,
          participantRole: 'Client',
          lastMessage: item.lastMessage || '',
          lastMessageTime: item.lastMessageAt || '',
          unreadCount: item.unreadCount,
        })
      );
    },
  });

  // Open (or start) the conversation for a client the user navigated from,
  // e.g. the "Message" button on the Clients page (?client=<id>).
  const startConversation = useMutation({
    mutationFn: (clientId: string) => unwrap(realtorService.startConversation(clientId)),
    onSuccess: (conversation) => {
      queryClient.invalidateQueries({ queryKey: realtorKeys.conversations });
      setActiveId(conversation.id);
    },
    onError: (error) =>
      setToast({
        message: error.message || 'Unable to open a conversation with this client.',
        variant: 'error',
      }),
  });

  useEffect(() => {
    const clientId = searchParams.get('client');
    if (!clientId || conversationsLoading) return;
    if (handledClientRef.current === clientId) return;
    handledClientRef.current = clientId;
    const existing = conversations.find((c) => c.clientId === clientId);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (existing) setActiveId(existing.id);
    else if (!startConversation.isPending) startConversation.mutate(clientId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, conversations, conversationsLoading]);
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
    onError: (error) =>
      setToast({
        message: error.message || 'Unable to send this message. Please try again.',
        variant: 'error',
      }),
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
            isLoading={conversationsLoading}
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
                onSend={async (text, files) => {
                  try {
                    await send.mutateAsync({ text, files });
                    return true;
                  } catch {
                    return false;
                  }
                }}
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

      {toast && (
        <Toast message={toast.message} variant={toast.variant} onClose={() => setToast(null)} />
      )}
    </div>
  );
}

export default function RealtorMessagesPage() {
  return (
    <Suspense fallback={null}>
      <RealtorMessagesPageContent />
    </Suspense>
  );
}
