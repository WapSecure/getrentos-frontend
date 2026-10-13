'use client';

import { FileLock2, Link2, Unlink, Upload } from 'lucide-react';
import { Badge, Button } from '@getrentos/ui';
import { formatDate } from '@getrentos/shared';
import type {
  LandDiligenceCheck,
  LandDiligenceDocument,
  LandDiligenceDocumentLink,
} from '@/types/land';
import { humaniseEnum } from '@/lib/landDiligence';
import { LandCaseSection, LandDocumentPreview, PanelMessage } from './shared';

interface LandDocumentsPanelProps {
  documents: LandDiligenceDocument[];
  checks: LandDiligenceCheck[];
  canReview: boolean;
  onCite: (documentId: string) => void;
  onStopCiting: (document: LandDiligenceDocument, link: LandDiligenceDocumentLink) => void;
  /** Opens the staff upload (e.g. a registry search report). */
  onUpload: () => void;
  /** `documentId:checklistKey` of the citation being withdrawn. */
  unlinkingId: string | null;
  onResolveUrl?: (documentId: string) => Promise<string | null | undefined>;
}

/**
 * Every document on the property, cited or not. Files open through
 * short-lived signed links; citing records which checks a document backs —
 * one title deed can back several.
 */
export const LandDocumentsPanel = ({
  documents,
  checks,
  canReview,
  onCite,
  onStopCiting,
  onUpload,
  unlinkingId,
  onResolveUrl,
}: LandDocumentsPanelProps) => {
  const labelFor = (key?: string | null) =>
    key ? (checks.find((check) => check.key === key)?.label ?? key) : null;
  const linksOf = (document: LandDiligenceDocument) =>
    document.links ?? (document.link ? [document.link] : []);
  const cited = documents.filter((document) => linksOf(document).length > 0);
  const uncited = documents.filter((document) => linksOf(document).length === 0);

  return (
    <LandCaseSection
      title="Documents on this property"
      icon={FileLock2}
      description={`${cited.length} cited by this review · ${uncited.length} not cited`}
      actions={
        canReview ? (
          <Button
            variant="outline"
            size="xs"
            onClick={onUpload}
            icon={<Upload className="h-3.5 w-3.5" />}
          >
            Upload document
          </Button>
        ) : undefined
      }
    >
      {documents.length === 0 ? (
        <PanelMessage>
          This property has no documents yet. Request clarification for the title, survey plan or
          ownership proof, or upload evidence you obtained (e.g. a registry search), before
          deciding.
        </PanelMessage>
      ) : (
        <ul className="space-y-2">
          {[...cited, ...uncited].map((document) => {
            const links = linksOf(document);
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
                    {canReview && (
                      <Button
                        variant="outline"
                        size="xs"
                        onClick={() => onCite(document.id)}
                        icon={<Link2 className="h-3.5 w-3.5" />}
                      >
                        {links.length ? 'Cite on another check' : 'Cite'}
                      </Button>
                    )}
                  </div>
                </div>
                {links.map((link) => {
                  const checkLabel = labelFor(link.checklistKey);
                  const citationId = `${document.id}:${link.checklistKey ?? ''}`;
                  return (
                    <div
                      key={citationId}
                      className="mt-2 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground"
                    >
                      <Badge variant="success">
                        {checkLabel ? `Cited for: ${checkLabel}` : 'Cited, not tied to a check'}
                      </Badge>
                      <span>
                        by {link.linkedByName} on {formatDate(link.linkedAt)}
                      </span>
                      {canReview && (
                        <Button
                          variant="ghost"
                          size="xs"
                          className="text-destructive"
                          onClick={() => onStopCiting(document, link)}
                          isLoading={unlinkingId === citationId}
                          disabled={Boolean(unlinkingId)}
                          icon={<Unlink className="h-3.5 w-3.5" />}
                        >
                          Stop citing
                        </Button>
                      )}
                      {link.note && <span className="w-full text-foreground">“{link.note}”</span>}
                    </div>
                  );
                })}
              </li>
            );
          })}
        </ul>
      )}
    </LandCaseSection>
  );
};
