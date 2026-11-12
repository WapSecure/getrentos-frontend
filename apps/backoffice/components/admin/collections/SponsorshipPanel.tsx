'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import {
  Alert,
  Badge,
  Button,
  Card,
  ConfirmDialog,
  CurrencyInput,
  DatePicker,
  DescriptionList,
  Field,
  Input,
  SegmentedControl,
  Textarea,
  useToast,
} from '@sureground/ui';
import { formatCurrency, formatDate, unwrap } from '@sureground/shared';
import type { CollectionsManager } from '@/services/adminCollectionsService';
import type { CollectionSponsorship, ManagedCollection } from '@/types/collections';

const errorMessage = (e: unknown) =>
  e instanceof Error ? e.message : 'Something went wrong. Try again.';

const SPONSOR_KINDS = [
  { value: 'organisation', label: 'Organisation' },
  { value: 'person', label: 'Person' },
] as const;

/**
 * Sponsored needs a record of who paid (decided 2026-11-12). Saving or removing it asks the staff member
 * to confirm it's them. The public page only ever shows the "Sponsored" label, never the amount.
 */
export function SponsorshipPanel({
  manager,
  collection,
  onSaved,
}: {
  manager: CollectionsManager;
  collection: ManagedCollection;
  onSaved: (next: ManagedCollection) => void;
}) {
  const toast = useToast();
  const record = collection.sponsorship;
  const [editing, setEditing] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const isStaff = collection.curatorType === 'STAFF';

  const clearFlag = useMutation({
    mutationFn: () => unwrap(manager.update(collection.id, { sponsored: false })),
    onSuccess: (next) => {
      toast.success('Sponsored flag cleared');
      onSaved(next);
    },
  });
  const remove = useMutation({
    mutationFn: () => unwrap(manager.removeSponsorship(collection.id)),
    onSuccess: (next) => {
      toast.success('Sponsor record removed');
      setConfirmRemove(false);
      onSaved(next);
    },
  });

  if (!isStaff && !collection.sponsored) return null;

  return (
    <Card className="space-y-4 p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold">Sponsorship</h2>
        {record ? (
          <Badge variant="warning">Sponsored</Badge>
        ) : collection.sponsorshipMissing ? (
          <Badge variant="warning">No sponsor record</Badge>
        ) : (
          <Badge variant="neutral">Not sponsored</Badge>
        )}
      </div>

      {collection.sponsorshipMissing && (
        <Alert variant="warning" title="Marked sponsored with no record of who paid">
          The public page no longer shows the Sponsored label for this collection.{' '}
          {isStaff
            ? 'Add the sponsor record to show it again, or clear the flag if it was never paid for.'
            : 'Only Sureground collections can be sponsored, so clear the flag.'}
        </Alert>
      )}

      {record && !editing ? (
        <>
          <DescriptionList
            items={[
              {
                label: record.sponsorKind === 'person' ? 'Person' : 'Organisation',
                value: record.sponsorName,
              },
              { label: 'Amount paid', value: formatCurrency(record.amount) },
              {
                label: 'Runs',
                value: `${formatDate(record.startDate)} to ${formatDate(record.endDate)}`,
              },
              ...(record.reference ? [{ label: 'Reference', value: record.reference }] : []),
              ...(record.note ? [{ label: 'Note', value: record.note }] : []),
            ]}
          />
          <p className="text-xs text-muted-foreground">
            Visitors only see the Sponsored label. The sponsor and amount stay in the backoffice.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => setEditing(true)}>
              Edit record
            </Button>
            <Button variant="ghost" onClick={() => setConfirmRemove(true)}>
              Remove sponsorship
            </Button>
          </div>
        </>
      ) : isStaff && (editing || !record) ? (
        <SponsorshipForm
          manager={manager}
          collectionId={collection.id}
          initial={record}
          onCancel={record ? () => setEditing(false) : undefined}
          onSaved={(next) => {
            setEditing(false);
            onSaved(next);
          }}
        />
      ) : null}

      {collection.sponsorshipMissing && (
        <Button
          variant="outline"
          onClick={() => clearFlag.mutate()}
          isLoading={clearFlag.isPending}
        >
          Clear the sponsored flag
        </Button>
      )}
      {clearFlag.isError && <Alert variant="danger">{errorMessage(clearFlag.error)}</Alert>}
      {remove.isError && <Alert variant="danger">{errorMessage(remove.error)}</Alert>}

      <ConfirmDialog
        open={confirmRemove}
        onOpenChange={setConfirmRemove}
        title="Remove sponsorship?"
        description="The record of who paid is removed and the Sponsored label stops showing. The change is kept in the audit log."
        confirmLabel="Remove sponsorship"
        onConfirm={() => remove.mutate()}
        isLoading={remove.isPending}
      />
    </Card>
  );
}

function SponsorshipForm({
  manager,
  collectionId,
  initial,
  onCancel,
  onSaved,
}: {
  manager: CollectionsManager;
  collectionId: string;
  initial: CollectionSponsorship | null;
  onCancel?: () => void;
  onSaved: (next: ManagedCollection) => void;
}) {
  const toast = useToast();
  const [sponsorKind, setSponsorKind] = useState<'organisation' | 'person'>(
    initial?.sponsorKind ?? 'organisation'
  );
  const [sponsorName, setSponsorName] = useState(initial?.sponsorName ?? '');
  const [amount, setAmount] = useState<number>(initial?.amount ?? 0);
  const [startDate, setStartDate] = useState(initial?.startDate.slice(0, 10) ?? '');
  const [endDate, setEndDate] = useState(initial?.endDate.slice(0, 10) ?? '');
  const [reference, setReference] = useState(initial?.reference ?? '');
  const [note, setNote] = useState(initial?.note ?? '');

  const save = useMutation({
    mutationFn: () =>
      unwrap(
        manager.setSponsorship(collectionId, {
          sponsorKind,
          sponsorName: sponsorName.trim(),
          amount,
          startDate: new Date(`${startDate}T00:00:00`).toISOString(),
          endDate: new Date(`${endDate}T23:59:59`).toISOString(),
          reference: reference.trim() || undefined,
          note: note.trim() || undefined,
        })
      ),
    onSuccess: (next) => {
      toast.success('Sponsor record saved');
      onSaved(next);
    },
  });

  const datesBackwards = Boolean(startDate && endDate && endDate < startDate);
  const ready =
    sponsorName.trim().length >= 2 && amount >= 1 && startDate && endDate && !datesBackwards;

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        A collection is labelled Sponsored only while this record exists. You will be asked to
        confirm it’s you before it is saved.
      </p>
      <Field label="Paid by">
        <SegmentedControl
          aria-label="Who paid"
          value={sponsorKind}
          onValueChange={setSponsorKind}
          segments={SPONSOR_KINDS}
          size="sm"
        />
      </Field>
      <Field
        label={sponsorKind === 'person' ? 'Name of the person' : 'Name of the organisation'}
        required
      >
        <Input
          value={sponsorName}
          maxLength={120}
          onChange={(e) => setSponsorName(e.target.value)}
        />
      </Field>
      <Field label="Amount paid" required hint="In naira, as on the invoice or receipt.">
        <CurrencyInput value={amount || ''} onValueChange={setAmount} prefix="₦" />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Starts" required>
          <DatePicker value={startDate} onChange={setStartDate} />
        </Field>
        <Field
          label="Ends"
          required
          error={datesBackwards ? 'The end date must be after the start date.' : undefined}
        >
          <DatePicker value={endDate} onChange={setEndDate} min={startDate || undefined} />
        </Field>
      </div>
      <Field label="Reference" optionalLabel="Optional" hint="Invoice, receipt or contract number.">
        <Input value={reference} maxLength={120} onChange={(e) => setReference(e.target.value)} />
      </Field>
      <Field label="Note" optionalLabel="Optional">
        <Textarea value={note} rows={2} maxLength={500} onChange={(e) => setNote(e.target.value)} />
      </Field>
      {save.isError && <Alert variant="danger">{errorMessage(save.error)}</Alert>}
      <div className="flex flex-wrap gap-2">
        <Button onClick={() => save.mutate()} isLoading={save.isPending} disabled={!ready}>
          Save sponsor record
        </Button>
        {onCancel && (
          <Button variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
    </div>
  );
}
