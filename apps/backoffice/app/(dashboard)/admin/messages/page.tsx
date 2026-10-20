'use client';

import { useEffect, useState } from 'react';
import { keepPreviousData, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import {
  Button,
  ConfirmDialog,
  PageErrorState,
  Pagination,
  useOptimisticMutation,
  useToast,
} from '@getrentos/ui';
import { ConversationList } from '@/components/admin/messages/ConversationList';
import { MessageThread } from '@/components/admin/messages/MessageThread';
import { cn } from '@getrentos/shared';
import { adminService } from '@/services/adminService';
import { unwrap } from '@getrentos/shared';
import { adminKeys } from '@/lib/queryKeys';

const PAGE_SIZE = 20;

export default function AdminMessagesPage() {
  const queryClient = useQueryClient();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [showResolveConfirm, setShowResolveConfirm] = useState(false);
  const toast = useToast();

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const conversationsKey = adminKeys.conversations({
    search: debouncedSearch,
    page,
    pageSize: PAGE_SIZE,
  });
  const { data, isLoading, isError, isFetching, refetch } = useQuery({
    queryKey: conversationsKey,
    queryFn: () =>
      unwrap(
        adminService.listConversations({
          search: debouncedSearch || undefined,
          page,
          pageSize: PAGE_SIZE,
        })
      ),
    refetchInterval: 20_000,
    placeholderData: keepPreviousData,
  });
  const conversations = data?.items ?? [];
  const total = data?.total ?? 0;

  const {
    data: activeMessages = [],
    isLoading: messagesLoading,
    isError: messagesError,
    isFetching: messagesFetching,
    refetch: refetchMessages,
  } = useQuery({
    queryKey: adminKeys.conversationMessages(activeId ?? ''),
    queryFn: () => unwrap(adminService.getConversationMessages(activeId!)),
    enabled: !!activeId,
  });

  const markReadMutation = useOptimisticMutation({
    mutationFn: (id: string) => unwrap(adminService.markConversationRead(id)),
    patches: (id) => [
      {
        queryKey: conversationsKey,
        update: (old) => {
          const page = old as typeof data;
          return page
            ? {
                ...page,
                items: page.items.map((c) => (c.id === id ? { ...c, unreadCount: 0 } : c)),
              }
            : old;
        },
      },
    ],
    invalidate: [['admin', 'conversations']],
    errorMessage: 'The conversation could not be marked as read.',
  });

  const sendMutation = useMutation({
    mutationFn: ({ id, text }: { id: string; text: string }) =>
      unwrap(adminService.sendConversationMessage(id, text)),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: adminKeys.conversationMessages(id) });
      queryClient.invalidateQueries({ queryKey: ['admin', 'conversations'] });
    },
    onError: (error: Error) =>
      toast.error(error.message || 'The message could not be sent. Please try again.'),
  });

  const resolveMutation = useMutation({
    mutationFn: (id: string) => unwrap(adminService.resolveConversation(id)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'conversations'] });
      toast.success('Conversation marked as resolved.');
    },
    onError: (error: Error) =>
      toast.error(error.message || 'The conversation could not be resolved.'),
  });

  const handleSelect = (id: string) => {
    setActiveId(id);
    markReadMutation.mutate(id);
  };

  const handleSend = async (text: string) => {
    if (!activeId) return false;
    try {
      await sendMutation.mutateAsync({ id: activeId, text });
      return true;
    } catch {
      return false;
    }
  };

  const activeConversation = conversations.find((c) => c.id === activeId);

  return (
    <div className="min-h-[calc(100vh-8rem)] lg:h-[calc(100vh-8rem)]">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Messages</h1>
        <p className="text-muted-foreground mt-1">
          Support conversations with users across the platform
        </p>
      </div>

      {isError && !data ? (
        <PageErrorState
          title="Could not load conversations"
          description="The support inbox is temporarily unavailable. Your search has been preserved."
          onRetry={() => void refetch()}
          isRetrying={isFetching}
        />
      ) : (
        <div className="flex min-h-[calc(100dvh-12rem)] gap-4 lg:h-[calc(100%-4.5rem)] lg:min-h-0">
          <div className={cn(activeId ? 'hidden sm:flex' : 'flex', 'w-full sm:w-auto')}>
            <div className="flex flex-col gap-2">
              <ConversationList
                conversations={conversations}
                activeId={activeId}
                searchQuery={searchQuery}
                onSearch={(value) => {
                  setSearchQuery(value);
                  setPage(1);
                }}
                onSelect={handleSelect}
                isLoading={isLoading}
              />
              {total > 0 && (
                <Pagination
                  page={page}
                  pageSize={PAGE_SIZE}
                  total={total}
                  onPageChange={(nextPage) => {
                    setActiveId(null);
                    setPage(nextPage);
                  }}
                />
              )}
            </div>
          </div>

          <div className={cn(activeId ? 'flex' : 'hidden sm:flex', 'flex-1 flex-col')}>
            {activeConversation ? (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  icon={<ArrowLeft className="w-4 h-4" aria-hidden="true" />}
                  onClick={() => setActiveId(null)}
                  className="mb-2 self-start sm:hidden"
                >
                  Back to conversations
                </Button>
                <MessageThread
                  contactName={activeConversation.participantName}
                  contactRole={activeConversation.participantRole}
                  messages={activeMessages}
                  onSend={handleSend}
                  status={activeConversation.status}
                  category={activeConversation.category}
                  source={activeConversation.source}
                  onResolve={() => setShowResolveConfirm(true)}
                  resolving={resolveMutation.isPending}
                  sending={sendMutation.isPending}
                  loading={messagesLoading}
                  error={messagesError}
                  retrying={messagesFetching}
                  onRetry={() => void refetchMessages()}
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
      )}
      <ConfirmDialog
        open={showResolveConfirm && Boolean(activeConversation)}
        onOpenChange={setShowResolveConfirm}
        title="Resolve support conversation?"
        description={
          activeConversation
            ? `${activeConversation.participantName}'s conversation will be closed. Sending is disabled after resolution.`
            : ''
        }
        confirmLabel="Mark resolved"
        onConfirm={() => activeConversation && resolveMutation.mutate(activeConversation.id)}
      />
    </div>
  );
}
