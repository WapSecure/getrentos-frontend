'use client';

import { Pin, PinOff, Archive, ArchiveRestore, Home } from 'lucide-react';
import { Badge, IconButton, type BadgeVariant } from '@getrentos/ui';
import { Conversation } from '@/types/messages';

interface ConversationItemProps {
  conversation: Conversation;
  isSelected: boolean;
  onSelect: () => void;
  onPin: () => void;
  onArchive: () => void;
}

const formatTime = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diff = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

  if (diff < 1) return 'Just now';
  if (diff < 60) return `${diff}m`;
  if (diff < 1440) return `${Math.floor(diff / 60)}h`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const getRoleVariant = (role: string): BadgeVariant => (role === 'landlord' ? 'info' : 'neutral');

export const ConversationItem = ({
  conversation,
  isSelected,
  onSelect,
  onPin,
  onArchive,
}: ConversationItemProps) => {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((word) => word[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <div
      className={`group relative p-3 rounded-xl cursor-pointer transition-all ${
        isSelected
          ? 'bg-accent border border-primary/20'
          : 'hover:bg-secondary border border-transparent'
      }`}
      onClick={onSelect}
      onKeyDown={(event) => {
        if (event.target !== event.currentTarget) return;
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onSelect();
        }
      }}
      role="button"
      tabIndex={0}
      aria-pressed={isSelected}
    >
      <div className="flex items-start gap-3">
        <div className="relative shrink-0">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
            {getInitials(conversation.participantName)}
          </div>
          {conversation.unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-destructive rounded-full flex items-center justify-center text-[10px] text-destructive-foreground font-medium">
              {conversation.unreadCount}
            </span>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2">
              <span className="font-medium text-foreground truncate">
                {conversation.participantName}
              </span>
              <Badge
                variant={getRoleVariant(conversation.participantRole)}
                className={
                  conversation.participantRole === 'agent'
                    ? 'border-purple/20 bg-purple-subtle text-purple'
                    : undefined
                }
              >
                {conversation.participantRole}
              </Badge>
            </div>
            <span className="text-xs text-muted-foreground shrink-0">
              {formatTime(conversation.lastMessageTime)}
            </span>
          </div>

          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-muted-foreground shrink-0">
              <Home className="w-3 h-3 inline mr-0.5" />
              {conversation.propertyName}
            </span>
          </div>

          <p className="text-sm text-muted-foreground truncate mt-0.5">
            {conversation.lastMessage}
          </p>
        </div>
      </div>

      <div className="absolute right-2 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity flex gap-1">
        <IconButton
          size="sm"
          label={conversation.isPinned ? 'Unpin' : 'Pin'}
          title={conversation.isPinned ? 'Unpin' : 'Pin'}
          icon={conversation.isPinned ? <Pin className="text-primary" /> : <PinOff />}
          onClick={(e) => {
            e.stopPropagation();
            onPin();
          }}
        />
        <IconButton
          size="sm"
          label={conversation.isArchived ? 'Unarchive' : 'Archive'}
          title={conversation.isArchived ? 'Unarchive' : 'Archive'}
          icon={
            conversation.isArchived ? <ArchiveRestore className="text-info" /> : <Archive />
          }
          onClick={(e) => {
            e.stopPropagation();
            onArchive();
          }}
        />
      </div>
    </div>
  );
};
