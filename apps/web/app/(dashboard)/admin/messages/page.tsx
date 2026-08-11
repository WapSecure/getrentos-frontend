'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import { ConversationList } from '@/components/admin/messages/ConversationList';
import { MessageThread } from '@/components/admin/messages/MessageThread';
import { cn } from '@/lib/cn';
import { adminService } from '@/services/adminService';
import { unwrap } from '@/lib/apiHelpers';
import { adminKeys } from '@/lib/queryKeys';

export default function AdminMessagesPage() {
  const queryClient = useQueryClient();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const { data: conversations = [] } = useQuery({
    queryKey: adminKeys.conversations(),
    queryFn: () => unwrap(adminService.listConversations()),
  });

  const { data: activeMessages = [] } = useQuery({
    queryKey: adminKeys.conversationMessages(activeId ?? ''),
    queryFn: () => unwrap(adminService.getConversationMessages(activeId!)),
    enabled: !!activeId,
  });

  const markReadMutation = useMutation({
    mutationFn: (id: string) => adminService.markConversationRead(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: adminKeys.conversations() }),
  });

  const sendMutation = useMutation({
    mutationFn: ({ id, text }: { id: string; text: string }) =>
      unwrap(adminService.sendConversationMessage(id, text)),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: adminKeys.conversationMessages(id) });
      queryClient.invalidateQueries({ queryKey: adminKeys.conversations() });
    },
  });

  const handleSelect = (id: string) => {
    setActiveId(id);
    markReadMutation.mutate(id);
  };

  const handleSend = (text: string) => {
    if (!activeId) return;
    sendMutation.mutate({ id: activeId, text });
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
          Support conversations with users across the platform
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
                messages={activeMessages}
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
