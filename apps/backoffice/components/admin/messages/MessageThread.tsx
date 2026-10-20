'use client';

import { Alert, Badge, Button, IconButton, Input, Skeleton } from '@getrentos/ui';

import { useState } from 'react';
import { Send, MessageCircle, Check, CheckCheck } from 'lucide-react';
import { getInitials } from '@getrentos/shared';
import { format } from 'date-fns';

export interface ThreadMessage {
  id: string;
  senderId: 'admin' | 'contact';
  text: string;
  timestamp: string;
  read: boolean;
}

interface MessageThreadProps {
  contactName: string;
  contactRole: string;
  messages: ThreadMessage[];
  onSend: (text: string) => Promise<boolean>;
  status?: string;
  category?: string | null;
  source?: string | null;
  onResolve?: () => void;
  resolving?: boolean;
  sending?: boolean;
  loading?: boolean;
  error?: boolean;
  retrying?: boolean;
  onRetry?: () => void;
}

export const MessageThread = ({
  contactName,
  contactRole,
  messages,
  onSend,
  status,
  category,
  source,
  onResolve,
  resolving = false,
  sending = false,
  loading = false,
  error = false,
  retrying = false,
  onRetry,
}: MessageThreadProps) => {
  const [draft, setDraft] = useState('');
  const [sendError, setSendError] = useState<string | null>(null);
  const isResolved = status === 'RESOLVED';

  const handleSend = async () => {
    if (!draft.trim() || sending || isResolved || loading || error) return;
    setSendError(null);
    const sent = await onSend(draft.trim());
    if (!sent) {
      setSendError('The message could not be sent. Your draft is unchanged.');
      return;
    }
    setDraft('');
  };

  return (
    <div className="flex-1 bg-card rounded-2xl border border-border flex flex-col overflow-hidden">
      <div className="p-4 border-b border-border flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-semibold text-xs shrink-0">
            {getInitials(contactName)}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">{contactName}</p>
            <p className="text-xs text-muted-foreground truncate">
              {contactRole}
              {category ? ` · ${category}` : ''}
              {source ? ` · ${source}` : ''}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Badge variant={isResolved ? 'success' : 'warning'}>
            {isResolved ? 'Resolved' : 'Open'}
          </Badge>
          {!isResolved && onResolve && (
            <Button
              variant="outline"
              size="xs"
              onClick={onResolve}
              isLoading={resolving}
              loadingText="Resolving…"
            >
              Mark resolved
            </Button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3" aria-live="polite" aria-busy={loading}>
        {error ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <p className="text-sm text-destructive">
              The conversation messages could not be loaded.
            </p>
            {onRetry && (
              <Button
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={onRetry}
                isLoading={retrying}
                loadingText="Retrying…"
              >
                Try again
              </Button>
            )}
          </div>
        ) : loading ? (
          <div className="space-y-3" role="status" aria-label="Loading messages">
            <Skeleton className="h-10 w-2/3 rounded-2xl" />
            <Skeleton className="ml-auto h-10 w-1/2 rounded-2xl" />
            <Skeleton className="h-10 w-3/5 rounded-2xl" />
          </div>
        ) : messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center">
            <MessageCircle className="w-8 h-8 text-muted-foreground/50 mb-2" aria-hidden="true" />
            <p className="text-sm text-muted-foreground">No messages yet: say hello</p>
          </div>
        ) : (
          messages.map((message) => {
            const isAdmin = message.senderId === 'admin';
            return (
              <div key={message.id} className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[70%] rounded-2xl px-3.5 py-2 ${
                    isAdmin
                      ? 'bg-primary text-primary-foreground rounded-br-sm'
                      : 'bg-secondary text-foreground rounded-bl-sm'
                  }`}
                >
                  <p className="text-sm">{message.text}</p>
                  <div
                    className={`flex items-center gap-1 mt-1 ${isAdmin ? 'justify-end' : 'justify-start'}`}
                  >
                    <span
                      className={`text-[10px] ${isAdmin ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}
                    >
                      {format(new Date(message.timestamp), 'h:mm a')}
                    </span>
                    {isAdmin &&
                      (message.read ? (
                        <CheckCheck
                          className="w-3 h-3 text-primary-foreground/80"
                          aria-label="Read"
                        />
                      ) : (
                        <Check className="w-3 h-3 text-primary-foreground/80" aria-label="Sent" />
                      ))}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="border-t border-border p-3">
        {sendError && (
          <Alert variant="danger" className="mb-2">
            {sendError}
          </Alert>
        )}
        <div className="flex items-center gap-2">
          <Input
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.nativeEvent.isComposing) void handleSend();
            }}
            placeholder={isResolved ? 'This conversation is resolved' : 'Type a message...'}
            aria-label="Message"
            disabled={isResolved || sending || loading || error}
            className="flex-1"
          />
          <IconButton
            variant="secondary"
            onClick={() => void handleSend()}
            disabled={!draft.trim() || isResolved || loading || error}
            isLoading={sending}
            label={sending ? 'Sending message' : 'Send message'}
            icon={<Send aria-hidden="true" />}
          />
        </div>
      </div>
    </div>
  );
};
