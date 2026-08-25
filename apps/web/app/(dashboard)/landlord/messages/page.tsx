'use client';

import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import { Pagination } from '@getrentos/ui';
import {
  ConversationList,
  type Conversation,
} from '@/components/landlord/messages/ConversationList';
import { MessageThread, type ThreadMessage } from '@/components/landlord/messages/MessageThread';
import { cn } from '@/lib/cn';
import { unwrap } from '@/lib/apiHelpers';
import { landlordKeys } from '@/lib/queryKeys';
import { landlordService } from '@/services/landlordService';
import { useRealtimeEvent } from '@/hooks/useRealtime';

const PAGE_SIZE = 10;

export default function LandlordMessagesPage() {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [page, setPage] = useState(1);
  const [messagePage, setMessagePage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const queryClient = useQueryClient();

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(searchQuery.trim());
      setPage(1);
    }, 250);
    return () => window.clearTimeout(timer);
  }, [searchQuery]);

  const { data: conversationsData } = useQuery({
    queryKey: [
      ...landlordKeys.conversations,
      { page, pageSize: PAGE_SIZE, search: debouncedSearch || undefined },
    ],
    queryFn: () =>
      unwrap(
        landlordService.listConversations({
          page,
          pageSize: PAGE_SIZE,
          search: debouncedSearch || undefined,
        })
      ),
  });
  const conversations = conversationsData?.items ?? [];
  const total = conversationsData?.total ?? 0;

  // Real-time: refresh the conversation list when either side sends a message.
  useRealtimeEvent('conversation:update', () => {
    void queryClient.invalidateQueries({ queryKey: landlordKeys.conversations });
  });

  const { data: messagesData } = useQuery({
    queryKey: [
      ...landlordKeys.conversationMessages(activeId ?? ''),
      { page: messagePage, pageSize: PAGE_SIZE },
    ],
    queryFn: () =>
      unwrap(
        landlordService.getConversationMessages(activeId as string, {
          page: messagePage,
          pageSize: PAGE_SIZE,
        })
      ),
    enabled: !!activeId,
  });
  const messages = messagesData?.items ?? [];
  const messagesTotal = messagesData?.total ?? 0;

  const handleSelect = (id: string) => {
    setActiveConversation(conversations.find((conversation) => conversation.id === id) ?? null);
    setActiveId(id);
    setMessagePage(1);
    void landlordService.markConversationRead(id).then(() => {
      void queryClient.invalidateQueries({ queryKey: landlordKeys.conversations });
    });
  };

  const handleSend = async (text: string) => {
    if (!activeId) return;
    const response = await landlordService.sendConversationMessage(activeId, text);
    if (!response.success || !response.data) return;
    setMessagePage(1);
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: landlordKeys.conversationMessages(activeId) }),
      queryClient.invalidateQueries({ queryKey: landlordKeys.conversations }),
    ]);
  };

  return (
    <div className="h-[calc(100vh-8rem)]">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Messages</h1>
        <p className="text-muted-foreground mt-1">
          Communicate with tenants, vendors, and applicants
        </p>
      </div>

      <div className="flex gap-4 h-[calc(100%-4.5rem)]">
        <div className={cn(activeId ? 'hidden sm:flex' : 'flex', 'w-full sm:w-80 flex-col gap-2')}>
          <ConversationList
            conversations={conversations as Conversation[]}
            activeId={activeId}
            searchQuery={searchQuery}
            onSearch={setSearchQuery}
            onSelect={handleSelect}
          />
          {total > 0 && (
            <Pagination
              page={page}
              pageSize={PAGE_SIZE}
              total={total}
              onPageChange={setPage}
              className="rounded-xl border border-border bg-card"
            />
          )}
        </div>

        <div className={cn(activeId ? 'flex' : 'hidden sm:flex', 'flex-1 flex-col')}>
          {activeConversation ? (
            <>
              <button
                onClick={() => {
                  setActiveId(null);
                  setActiveConversation(null);
                }}
                className="sm:hidden flex items-center gap-1.5 text-sm text-muted-foreground mb-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to conversations
              </button>
              <MessageThread
                contactName={activeConversation.participantName}
                contactRole={activeConversation.participantRole}
                messages={messages as ThreadMessage[]}
                onSend={handleSend}
              />
              {messagesTotal > 0 && (
                <Pagination
                  page={messagePage}
                  pageSize={PAGE_SIZE}
                  total={messagesTotal}
                  onPageChange={setMessagePage}
                  className="mt-2 rounded-xl border border-border bg-card"
                />
              )}
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
