'use client';

import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import { Pagination } from '@getrentos/ui';
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

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const { data } = useQuery({
    queryKey: adminKeys.conversations({ search: debouncedSearch, page, pageSize: PAGE_SIZE }),
    queryFn: () =>
      unwrap(
        adminService.listConversations({
          search: debouncedSearch || undefined,
          page,
          pageSize: PAGE_SIZE,
        })
      ),
    refetchInterval: 20_000,
  });
  const conversations = data?.items ?? [];
  const total = data?.total ?? 0;

  const { data: activeMessages = [] } = useQuery({
    queryKey: adminKeys.conversationMessages(activeId ?? ''),
    queryFn: () => unwrap(adminService.getConversationMessages(activeId!)),
    enabled: !!activeId,
  });

  const markReadMutation = useMutation({
    mutationFn: (id: string) => adminService.markConversationRead(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'conversations'] }),
  });

  const sendMutation = useMutation({
    mutationFn: ({ id, text }: { id: string; text: string }) =>
      unwrap(adminService.sendConversationMessage(id, text)),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: adminKeys.conversationMessages(id) });
      queryClient.invalidateQueries({ queryKey: ['admin', 'conversations'] });
    },
  });

  const resolveMutation = useMutation({
    mutationFn: (id: string) => unwrap(adminService.resolveConversation(id)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'conversations'] }),
  });

  const handleSelect = (id: string) => {
    setActiveId(id);
    markReadMutation.mutate(id);
  };

  const handleSend = (text: string) => {
    if (!activeId) return;
    sendMutation.mutate({ id: activeId, text });
  };

  const activeConversation = conversations.find((c) => c.id === activeId);

  return (
    <div className="h-[calc(100vh-8rem)]">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Messages</h1>
        <p className="text-muted-foreground mt-1">
          Support conversations with users across the platform
        </p>
      </div>

      <div className="flex gap-4 h-[calc(100%-4.5rem)]">
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
            />
            {total > 0 && (
              <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={setPage} />
            )}
          </div>
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
                messages={activeMessages}
                onSend={handleSend}
                status={activeConversation.status}
                category={activeConversation.category}
                source={activeConversation.source}
                onResolve={() => resolveMutation.mutate(activeConversation.id)}
                resolving={resolveMutation.isPending}
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
