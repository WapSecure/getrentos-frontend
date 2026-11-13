'use client';

import { Check, CheckCheck, FileText, Image as ImageIcon, Link2 } from '@sureground/icons';
import { RecordAvatar } from '@/components/shared/records/RecordParts';
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

  const renderAttachmentIcon = (type: string) => {
    const Icon = type.startsWith('image/')
      ? ImageIcon
      : type === 'application/pdf'
        ? FileText
        : Link2;
    return <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />;
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
          <RecordAvatar name={message.senderName} size="sm" className="h-8 w-8" />
        </div>
      )}

      <div className={`max-w-[70%] ${isCurrentUser ? 'order-1' : 'order-2'}`}>
        {!isCurrentUser && (
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-medium text-foreground">{message.senderName}</span>
            <span className="text-xs text-muted-foreground capitalize">{message.senderRole}</span>
          </div>
        )}

        <div
          className={`rounded-2xl px-3.5 py-2.5 ${
            isCurrentUser
              ? 'rounded-br-md bg-primary text-primary-foreground'
              : 'rounded-bl-md bg-secondary text-foreground'
          }`}
        >
          <p className="text-sm whitespace-pre-wrap break-words">{message.text}</p>

          {message.attachments && message.attachments.length > 0 && (
            <div className="mt-2 space-y-2">
              {message.attachments.map((attachment, index) => (
                <div
                  key={index}
                  className={`flex items-center gap-2 p-2 rounded-lg ${
                    isCurrentUser ? 'bg-primary-hover' : 'bg-background/60'
                  }`}
                >
                  {renderAttachmentIcon(attachment.type)}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{attachment.name}</p>
                    <p
                      className={`text-xs ${isCurrentUser ? 'text-primary-foreground/90' : 'text-muted-foreground'}`}
                    >
                      {formatFileSize(attachment.size)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div
          className={`flex items-center gap-1 mt-1 ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
        >
          <span className="text-xs text-muted-foreground">{formatTime(message.timestamp)}</span>
          {isCurrentUser && (
            <span className="text-muted-foreground">
              {message.read ? (
                <CheckCheck className="w-3 h-3 text-primary" />
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
