'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { LandlordNavbar } from '@/components/landlord/navigation/LandlordNavbar';
import { LandlordSidebar } from '@/components/landlord/dashboard/LandlordSidebar';
import {
  ConversationList,
  type Conversation,
} from '@/components/landlord/messages/ConversationList';
import { MessageThread, type ThreadMessage } from '@/components/landlord/messages/MessageThread';
import { ROUTES, isAuthenticated, STORAGE_KEYS, getDashboardRoute } from '@/lib/constants/auth';

const mockConversations: Conversation[] = [
  {
    id: 'conv_001',
    participantName: 'Chuka Nwosu',
    participantRole: 'Tenant',
    lastMessage: 'Thanks, I will send the plumber access tomorrow morning.',
    lastMessageTime: '2026-08-06T15:40:00.000Z',
    unreadCount: 2,
  },
  {
    id: 'conv_002',
    participantName: 'AquaFlow Plumbers',
    participantRole: 'Vendor',
    lastMessage: 'We can be there by 10am on Friday.',
    lastMessageTime: '2026-08-06T11:15:00.000Z',
    unreadCount: 0,
  },
  {
    id: 'conv_003',
    participantName: 'Bisi Adewale',
    participantRole: 'Applicant',
    lastMessage: 'I have uploaded my bank statement, please check.',
    lastMessageTime: '2026-08-05T09:05:00.000Z',
    unreadCount: 1,
  },
  {
    id: 'conv_004',
    participantName: 'Ifeoma Bello',
    participantRole: 'Tenant',
    lastMessage: 'Received, thank you!',
    lastMessageTime: '2026-08-01T18:20:00.000Z',
    unreadCount: 0,
  },
];

const mockMessages: Record<string, ThreadMessage[]> = {
  conv_001: [
    {
      id: 'm1',
      senderId: 'contact',
      text: 'Hi, the kitchen faucet is still leaking.',
      timestamp: '2026-08-06T15:20:00.000Z',
      read: true,
    },
    {
      id: 'm2',
      senderId: 'landlord',
      text: 'Thanks for the update — I have assigned a plumber to look at it this week.',
      timestamp: '2026-08-06T15:25:00.000Z',
      read: true,
    },
    {
      id: 'm3',
      senderId: 'contact',
      text: 'Great, what time should I expect them?',
      timestamp: '2026-08-06T15:32:00.000Z',
      read: true,
    },
    {
      id: 'm4',
      senderId: 'contact',
      text: 'Thanks, I will send the plumber access tomorrow morning.',
      timestamp: '2026-08-06T15:40:00.000Z',
      read: false,
    },
  ],
  conv_002: [
    {
      id: 'm1',
      senderId: 'landlord',
      text: 'Can you attend to Unit 3B this week for a leaking faucet?',
      timestamp: '2026-08-06T10:50:00.000Z',
      read: true,
    },
    {
      id: 'm2',
      senderId: 'contact',
      text: 'We can be there by 10am on Friday.',
      timestamp: '2026-08-06T11:15:00.000Z',
      read: true,
    },
  ],
  conv_003: [
    {
      id: 'm1',
      senderId: 'landlord',
      text: 'Your bank statement document is still missing from your application.',
      timestamp: '2026-08-05T08:50:00.000Z',
      read: true,
    },
    {
      id: 'm2',
      senderId: 'contact',
      text: 'I have uploaded my bank statement, please check.',
      timestamp: '2026-08-05T09:05:00.000Z',
      read: false,
    },
  ],
  conv_004: [
    {
      id: 'm1',
      senderId: 'landlord',
      text: 'Your renewal offer has been sent — let me know if you have questions.',
      timestamp: '2026-08-01T18:00:00.000Z',
      read: true,
    },
    {
      id: 'm2',
      senderId: 'contact',
      text: 'Received, thank you!',
      timestamp: '2026-08-01T18:20:00.000Z',
      read: true,
    },
  ],
};

export default function LandlordMessagesPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ fullName: string; email: string; role?: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messagesByConversation, setMessagesByConversation] = useState<
    Record<string, ThreadMessage[]>
  >({});
  const [activeId, setActiveId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const checkAuth = () => {
      const authenticated = isAuthenticated();
      if (!authenticated) {
        router.replace(ROUTES.LOGIN);
        return;
      }
      const storedUser = localStorage.getItem(STORAGE_KEYS.USER);
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        if (parsedUser.role && parsedUser.role !== 'landlord') {
          router.replace(getDashboardRoute(parsedUser.role));
          return;
        }
      }
      setConversations(mockConversations);
      setMessagesByConversation(mockMessages);
      setIsLoading(false);
    };
    checkAuth();
  }, [router]);

  const handleSelect = (id: string) => {
    setActiveId(id);
    setConversations((prev) => prev.map((c) => (c.id === id ? { ...c, unreadCount: 0 } : c)));
    setMessagesByConversation((prev) => ({
      ...prev,
      [id]: (prev[id] || []).map((m) => ({ ...m, read: true })),
    }));
  };

  const handleSend = (text: string) => {
    if (!activeId) return;
    const newMessage: ThreadMessage = {
      id: `m_${Date.now()}`,
      senderId: 'landlord',
      text,
      timestamp: new Date().toISOString(),
      read: false,
    };
    setMessagesByConversation((prev) => ({
      ...prev,
      [activeId]: [...(prev[activeId] || []), newMessage],
    }));
    setConversations((prev) =>
      prev.map((c) =>
        c.id === activeId ? { ...c, lastMessage: text, lastMessageTime: newMessage.timestamp } : c
      )
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#0a1a1f] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#c4a747] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const filteredConversations = conversations.filter((c) =>
    c.participantName.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const activeConversation = conversations.find((c) => c.id === activeId);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0a1a1f]">
      <LandlordNavbar user={user} />

      <div className="flex">
        <LandlordSidebar />

        <main className="flex-1 lg:ml-64 mt-16 p-6 lg:p-8">
          <div className="max-w-7xl mx-auto h-[calc(100vh-8rem)]">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Messages</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Communicate with tenants, vendors, and applicants
              </p>
            </div>

            <div className="flex gap-4 h-[calc(100%-4.5rem)]">
              <div className={`${activeId ? 'hidden sm:flex' : 'flex'} w-full sm:w-auto`}>
                <ConversationList
                  conversations={filteredConversations}
                  activeId={activeId}
                  searchQuery={searchQuery}
                  onSearch={setSearchQuery}
                  onSelect={handleSelect}
                />
              </div>

              <div className={`${activeId ? 'flex' : 'hidden sm:flex'} flex-1 flex-col`}>
                {activeConversation ? (
                  <>
                    <button
                      onClick={() => setActiveId(null)}
                      className="sm:hidden flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 mb-2"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      Back to conversations
                    </button>
                    <MessageThread
                      contactName={activeConversation.participantName}
                      contactRole={activeConversation.participantRole}
                      messages={messagesByConversation[activeConversation.id] || []}
                      onSend={handleSend}
                    />
                  </>
                ) : (
                  <div className="flex-1 bg-white dark:bg-[#1a2a2f] rounded-2xl border border-gray-200 dark:border-white/10 flex items-center justify-center">
                    <p className="text-sm text-gray-400">
                      Select a conversation to start messaging
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
