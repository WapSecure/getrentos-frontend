'use client';

import { FileLock2, Link2, Unlink } from 'lucide-react';
import { Badge, Button } from '@getrentos/ui';
import { formatDate } from '@getrentos/shared';
import type { LandDiligenceCheck, LandDiligenceDocument } from '@/types/land';
import { humaniseEnum } from '@/lib/landDiligence';
import { LandCaseSection, LandDocumentPreview, PanelMessage } from './shared';

interface LandDocumentsPanelProps {
  documents: LandDiligenceDocument[];
  checks: LandDiligenceCheck[];
  canReview: boolean;
  onCite: (documentId: string) => void;
  onStopCiting: (document: LandDiligenceDocument) => void;
  unlinkingId: string | null;
  onResolveUrl?: (documentId: string) => Promise<string | null | undefined>;
}

/**
 * Every document on the property, cited or not. Files open through
 * short-lived signed links; citing records which check a document backs.
 */
export const LandDocumentsPanel = ({
  documents,
  checks,
  canReview,
  onCite,
  onStopCiting,
  unlinkingId,
  onResolveUrl,
}: LandDocumentsPanelProps) => {
  const labelFor = (key?: string | null) =>
    key ? (checks.find((check) => check.key === key)?.label ?? key) : null;
  const cited = documents.filter((document) => document.link);
  const uncited = documents.filter((document) => !document.link);

  return (
    <LandCaseSection
      title="Documents on this property"
      icon={FileLock2}
      description={`${cited.length} cited by this review · ${uncited.length} not cited`}
    >
      {documents.length === 0 ? (
        <PanelMessage>
          This property has no documents yet. Request clarification for the title, survey plan or
          ownership proof before deciding.
        </PanelMessage>
      ) : (
        <ul className="space-y-2">
          {[...cited, ...uncited].map((document) => {
            const link = document.link;
            const checkLabel = labelFor(link?.checklistKey);
            return (
              <li key={document.id} className="rounded-xl border border-border bg-card p-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">{document.name}</p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                      {humaniseEnum(document.documentType)}
                      {document.uploadedBy?.legalName && ` · ${document.uploadedBy.legalName}`}
                      {` · ${formatDate(document.uploadedAt)}`}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <LandDocumentPreview document={document} onResolveUrl={onResolveUrl} />
                    {canReview &&
                      (link ? (
                        <Button
                          variant="ghost"
                          size="xs"
                          className="text-destructive"
                          onClick={() => onStopCiting(document)}
                          isLoading={unlinkingId === document.id}
                          disabled={Boolean(unlinkingId)}
                          icon={<Unlink className="h-3.5 w-3.5" />}
                        >
                          Stop citing
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="xs"
                          onClick={() => onCite(document.id)}
                          icon={<Link2 className="h-3.5 w-3.5" />}
                        >
                          Cite
                        </Button>
                      ))}
                  </div>
                </div>
                {link && (
                  <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                    <Badge variant="success">
                      {checkLabel ? `Cited for: ${checkLabel}` : 'Cited, not tied to a check'}
                    </Badge>
                    <span>
                      by {link.linkedByName} on {formatDate(link.linkedAt)}
                    </span>
                    {link.note && <span className="w-full text-foreground">“{link.note}”</span>}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </LandCaseSection>
  );
};
