'use client';

import { useState } from 'react';
import { Send, MessageCircle, Check, CheckCheck } from 'lucide-react';
import { Alert, Button, EmptyState, Input } from '@getrentos/ui';
import { getInitials } from '@/lib/format';
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
    <div className="flex-1 bg-card rounded-2xl border border-border flex flex-col overflow-hidden">
      <div className="p-4 border-b border-border flex items-center gap-3">
        <div className="w-9 h-9 shrink-0 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-semibold text-xs">
          {getInitials(contactName)}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground">{contactName}</p>
          <p className="text-xs text-muted-foreground">{contactRole}</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
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
                  className={`max-w-[70%] rounded-2xl px-3.5 py-2 ${
                    isLandlord
                      ? 'bg-primary text-primary-foreground rounded-br-sm'
                      : 'bg-secondary text-foreground rounded-bl-sm'
                  }`}
                >
                  <p className="text-sm">{message.text}</p>
                  <div
                    className={`flex items-center gap-1 mt-1 ${isLandlord ? 'justify-end' : 'justify-start'}`}
                  >
                    <span
                      className={`text-[10px] ${isLandlord ? 'text-primary-foreground/60' : 'text-muted-foreground'}`}
                    >
                      {format(new Date(message.timestamp), 'h:mm a')}
                    </span>
                    {isLandlord &&
                      (message.read ? (
                        <CheckCheck className="w-3 h-3 text-primary-foreground/60" />
                      ) : (
                        <Check className="w-3 h-3 text-primary-foreground/60" />
                      ))}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="border-t border-border p-3">
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
