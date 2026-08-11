'use client';

import { useRenterUser } from '../layout';
import { useState, useEffect } from 'react';
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
import { Conversation, Attachment, Reminder, ReminderData, FilterState } from '@/types/messages';
import { renterService } from '@/services/renterService';

const DEFAULT_REMINDERS: Reminder[] = [
  {
    id: 'rem_001',
    message: 'Follow up on lease agreement',
    date: '2026-08-15',
    time: '10:00',
    active: true,
  },
];

export default function MessagesPage() {
  const user = useRenterUser();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [selectedLabel, setSelectedLabel] = useState<string>('all');
  const [reminders, setReminders] = useState<Reminder[]>(() => {
    if (typeof window === 'undefined') return [];
    const saved = localStorage.getItem('message_reminders');
    if (saved) return JSON.parse(saved);
    localStorage.setItem('message_reminders', JSON.stringify(DEFAULT_REMINDERS));
    return DEFAULT_REMINDERS;
  });

  useEffect(() => {
    const loadConversations = async () => {
      const res = await renterService.listConversations();
      if (res.success && res.data) {
        setConversations(res.data);
        if (res.data.length > 0) setSelectedConversation(res.data[0]);
      }
    };
    loadConversations();
  }, []);

  const handleSendMessage = async (
    conversationId: string,
    text: string,
    _attachments?: Attachment[]
  ) => {
    const res = await renterService.sendMessage(conversationId, text);
    if (res.success && res.data) {
      const updated = res.data;
      setConversations((prev) => prev.map((conv) => (conv.id === conversationId ? updated : conv)));
      if (selectedConversation?.id === conversationId) {
        setSelectedConversation(updated);
      }
    }
  };

  const handleSelectConversation = async (conversation: Conversation) => {
    setSelectedConversation(conversation);
    if (conversation.unreadCount > 0) {
      const res = await renterService.markConversationRead(conversation.id);
      if (res.success && res.data) {
        const updated = res.data;
        setConversations((prev) =>
          prev.map((conv) => (conv.id === conversation.id ? updated : conv))
        );
        setSelectedConversation(updated);
      }
    }
  };

  const handlePinConversation = async (conversationId: string) => {
    const res = await renterService.togglePinConversation(conversationId);
    if (res.success && res.data) {
      const updated = res.data;
      setConversations((prev) => prev.map((conv) => (conv.id === conversationId ? updated : conv)));
    }
  };

  const handleArchiveConversation = async (conversationId: string) => {
    const res = await renterService.toggleArchiveConversation(conversationId);
    if (res.success && res.data) {
      const updated = res.data;
      setConversations((prev) => prev.map((conv) => (conv.id === conversationId ? updated : conv)));
    }
  };

  const handleAddReminder = (reminderData: ReminderData) => {
    const newReminder: Reminder = {
      id: `rem_${Date.now()}`,
      ...reminderData,
      active: true,
    };
    const updated = [...reminders, newReminder];
    setReminders(updated);
    localStorage.setItem('message_reminders', JSON.stringify(updated));
  };

  const handleToggleReminder = (id: string) => {
    const updated = reminders.map((r) => (r.id === id ? { ...r, active: !r.active } : r));
    setReminders(updated);
    localStorage.setItem('message_reminders', JSON.stringify(updated));
  };

  const handleDeleteReminder = (id: string) => {
    const updated = reminders.filter((r) => r.id !== id);
    setReminders(updated);
    localStorage.setItem('message_reminders', JSON.stringify(updated));
  };

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
