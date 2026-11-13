'use client';

import { EmptyState, SearchInput } from '@sureground/ui';
import { MessageCircle } from '@sureground/icons';
import { formatRelativeTime } from '@/lib/format';
import { RecordAvatar } from '@/components/shared/records/RecordParts';

export interface Conversation {
  id: string;
  participantName: string;
  participantRole: 'Tenant' | 'Vendor' | 'Applicant';
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
              aria-current={activeId === conversation.id || undefined}
              onClick={() => onSelect(conversation.id)}
              className={`relative flex w-full items-start gap-3 px-3 py-3.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring ${
                activeId === conversation.id
                  ? 'bg-primary/[0.06] before:absolute before:inset-y-2 before:left-0 before:w-0.5 before:rounded-full before:bg-primary'
                  : 'hover:bg-secondary/70'
              }`}
            >
              <RecordAvatar name={conversation.participantName} size="sm" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p
                    className={`truncate text-sm text-foreground ${conversation.unreadCount > 0 ? 'font-semibold' : 'font-medium'}`}
                  >
                    {conversation.participantName}
                  </p>
                  <span className="whitespace-nowrap text-xs tabular-nums text-muted-foreground">
                    {formatRelativeTime(conversation.lastMessageTime)}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mb-0.5">
                  {conversation.participantRole}
                </p>
                <p className="text-xs text-muted-foreground truncate">{conversation.lastMessage}</p>
              </div>
              {conversation.unreadCount > 0 && (
                <span className="mt-0.5 flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-primary px-1.5 text-2xs font-bold text-primary-foreground">
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
