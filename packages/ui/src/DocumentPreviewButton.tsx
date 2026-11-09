'use client';

import { useState } from 'react';
import { Eye, Loader2 } from '@sureground/icons';
import { cn } from '@sureground/shared';
import { FilePreviewDialog } from './FilePreviewDialog';

export interface PreviewFile {
  url: string;
  name: string;
  mimeType?: string | null;
}

interface DocumentPreviewButtonProps {
  file?: PreviewFile | null;
  resolveUrl?: () => Promise<string | null | undefined>;
  name?: string;
  mimeType?: string;
  label?: string;
  title?: string;
  className?: string;
  disabled?: boolean;
}

export function DocumentPreviewButton({
  file,
  resolveUrl,
  name,
  mimeType,
  label,
  title,
  className,
  disabled,
}: DocumentPreviewButtonProps) {
  const [open, setOpen] = useState(false);
  const [preview, setPreview] = useState<PreviewFile | null>(null);
  const [loading, setLoading] = useState(false);

  const hasDirect = Boolean(file?.url);
  const canOpen = Boolean(hasDirect || resolveUrl);

  const handleOpen = async () => {
    if (loading || disabled || !canOpen) return;
    if (hasDirect && file) {
      setPreview(file);
      setOpen(true);
      return;
    }
    if (resolveUrl) {
      setLoading(true);
      try {
        const url = await resolveUrl();
        if (!url) return;
        setPreview({
          url,
          name: name ?? file?.name ?? 'Document',
          mimeType: mimeType ?? file?.mimeType,
        });
        setOpen(true);
      } catch {
        // The resolver already surfaces errors; keep the button quiet here.
      } finally {
        setLoading(false);
      }
    }
  };

  if (label) {
    return (
      <>
        <button
          type="button"
          onClick={handleOpen}
          disabled={disabled || loading || !canOpen}
          title={title ?? 'View document'}
          className={cn(
            'inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-medium transition-colors',
            'text-muted-foreground hover:text-primary hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-40',
            className
          )}
        >
          {loading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Eye className="h-3.5 w-3.5" />
          )}
          {loading ? 'Loading…' : label}
        </button>
        <FilePreviewDialog open={open} onOpenChange={setOpen} file={preview} />
      </>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        disabled={disabled || loading || !canOpen}
        title={title ?? 'View document'}
        aria-label={title ?? 'View document'}
        className={cn(
          'p-1.5 rounded-lg transition-colors text-muted-foreground hover:text-primary hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-40',
          className
        )}
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Eye className="w-4 h-4" />}
      </button>
      <FilePreviewDialog open={open} onOpenChange={setOpen} file={preview} />
    </>
  );
}
