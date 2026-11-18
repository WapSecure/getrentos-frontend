'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { format, isToday } from 'date-fns';
import { MessageCircle, Send } from '@sureground/icons';
import { Alert, Button, EmptyState, Textarea } from '@sureground/ui';
import { RecordAvatar } from '@/components/shared/records/RecordParts';
import type { EstateOfficeMessage } from '@/types/estate';

export const OFFICE_MESSAGE_MAX_LENGTH = 2000;

interface OfficeConversationProps {
  title: string;
  subtitle?: string;
  messages: EstateOfficeMessage[];
  viewer: 'office' | 'resident';
  onSend: (body: string) => Promise<boolean>;
  emptyState: ReactNode;
  placeholder: string;
}

const formatSentAt = (value: string) => {
  const date = new Date(value);
  return isToday(date) ? format(date, 'h:mm a') : format(date, 'd MMM, h:mm a');
};

export function OfficeConversation({
  title,
  subtitle,
  messages,
  viewer,
  onSend,
  emptyState,
  placeholder,
}: OfficeConversationProps) {
  const [draft, setDraft] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' });
  }, [messages.length]);

  const handleSend = async () => {
    const body = draft.trim();
    if (!body || isSending) return;
    setIsSending(true);
    setErrorMessage(null);
    const sent = await onSend(body);
    setIsSending(false);
    if (!sent) {
      setErrorMessage('Your message could not be sent. Your draft is unchanged.');
      return;
    }
    setDraft('');
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-xs">
      <div className="flex items-center gap-3 border-b border-border px-4 py-3.5">
        <RecordAvatar name={title} size="sm" />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-foreground">{title}</p>
          {subtitle && <p className="truncate text-xs text-muted-foreground">{subtitle}</p>}
        </div>
      </div>

      <div className="min-h-0 flex-1 space-y-2.5 overflow-y-auto bg-secondary/30 p-4 sm:px-5">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center">{emptyState}</div>
        ) : (
          messages.map((message) => {
            const mine = message.fromOffice === (viewer === 'office');
            return (
              <div key={message.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[80%] rounded-2xl px-3.5 py-2 shadow-xs sm:max-w-[70%] ${
                    mine
                      ? 'rounded-br-sm bg-primary text-primary-foreground'
                      : 'rounded-bl-sm border border-border bg-card text-foreground'
                  }`}
                >
                  {!mine || viewer === 'office' ? (
                    <p
                      className={`mb-0.5 text-xs font-medium ${mine ? 'text-primary-foreground/90' : 'text-muted-foreground'}`}
                    >
                      {message.senderName}
                    </p>
                  ) : null}
                  <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">
                    {message.body}
                  </p>
                  <p
                    className={`mt-1 text-2xs ${mine ? 'text-right text-primary-foreground/90' : 'text-muted-foreground'}`}
                  >
                    {formatSentAt(message.createdAt)}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={endRef} />
      </div>

      <div className="border-t border-border bg-card p-3">
        {errorMessage && (
          <Alert variant="danger" className="mb-2">
            {errorMessage}
          </Alert>
        )}
        <div className="flex items-end gap-2">
          <Textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault();
                void handleSend();
              }
            }}
            rows={2}
            maxLength={OFFICE_MESSAGE_MAX_LENGTH}
            placeholder={placeholder}
            aria-label="Message"
            className="min-w-0 flex-1 resize-none"
          />
          <Button
            className="shrink-0 px-3"
            onClick={() => void handleSend()}
            disabled={!draft.trim()}
            isLoading={isSending}
            aria-label={isSending ? 'Sending message' : 'Send message'}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export function NoOfficeMessages({ title, description }: { title: string; description: string }) {
  return (
    <EmptyState icon={MessageCircle} title={title} description={description} size="compact" bare />
  );
}
