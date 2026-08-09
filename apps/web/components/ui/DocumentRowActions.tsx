'use client';

import { useState } from 'react';
import { Share2, Download, Check } from 'lucide-react';
import { cn } from '@/lib/cn';

interface DocumentRowActionsProps {
  onShare?: () => void;
  onDownload?: () => void;
  showShare?: boolean;
  className?: string;
}

export const DocumentRowActions = ({
  onShare,
  onDownload,
  showShare = true,
  className,
}: DocumentRowActionsProps) => {
  const [sharing, setSharing] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const handleShare = () => {
    onShare?.();
    setSharing(true);
    window.setTimeout(() => setSharing(false), 1500);
  };

  const handleDownload = () => {
    onDownload?.();
    setDownloading(true);
    window.setTimeout(() => setDownloading(false), 1500);
  };

  return (
    <div className={cn('flex gap-1 flex-shrink-0', className)}>
      {showShare && (
        <button
          onClick={handleShare}
          title={sharing ? 'Link copied' : 'Share securely'}
          className={cn(
            'p-1.5 rounded-lg transition-colors',
            sharing
              ? 'text-green-600 dark:text-green-400'
              : 'text-muted-foreground hover:text-primary hover:bg-secondary'
          )}
        >
          {sharing ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
        </button>
      )}
      <button
        onClick={handleDownload}
        title={downloading ? 'Downloaded' : 'Download'}
        className={cn(
          'p-1.5 rounded-lg transition-colors',
          downloading
            ? 'text-green-600 dark:text-green-400'
            : 'text-muted-foreground hover:text-primary hover:bg-secondary'
        )}
      >
        {downloading ? <Check className="w-4 h-4" /> : <Download className="w-4 h-4" />}
      </button>
    </div>
  );
};
