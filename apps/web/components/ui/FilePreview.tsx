'use client';

import { useMemo, useState } from 'react';
import { Download, FileText, Maximize2, Minus, Plus, RotateCw } from 'lucide-react';
import { cn } from '@/lib/cn';

interface FilePreviewProps {
  url: string;
  name: string;
  mimeType?: string;
  className?: string;
}

const isImage = (mimeType: string | undefined, name: string) =>
  mimeType?.startsWith('image/') || /\.(avif|gif|jpe?g|png|webp)$/i.test(name);
const isPdf = (mimeType: string | undefined, name: string) =>
  mimeType === 'application/pdf' || /\.pdf$/i.test(name);

/** Secure in-app viewer for user-provided image and PDF URLs. */
export function FilePreview({ url, name, mimeType, className }: FilePreviewProps) {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const image = useMemo(() => isImage(mimeType, name), [mimeType, name]);
  const pdf = useMemo(() => isPdf(mimeType, name), [mimeType, name]);

  if (!url) return <UnsupportedPreview name={name} />;

  if (!image && !pdf) return <UnsupportedPreview name={name} url={url} />;

  return (
    <div
      className={cn('overflow-hidden rounded-2xl border border-border bg-secondary/45', className)}
    >
      <div className="flex items-center justify-between border-b border-border bg-card/80 px-3 py-2 backdrop-blur">
        <p className="truncate text-xs font-medium text-muted-foreground">{name}</p>
        <div className="ml-3 flex shrink-0 items-center gap-1">
          {image && (
            <>
              <PreviewButton
                label="Zoom out"
                onClick={() => setZoom((value) => Math.max(0.5, value - 0.25))}
              >
                <Minus className="h-4 w-4" />
              </PreviewButton>
              <span className="w-10 text-center text-[11px] tabular-nums text-muted-foreground">
                {Math.round(zoom * 100)}%
              </span>
              <PreviewButton
                label="Zoom in"
                onClick={() => setZoom((value) => Math.min(3, value + 0.25))}
              >
                <Plus className="h-4 w-4" />
              </PreviewButton>
              <PreviewButton
                label="Rotate image"
                onClick={() => setRotation((value) => (value + 90) % 360)}
              >
                <RotateCw className="h-4 w-4" />
              </PreviewButton>
            </>
          )}
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            aria-label="Open preview in a new tab"
          >
            <Maximize2 className="h-4 w-4" />
          </a>
        </div>
      </div>
      <div className="flex min-h-72 items-center justify-center overflow-auto p-6">
        {image ? (
          <img
            src={url}
            alt={name}
            className="max-h-[55vh] max-w-full object-contain transition-transform duration-200"
            style={{ transform: `scale(${zoom}) rotate(${rotation}deg)` }}
          />
        ) : (
          <iframe
            src={`${url}#view=FitH`}
            title={name}
            className="h-[55vh] w-full rounded-lg bg-card"
          />
        )}
      </div>
    </div>
  );
}

function PreviewButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground focus:outline-none focus:ring-4 focus:ring-primary/12"
    >
      {children}
    </button>
  );
}

function UnsupportedPreview({ name, url }: { name: string; url?: string }) {
  return (
    <div className="flex min-h-72 flex-col items-center justify-center gap-3 p-6 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-card">
        <FileText className="h-6 w-6 text-muted-foreground" />
      </div>
      <div>
        <p className="text-sm font-medium text-foreground">Preview unavailable</p>
        <p className="mt-1 text-xs text-muted-foreground">{name}</p>
      </div>
      {url && (
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 text-sm font-medium text-primary"
        >
          <Download className="h-4 w-4" /> Download file
        </a>
      )}
    </div>
  );
}
