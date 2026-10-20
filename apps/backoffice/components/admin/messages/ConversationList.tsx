'use client';

import { SearchInput, Skeleton } from '@getrentos/ui';
import { getInitials, formatRelativeTime } from '@getrentos/shared';

export interface Conversation {
  id: string;
  participantName: string;
  participantRole: string;
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount: number;
}

interface ConversationListProps {
  conversations: Conversation[];
  activeId: string | null;
  searchQuery: string;
  onSearch: (value: string) => void;
  onSelect: (id: string) => void;
  isLoading?: boolean;
}

export const ConversationList = ({
  conversations,
  activeId,
  searchQuery,
  onSearch,
  onSelect,
  isLoading = false,
}: ConversationListProps) => {
  return (
    <div className="w-full sm:w-80 shrink-0 bg-card rounded-2xl border border-border flex flex-col overflow-hidden">
      <div className="p-3 border-b border-border">
        <SearchInput
          value={searchQuery}
          onValueChange={onSearch}
          placeholder="Search conversations..."
          label="Search conversations"
        />
      </div>

      <div className="flex-1 overflow-y-auto divide-y divide-border">
        {isLoading ? (
          <div className="space-y-2 p-3" role="status" aria-label="Loading conversations">
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={index} className="h-16 w-full rounded-lg" />
            ))}
          </div>
        ) : conversations.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">No conversations found</p>
        ) : (
          conversations.map((conversation) => (
            <button
              type="button"
              key={conversation.id}
              onClick={() => onSelect(conversation.id)}
              className={`w-full flex items-start gap-3 p-3 text-left transition-colors ${
                activeId === conversation.id ? 'bg-accent' : 'hover:bg-secondary'
              }`}
              aria-current={activeId === conversation.id ? 'true' : undefined}
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
                    {conversation.lastMessageTime
                      ? formatRelativeTime(conversation.lastMessageTime)
                      : ''}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mb-0.5">
                  {conversation.participantRole}
                </p>
                <p className="text-xs text-muted-foreground truncate">{conversation.lastMessage}</p>
              </div>
              {conversation.unreadCount > 0 && (
                <span
                  className="shrink-0 min-w-5 h-5 rounded-full bg-primary px-1 text-primary-foreground text-[10px] font-bold flex items-center justify-center"
                  aria-label={`${conversation.unreadCount} unread messages`}
                >
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
