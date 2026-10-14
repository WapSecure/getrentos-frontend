'use client';

import { LegacyInput } from '@getrentos/ui';

import { useRef, useState } from 'react';
import { Send, Paperclip, MessageCircle, Check, CheckCheck } from 'lucide-react';
import { getInitials } from '@/lib/format';
import { format } from 'date-fns';

export interface ThreadMessage {
  id: string;
  senderId: 'agent' | 'contact';
  text: string;
  timestamp: string;
  read: boolean;
}

interface MessageThreadProps {
  contactName: string;
  contactRole: string;
  messages: ThreadMessage[];
  onSend: (text: string, files: File[]) => Promise<boolean>;
}

export const MessageThread = ({
  contactName,
  contactRole,
  messages,
  onSend,
}: MessageThreadProps) => {
  const [draft, setDraft] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSend = async () => {
    if ((!draft.trim() && files.length === 0) || isSending) return;
    setIsSending(true);
    setErrorMessage(null);
    const stored = await onSend(draft.trim(), files);
    setIsSending(false);
    if (!stored) {
      setErrorMessage(
        'The message could not be sent or saved for syncing. Your draft is unchanged.'
      );
      return;
    }
    setDraft('');
    setFiles([]);
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAttach = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setFiles((prev) => [...prev, file]);
    e.target.value = '';
  };

  return (
    <div className="flex-1 bg-card rounded-2xl border border-border flex flex-col overflow-hidden">
      <div className="p-4 border-b border-border flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-semibold text-xs">
          {getInitials(contactName)}
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">{contactName}</p>
          <p className="text-xs text-gray-400">{contactRole}</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center">
            <MessageCircle className="w-8 h-8 text-muted-foreground/50 mb-2" />
            <p className="text-sm text-gray-400">No messages yet: say hello</p>
          </div>
        ) : (
          messages.map((message) => {
            const isAgent = message.senderId === 'agent';
            return (
              <div key={message.id} className={`flex ${isAgent ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[70%] rounded-2xl px-3.5 py-2 ${
                    isAgent
                      ? 'bg-primary text-primary-foreground rounded-br-sm'
                      : 'bg-secondary text-foreground rounded-bl-sm'
                  }`}
                >
                  <p className="text-sm">{message.text}</p>
                  <div
                    className={`flex items-center gap-1 mt-1 ${isAgent ? 'justify-end' : 'justify-start'}`}
                  >
                    <span
                      className={`text-[10px] ${isAgent ? 'text-primary-foreground/60' : 'text-gray-400'}`}
                    >
                      {format(new Date(message.timestamp), 'h:mm a')}
                    </span>
                    {isAgent &&
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
        {errorMessage && <p className="mb-2 text-xs text-destructive">{errorMessage}</p>}
        <div className="flex items-center gap-2">
          <LegacyInput ref={fileInputRef} type="file" className="hidden" onChange={handleAttach} />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isSending}
            aria-label="Attach a file"
            className="p-2 rounded-lg text-gray-400 hover:bg-secondary shrink-0"
          >
            <Paperclip className="w-4 h-4" />
          </button>
          <LegacyInput
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && void handleSend()}
            placeholder="Type a message..."
            className="flex-1 px-3 py-2 text-sm rounded-lg border border-border bg-gray-50 dark:bg-white/5 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <button
            type="button"
            onClick={() => void handleSend()}
            disabled={isSending || (!draft.trim() && files.length === 0)}
            aria-label={isSending ? 'Saving message' : 'Send message'}
            className="p-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
