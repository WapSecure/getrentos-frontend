'use client';

import { useRef, useEffect } from 'react';
import { Phone, Video, MoreVertical, Home } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { MessageBubble } from './MessageBubble';
import { MessageInput } from './MessageInput';
import { Conversation, Attachment } from '@/types/messages';

interface MessageThreadProps {
  conversation: Conversation;
  onSendMessage: (conversationId: string, text: string, attachments?: Attachment[]) => void;
  currentUser: { fullName: string } | null;
}

export const MessageThread = ({ conversation, onSendMessage, currentUser }: MessageThreadProps) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [conversation.messages]);

  const handleSend = (text: string, attachments?: Attachment[]) => {
    if (text.trim() || (attachments && attachments.length > 0)) {
      onSendMessage(conversation.id, text, attachments);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((word) => word[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <div className="bg-card rounded-xl border border-border flex flex-col h-[calc(100vh-300px)] min-h-[500px]">
      <div className="p-4 border-b border-border flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-linear-to-r from-primary to-primary/60 flex items-center justify-center text-white font-semibold text-sm">
            {getInitials(conversation.participantName)}
          </div>
          <div>
            <h3 className="font-semibold text-foreground">{conversation.participantName}</h3>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span className="capitalize">{conversation.participantRole}</span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                Online
              </span>
              <span>•</span>
              <Home className="w-3 h-3" />
              <span>{conversation.propertyName}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="px-2">
            <Phone className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" className="px-2">
            <Video className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" className="px-2">
            <MoreVertical className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {conversation.messages.map((message) => (
          <MessageBubble
            key={message.id}
            message={message}
            isCurrentUser={
              message.senderId === 'renter_001' || message.senderName === currentUser?.fullName
            }
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
