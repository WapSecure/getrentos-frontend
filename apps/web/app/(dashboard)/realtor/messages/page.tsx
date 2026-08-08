'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { RealtorNavbar } from '@/components/realtor/navigation/RealtorNavbar';
import { RealtorSidebar } from '@/components/realtor/dashboard/RealtorSidebar';
import {
  ConversationList,
  type Conversation,
} from '@/components/realtor/messages/ConversationList';
import { MessageThread, type ThreadMessage } from '@/components/realtor/messages/MessageThread';
import { ROUTES, isAuthenticated, STORAGE_KEYS, getDashboardRoute } from '@/lib/constants/auth';

const mockConversations: Conversation[] = [
  {
    id: 'conv_001',
    participantName: 'Adaeze Okafor',
    participantRole: 'Client',
    lastMessage: 'Please go ahead and list it whenever ready.',
    lastMessageTime: '2026-08-07T14:00:00.000Z',
    unreadCount: 1,
  },
  {
    id: 'conv_002',
    participantName: 'Blessing Eze',
    participantRole: 'Buyer',
    lastMessage: 'Is the seller open to negotiating the price?',
    lastMessageTime: '2026-08-07T08:20:00.000Z',
    unreadCount: 2,
  },
  {
    id: 'conv_003',
    participantName: 'GetRentos Support',
    participantRole: 'Support',
    lastMessage: 'Your license verification has been approved.',
    lastMessageTime: '2026-08-01T10:00:00.000Z',
    unreadCount: 0,
  },
];

const mockMessages: Record<string, ThreadMessage[]> = {
  conv_001: [
    {
      id: 'm1',
      senderId: 'realtor',
      text: 'The listing photos and description are ready for Ocean View Towers.',
      timestamp: '2026-08-07T13:50:00.000Z',
      read: true,
    },
    {
      id: 'm2',
      senderId: 'contact',
      text: 'Please go ahead and list it whenever ready.',
      timestamp: '2026-08-07T14:00:00.000Z',
      read: false,
    },
  ],
  conv_002: [
    {
      id: 'm1',
      senderId: 'contact',
      text: 'Is the seller open to negotiating the price?',
      timestamp: '2026-08-07T08:20:00.000Z',
      read: false,
    },
  ],
  conv_003: [
    {
      id: 'm1',
      senderId: 'contact',
      text: 'Your license verification has been approved.',
      timestamp: '2026-08-01T10:00:00.000Z',
      read: true,
    },
  ],
};

export default function RealtorMessagesPage() {
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
        if (parsedUser.role && parsedUser.role !== 'realtor') {
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
      senderId: 'realtor',
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
      <RealtorNavbar user={user} />

      <div className="flex">
        <RealtorSidebar />

        <main className="flex-1 lg:ml-64 mt-16 p-6 lg:p-8">
          <div className="max-w-7xl mx-auto h-[calc(100vh-8rem)]">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Messages</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Communicate with clients, leads, and support
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
