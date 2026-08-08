'use client';

import { Search } from 'lucide-react';
import { getInitials, formatRelativeTime } from '@/lib/format';

export interface Conversation {
  id: string;
  participantName: string;
  participantRole: 'Dispatcher' | 'Client' | 'Support';
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
}

interface ConversationListProps {
  conversations: Conversation[];
  activeId: string | null;
  searchQuery: string;
  onSearch: (value: string) => void;
  onSelect: (id: string) => void;
}

export const ConversationList = ({
  conversations,
  activeId,
  searchQuery,
  onSearch,
  onSelect,
}: ConversationListProps) => {
  return (
    <div className="w-full sm:w-80 flex-shrink-0 bg-white dark:bg-[#1a2a2f] rounded-2xl border border-gray-200 dark:border-white/10 flex flex-col overflow-hidden">
      <div className="p-3 border-b border-gray-200 dark:border-white/10">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="Search conversations..."
            className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-white/5 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#c4a747]"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto divide-y divide-gray-100 dark:divide-white/5">
        {conversations.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">
            No conversations found
          </p>
        ) : (
          conversations.map((conversation) => (
            <button
              key={conversation.id}
              onClick={() => onSelect(conversation.id)}
              className={`w-full flex items-start gap-3 p-3 text-left transition-colors ${
                activeId === conversation.id
                  ? 'bg-[#c4a747]/10'
                  : 'hover:bg-gray-50 dark:hover:bg-white/5'
              }`}
            >
              <div className="w-9 h-9 rounded-full bg-gradient-to-r from-[#c4a747] to-[#e8d5a3] flex items-center justify-center text-[#0a1a1f] font-semibold text-xs flex-shrink-0">
                {getInitials(conversation.participantName)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {conversation.participantName}
                  </p>
                  <span className="text-xs text-gray-400 whitespace-nowrap">
                    {formatRelativeTime(conversation.lastMessageTime)}
                  </span>
                </div>
                <p className="text-xs text-gray-400 mb-0.5">{conversation.participantRole}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {conversation.lastMessage}
                </p>
              </div>
              {conversation.unreadCount > 0 && (
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-[#c4a747] text-[#0a1a1f] text-[10px] font-bold flex items-center justify-center">
                  {conversation.unreadCount}
                </span>
              )}
            </button>
          ))
        )}
      </div>
    </div>
  );
};
