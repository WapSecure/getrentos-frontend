'use client';

import { Check, CheckCheck } from 'lucide-react';
import { format } from 'date-fns';

interface Attachment {
  name: string;
  type: string;
  url: string;
  size: string;
}

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: 'renter' | 'landlord' | 'agent';
  text: string;
  timestamp: string;
  read: boolean;
  attachments?: Attachment[];
}

interface MessageBubbleProps {
  message: Message;
  isCurrentUser: boolean;
}

export const MessageBubble = ({ message, isCurrentUser }: MessageBubbleProps) => {
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, 'h:mm a');
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((word) => word[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const renderAttachmentIcon = (type: string) => {
    if (type.startsWith('image/')) return '🖼️';
    if (type === 'application/pdf') return '📄';
    return '🔗';
  };

  const formatFileSize = (size: string) => {
    const num = parseInt(size);
    if (num < 1024) return `${num} B`;
    if (num < 1048576) return `${(num / 1024).toFixed(1)} KB`;
    return `${(num / 1048576).toFixed(1)} MB`;
  };

  return (
    <div className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'} mb-4`}>
      {!isCurrentUser && (
        <div className="shrink-0 mr-3">
          <div className="w-8 h-8 rounded-full bg-linear-to-r from-primary to-primary/60 flex items-center justify-center text-white text-xs font-semibold">
            {getInitials(message.senderName)}
          </div>
        </div>
      )}

      <div className={`max-w-[70%] ${isCurrentUser ? 'order-1' : 'order-2'}`}>
        {!isCurrentUser && (
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-medium text-foreground">{message.senderName}</span>
            <span className="text-xs text-gray-500 capitalize">{message.senderRole}</span>
          </div>
        )}

        <div
          className={`rounded-2xl p-3 ${
            isCurrentUser ? 'bg-primary text-white' : 'bg-gray-100 dark:bg-gray-800 text-foreground'
          }`}
        >
          <p className="text-sm whitespace-pre-wrap break-words">{message.text}</p>

          {/* Attachments */}
          {message.attachments && message.attachments.length > 0 && (
            <div className="mt-2 space-y-2">
              {message.attachments.map((attachment, index) => (
                <div
                  key={index}
                  className={`flex items-center gap-2 p-2 rounded-lg ${
                    isCurrentUser ? 'bg-[#b89a3a]' : 'bg-white/50 dark:bg-gray-700/50'
                  }`}
                >
                  <span className="text-sm">{renderAttachmentIcon(attachment.type)}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{attachment.name}</p>
                    <p className="text-xs opacity-75">{formatFileSize(attachment.size)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div
          className={`flex items-center gap-1 mt-1 ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
        >
          <span className="text-xs text-gray-500">{formatTime(message.timestamp)}</span>
          {isCurrentUser && (
            <span className="text-gray-400">
              {message.read ? (
                <CheckCheck className="w-3 h-3 text-green-500" />
              ) : (
                <Check className="w-3 h-3" />
              )}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
