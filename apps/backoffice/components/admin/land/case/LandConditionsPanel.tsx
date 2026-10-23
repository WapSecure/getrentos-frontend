'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { CircleDashed } from 'lucide-react';
import { Badge, Button, ConfirmDialog } from '@getrentos/ui';
import { formatDate, unwrap } from '@getrentos/shared';
import { adminLandService } from '@/services/adminLandService';
import type { AdminLandDiligenceCondition, AdminLandDiligenceDetail } from '@/types/land';
import {
  LandCaseSection,
  LandDocumentPreview,
  useInvalidateLandCase,
  type LandCasePanelProps,
} from './shared';

const STATUS: Record<
  AdminLandDiligenceCondition['status'],
  { label: string; variant: 'info' | 'success' | 'neutral' }
> = {
  OPEN: { label: 'Open', variant: 'info' },
  MET: { label: 'Met', variant: 'success' },
  WAIVED: { label: 'Waived', variant: 'neutral' },
};

/**
 * The conditions of a conditional approval: what the owner sent for each, and
 * meeting or waiving it. The case turns VERIFIED when the last one is settled.
 */
export const LandConditionsPanel = ({
  detail,
  canApprove,
  onError,
  onSuccess,
  onResolveUrl,
}: LandCasePanelProps & {
  detail: AdminLandDiligenceDetail;
  onResolveUrl?: (documentId: string) => Promise<string | null | undefined>;
}) => {
  const { propertyId, diligence } = detail;
  const invalidate = useInvalidateLandCase();
  const [pending, setPending] = useState<{
    condition: AdminLandDiligenceCondition;
    outcome: 'meet' | 'waive';
  } | null>(null);
  const [note, setNote] = useState('');
  const conditions = diligence.conditions ?? [];
  const settle = useMutation({
    mutationFn: (input: NonNullable<typeof pending>) =>
      unwrap(
        adminLandService.settleCondition(propertyId, input.condition.id, input.outcome, {
          note,
          expectedVersion: diligence.version,
        })
      ),
    onSuccess: (result) => {
      invalidate();
      onSuccess(
        result.status === 'VERIFIED'
          ? 'Every condition is settled. The land is verified and open for reservations and offers.'
          : 'Condition settled. The owner has been told.'
      );
    },
    onError: (error) => onError(error, 'Unable to settle that condition.', { versioned: true }),
  });

  if (conditions.length === 0) return null;
  const isConditional = String(diligence.status) === 'CONDITIONAL';

  return (
    <LandCaseSection
      title="Conditions"
      icon={CircleDashed}
      description={
        isConditional
          ? 'Listed with these disclosed; reservations and offers open once each is met or waived.'
          : 'From the approval on record.'
      }
    >
      <ul className="space-y-3">
        {conditions.map((condition) => {
          const evidence = condition.evidenceDocumentId
            ? detail.documents?.find((document) => document.id === condition.evidenceDocumentId)
            : undefined;
          const status = STATUS[condition.status];
          return (
            <li key={condition.id} className="rounded-xl border border-border p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <p className="text-sm font-medium text-foreground">{condition.text}</p>
                <Badge variant={status.variant}>{status.label}</Badge>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {condition.dueAt ? `Expected by ${formatDate(condition.dueAt)}` : 'No due date'}
              </p>
              {condition.hasEvidence ? (
                <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
                  <span className="text-foreground">
                    Owner&apos;s evidence
                    {condition.evidenceAt ? ` (${formatDate(condition.evidenceAt)})` : ''}:{' '}
                    {evidence?.name ?? 'a document on the property'}
                  </span>
                  {evidence && (
                    <LandDocumentPreview document={evidence} onResolveUrl={onResolveUrl} />
                  )}
                </div>
              ) : (
                condition.status === 'OPEN' && (
                  <p className="mt-2 text-sm text-muted-foreground">
                    No evidence from the owner yet.
                  </p>
                )
              )}
              {condition.evidenceNote && (
                <p className="mt-1 text-sm text-muted-foreground">
                  Owner&apos;s note: {condition.evidenceNote}
                </p>
              )}
              {condition.decisionNote && (
                <p className="mt-2 text-sm text-muted-foreground">
                  {condition.decidedByName ?? 'Staff'}
                  {condition.decidedAt ? ` (${formatDate(condition.decidedAt)})` : ''}:{' '}
                  {condition.decisionNote}
                </p>
              )}
              {canApprove && isConditional && condition.status === 'OPEN' && (
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button size="sm" onClick={() => setPending({ condition, outcome: 'meet' })}>
                    Mark met
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setPending({ condition, outcome: 'waive' })}
                  >
                    Waive
                  </Button>
                </div>
              )}
            </li>
          );
        })}
      </ul>
      <ConfirmDialog
        open={pending !== null}
        onOpenChange={(open) => {
          if (!open) {
            setPending(null);
            setNote('');
          }
        }}
        title={pending?.outcome === 'waive' ? 'Waive this condition' : 'Mark this condition met'}
        description={
          pending?.outcome === 'waive'
            ? 'Say why it no longer applies. The owner sees this, and buyers stop seeing the condition.'
            : 'Say what you checked. The owner sees this. When it is the last open condition the land becomes verified.'
        }
        confirmLabel={pending?.outcome === 'waive' ? 'Waive' : 'Mark met'}
        tone="primary"
        promptLabel="Note"
        promptValue={note}
        onPromptChange={setNote}
        promptRequired
        promptMinLength={5}
        isLoading={settle.isPending}
        onConfirm={() => (pending ? settle.mutateAsync(pending) : undefined)}
      />
    </LandCaseSection>
  );
};
