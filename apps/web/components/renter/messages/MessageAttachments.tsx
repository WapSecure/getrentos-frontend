'use client';

import { FileText, Image, Link as LinkIcon, Download, X } from 'lucide-react';

interface Attachment {
  name: string;
  type: string;
  url: string;
  size: string;
}

interface MessageAttachmentsProps {
  attachments: Attachment[];
  onDownload: (attachment: Attachment) => void;
  onRemove?: (index: number) => void;
}

export const MessageAttachments = ({
  attachments,
  onDownload,
  onRemove,
}: MessageAttachmentsProps) => {
  const renderAttachmentIcon = (type: string) => {
    if (type.startsWith('image/')) return <Image className="w-4 h-4" />;
    if (type === 'application/pdf') return <FileText className="w-4 h-4" />;
    return <LinkIcon className="w-4 h-4" />;
  };

  const formatFileSize = (size: string) => {
    const num = parseInt(size);
    if (num < 1024) return `${num} B`;
    if (num < 1048576) return `${(num / 1024).toFixed(1)} KB`;
    return `${(num / 1048576).toFixed(1)} MB`;
  };

  return (
    <div className="flex flex-wrap gap-2">
      {attachments.map((attachment, index) => (
        <div
          key={index}
          className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-800 rounded-lg text-sm group"
        >
          {renderAttachmentIcon(attachment.type)}
          <span className="truncate max-w-[120px]">{attachment.name}</span>
          <span className="text-xs text-gray-500">({formatFileSize(attachment.size)})</span>
          <button
            onClick={() => onDownload(attachment)}
            className="p-0.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Download className="w-3 h-3" />
          </button>
          {onRemove && (
            <button
              onClick={() => onRemove(index)}
              className="p-0.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      ))}
    </div>
  );
};
