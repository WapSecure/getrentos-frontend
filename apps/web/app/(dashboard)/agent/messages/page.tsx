'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import { Pagination } from '@getrentos/ui';
import { ConversationList, type Conversation } from '@/components/agent/messages/ConversationList';
import { MessageThread, type ThreadMessage } from '@/components/agent/messages/MessageThread';
import { cn } from '@/lib/cn';
import { agentKeys } from '@/lib/queryKeys';
import { agentService } from '@/services/agentService';
import { unwrap } from '@/lib/apiHelpers';
import { useAgentUser } from '../layout';
import { agentOfflineQueue } from '@/lib/agentOfflineQueue';
import { enqueueAgentBinaryOperation } from '@/lib/agentBinaryQueue';

export default function AgentMessagesPage() {
  const agent = useAgentUser();
  const queryClient = useQueryClient();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const PAGE_SIZE = 10;
  const [page, setPage] = useState(1);
  const CLIENT_PAGE_SIZE = 20;
  const [clientPage, setClientPage] = useState(1);
  const { data: conversationsData } = useQuery({
    queryKey: [...agentKeys.conversations, { search: searchQuery, page, pageSize: PAGE_SIZE }],
    queryFn: () =>
      unwrap(
        agentService.listConversations({
          search: searchQuery || undefined,
          page,
          pageSize: PAGE_SIZE,
        })
      ),
  });
  const conversationApi = conversationsData?.items ?? [];
  const total = conversationsData?.total ?? 0;
  const conversations: Conversation[] = conversationApi.map((item) => ({
    id: item.id,
    participantName: item.client.legalName || 'Client',
    participantRole: 'Client',
    lastMessage: item.lastMessage || '',
    lastMessageTime: item.lastMessageAt || new Date().toISOString(),
    unreadCount: 0,
  }));
  const { data: clientsData } = useQuery({
    queryKey: [
      ...agentKeys.clients,
      { status: 'active', page: clientPage, pageSize: CLIENT_PAGE_SIZE },
    ],
    queryFn: () =>
      unwrap(
        agentService.listAgentClients({
          status: 'active',
          page: clientPage,
          pageSize: CLIENT_PAGE_SIZE,
        })
      ),
  });
  const clients = clientsData?.items ?? [];
  const clientTotal = clientsData?.total ?? 0;
  const startConversation = useMutation({
    mutationFn: (clientId: string) => unwrap(agentService.startConversation(clientId)),
    onSuccess: (conversation: { id: string }) => {
      queryClient.invalidateQueries({ queryKey: agentKeys.conversations });
      setPage(1);
      setActiveId(conversation.id);
    },
  });
  const { data: messageApi = [] } = useQuery({
    queryKey: agentKeys.conversationMessages(activeId || 'none'),
    queryFn: () => unwrap(agentService.getMessages(activeId!)),
    enabled: Boolean(activeId),
  });
  const messages: ThreadMessage[] = messageApi.map((item) => ({
    id: item.id,
    senderId: item.senderId === agent?.id ? 'agent' : 'contact',
    text: item.text,
    timestamp: item.createdAt,
    read: item.read,
  }));
  const send = useMutation({
    mutationFn: ({ text, files }: { text: string; files: File[] }) =>
      unwrap(agentService.sendMessage(activeId!, text, files)),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: agentKeys.conversationMessages(activeId || 'none'),
      });
      queryClient.invalidateQueries({ queryKey: agentKeys.conversations });
    },
    onError: (_error, payload) => {
      if (!activeId) return;
      if (payload.files.length)
        void enqueueAgentBinaryOperation(
          'message',
          { id: activeId, text: payload.text },
          payload.files
        );
      else agentOfflineQueue.enqueue('message', { id: activeId, text: payload.text, files: [] });
    },
  });

  const handleSelect = (id: string) => {
    setActiveId(id);
  };

  const handleSend = (text: string, files: File[]) => {
    if (!activeId) return;
    send.mutate({ text, files });
  };

  const activeConversation = conversations.find((c) => c.id === activeId);

  return (
    <div className="h-[calc(100vh-8rem)]">
      <div className="mb-6">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-2xl font-bold text-foreground">Messages</h1>
          <div className="flex flex-col items-end gap-2">
            <select
              className="rounded-lg border border-border bg-card px-3 py-2 text-sm"
              defaultValue=""
              onChange={(event) => {
                if (event.target.value) startConversation.mutate(event.target.value);
                event.currentTarget.value = '';
              }}
              disabled={startConversation.isPending}
            >
              <option value="">New conversation</option>
              {clients
                .filter((item) => item.client)
                .map((item) => (
                  <option key={item.id} value={item.client!.id}>
                    {item.client!.legalName}
                  </option>
                ))}
            </select>
            {clientTotal > CLIENT_PAGE_SIZE && (
              <Pagination
                page={clientPage}
                pageSize={CLIENT_PAGE_SIZE}
                total={clientTotal}
                onPageChange={setClientPage}
                className="max-w-xs"
              />
            )}
          </div>
        </div>
        <p className="text-muted-foreground mt-1">
          Communicate with dispatch, clients, and support
        </p>
      </div>

      <div className="flex gap-4 h-[calc(100%-4.5rem)]">
        <div className={cn(activeId ? 'hidden sm:flex' : 'flex', 'w-full sm:w-auto')}>
          <ConversationList
            conversations={conversations}
            activeId={activeId}
            searchQuery={searchQuery}
            onSearch={(value) => {
              setSearchQuery(value);
              setPage(1);
              setActiveId(null);
            }}
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

      {total > 0 && (
        <Pagination
          page={page}
          pageSize={PAGE_SIZE}
          total={total}
          onPageChange={(nextPage) => {
            setPage(nextPage);
            setActiveId(null);
          }}
          className="mt-4"
        />
      )}
    </div>
  );
}
