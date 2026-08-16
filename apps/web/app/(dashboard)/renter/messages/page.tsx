'use client';

import { useRenterUser } from '../layout';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MessagesHeader } from '@/components/renter/messages/MessagesHeader';
import { MessageConversationList } from '@/components/renter/messages/MessageConversationList';
import { MessageThread } from '@/components/renter/messages/MessageThread';
import { MessageSearch } from '@/components/renter/messages/MessageSearch';
import { QuickReplies } from '@/components/renter/messages/QuickReplies';
import { MessageTemplates } from '@/components/renter/messages/MessageTemplates';
import { MessageFilters } from '@/components/renter/messages/MessageFilters';
import { MessageLabels } from '@/components/renter/messages/MessageLabels';
import { MessageReminders } from '@/components/renter/messages/MessageReminders';
import { MessageCircle } from 'lucide-react';
import { Conversation, Message, FilterState } from '@/types/messages';
import { renterService } from '@/services/renterService';
import { unwrap } from '@/lib/apiHelpers';
import { renterKeys } from '@/lib/queryKeys';
import { useRealtimeEvent } from '@/hooks/useRealtime';

export default function MessagesPage() {
  const user = useRenterUser();
  const queryClient = useQueryClient();
  const { data: conversations = [] } = useQuery({
    queryKey: renterKeys.conversations,
    queryFn: () => unwrap(renterService.listConversations()),
  });
  const { data: reminders = [] } = useQuery({
    queryKey: renterKeys.reminders,
    queryFn: () => unwrap(renterService.listReminders()),
  });
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const selectedConversation =
    conversations.find((c) => c.id === selectedConversationId) ?? conversations[0] ?? null;
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [selectedLabel, setSelectedLabel] = useState<string>('all');

  const invalidateConversations = () =>
    queryClient.invalidateQueries({ queryKey: renterKeys.conversations });
  const invalidateReminders = () =>
    queryClient.invalidateQueries({ queryKey: renterKeys.reminders });

  // Real-time: refresh the conversation list whenever either participant
  // sends a message or starts a conversation (pushed over the WebSocket).
  useRealtimeEvent('conversation:update', () => {
    invalidateConversations();
  });

  const sendMessageMutation = useMutation({
    mutationFn: ({
      conversationId,
      text,
      files,
    }: {
      conversationId: string;
      text: string;
      files?: File[];
    }) => unwrap(renterService.sendMessage(conversationId, text, files)),
    onMutate: async ({ conversationId, text }) => {
      await queryClient.cancelQueries({ queryKey: renterKeys.conversations });
      const previousConversations = queryClient.getQueryData<Conversation[]>(
        renterKeys.conversations
      );
      const optimisticMessage: Message = {
        id: `optimistic-${crypto.randomUUID()}`,
        conversationId,
        senderId: user?.id ?? 'me',
        senderName: user?.fullName ?? 'You',
        senderRole: 'renter',
        text,
        timestamp: new Date().toISOString(),
        read: true,
      };
      queryClient.setQueryData<Conversation[]>(renterKeys.conversations, (old = []) =>
        old.map((conversation) =>
          conversation.id === conversationId
            ? {
                ...conversation,
                messages: [...conversation.messages, optimisticMessage],
                lastMessage: text,
                lastMessageTime: optimisticMessage.timestamp,
              }
            : conversation
        )
      );
      return { previousConversations };
    },
    onError: (_error, _variables, context) => {
      if (context)
        queryClient.setQueryData(renterKeys.conversations, context.previousConversations);
    },
    onSettled: invalidateConversations,
  });

  const markReadMutation = useMutation({
    mutationFn: (conversationId: string) =>
      unwrap(renterService.markConversationRead(conversationId)),
    onSuccess: invalidateConversations,
  });

  const pinMutation = useMutation({
    mutationFn: (conversationId: string) =>
      unwrap(renterService.togglePinConversation(conversationId)),
    onSuccess: invalidateConversations,
  });

  const archiveMutation = useMutation({
    mutationFn: (conversationId: string) =>
      unwrap(renterService.toggleArchiveConversation(conversationId)),
    onSuccess: invalidateConversations,
  });

  const addReminderMutation = useMutation({
    mutationFn: (reminderData: { message: string; date: string; time: string }) =>
      unwrap(renterService.createReminder(reminderData)),
    onSuccess: invalidateReminders,
  });

  const toggleReminderMutation = useMutation({
    mutationFn: (id: string) => unwrap(renterService.toggleReminder(id)),
    onSuccess: invalidateReminders,
  });

  const deleteReminderMutation = useMutation({
    mutationFn: (id: string) => unwrap(renterService.deleteReminder(id)),
    onSuccess: invalidateReminders,
  });

  const handleSendMessage = (conversationId: string, text: string, files?: File[]) =>
    sendMessageMutation.mutate({ conversationId, text, files });

  const handleSelectConversation = (conversation: Conversation) => {
    setSelectedConversationId(conversation.id);
    if (conversation.unreadCount > 0) {
      markReadMutation.mutate(conversation.id);
    }
  };

  const handlePinConversation = (conversationId: string) => pinMutation.mutate(conversationId);

  const handleArchiveConversation = (conversationId: string) =>
    archiveMutation.mutate(conversationId);

  const handleAddReminder = (reminderData: { message: string; date: string; time: string }) =>
    addReminderMutation.mutate(reminderData);

  const handleToggleReminder = (id: string) => toggleReminderMutation.mutate(id);

  const handleDeleteReminder = (id: string) => deleteReminderMutation.mutate(id);

  const handleFilterChange = (filters: FilterState) => {
    setFilterType(filters.type);
  };

  const getConversationLabelIds = (conv: Conversation): string[] => {
    const ids: string[] = [];
    if (conv.propertyName.includes('Loft')) ids.push('1');
    if (conv.messages.some((m) => m.text.toLowerCase().includes('lease'))) ids.push('2');
    if (conv.messages.some((m) => /maintenance|repair/i.test(m.text))) ids.push('3');
    return ids;
  };

  const filteredConversations = conversations.filter((conv) => {
    const matchesSearch =
      conv.participantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      conv.propertyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      conv.lastMessage.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType =
      filterType === 'all' ||
      (filterType === 'unread' && conv.unreadCount > 0) ||
      (filterType === 'read' && conv.unreadCount === 0);

    const matchesLabel =
      selectedLabel === 'all' || getConversationLabelIds(conv).includes(selectedLabel);

    return matchesSearch && matchesType && matchesLabel;
  });

  const labels = [
    {
      id: '1',
      name: 'Property Inquiries',
      color: 'bg-blue-100',
      count: conversations.filter((c) => getConversationLabelIds(c).includes('1')).length,
    },
    {
      id: '2',
      name: 'Lease Discussions',
      color: 'bg-green-100',
      count: conversations.filter((c) => getConversationLabelIds(c).includes('2')).length,
    },
    {
      id: '3',
      name: 'Maintenance',
      color: 'bg-yellow-100',
      count: conversations.filter((c) => getConversationLabelIds(c).includes('3')).length,
    },
  ];

  return (
    <>
      <MessagesHeader unreadCount={conversations.reduce((sum, c) => sum + c.unreadCount, 0)} />

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <MessageSearch searchTerm={searchTerm} onSearch={setSearchTerm} />
          <MessageFilters
            onFilterChange={handleFilterChange}
            unreadCount={conversations.reduce((sum, c) => sum + c.unreadCount, 0)}
            totalCount={conversations.length}
          />
          <MessageLabels
            labels={labels}
            onSelectLabel={setSelectedLabel}
            selectedLabel={selectedLabel}
          />
          <MessageConversationList
            conversations={filteredConversations}
            selectedId={selectedConversation?.id || null}
            onSelect={handleSelectConversation}
            onPin={handlePinConversation}
            onArchive={handleArchiveConversation}
          />
          <MessageTemplates
            onSelectTemplate={(content) => {
              if (selectedConversation) {
                handleSendMessage(selectedConversation.id, content);
              }
            }}
          />
          <QuickReplies
            onSelectReply={(reply) => {
              if (selectedConversation) {
                handleSendMessage(selectedConversation.id, reply);
              }
            }}
          />
          <MessageReminders
            reminders={reminders}
            onAddReminder={handleAddReminder}
            onToggleReminder={handleToggleReminder}
            onDeleteReminder={handleDeleteReminder}
          />
        </div>

        <div className="lg:col-span-2">
          {selectedConversation ? (
            <MessageThread
              conversation={selectedConversation}
              onSendMessage={handleSendMessage}
              currentUser={user}
            />
          ) : (
            <div className="bg-card rounded-xl border border-border p-12 text-center">
              <MessageCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-foreground">No conversation selected</h3>
              <p className="text-muted-foreground mt-2">
                Select a conversation from the list to start messaging
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
