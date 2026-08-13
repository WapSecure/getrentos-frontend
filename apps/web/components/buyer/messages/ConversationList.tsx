'use client';

import { LegacyInput } from '@/components/ui/LegacyInput';

import { Search } from 'lucide-react';
import { getInitials, formatRelativeTime } from '@/lib/format';

export interface Conversation {
  id: string;
  participantName: string;
  participantRole: 'Owner' | 'Realtor' | 'Support';
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
    <div className="w-full sm:w-80 shrink-0 bg-card rounded-2xl border border-border flex flex-col overflow-hidden">
      <div className="p-3 border-b border-border">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <LegacyInput
            type="text"
            value={searchQuery}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="Search conversations..."
            className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-border bg-gray-50 dark:bg-white/5 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto divide-y divide-border">
        {conversations.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">No conversations found</p>
        ) : (
          conversations.map((conversation) => (
            <button
              key={conversation.id}
              onClick={() => onSelect(conversation.id)}
              className={`w-full flex items-start gap-3 p-3 text-left transition-colors ${
                activeId === conversation.id ? 'bg-accent' : 'hover:bg-secondary'
              }`}
            >
              <div className="w-9 h-9 rounded-full bg-linear-to-r from-primary to-primary/60 flex items-center justify-center text-primary-foreground font-semibold text-xs shrink-0">
                {getInitials(conversation.participantName)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium text-foreground truncate">
                    {conversation.participantName}
                  </p>
                  <span className="text-xs text-gray-400 whitespace-nowrap">
                    {formatRelativeTime(conversation.lastMessageTime)}
                  </span>
                </div>
                <p className="text-xs text-gray-400 mb-0.5">{conversation.participantRole}</p>
                <p className="text-xs text-muted-foreground truncate">{conversation.lastMessage}</p>
              </div>
              {conversation.unreadCount > 0 && (
                <span className="shrink-0 w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
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
