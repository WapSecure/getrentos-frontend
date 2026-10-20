'use client';

import { MessageCircle } from 'lucide-react';
import { Card, EmptyState, SearchInput } from '@getrentos/ui';
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
    <Card className="w-full sm:w-80 shrink-0 flex flex-col">
      <div className="p-3 border-b border-border">
        <SearchInput
          value={searchQuery}
          onValueChange={onSearch}
          placeholder="Search conversations..."
          label="Search conversations"
        />
      </div>

      <div className="flex-1 overflow-y-auto divide-y divide-border">
        {conversations.length === 0 ? (
          <EmptyState icon={MessageCircle} title="No conversations found" size="compact" bare />
        ) : (
          conversations.map((conversation) => (
            <button
              key={conversation.id}
              type="button"
              aria-current={activeId === conversation.id ? 'true' : undefined}
              onClick={() => onSelect(conversation.id)}
              className={`w-full flex items-start gap-3 p-3 text-left transition-colors ${
                activeId === conversation.id ? 'bg-accent' : 'hover:bg-secondary'
              }`}
            >
              <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-semibold text-xs shrink-0">
                {getInitials(conversation.participantName)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium text-foreground truncate">
                    {conversation.participantName}
                  </p>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {formatRelativeTime(conversation.lastMessageTime)}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mb-0.5">
                  {conversation.participantRole}
                </p>
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
    </Card>
  );
};
