'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Alert, Badge, Button, Card, Field, Textarea } from '@getrentos/ui';
import { CircleDashed, PauseCircle } from 'lucide-react';
import { unwrap } from '@/lib/apiHelpers';
import { formatDate } from '@/lib/format';
import { landKeys } from '@/lib/queryKeys';
import { landService } from '@/services/landService';
import type { LandDiligence, LandDiligenceCondition } from '@/types/land';
import { errorMessage, useNotify } from '../developer/feedback';
import { LandDocumentPicker } from '../documents/LandDocumentPicker';

const STATUS: Record<
  LandDiligenceCondition['status'],
  { label: string; variant: 'info' | 'success' | 'neutral' }
> = {
  OPEN: { label: 'Open', variant: 'info' },
  MET: { label: 'Met', variant: 'success' },
  WAIVED: { label: 'Waived', variant: 'neutral' },
};

/** One condition: where it stands, and the owner's evidence for it while open. */
const ConditionRow = ({
  propertyId,
  condition,
}: {
  propertyId: string;
  condition: LandDiligenceCondition;
}) => {
  const queryClient = useQueryClient();
  const { notify } = useNotify();
  const [open, setOpen] = useState(false);
  const [documentId, setDocumentId] = useState(condition.evidenceDocumentId ?? '');
  const [note, setNote] = useState(condition.evidenceNote ?? '');
  const send = useMutation({
    mutationFn: () =>
      unwrap(landService.attachConditionEvidence(propertyId, condition.id, documentId, note)),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: landKeys.ownerDetail(propertyId) });
      void queryClient.invalidateQueries({ queryKey: landKeys.owner });
      setOpen(false);
      notify('Evidence sent. GetRentos will check it and confirm the condition.');
    },
    onError: (error) => notify(errorMessage(error), 'error'),
  });
  const status = STATUS[condition.status];

  return (
    <li className="rounded-xl border border-border p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <p className="text-sm font-medium text-foreground">{condition.text}</p>
        <Badge variant={status.variant}>{status.label}</Badge>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        {condition.dueAt ? `Expected by ${formatDate(condition.dueAt)}` : 'No due date'}
        {condition.evidenceAt && ` · evidence sent ${formatDate(condition.evidenceAt)}`}
      </p>
      {condition.decisionNote && (
        <p className="mt-2 text-sm text-muted-foreground">
          GetRentos{condition.decidedAt ? ` (${formatDate(condition.decidedAt)})` : ''}:{' '}
          {condition.decisionNote}
        </p>
      )}
      {condition.status === 'OPEN' &&
        (open ? (
          <div className="mt-3 space-y-3">
            <LandDocumentPicker
              propertyId={propertyId}
              label="Evidence"
              value={documentId}
              onChange={setDocumentId}
              hint="Choose the document that shows this condition is met, or upload it."
            />
            <Field label="Note (optional)" htmlFor={`condition-${condition.id}-note`}>
              <Textarea
                id={`condition-${condition.id}-note`}
                rows={2}
                maxLength={2000}
                value={note}
                onChange={(event) => setNote(event.target.value)}
              />
            </Field>
            <div className="flex gap-2">
              <Button
                size="sm"
                disabled={!documentId || send.isPending}
                isLoading={send.isPending}
                onClick={() => send.mutate()}
              >
                Send evidence
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <Button className="mt-3" size="sm" variant="outline" onClick={() => setOpen(true)}>
            {condition.hasEvidence ? 'Replace evidence' : 'Attach evidence'}
          </Button>
        ))}
    </li>
  );
};

/**
 * What the owner needs to know about a conditional or suspended approval:
 * the conditions to meet (with evidence), or why the land is off the market.
 */
export const OwnerDiligenceConditions = ({
  propertyId,
  diligence,
}: {
  propertyId: string;
  diligence?: LandDiligence | null;
}) => {
  if (!diligence) return null;
  if (diligence.status === 'SUSPENDED') {
    return (
      <Alert variant="danger" icon={PauseCircle} title="Suspended" className="mt-4">
        {diligence.suspension?.reason ||
          'GetRentos has taken this land off the market while it looks into an issue.'}{' '}
        {diligence.suspension?.bySystem
          ? 'This happened automatically and lifts once the issue is resolved.'
          : 'GetRentos will tell you when it is resumed.'}
        {diligence.suspension?.at && ` Since ${formatDate(diligence.suspension.at)}.`}
      </Alert>
    );
  }
  const conditions = diligence.conditions ?? [];
  if (diligence.status !== 'CONDITIONAL' || conditions.length === 0) return null;
  return (
    <Card static className="mt-4 p-5">
      <div className="flex items-start gap-2">
        <CircleDashed className="mt-0.5 h-5 w-5 shrink-0 text-info" aria-hidden />
        <div>
          <h3 className="font-semibold text-foreground">Conditions to meet</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Your land is listed, and buyers see these conditions. Reservations and offers open once
            GetRentos confirms each one.
          </p>
        </div>
      </div>
      <ul className="mt-4 space-y-3">
        {conditions.map((condition) => (
          <ConditionRow key={condition.id} propertyId={propertyId} condition={condition} />
        ))}
      </ul>
    </Card>
  );
};
