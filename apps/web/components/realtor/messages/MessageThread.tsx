'use client';

import { useRef, useState } from 'react';
import { Send, Paperclip, MessageCircle, Check, CheckCheck, X } from 'lucide-react';
import { Button, Card, EmptyState, IconButton, Input } from '@getrentos/ui';
import { getInitials } from '@/lib/format';
import { format } from 'date-fns';

export interface ThreadMessage {
  id: string;
  senderId: 'realtor' | 'contact';
  text: string;
  timestamp: string;
  read: boolean;
}
interface MessageThreadProps {
  contactName: string;
  contactRole: string;
  messages: ThreadMessage[];
  onSend: (text: string, files: File[]) => Promise<boolean> | boolean;
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const handleSend = async () => {
    if (!draft.trim() && files.length === 0) return;
    setIsSending(true);
    try {
      const ok = await onSend(draft.trim(), files);
      if (ok) {
        setDraft('');
        setFiles([]);
      }
    } finally {
      setIsSending(false);
    }
  };
  return (
    <Card className="flex-1 flex flex-col">
      <div className="p-4 border-b border-border flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-semibold text-xs">
          {getInitials(contactName)}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground truncate">{contactName}</p>
          <p className="text-xs text-muted-foreground">{contactRole}</p>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <EmptyState
              icon={MessageCircle}
              title="No messages yet: say hello"
              size="compact"
              bare
            />
          </div>
        ) : (
          messages.map((message) => {
            const isRealtor = message.senderId === 'realtor';
            return (
              <div
                key={message.id}
                className={`flex ${isRealtor ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[70%] rounded-2xl px-3.5 py-2 ${isRealtor ? 'bg-primary text-primary-foreground rounded-br-sm' : 'bg-secondary text-foreground rounded-bl-sm'}`}
                >
                  <p className="text-sm">{message.text}</p>
                  <div
                    className={`flex items-center gap-1 mt-1 ${isRealtor ? 'justify-end' : 'justify-start'}`}
                  >
                    <span
                      className={`text-[10px] ${isRealtor ? 'text-primary-foreground/60' : 'text-muted-foreground'}`}
                    >
                      {format(new Date(message.timestamp), 'h:mm a')}
                    </span>
                    {isRealtor &&
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
        {files.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-1">
            {files.map((file) => (
              <Button
                key={`${file.name}-${file.lastModified}`}
                variant="secondary"
                size="xs"
                aria-label={`Remove ${file.name}`}
                icon={<X className="h-3 w-3" aria-hidden />}
                iconPosition="right"
                onClick={() => setFiles((current) => current.filter((item) => item !== file))}
              >
                {file.name}
              </Button>
            ))}
          </div>
        )}
        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={(event) => {
              setFiles((current) =>
                [...current, ...Array.from(event.target.files || [])].slice(0, 5)
              );
              event.target.value = '';
            }}
          />
          <IconButton
            label="Attach a file"
            icon={<Paperclip />}
            onClick={() => fileInputRef.current?.click()}
          />
          <Input
            type="text"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => event.key === 'Enter' && handleSend()}
            placeholder="Type a message..."
            aria-label="Message"
            className="min-w-0 flex-1"
          />
          <Button
            onClick={handleSend}
            isLoading={isSending}
            disabled={!draft.trim() && files.length === 0}
            aria-label="Send message"
            className="shrink-0 px-3"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
};
