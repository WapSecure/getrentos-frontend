'use client';

import { useId, useState, type FormEvent } from 'react';
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  Field,
  Input,
  Select,
  Textarea,
} from '@getrentos/ui';
import {
  LAND_TITLE_EVENT_KINDS,
  type LandTitleEventInput,
  type LandTitleEventKind,
} from '@/types/landDeveloper';
import { DocumentReferenceField } from './feedback';
import { TITLE_EVENT_KIND_LABELS } from './labels';

interface TitleEventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isSaving: boolean;
  onSubmit: (input: LandTitleEventInput) => void;
}

const KIND_OPTIONS = LAND_TITLE_EVENT_KINDS.map((kind) => ({
  value: kind,
  label: TITLE_EVENT_KIND_LABELS[kind],
}));

const today = () => new Date().toISOString().slice(0, 10);

const TitleEventForm = ({
  isSaving,
  onSubmit,
  onCancel,
}: Omit<TitleEventDialogProps, 'open' | 'onOpenChange'> & { onCancel: () => void }) => {
  const id = useId();
  const [kind, setKind] = useState<LandTitleEventKind>('ASSIGNMENT');
  const [fromParty, setFromParty] = useState('');
  const [toParty, setToParty] = useState('');
  const [instrumentReference, setInstrumentReference] = useState('');
  const [occurredAt, setOccurredAt] = useState('');
  const [registeredAt, setRegisteredAt] = useState('');
  const [note, setNote] = useState('');
  const [documentId, setDocumentId] = useState('');

  const dateError =
    occurredAt && occurredAt > today() ? 'The date cannot be in the future.' : undefined;
  const registeredError =
    registeredAt && occurredAt && registeredAt < occurredAt
      ? 'Registration cannot come before the event.'
      : undefined;
  const valid = Boolean(occurredAt) && !dateError && !registeredError;

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!valid) return;
    const optional = (value: string) => (value.trim() ? value.trim() : undefined);
    onSubmit({
      kind,
      occurredAt,
      fromParty: optional(fromParty),
      toParty: optional(toParty),
      instrumentReference: optional(instrumentReference),
      registeredAt: optional(registeredAt),
      note: optional(note),
      documentId: optional(documentId),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="mt-4 space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="What happened" required>
          <Select
            value={kind}
            onValueChange={(value) => setKind(value as LandTitleEventKind)}
            options={KIND_OPTIONS}
            ariaLabel="Title event"
          />
        </Field>
        <Field label="Date" htmlFor={`${id}-date`} required error={dateError}>
          <Input
            id={`${id}-date`}
            type="date"
            max={today()}
            value={occurredAt}
            onChange={(event) => setOccurredAt(event.target.value)}
          />
        </Field>
        <Field label="From" htmlFor={`${id}-from`} hint="e.g. the family, community or grantor.">
          <Input
            id={`${id}-from`}
            value={fromParty}
            maxLength={200}
            onChange={(event) => setFromParty(event.target.value)}
          />
        </Field>
        <Field label="To" htmlFor={`${id}-to`}>
          <Input
            id={`${id}-to`}
            value={toParty}
            maxLength={200}
            onChange={(event) => setToParty(event.target.value)}
          />
        </Field>
        <Field
          label="Registration number"
          htmlFor={`${id}-instrument`}
          hint='e.g. "45/45/2011 Lagos".'
        >
          <Input
            id={`${id}-instrument`}
            value={instrumentReference}
            maxLength={200}
            onChange={(event) => setInstrumentReference(event.target.value)}
          />
        </Field>
        <Field label="Registered on" htmlFor={`${id}-registered`} error={registeredError}>
          <Input
            id={`${id}-registered`}
            type="date"
            value={registeredAt}
            onChange={(event) => setRegisteredAt(event.target.value)}
          />
        </Field>
      </div>
      <Field label="Note" htmlFor={`${id}-note`}>
        <Textarea
          id={`${id}-note`}
          value={note}
          maxLength={2000}
          rows={3}
          onChange={(event) => setNote(event.target.value)}
        />
      </Field>
      <DocumentReferenceField
        id={`${id}-document`}
        label="Supporting document"
        value={documentId}
        onChange={setDocumentId}
      />
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button type="button" variant="ghost" onClick={onCancel} disabled={isSaving}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" disabled={!valid} isLoading={isSaving}>
          Add to chain of title
        </Button>
      </div>
    </form>
  );
};

/** Records one link in the parcel's chain of title, to be verified by compliance. */
export const TitleEventDialog = ({ open, onOpenChange, ...rest }: TitleEventDialogProps) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="max-w-2xl">
      <DialogTitle className="text-lg font-semibold text-foreground">
        Add to the chain of title
      </DialogTitle>
      <DialogDescription className="mt-1 text-sm text-muted-foreground">
        Your entry shows as unverified until a compliance reviewer checks it against the registry.
      </DialogDescription>
      <TitleEventForm {...rest} onCancel={() => onOpenChange(false)} />
    </DialogContent>
  </Dialog>
);
