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
import {
  Conversation,
  Message,
  Attachment,
  Reminder,
  ReminderData,
  FilterState,
} from '@/types/messages';

export default function MessagesPage() {
  const user = useRenterUser();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [selectedLabel, setSelectedLabel] = useState<string>('all');
  const [reminders, setReminders] = useState<Reminder[]>([]);

  const loadConversations = () => {
    const mockConversations: Conversation[] = [
      {
        id: 'conv_001',
        propertyId: 'prop_001',
        propertyName: 'Modern Downtown Loft',
        participantId: 'landlord_001',
        participantName: 'Jane Smith',
        participantRole: 'landlord',
        lastMessage: 'Great! I will send you the lease agreement shortly.',
        lastMessageTime: '2024-06-10T14:30:00',
        unreadCount: 2,
        isPinned: true,
        isArchived: false,
        messages: [
          {
            id: 'msg_001',
            conversationId: 'conv_001',
            senderId: 'renter_001',
            senderName: 'John Doe',
            senderRole: 'renter',
            text: "Hi Jane, I'm interested in the Modern Downtown Loft. When can I view it?",
            timestamp: '2024-06-10T10:00:00',
            read: true,
          },
          {
            id: 'msg_002',
            conversationId: 'conv_001',
            senderId: 'landlord_001',
            senderName: 'Jane Smith',
            senderRole: 'landlord',
            text: 'Hello John! The property is available for viewing tomorrow at 2pm.',
            timestamp: '2024-06-10T12:30:00',
            read: true,
          },
          {
            id: 'msg_003',
            conversationId: 'conv_001',
            senderId: 'renter_001',
            senderName: 'John Doe',
            senderRole: 'renter',
            text: "That works perfectly! I'll be there at 2pm.",
            timestamp: '2024-06-10T13:15:00',
            read: true,
          },
          {
            id: 'msg_004',
            conversationId: 'conv_001',
            senderId: 'landlord_001',
            senderName: 'Jane Smith',
            senderRole: 'landlord',
            text: 'Great! I will send you the lease agreement shortly.',
            timestamp: '2024-06-10T14:30:00',
            read: false,
          },
          {
            id: 'msg_005',
            conversationId: 'conv_001',
            senderId: 'landlord_001',
            senderName: 'Jane Smith',
            senderRole: 'landlord',
            text: 'Please bring your ID and proof of income for the application.',
            timestamp: '2024-06-10T14:32:00',
            read: false,
          },
        ],
      },
      {
        id: 'conv_002',
        propertyId: 'prop_002',
        propertyName: 'Cozy Studio Apartment',
        participantId: 'landlord_002',
        participantName: 'John Doe',
        participantRole: 'landlord',
        lastMessage: "The application has been received. I'll review it today.",
        lastMessageTime: '2024-06-09T16:45:00',
        unreadCount: 0,
        isPinned: false,
        isArchived: false,
        messages: [
          {
            id: 'msg_006',
            conversationId: 'conv_002',
            senderId: 'renter_001',
            senderName: 'John Doe',
            senderRole: 'renter',
            text: "I've submitted the application for the studio apartment.",
            timestamp: '2024-06-09T15:00:00',
            read: true,
          },
          {
            id: 'msg_007',
            conversationId: 'conv_002',
            senderId: 'landlord_002',
            senderName: 'John Doe',
            senderRole: 'landlord',
            text: "The application has been received. I'll review it today.",
            timestamp: '2024-06-09T16:45:00',
            read: true,
          },
        ],
      },
      {
        id: 'conv_003',
        propertyId: 'prop_003',
        propertyName: 'Luxury Beachfront Villa',
        participantId: 'realtor_001',
        participantName: 'Sarah Johnson',
        participantRole: 'agent',
        lastMessage: "I'll check the availability and get back to you.",
        lastMessageTime: '2024-06-08T09:20:00',
        unreadCount: 1,
        isPinned: false,
        isArchived: false,
        messages: [
          {
            id: 'msg_008',
            conversationId: 'conv_003',
            senderId: 'renter_001',
            senderName: 'John Doe',
            senderRole: 'renter',
            text: 'Is the luxury villa still available?',
            timestamp: '2024-06-08T08:00:00',
            read: true,
          },
          {
            id: 'msg_009',
            conversationId: 'conv_003',
            senderId: 'realtor_001',
            senderName: 'Sarah Johnson',
            senderRole: 'agent',
            text: "I'll check the availability and get back to you.",
            timestamp: '2024-06-08T09:20:00',
            read: false,
          },
        ],
      },
    ];
    setConversations(mockConversations);
    if (mockConversations.length > 0) {
      setSelectedConversation(mockConversations[0]);
    }

    const savedReminders = localStorage.getItem('message_reminders');
    if (savedReminders) {
      setReminders(JSON.parse(savedReminders));
    } else {
      const mockReminders: Reminder[] = [
        {
          id: 'rem_001',
          message: 'Follow up on lease agreement',
          date: '2024-06-15',
          time: '10:00',
          active: true,
        },
        {
          id: 'rem_002',
          message: 'Schedule viewing for Modern Downtown Loft',
          date: '2024-06-12',
          time: '14:30',
          active: true,
        },
      ];
      setReminders(mockReminders);
      localStorage.setItem('message_reminders', JSON.stringify(mockReminders));
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadConversations();
  }, []);

  const handleSendMessage = (conversationId: string, text: string, attachments?: Attachment[]) => {
    const newMessage: Message = {
      id: `msg_${Date.now()}`,
      conversationId,
      senderId: 'renter_001',
      senderName: user?.fullName || 'You',
      senderRole: 'renter',
      text,
      timestamp: new Date().toISOString(),
      read: false,
      attachments,
    };

    setConversations((prev) =>
      prev.map((conv) => {
        if (conv.id === conversationId) {
          return {
            ...conv,
            messages: [...conv.messages, newMessage],
            lastMessage: text,
            lastMessageTime: newMessage.timestamp,
            unreadCount: 0,
          };
        }
        return conv;
      })
    );

    if (selectedConversation?.id === conversationId) {
      setSelectedConversation((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          messages: [...prev.messages, newMessage],
          lastMessage: text,
          lastMessageTime: newMessage.timestamp,
          unreadCount: 0,
        };
      });
    }
  };

  const handleSelectConversation = (conversation: Conversation) => {
    setSelectedConversation(conversation);
    setConversations((prev) =>
      prev.map((conv) => {
        if (conv.id === conversation.id) {
          return { ...conv, unreadCount: 0 };
        }
        return conv;
      })
    );
  };

  const handlePinConversation = (conversationId: string) => {
    setConversations((prev) =>
      prev.map((conv) =>
        conv.id === conversationId ? { ...conv, isPinned: !conv.isPinned } : conv
      )
    );
  };

  const handleArchiveConversation = (conversationId: string) => {
    setConversations((prev) =>
      prev.map((conv) =>
        conv.id === conversationId ? { ...conv, isArchived: !conv.isArchived } : conv
      )
    );
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
