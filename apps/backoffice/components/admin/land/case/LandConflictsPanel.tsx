'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery } from '@tanstack/react-query';
import { CheckCircle2, ShieldAlert, XCircle } from 'lucide-react';
import { Badge, Button, ConfirmDialog, ListSkeleton, type BadgeVariant } from '@getrentos/ui';
import { formatDate, unwrap } from '@getrentos/shared';
import { adminLandService } from '@/services/adminLandService';
import type { LandConflict } from '@/types/land';
import { humaniseEnum, landQueryKeys } from '@/lib/landDiligence';
import {
  LandCaseSection,
  PanelMessage,
  useInvalidateLandCase,
  type LandCasePanelProps,
} from './shared';

const statusVariant: Record<string, BadgeVariant> = {
  OPEN: 'warning',
  CONFIRMED: 'danger',
  DISMISSED: 'neutral',
};

const kindLabel: Record<string, string> = {
  TITLE_NUMBER: 'Same title number',
  SURVEY_NUMBER: 'Same survey number',
  BOUNDARY_OVERLAP: 'Overlapping boundary',
};

/**
 * Duplicate-title, duplicate-survey and overlapping-boundary clashes with
 * other parcels. A resolution applies to both parcels, so it needs a reason.
 */
export const LandConflictsPanel = ({
  propertyId,
  canApprove,
  onError,
  onSuccess,
}: Omit<LandCasePanelProps, 'canReview'>) => {
  const invalidate = useInvalidateLandCase();
  const [pending, setPending] = useState<{
    conflict: LandConflict;
    decision: 'DISMISS' | 'CONFIRM';
  } | null>(null);
  const [note, setNote] = useState('');

  const conflicts = useQuery({
    queryKey: landQueryKeys.caseSection(propertyId, 'conflicts'),
    queryFn: () => unwrap(adminLandService.listConflicts(propertyId)),
  });

  const resolve = useMutation({
    mutationFn: ({
      conflictId,
      decision,
    }: {
      conflictId: string;
      decision: 'DISMISS' | 'CONFIRM';
    }) =>
      unwrap(
        adminLandService.resolveConflict(propertyId, conflictId, { decision, note: note.trim() })
      ),
    onSuccess: (_result, { decision }) => {
      invalidate();
      setNote('');
      onSuccess(
        decision === 'DISMISS'
          ? 'Conflict dismissed on both parcels.'
          : 'Conflict confirmed. It now blocks approval on both parcels.'
      );
    },
    onError: (error) => onError(error, 'Unable to resolve that conflict.'),
  });

  const items = conflicts.data ?? [];
  const open = items.filter((conflict) => conflict.status === 'OPEN').length;

  return (
    <LandCaseSection
      title="Conflicts"
      icon={ShieldAlert}
      description={
        items.length ? `${open} open of ${items.length} detected` : 'Checked against every parcel'
      }
    >
      {conflicts.isLoading ? (
        <ListSkeleton rows={2} label="Loading conflicts" />
      ) : conflicts.isError && !conflicts.data ? (
        <PanelMessage>
          {conflicts.error instanceof Error
            ? conflicts.error.message
            : 'Conflicts are unavailable.'}
        </PanelMessage>
      ) : items.length === 0 ? (
        <PanelMessage>No duplicate title, survey or overlapping boundary was found.</PanelMessage>
      ) : (
        <ul className="space-y-2.5">
          {items.map((conflict) => (
            <li key={conflict.id} className="rounded-xl border border-border p-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground">
                    {kindLabel[conflict.kind] ?? humaniseEnum(conflict.kind)}
                    {conflict.overlapRatio !== undefined && conflict.overlapRatio !== null && (
                      <span className="ml-1.5 font-semibold text-destructive">
                        {Math.round(conflict.overlapRatio * 100)}% overlap
                      </span>
                    )}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    With{' '}
                    <Link
                      href={`/admin/land/diligence/${encodeURIComponent(conflict.conflictingPropertyId)}`}
                      className="text-primary hover:underline"
                    >
                      {conflict.conflictingPropertyTitle}
                    </Link>
                    {conflict.conflictingPlotNumber && ` · Plot ${conflict.conflictingPlotNumber}`}
                    {conflict.conflictingLocation && ` · ${conflict.conflictingLocation}`}
                    {` · detected ${formatDate(conflict.detectedAt)}`}
                  </p>
                </div>
                <Badge variant={statusVariant[conflict.status] ?? 'neutral'}>
                  {humaniseEnum(conflict.status)}
                </Badge>
              </div>
              {conflict.resolutionNote && (
                <p className="mt-2 text-xs text-muted-foreground">
                  {conflict.resolvedByName ?? 'A reviewer'}
                  {conflict.resolvedAt && ` on ${formatDate(conflict.resolvedAt)}`}: “
                  {conflict.resolutionNote}”
                </p>
              )}
              {canApprove && conflict.status === 'OPEN' && (
                <div className="mt-2.5 flex flex-wrap justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="xs"
                    icon={<XCircle className="h-3.5 w-3.5" />}
                    onClick={() => setPending({ conflict, decision: 'DISMISS' })}
                  >
                    Dismiss
                  </Button>
                  <Button
                    variant="outline"
                    size="xs"
                    className="text-destructive"
                    icon={<CheckCircle2 className="h-3.5 w-3.5" />}
                    onClick={() => setPending({ conflict, decision: 'CONFIRM' })}
                  >
                    Confirm clash
                  </Button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      <ConfirmDialog
        open={Boolean(pending)}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            setPending(null);
            setNote('');
          }
        }}
        title={pending?.decision === 'DISMISS' ? 'Dismiss this conflict?' : 'Confirm this clash?'}
        description={
          pending?.decision === 'DISMISS'
            ? `Dismissing records that this is not the same land as "${pending.conflict.conflictingPropertyTitle}". It applies to both parcels and is kept in the audit trail.`
            : `Confirming records a real clash with "${pending?.conflict.conflictingPropertyTitle ?? ''}". It keeps blocking approval on both parcels.`
        }
        confirmLabel={pending?.decision === 'DISMISS' ? 'Dismiss conflict' : 'Confirm clash'}
        promptLabel="Why"
        promptPlaceholder="e.g. Re-listing by the same owner; registry search shows one title"
        promptValue={note}
        onPromptChange={setNote}
        promptRequired
        promptMinLength={3}
        isLoading={resolve.isPending}
        onConfirm={async () => {
          if (!pending) return;
          await resolve
            .mutateAsync({ conflictId: pending.conflict.id, decision: pending.decision })
            .catch(() => undefined);
        }}
      />
    </LandCaseSection>
  );
};
