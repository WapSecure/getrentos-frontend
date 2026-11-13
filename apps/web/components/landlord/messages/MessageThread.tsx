'use client';

import { useState } from 'react';
import { Send, MessageCircle, Check, CheckCheck } from '@sureground/icons';
import { Alert, Button, EmptyState, Input } from '@sureground/ui';
import { RecordAvatar } from '@/components/shared/records/RecordParts';
import { format } from 'date-fns';

export interface ThreadMessage {
  id: string;
  senderId: 'landlord' | 'contact';
  text: string;
  timestamp: string;
  read: boolean;
}

interface MessageThreadProps {
  contactName: string;
  contactRole: string;
  messages: ThreadMessage[];
  onSend: (text: string) => Promise<boolean>;
}

export const MessageThread = ({
  contactName,
  contactRole,
  messages,
  onSend,
}: MessageThreadProps) => {
  const [draft, setDraft] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSend = async () => {
    if (!draft.trim() || isSending) return;
    setIsSending(true);
    setErrorMessage(null);
    const sent = await onSend(draft.trim());
    setIsSending(false);
    if (!sent) {
      setErrorMessage('Your message could not be sent. Your draft is unchanged.');
      return;
    }
    setDraft('');
  };

  return (
    <div className="flex flex-1 flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-xs">
      <div className="flex items-center gap-3 border-b border-border px-4 py-3.5">
        <RecordAvatar name={contactName} size="sm" />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-foreground">{contactName}</p>
          <p className="text-xs text-muted-foreground">{contactRole}</p>
        </div>
      </div>

      <div className="flex-1 space-y-2.5 overflow-y-auto bg-secondary/30 p-4 sm:px-5">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center">
            <EmptyState
              icon={MessageCircle}
              title="No messages yet: say hello"
              size="compact"
              bare
            />
          </div>
        ) : (
          messages.map((message) => {
            const isLandlord = message.senderId === 'landlord';
            return (
              <div
                key={message.id}
                className={`flex ${isLandlord ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-3.5 py-2 shadow-xs sm:max-w-[70%] ${
                    isLandlord
                      ? 'bg-primary text-primary-foreground rounded-br-sm'
                      : 'border border-border bg-card text-foreground rounded-bl-sm'
                  }`}
                >
                  <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">
                    {message.text}
                  </p>
                  <div
                    className={`flex items-center gap-1 mt-1 ${isLandlord ? 'justify-end' : 'justify-start'}`}
                  >
                    <span
                      className={`text-2xs ${isLandlord ? 'text-primary-foreground/90' : 'text-muted-foreground'}`}
                    >
                      {format(new Date(message.timestamp), 'h:mm a')}
                    </span>
                    {isLandlord &&
                      (message.read ? (
                        <CheckCheck className="w-3 h-3 text-primary-foreground/90" />
                      ) : (
                        <Check className="w-3 h-3 text-primary-foreground/90" />
                      ))}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="border-t border-border bg-card p-3">
        {errorMessage && (
          <Alert variant="danger" className="mb-2">
            {errorMessage}
          </Alert>
        )}
        <div className="flex items-center gap-2">
          <Input
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && void handleSend()}
            placeholder="Type a message..."
            aria-label="Message"
            className="flex-1 min-w-0"
          />
          <Button
            className="shrink-0 px-3"
            onClick={() => void handleSend()}
            disabled={!draft.trim()}
            isLoading={isSending}
            aria-label={isSending ? 'Sending message' : 'Send message'}
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};
