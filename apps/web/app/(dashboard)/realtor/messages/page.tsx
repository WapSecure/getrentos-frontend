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
import { Pagination, Toast, type ToastVariant } from '@getrentos/ui';

const PAGE_SIZE = 10;

function RealtorMessagesPageContent() {
  const searchParams = useSearchParams();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [messagePage, setMessagePage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [toast, setToast] = useState<{ message: string; variant: ToastVariant } | null>(null);
  const handledClientRef = useRef<string | null>(null);
  const queryClient = useQueryClient();
  const { data: conversationsResult, isLoading: conversationsLoading } = useQuery({
    queryKey: [
      ...realtorKeys.conversations,
      { page, pageSize: PAGE_SIZE, search: searchQuery.trim() || undefined },
    ],
    queryFn: async () => {
      const result = await unwrap(
        realtorService.listConversations({
          page,
          pageSize: PAGE_SIZE,
          search: searchQuery.trim() || undefined,
        })
      );
      return {
        ...result,
        items: result.items.map(
          (item): Conversation => ({
            id: item.id,
            clientId: item.client.id,
            participantName: item.client.legalName,
            participantRole: 'Client',
            lastMessage: item.lastMessage || '',
            lastMessageTime: item.lastMessageAt || '',
            unreadCount: item.unreadCount,
          })
        ),
      };
    },
  });
  const conversations = conversationsResult?.items ?? [];
  const conversationTotal = conversationsResult?.total ?? 0;
  const activateConversation = (conversationId: string) => {
    setMessagePage(1);
    setActiveId(conversationId);
  };

  // Open (or start) the conversation for a client the user navigated from,
  // e.g. the "Message" button on the Clients page (?client=<id>).
  const startConversation = useMutation({
    mutationFn: (clientId: string) => unwrap(realtorService.startConversation(clientId)),
    onSuccess: (conversation) => {
      queryClient.invalidateQueries({ queryKey: realtorKeys.conversations });
      setPage(1);
      activateConversation(conversation.id);
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
    if (existing) {
      const timeoutId = window.setTimeout(() => activateConversation(existing.id), 0);
      return () => window.clearTimeout(timeoutId);
    } else if (!startConversation.isPending) startConversation.mutate(clientId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, conversations, conversationsLoading]);
  const { data: messagesResult } = useQuery({
    enabled: !!activeId,
    queryKey: [
      ...realtorKeys.conversationMessages(activeId || ''),
      { page: messagePage, pageSize: PAGE_SIZE },
    ],
    queryFn: async () => {
      const result = await unwrap(
        realtorService.getConversationMessages(activeId!, {
          page: messagePage,
          pageSize: PAGE_SIZE,
        })
      );
      return {
        ...result,
        items: result.items.map(
          (item): ThreadMessage => ({
            id: item.id,
            senderId: item.senderType,
            text: item.text,
            timestamp: item.createdAt,
            read: item.read,
          })
        ),
      };
    },
  });
  const messages = messagesResult?.items ?? [];
  const messageTotal = messagesResult?.total ?? 0;
  const send = useMutation({
    mutationFn: ({ text, files }: { text: string; files: File[] }) =>
      unwrap(realtorService.sendMessage(activeId!, text, files)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: realtorKeys.conversationMessages(activeId || '') });
      queryClient.invalidateQueries({ queryKey: realtorKeys.conversations });
      setMessagePage(1);
    },
    onError: (error) =>
      setToast({
        message: error.message || 'Unable to send this message. Please try again.',
        variant: 'error',
      }),
  });
  const activeConversation = conversations.find((conversation) => conversation.id === activeId);

  return (
    <div className="h-[calc(100vh-8rem)]">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Messages</h1>
        <p className="text-muted-foreground mt-1">Communicate securely with active clients</p>
      </div>
      <div className="flex gap-4 h-[calc(100%-4.5rem)]">
        <div
          className={cn(activeId ? 'hidden sm:flex' : 'flex', 'w-full sm:w-auto flex-col gap-2')}
        >
          <ConversationList
            conversations={conversations}
            activeId={activeId}
            searchQuery={searchQuery}
            isLoading={conversationsLoading}
            onSearch={(value) => {
              setSearchQuery(value);
              setPage(1);
            }}
            onSelect={(id) => {
              activateConversation(id);
            }}
          />
          {conversationTotal > 0 && (
            <Pagination
              page={page}
              pageSize={PAGE_SIZE}
              total={conversationTotal}
              onPageChange={setPage}
              className="rounded-xl border border-border bg-card"
            />
          )}
        </div>
        <div className={cn(activeId ? 'flex' : 'hidden sm:flex', 'flex-1 flex-col')}>
          {activeConversation ? (
            <div className="flex flex-1 min-h-0 flex-col gap-2">
              <button
                onClick={() => {
                  setMessagePage(1);
                  setActiveId(null);
                }}
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
              {messageTotal > 0 && (
                <Pagination
                  page={messagePage}
                  pageSize={PAGE_SIZE}
                  total={messageTotal}
                  onPageChange={setMessagePage}
                  className="rounded-xl border border-border bg-card"
                />
              )}
            </div>
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
