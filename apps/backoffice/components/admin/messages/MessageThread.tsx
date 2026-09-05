'use client';

import { LegacyInput } from '@getrentos/ui';

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
  onSend: (text: string) => void;
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
  const isResolved = status === 'RESOLVED';

  const handleSend = () => {
    if (!draft.trim() || sending || isResolved || loading || error) return;
    onSend(draft.trim());
    setDraft('');
  };

  return (
    <div className="flex-1 bg-card rounded-2xl border border-border flex flex-col overflow-hidden">
      <div className="p-4 border-b border-border flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-full bg-linear-to-r from-primary to-primary/60 flex items-center justify-center text-primary-foreground font-semibold text-xs shrink-0">
            {getInitials(contactName)}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">{contactName}</p>
            <p className="text-xs text-gray-400 truncate">
              {contactRole}
              {category ? ` · ${category}` : ''}
              {source ? ` · ${source}` : ''}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span
            className={`rounded-full px-2.5 py-1 text-xs font-medium ${
              isResolved
                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                : 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300'
            }`}
          >
            {isResolved ? 'Resolved' : 'Open'}
          </span>
          {!isResolved && onResolve && (
            <button
              type="button"
              onClick={onResolve}
              disabled={resolving}
              className="rounded-lg border border-border px-2.5 py-1 text-xs font-medium text-foreground hover:bg-accent disabled:opacity-50"
            >
              {resolving ? 'Resolving…' : 'Mark resolved'}
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {error ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <p className="text-sm text-destructive">
              The conversation messages could not be loaded.
            </p>
            {onRetry && (
              <button
                type="button"
                onClick={onRetry}
                disabled={retrying}
                className="mt-3 rounded-lg border border-border px-3 py-1.5 text-sm font-medium hover:bg-secondary disabled:opacity-50"
              >
                {retrying ? 'Retrying…' : 'Try again'}
              </button>
            )}
          </div>
        ) : loading ? (
          <div className="flex h-full items-center justify-center" role="status">
            <p className="text-sm text-muted-foreground">Loading messages…</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center">
            <MessageCircle className="w-8 h-8 text-muted-foreground/50 mb-2" />
            <p className="text-sm text-gray-400">No messages yet — say hello</p>
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
                      className={`text-[10px] ${isAdmin ? 'text-primary-foreground/60' : 'text-gray-400'}`}
                    >
                      {format(new Date(message.timestamp), 'h:mm a')}
                    </span>
                    {isAdmin &&
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

      <div className="p-3 border-t border-border flex items-center gap-2">
        <LegacyInput
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.nativeEvent.isComposing) handleSend();
          }}
          placeholder={isResolved ? 'This conversation is resolved' : 'Type a message...'}
          disabled={isResolved || sending || loading || error}
          className="flex-1 px-3 py-2 text-sm rounded-lg border border-border bg-gray-50 dark:bg-white/5 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <button
          type="button"
          onClick={handleSend}
          disabled={!draft.trim() || sending || isResolved || loading || error}
          aria-label={sending ? 'Sending message' : 'Send message'}
          className="p-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors shrink-0"
        >
          <Send className={`w-4 h-4 ${sending ? 'animate-pulse' : ''}`} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
};
