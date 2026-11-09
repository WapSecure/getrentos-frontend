'use client';

import type { ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { LucideIcon } from 'lucide-react';
import { DocumentPreviewButton } from '@sureground/ui';
import { landQueryKeys } from '@/lib/landDiligence';
import type { LandDiligenceDocument } from '@/types/land';

export interface LandCasePanelProps {
  propertyId: string;
  canReview: boolean;
  canApprove: boolean;
  /** For a `versioned` call a 409 means the case moved on and flags it stale; elsewhere a 409 is an ordinary refusal. */
  onError: (error: unknown, fallback: string, options?: { versioned?: boolean }) => void;
  onSuccess: (message: string) => void;
}

export function useInvalidateLandCase() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: landQueryKeys.diligenceRoot });
}

export const LandCaseSection = ({
  title,
  description,
  icon: Icon,
  actions,
  children,
  id,
}: {
  title: string;
  description?: ReactNode;
  icon?: LucideIcon;
  actions?: ReactNode;
  children: ReactNode;
  id?: string;
}) => (
  <section id={id} className="rounded-2xl border border-border bg-card p-5 shadow-sm">
    <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
      <div className="flex min-w-0 items-start gap-3">
        {Icon && (
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent text-primary">
            <Icon className="h-4 w-4" />
          </div>
        )}
        <div className="min-w-0">
          <h2 className="type-heading text-base">{title}</h2>
          {description && <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>}
        </div>
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
    {children}
  </section>
);

export const PanelMessage = ({ children }: { children: ReactNode }) => (
  <p className="rounded-xl bg-secondary/50 px-3 py-2.5 text-sm text-muted-foreground">{children}</p>
);

export const Fact = ({ label, value }: { label: string; value: ReactNode }) => (
  <div className="min-w-0">
    <p className="text-xs font-medium text-muted-foreground">{label}</p>
    <p className="mt-0.5 break-words text-sm text-foreground">{value}</p>
  </div>
);

export const LandDocumentPreview = ({
  document,
  onResolveUrl,
}: {
  document: Pick<LandDiligenceDocument, 'id' | 'url' | 'name' | 'mimeType'>;
  onResolveUrl?: (documentId: string) => Promise<string | null | undefined>;
}) => (
  <DocumentPreviewButton
    file={{ url: document.url, name: document.name, mimeType: document.mimeType ?? undefined }}
    label="Preview"
    resolveUrl={onResolveUrl ? () => onResolveUrl(document.id) : undefined}
  />
);

export const toDateInput = (value: string | null | undefined) =>
  value ? new Date(value).toISOString().slice(0, 10) : '';

export const fromDateInput = (value: string) =>
  value ? new Date(`${value}T00:00:00.000Z`).toISOString() : undefined;

export const tomorrowDateInput = () =>
  new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
