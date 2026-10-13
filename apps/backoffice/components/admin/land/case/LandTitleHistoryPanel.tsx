'use client';

import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { BadgeCheck, History, Plus } from 'lucide-react';
import {
  Badge,
  Button,
  Checkbox,
  ConfirmDialog,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  Field,
  Input,
  Select,
  Textarea,
} from '@getrentos/ui';
import { formatDate, unwrap } from '@getrentos/shared';
import { adminLandService } from '@/services/adminLandService';
import {
  LAND_TITLE_EVENT_KINDS,
  type LandDiligenceDocument,
  type LandTitleEvent,
  type LandTitleEventKind,
  type RecordLandTitleEventInput,
} from '@/types/land';
import { humaniseEnum, landQueryKeys } from '@/lib/landDiligence';
import {
  fromDateInput,
  LandCaseSection,
  PanelMessage,
  useInvalidateLandCase,
  type LandCasePanelProps,
} from './shared';

const emptyForm = {
  kind: 'ORIGINAL_GRANT' as LandTitleEventKind,
  fromParty: '',
  toParty: '',
  instrumentReference: '',
  occurredAt: '',
  registeredAt: '',
  note: '',
  documentId: '',
  verified: true,
};

/**
 * The chain of title, oldest first. Owners can record links themselves; a
 * reviewer verifies each against the registry before relying on it.
 */
export const LandTitleHistoryPanel = ({
  propertyId,
  documents,
  canReview,
  onError,
  onSuccess,
}: Omit<LandCasePanelProps, 'canApprove'> & { documents: LandDiligenceDocument[] }) => {
  const invalidate = useInvalidateLandCase();
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [verifying, setVerifying] = useState<LandTitleEvent | null>(null);

  const history = useQuery({
    queryKey: landQueryKeys.caseSection(propertyId, 'title-history'),
    queryFn: () => unwrap(adminLandService.listTitleHistory(propertyId)),
  });

  const add = useMutation({
    mutationFn: (input: RecordLandTitleEventInput) =>
      unwrap(adminLandService.addTitleEvent(propertyId, input)),
    onSuccess: () => {
      invalidate();
      setAdding(false);
      setForm(emptyForm);
      onSuccess('Link added to the chain of title.');
    },
    onError: (error) => onError(error, 'Unable to add that title event.'),
  });

  const verify = useMutation({
    mutationFn: (eventId: string) => unwrap(adminLandService.verifyTitleEvent(propertyId, eventId)),
    onSuccess: () => {
      invalidate();
      onSuccess('Title event verified.');
    },
    onError: (error) => onError(error, 'Unable to verify that title event.'),
  });

  const events = history.data ?? [];
  const unverified = events.filter((event) => !event.verified).length;
  const set = (patch: Partial<typeof emptyForm>) =>
    setForm((current) => ({ ...current, ...patch }));
  const optional = (value: string) => value.trim() || undefined;
  const occurredAtIso = fromDateInput(form.occurredAt);

  return (
    <LandCaseSection
      title="Chain of title"
      icon={History}
      description={events.length ? `${events.length} links · ${unverified} unverified` : undefined}
      actions={
        canReview && (
          <Button
            variant="outline"
            size="xs"
            onClick={() => setAdding(true)}
            icon={<Plus className="h-3.5 w-3.5" />}
          >
            Add link
          </Button>
        )
      }
    >
      {history.isLoading ? (
        <PanelMessage>Loading the chain of title…</PanelMessage>
      ) : history.isError ? (
        <PanelMessage>
          {history.error instanceof Error ? history.error.message : 'Title history is unavailable.'}
        </PanelMessage>
      ) : events.length === 0 ? (
        <PanelMessage>No link in the chain of title has been recorded yet.</PanelMessage>
      ) : (
        <ol className="relative space-y-3 border-l border-border pl-4">
          {events.map((event) => (
            <li key={event.id} className="text-sm">
              <span className="absolute -left-[5px] mt-1.5 h-2.5 w-2.5 rounded-full bg-primary" />
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-medium text-foreground">
                    {humaniseEnum(event.kind)}{' '}
                    <span className="font-normal text-muted-foreground">
                      {formatDate(event.occurredAt)}
                    </span>
                  </p>
                  {(event.fromParty || event.toParty) && (
                    <p className="text-xs text-foreground">
                      {event.fromParty ?? '—'} → {event.toParty ?? '—'}
                    </p>
                  )}
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {event.instrumentReference && (
                      <span className="font-mono">{event.instrumentReference} · </span>
                    )}
                    {event.registeredAt && `registered ${formatDate(event.registeredAt)} · `}
                    recorded by {event.recordedByName}
                  </p>
                  {event.note && <p className="mt-1 text-xs text-foreground">{event.note}</p>}
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {event.verified ? (
                    <Badge variant="success" icon={<BadgeCheck className="h-3 w-3" />}>
                      Verified
                    </Badge>
                  ) : (
                    <>
                      <Badge variant="warning">Unverified</Badge>
                      {canReview && (
                        <Button variant="ghost" size="xs" onClick={() => setVerifying(event)}>
                          Verify
                        </Button>
                      )}
                    </>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ol>
      )}

      <Dialog open={adding} onOpenChange={(open) => !open && !add.isPending && setAdding(false)}>
        {adding && (
          <DialogContent className="max-w-lg">
            <div className="space-y-3 p-5">
              <DialogTitle className="type-heading text-lg">Add a link in the chain</DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                One transfer or grant on the title, as found in the registry.
              </DialogDescription>
              <Field label="Kind" required>
                <Select
                  value={form.kind}
                  onValueChange={(value) => set({ kind: value as LandTitleEventKind })}
                  ariaLabel="Title event kind"
                  options={LAND_TITLE_EVENT_KINDS.map((kind) => ({
                    value: kind,
                    label: humaniseEnum(kind),
                  }))}
                />
              </Field>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="From">
                  <Input
                    value={form.fromParty}
                    maxLength={200}
                    onChange={(e) => set({ fromParty: e.target.value })}
                  />
                </Field>
                <Field label="To">
                  <Input
                    value={form.toParty}
                    maxLength={200}
                    onChange={(e) => set({ toParty: e.target.value })}
                  />
                </Field>
                <Field label="Occurred on" required>
                  <Input
                    type="date"
                    value={form.occurredAt}
                    onChange={(e) => set({ occurredAt: e.target.value })}
                  />
                </Field>
                <Field label="Registered on">
                  <Input
                    type="date"
                    value={form.registeredAt}
                    onChange={(e) => set({ registeredAt: e.target.value })}
                  />
                </Field>
              </div>
              <Field label="Instrument reference" hint='e.g. "45/45/2011 Lagos"'>
                <Input
                  value={form.instrumentReference}
                  maxLength={200}
                  onChange={(e) => set({ instrumentReference: e.target.value })}
                />
              </Field>
              <Field label="Note">
                <Textarea
                  value={form.note}
                  maxLength={2000}
                  onChange={(e) => set({ note: e.target.value })}
                />
              </Field>
              {documents.length > 0 && (
                <Field label="Supporting document">
                  <Select
                    value={form.documentId}
                    onValueChange={(value) => set({ documentId: value })}
                    ariaLabel="Supporting document"
                    options={[
                      { value: '', label: 'None' },
                      ...documents.map((document) => ({
                        value: document.id,
                        label: document.name,
                      })),
                    ]}
                  />
                </Field>
              )}
              <label className="flex items-center gap-2 text-sm text-foreground">
                <Checkbox
                  checked={form.verified}
                  onCheckedChange={(checked) => set({ verified: checked })}
                  aria-label="Record as verified"
                />
                I checked this against the registry: record it as verified
              </label>
              <div className="flex justify-end gap-2 pt-1">
                <Button variant="ghost" onClick={() => setAdding(false)} disabled={add.isPending}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  disabled={!occurredAtIso}
                  isLoading={add.isPending}
                  onClick={() =>
                    occurredAtIso &&
                    add.mutate({
                      kind: form.kind,
                      fromParty: optional(form.fromParty),
                      toParty: optional(form.toParty),
                      instrumentReference: optional(form.instrumentReference),
                      occurredAt: occurredAtIso,
                      registeredAt: fromDateInput(form.registeredAt),
                      note: optional(form.note),
                      documentId: optional(form.documentId),
                      verified: form.verified,
                    })
                  }
                >
                  Add link
                </Button>
              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>

      <ConfirmDialog
        open={Boolean(verifying)}
        onOpenChange={(open) => !open && setVerifying(null)}
        title="Verify this title event?"
        description={`Mark the ${humaniseEnum(verifying?.kind).toLowerCase()} of ${
          verifying ? formatDate(verifying.occurredAt) : ''
        } as checked against the registry. Your name is recorded against it.`}
        confirmLabel="Verify"
        isLoading={verify.isPending}
        onConfirm={async () => {
          if (verifying) await verify.mutateAsync(verifying.id).catch(() => undefined);
        }}
      />
    </LandCaseSection>
  );
};
