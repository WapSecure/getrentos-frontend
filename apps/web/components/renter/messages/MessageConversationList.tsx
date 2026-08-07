'use client';

import { MessageCircle } from 'lucide-react';
import { ConversationItem } from './ConversationItem';
import { Conversation } from '@/types/messages';

interface MessageConversationListProps {
  conversations: Conversation[];
  selectedId: string | null;
  onSelect: (conversation: Conversation) => void;
  onPin: (id: string) => void;
  onArchive: (id: string) => void;
}

export const MessageConversationList = ({
  conversations,
  selectedId,
  onSelect,
  onPin,
  onArchive,
}: MessageConversationListProps) => {
  const pinned = conversations.filter((c) => c.isPinned && !c.isArchived);
  const active = conversations.filter((c) => !c.isPinned && !c.isArchived);
  const archived = conversations.filter((c) => c.isArchived);

  const renderConversations = (list: Conversation[], title?: string) => {
    if (list.length === 0) return null;

    return (
      <div>
        {title && (
          <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 px-3 py-2">
            {title}
          </h4>
        )}
        <div className="space-y-1">
          {list.map((conversation) => (
            <ConversationItem
              key={conversation.id}
              conversation={conversation}
              isSelected={selectedId === conversation.id}
              onSelect={() => onSelect(conversation)}
              onPin={() => onPin(conversation.id)}
              onArchive={() => onArchive(conversation.id)}
            />
          ))}
        </div>
      </div>
    );
  };

  if (conversations.length === 0) {
    return (
      <div className="bg-white dark:bg-[#1a2a2f] rounded-xl border border-gray-200 dark:border-white/10 p-8 text-center">
        <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">No conversations</h3>
        <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">
          Start a conversation with a landlord or agent
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-[#1a2a2f] rounded-xl border border-gray-200 dark:border-white/10 overflow-y-auto max-h-[400px]">
      <div className="p-2">
        {renderConversations(pinned, 'Pinned')}
        {renderConversations(active, 'All Conversations')}
        {renderConversations(archived, 'Archived')}
      </div>
    </div>
  );
};
