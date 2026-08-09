'use client';

import { Pin, PinOff, Archive, ArchiveRestore, Home } from 'lucide-react';
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

const getRoleColor = (role: string) => {
  switch (role) {
    case 'landlord':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
    case 'agent':
      return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
  }
};

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
    >
      <div className="flex items-start gap-3">
        <div className="relative shrink-0">
          <div className="w-12 h-12 rounded-full bg-linear-to-r from-primary to-primary/60 flex items-center justify-center text-white font-semibold text-sm">
            {getInitials(conversation.participantName)}
          </div>
          {conversation.unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-[10px] text-white font-medium">
              {conversation.unreadCount}
            </span>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="font-medium text-foreground truncate">
                {conversation.participantName}
              </span>
              <span
                className={`text-xs px-1.5 py-0.5 rounded-full ${getRoleColor(conversation.participantRole)}`}
              >
                {conversation.participantRole}
              </span>
            </div>
            <span className="text-xs text-gray-500 shrink-0">
              {formatTime(conversation.lastMessageTime)}
            </span>
          </div>

          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-gray-500 shrink-0">
              <Home className="w-3 h-3 inline mr-0.5" />
              {conversation.propertyName}
            </span>
          </div>

          <p className="text-sm text-muted-foreground truncate mt-0.5">
            {conversation.lastMessage}
          </p>
        </div>
      </div>

      <div className="absolute right-2 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onPin();
          }}
          className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          title={conversation.isPinned ? 'Unpin' : 'Pin'}
        >
          {conversation.isPinned ? (
            <Pin className="w-3 h-3 text-primary" />
          ) : (
            <PinOff className="w-3 h-3 text-gray-400" />
          )}
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onArchive();
          }}
          className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          title={conversation.isArchived ? 'Unarchive' : 'Archive'}
        >
          {conversation.isArchived ? (
            <ArchiveRestore className="w-3 h-3 text-blue-500" />
          ) : (
            <Archive className="w-3 h-3 text-gray-400" />
          )}
        </button>
      </div>
    </div>
  );
};
