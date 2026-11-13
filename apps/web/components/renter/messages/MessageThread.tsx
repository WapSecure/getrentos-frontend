'use client';

import { useRef, useEffect } from 'react';
import { Home } from '@sureground/icons';
import { MessageBubble } from './MessageBubble';
import { MessageInput } from './MessageInput';
import { Conversation } from '@/types/messages';
import { RecordAvatar } from '@/components/shared/records/RecordParts';

interface MessageThreadProps {
  conversation: Conversation;
  onSendMessage: (conversationId: string, text: string, files?: File[]) => Promise<boolean>;
  currentUser: { id?: string; fullName: string } | null;
}

export const MessageThread = ({ conversation, onSendMessage, currentUser }: MessageThreadProps) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [conversation.messages]);

  const handleSend = (text: string, files?: File[]) => {
    if (text.trim() || (files && files.length > 0)) {
      return onSendMessage(conversation.id, text, files);
    }
    return Promise.resolve(false);
  };

  return (
    <div className="bg-card rounded-2xl border border-border shadow-xs flex flex-col h-[calc(100vh-300px)] min-h-[500px]">
      <div className="p-4 border-b border-border flex items-center">
        <div className="flex items-center gap-3">
          <RecordAvatar name={conversation.participantName} className="h-10 w-10" />
          <div>
            <h3 className="font-semibold text-foreground">{conversation.participantName}</h3>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
              <span className="capitalize">{conversation.participantRole}</span>
              {conversation.propertyName && (
                <span className="flex items-center gap-1">
                  <Home className="h-3 w-3" aria-hidden="true" />
                  {conversation.propertyName}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {(conversation.messages ?? []).map((message) => (
          <MessageBubble
            key={message.id}
            message={message}
            isCurrentUser={message.senderId === currentUser?.id}
          />
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t border-border">
        <MessageInput onSend={handleSend} />
      </div>
    </div>
  );
};
