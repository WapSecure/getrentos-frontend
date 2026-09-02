'use client';

import { useEffect, useRef, useState } from 'react';
import { FileText, ImageIcon, Upload, X, Eye } from 'lucide-react';
import { cn } from '@getrentos/shared';
import { FilePreviewDialog } from './FilePreviewDialog';

export interface PendingUpload {
  id: string;
  file: File;
}

export const DEFAULT_ACCEPT =
  '.pdf,.doc,.docx,.jpg,.jpeg,.png,.webp,.gif,.txt,.csv,.xls,.xlsx,.mp4,.webm';

const ACCEPTED_TYPES: Record<string, boolean> = {
  pdf: true,
  doc: true,
  docx: true,
  jpg: true,
  jpeg: true,
  png: true,
  webp: true,
  gif: true,
  txt: true,
  csv: true,
  xls: true,
  xlsx: true,
  mp4: true,
  webm: true,
};

interface DocumentUploadProps {
  /** Controlled list of files the user has picked but not yet submitted. */
  value: PendingUpload[];
  onChange: (next: PendingUpload[]) => void;
  accept?: string;
  multiple?: boolean;
  /** Per-file size cap in MB (default 10). */
  maxSizeMB?: number;
  label?: string;
  hint?: string;
  disabled?: boolean;
  className?: string;
}

const formatBytes = (bytes: number): string => {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  if (bytes >= 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${bytes} B`;
};

const isImageFile = (file: File) => file.type.startsWith('image/');
const isPdfFile = (file: File) => file.type === 'application/pdf' || /\.pdf$/i.test(file.name);
const isVideoFile = (file: File) =>
  file.type.startsWith('video/') || /\.(mp4|webm|mov)$/i.test(file.name);

/**
 * Inline file picker with a good upload UX: drag & drop, a per-file thumbnail,
 * size/type checks and — most importantly — a live "Preview" button per file so
 * the user inspects the actual content (zoom/rotate/paginate) BEFORE submitting.
 */
export function DocumentUpload({
  value,
  onChange,
  accept = DEFAULT_ACCEPT,
  multiple = false,
  maxSizeMB = 10,
  label = 'Documents',
  hint,
  disabled,
  className,
}: DocumentUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewItem, setPreviewItem] = useState<PendingUpload | null>(null);
  // Live object URLs so preview/thumbnail work before any upload happens.
  const [objectUrls, setObjectUrls] = useState<Record<string, string>>({});

  useEffect(() => {
    const urls: Record<string, string> = {};
    for (const item of value) {
      if (isImageFile(item.file) || isPdfFile(item.file) || isVideoFile(item.file)) {
        urls[item.id] = URL.createObjectURL(item.file);
      }
    }
    setObjectUrls(urls);
    return () => {
      Object.values(urls).forEach((u) => URL.revokeObjectURL(u));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const addFiles = (files: FileList | File[] | null) => {
    if (!files || disabled) return;
    const incoming = Array.from(files);
    const tooBig = incoming.find((f) => f.size > maxSizeMB * 1024 * 1024);
    if (tooBig) {
      setError(`"${tooBig.name}" exceeds the ${maxSizeMB} MB limit.`);
      return;
    }
    const unsupported = incoming.find((f) => {
      const ext = f.name.split('.').pop()?.toLowerCase() ?? '';
      return !ACCEPTED_TYPES[ext];
    });
    if (unsupported) {
      setError(`"${unsupported.name}" is not an accepted file type.`);
      return;
    }
    setError(null);
    const next = multiple ? [...value] : [];
    for (const file of incoming) {
      next.push({ id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, file });
    }
    onChange(next);
  };

  const remove = (id: string) => onChange(value.filter((item) => item.id !== id));

  return (
    <div className={cn('space-y-2', className)}>
      <div
        onDragEnter={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          setDragActive(false);
        }}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          setDragActive(false);
          addFiles(e.dataTransfer.files);
        }}
        onClick={() => !disabled && inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if ((e.key === 'Enter' || e.key === ' ') && !disabled) inputRef.current?.click();
        }}
        className={cn(
          'cursor-pointer border-2 border-dashed rounded-xl px-4 py-6 text-center transition-colors',
          dragActive ? 'border-primary bg-accent' : 'border-border hover:border-primary',
          disabled && 'cursor-not-allowed opacity-60'
        )}
      >
        <Upload className="mx-auto h-6 w-6 text-muted-foreground" />
        <p className="mt-1.5 text-xs text-muted-foreground">
          <span className="text-primary font-medium">Click to browse</span> or drag &amp; drop
          {multiple ? ' files' : ' a file'}
        </p>
        {hint && <p className="mt-1 text-[11px] text-muted-foreground/70">{hint}</p>}
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          disabled={disabled}
          className="hidden"
          onChange={(e) => {
            addFiles(e.target.files);
            e.target.value = '';
          }}
        />
      </div>

      {label && value.length > 0 && (
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
      )}

      {value.map((item) => {
        const url = objectUrls[item.id];
        const isImage = isImageFile(item.file);
        const isPdf = isPdfFile(item.file);
        const isVideo = isVideoFile(item.file);
        const previewable = isImage || isPdf || isVideo;
        return (
          <div
            key={item.id}
            className="flex items-center gap-3 rounded-lg border border-border bg-card p-2"
          >
            {isImage && url ? (
              <img
                src={url}
                alt={item.file.name}
                className="h-12 w-12 shrink-0 rounded-md border border-border object-cover"
              />
            ) : (
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md border border-border bg-secondary/60 text-muted-foreground">
                {isImage ? <ImageIcon className="h-5 w-5" /> : <FileText className="h-5 w-5" />}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">{item.file.name}</p>
              <p className="text-[11px] text-muted-foreground">
                {formatBytes(item.file.size)}
                {isVideo ? ' · video' : ''}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              {previewable && url ? (
                <button
                  type="button"
                  onClick={() => setPreviewItem(item)}
                  title="Preview before upload"
                  className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-primary hover:bg-secondary"
                >
                  <Eye className="h-3.5 w-3.5" /> Preview
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => remove(item.id)}
                title="Remove file"
                className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:text-destructive hover:bg-secondary"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        );
      })}

      {error && (
        <p className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
          {error}
        </p>
      )}

      <FilePreviewDialog
        open={Boolean(previewItem)}
        onOpenChange={(open) => !open && setPreviewItem(null)}
        file={
          previewItem && objectUrls[previewItem.id]
            ? {
                url: objectUrls[previewItem.id],
                name: previewItem.file.name,
                mimeType: previewItem.file.type,
              }
            : null
        }
      />
    </div>
  );
}
