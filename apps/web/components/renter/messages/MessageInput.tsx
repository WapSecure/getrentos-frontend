'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Send, Paperclip } from 'lucide-react';
import { Button, IconButton, Textarea } from '@getrentos/ui';
import { MessageAttachments } from './MessageAttachments';

interface Attachment {
  name: string;
  type: string;
  url: string;
  size: string;
}

interface MessageInputProps {
  onSend: (text: string, files?: File[]) => Promise<boolean>;
}

export const MessageInput = ({ onSend }: MessageInputProps) => {
  const [message, setMessage] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [isSending, setIsSending] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const previewAttachments: Attachment[] = useMemo(
    () =>
      files.map((file) => ({
        name: file.name,
        type: file.type,
        size: file.size.toString(),
        url: URL.createObjectURL(file),
      })),
    [files]
  );

  useEffect(
    () => () => previewAttachments.forEach((attachment) => URL.revokeObjectURL(attachment.url)),
    [previewAttachments]
  );

  const handleSend = async () => {
    if ((message.trim() || files.length > 0) && !isSending) {
      setIsSending(true);
      const sent = await onSend(message, files);
      setIsSending(false);
      if (!sent) return;
      setMessage('');
      setFiles([]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files;
    if (selected) {
      setFiles([...files, ...Array.from(selected)]);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveAttachment = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const handleDownloadAttachment = (attachment: Attachment) => {
    window.open(attachment.url, '_blank');
  };

  return (
    <div className="space-y-2">
      {previewAttachments.length > 0 && (
        <MessageAttachments
          attachments={previewAttachments}
          onDownload={handleDownloadAttachment}
          onRemove={handleRemoveAttachment}
        />
      )}

      <div className="flex items-end gap-2">
        <div className="flex-1 relative">
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            rows={1}
            aria-label="Message"
            className="resize-none"
            style={{ minHeight: '44px', maxHeight: '120px' }}
          />
        </div>

        <div className="flex items-center gap-1">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFileUpload}
            className="hidden"
            accept="image/*,.pdf,.doc,.docx"
          />
          <IconButton
            label="Attach files"
            icon={<Paperclip />}
            onClick={() => fileInputRef.current?.click()}
            disabled={isSending}
          />
          <Button
            onClick={() => void handleSend()}
            disabled={isSending || (!message.trim() && files.length === 0)}
            isLoading={isSending}
            aria-label={isSending ? 'Sending message' : 'Send message'}
            variant="primary"
            className="p-2.5 rounded-xl"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};
