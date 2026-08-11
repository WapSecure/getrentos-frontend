'use client';

import { useState, useRef } from 'react';
import { Send, Paperclip } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { MessageAttachments } from './MessageAttachments';

interface Attachment {
  name: string;
  type: string;
  url: string;
  size: string;
}

interface MessageInputProps {
  onSend: (text: string, files?: File[]) => void;
}

export const MessageInput = ({ onSend }: MessageInputProps) => {
  const [message, setMessage] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const previewAttachments: Attachment[] = files.map((file) => ({
    name: file.name,
    type: file.type,
    size: file.size.toString(),
    url: URL.createObjectURL(file),
  }));

  const handleSend = () => {
    if (message.trim() || files.length > 0) {
      onSend(message, files);
      setMessage('');
      setFiles([]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
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
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            rows={1}
            className="w-full px-4 py-2.5 rounded-xl border border-border bg-gray-50 dark:bg-card text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
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
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <Paperclip className="w-4 h-4 text-gray-500" />
          </button>
          <Button
            onClick={handleSend}
            disabled={!message.trim() && files.length === 0}
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
