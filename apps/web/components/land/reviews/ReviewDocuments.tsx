'use client';

import { DocumentPreviewButton } from '@getrentos/ui';
import { ExternalLink, FileText, Link2 } from 'lucide-react';
import { formatDate } from '@/lib/format';
import type { LandReviewCheck, LandReviewDocument } from '@/types/landReviewer';

const humanise = (value: string) =>
  value.charAt(0) + value.slice(1).toLowerCase().replace(/_/g, ' ');

const sizeLabel = (bytes?: number | null) =>
  bytes
    ? bytes > 1_048_576
      ? `${(bytes / 1_048_576).toFixed(1)} MB`
      : `${Math.ceil(bytes / 1024)} KB`
    : null;

/**
 * Documents on the property. Stored files open in the in-app viewer from a
 * short-lived signed URL (reload the case if one has expired); an external
 * address is somebody's word, not a file we hold, and is labelled so.
 */
export const ReviewDocuments = ({
  documents,
  checks,
}: {
  documents: LandReviewDocument[];
  checks: LandReviewCheck[];
}) => {
  const checkLabel = (key?: string | null) => checks.find((c) => c.key === key)?.label ?? key;
  if (documents.length === 0) {
    return <p className="text-sm text-muted-foreground">No documents are on this property.</p>;
  }
  return (
    <ul className="divide-y divide-border rounded-2xl border border-border bg-card">
      {documents.map((doc) => (
        <li key={doc.id} className="flex flex-wrap items-center gap-3 p-3">
          <FileText className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-foreground">{doc.name}</p>
            <p className="text-xs text-muted-foreground">
              {[
                humanise(doc.documentType),
                doc.source === 'ADMIN' ? 'Added by GetRentos' : 'From the owner',
                formatDate(doc.uploadedAt),
                sizeLabel(doc.sizeBytes),
              ]
                .filter(Boolean)
                .join(' · ')}
            </p>
            {doc.link?.checklistKey && (
              <p className="mt-0.5 inline-flex items-center gap-1 text-xs text-primary">
                <Link2 className="h-3 w-3" aria-hidden /> Cited for{' '}
                {checkLabel(doc.link.checklistKey)}
              </p>
            )}
          </div>
          {doc.kind === 'STORED' ? (
            <DocumentPreviewButton
              file={{ url: doc.url, name: doc.name, mimeType: doc.mimeType }}
              label="Preview"
            />
          ) : (
            <a
              href={doc.url}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
            >
              External link{doc.host ? ` (${doc.host})` : ''}
              <ExternalLink className="h-3 w-3" aria-hidden />
            </a>
          )}
        </li>
      ))}
    </ul>
  );
};
