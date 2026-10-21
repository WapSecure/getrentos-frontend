'use client';

import { useId, useState, type FormEvent, type ReactNode } from 'react';
import {
  Button,
  DatePicker,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  Field,
  Input,
  Select,
  Textarea,
} from '@getrentos/ui';
import type {
  EstateChangeOrderInput,
  EstateChangeOrderKind,
  EstateCommitment,
  EstateCommitmentInput,
  EstateCommitmentKind,
  EstateProgressInput,
} from '@/types/landEstateInfrastructure';
import { LandDocumentPicker } from '../documents/LandDocumentPicker';
import { CHANGE_KIND_OPTIONS, COMMITMENT_KIND_OPTIONS } from './labels';

/** Tomorrow as YYYY-MM-DD: target dates must be in the future. */
const tomorrow = () => new Date(Date.now() + 86_400_000).toISOString().slice(0, 10);

interface DialogShellProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  isSaving: boolean;
  submitLabel: string;
  valid: boolean;
  onSubmit: () => void;
  children: ReactNode;
}

const DialogShell = ({
  open,
  onOpenChange,
  title,
  description,
  isSaving,
  submitLabel,
  valid,
  onSubmit,
  children,
}: DialogShellProps) => {
  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (valid) onSubmit();
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogTitle className="text-lg font-semibold text-foreground">{title}</DialogTitle>
        <DialogDescription className="mt-1 text-sm text-muted-foreground">
          {description}
        </DialogDescription>
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {children}
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={!valid} isLoading={isSaving}>
              {submitLabel}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

interface BaseProps<T> {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isSaving: boolean;
  onSubmit: (input: T) => void;
}

/** Add a promise: what will be built, and by when. */
export const CommitmentFormDialog = (props: BaseProps<EstateCommitmentInput>) => {
  const id = useId();
  const [kind, setKind] = useState<EstateCommitmentKind>('ROADS');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [minDate] = useState(tomorrow);
  const valid = title.trim().length >= 3 && description.trim().length >= 10;
  return (
    <DialogShell
      {...props}
      title="Add an infrastructure promise"
      description="Buyers see this on the estate page. Once plots are sold, changing the date or scope needs their say."
      submitLabel="Add promise"
      valid={valid}
      onSubmit={() =>
        props.onSubmit({
          kind,
          title: title.trim(),
          description: description.trim(),
          ...(targetDate ? { targetDate } : {}),
        })
      }
    >
      <Field label="Type" required>
        <Select
          value={kind}
          onValueChange={(value) => setKind(value as EstateCommitmentKind)}
          options={COMMITMENT_KIND_OPTIONS}
          ariaLabel="Type of infrastructure"
        />
      </Field>
      <Field label="Title" htmlFor={`${id}-title`} required>
        <Input
          id={`${id}-title`}
          value={title}
          maxLength={120}
          placeholder="e.g. Tarred internal roads"
          onChange={(event) => setTitle(event.target.value)}
        />
      </Field>
      <Field
        label="What exactly will be delivered"
        htmlFor={`${id}-description`}
        required
        hint="Be specific: lengths, standards, capacity. This is what you will be held to."
      >
        <Textarea
          id={`${id}-description`}
          rows={3}
          maxLength={2000}
          value={description}
          onChange={(event) => setDescription(event.target.value)}
        />
      </Field>
      <Field label="Target date" hint="Optional, but buyers trust a date.">
        <DatePicker value={targetDate} onChange={setTargetDate} min={minDate} clearable />
      </Field>
    </DialogShell>
  );
};

/** Report progress; claiming delivery needs evidence from the estate's documents. */
export const ProgressDialog = ({
  propertyId,
  commitment,
  ...props
}: BaseProps<EstateProgressInput> & { propertyId: string; commitment: EstateCommitment }) => {
  const id = useId();
  const [status, setStatus] = useState<EstateProgressInput['status']>(
    commitment.status === 'PLANNED' ? 'IN_PROGRESS' : 'DELIVERED'
  );
  const [note, setNote] = useState('');
  const [documentId, setDocumentId] = useState('');
  const options = [
    ...(commitment.status === 'PLANNED'
      ? [{ value: 'IN_PROGRESS', label: 'Work has started' }]
      : []),
    { value: 'DELIVERED', label: 'Delivered' },
  ];
  const valid = note.trim().length >= 5 && (status !== 'DELIVERED' || documentId !== '');
  return (
    <DialogShell
      {...props}
      title={`Update: ${commitment.title}`}
      description="Buyers are told when you report delivery. GetRentos checks the evidence before it shows as verified."
      submitLabel="Post update"
      valid={valid}
      onSubmit={() =>
        props.onSubmit({ status, note: note.trim(), ...(documentId ? { documentId } : {}) })
      }
    >
      <Field label="Where it stands" required>
        <Select
          value={status}
          onValueChange={(value) => setStatus(value as EstateProgressInput['status'])}
          options={options}
          ariaLabel="Progress"
        />
      </Field>
      <Field label="Note" htmlFor={`${id}-note`} required>
        <Textarea
          id={`${id}-note`}
          rows={3}
          maxLength={2000}
          value={note}
          onChange={(event) => setNote(event.target.value)}
        />
      </Field>
      <LandDocumentPicker
        propertyId={propertyId}
        label={status === 'DELIVERED' ? 'Evidence (required)' : 'Evidence (optional)'}
        value={documentId}
        onChange={setDocumentId}
        suggestedType="PHOTO"
        hint="Photos, a completion certificate or a contractor's report."
      />
    </DialogShell>
  );
};

/** Ask to move the date, change the scope, or withdraw a promise. */
export const ChangeOrderDialog = ({
  commitment,
  ...props
}: BaseProps<EstateChangeOrderInput> & { commitment: EstateCommitment }) => {
  const id = useId();
  const [kind, setKind] = useState<EstateChangeOrderKind>('DATE_CHANGE');
  const [reason, setReason] = useState('');
  const [newTargetDate, setNewTargetDate] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [minDate] = useState(tomorrow);
  const sameDate = Boolean(
    commitment.targetDate && newTargetDate && commitment.targetDate.slice(0, 10) === newTargetDate
  );
  const valid =
    reason.trim().length >= 10 &&
    (kind !== 'DATE_CHANGE' || (newTargetDate !== '' && !sameDate)) &&
    (kind !== 'SCOPE_CHANGE' || newDescription.trim() !== '');
  return (
    <DialogShell
      {...props}
      title={`Change: ${commitment.title}`}
      description="Buyers have 14 days to answer. Silence counts as acknowledged; any objection goes to GetRentos to decide. If no plot is sold yet, the change applies at once."
      submitLabel="Send to buyers"
      valid={valid}
      onSubmit={() =>
        props.onSubmit({
          commitmentId: commitment.id,
          kind,
          reason: reason.trim(),
          ...(kind === 'DATE_CHANGE' ? { newTargetDate } : {}),
          ...(kind === 'SCOPE_CHANGE' ? { newDescription: newDescription.trim() } : {}),
        })
      }
    >
      <Field label="Change" required>
        <Select
          value={kind}
          onValueChange={(value) => setKind(value as EstateChangeOrderKind)}
          options={CHANGE_KIND_OPTIONS}
          ariaLabel="Kind of change"
        />
      </Field>
      {kind === 'DATE_CHANGE' && (
        <Field
          label="New target date"
          required
          error={sameDate ? 'That is the current target date.' : undefined}
        >
          <DatePicker value={newTargetDate} onChange={setNewTargetDate} min={minDate} />
        </Field>
      )}
      {kind === 'SCOPE_CHANGE' && (
        <Field label="What will now be delivered" htmlFor={`${id}-scope`} required>
          <Textarea
            id={`${id}-scope`}
            rows={3}
            maxLength={2000}
            value={newDescription}
            onChange={(event) => setNewDescription(event.target.value)}
          />
        </Field>
      )}
      <Field
        label="Why"
        htmlFor={`${id}-reason`}
        required
        hint="Buyers read this word for word. At least 10 characters."
      >
        <Textarea
          id={`${id}-reason`}
          rows={3}
          maxLength={2000}
          value={reason}
          onChange={(event) => setReason(event.target.value)}
        />
      </Field>
    </DialogShell>
  );
};
