'use client';

import { LegacyInput } from '@getrentos/ui';

import { useRef, useState } from 'react';
import { Send, Paperclip, MessageCircle, Check, CheckCheck } from 'lucide-react';
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
}: MessageThreadProps) => {
  const [draft, setDraft] = useState('');

  const handleSend = () => {
    if (!draft.trim()) return;
    onSend(draft.trim());
    setDraft('');
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAttach = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setDraft((prev) =>
        prev ? `${prev} \ud83d\udcce ${file.name}` : `\ud83d\udcce ${file.name}`
      );
    }
    e.target.value = '';
  };

  const isResolved = status === 'RESOLVED';

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
        {messages.length === 0 ? (
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
        <LegacyInput ref={fileInputRef} type="file" className="hidden" onChange={handleAttach} />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="p-2 rounded-lg text-gray-400 hover:bg-secondary shrink-0"
        >
          <Paperclip className="w-4 h-4" />
        </button>
        <LegacyInput
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Type a message..."
          className="flex-1 px-3 py-2 text-sm rounded-lg border border-border bg-gray-50 dark:bg-white/5 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <button
          onClick={handleSend}
          disabled={!draft.trim()}
          className="p-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors shrink-0"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
