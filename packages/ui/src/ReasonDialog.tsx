'use client';

import { useRef, useState, type FormEvent, type ReactNode } from 'react';
import { Alert } from './Alert';
import { Button } from './Button';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from './Dialog';
import { DocumentUpload, type PendingUpload } from './DocumentUpload';
import { Field } from './Field';
import { Input } from './Input';
import { RadioGroup } from './RadioGroup';
import { Select } from './Select';
import { Textarea } from './Textarea';

// One dialog for "tell us what is wrong": disputes, problem reports, objections. Each caller
// keeps its own copy, limits and API call; the layout and the submit/close rules are shared.

export interface ReasonCategory<C extends string = string> {
  value: C;
  label: string;
  /** Shown under the control once this category is chosen. */
  hint?: string;
}

export interface ReasonDialogValues<C extends string = string> {
  /** Trimmed. */
  reason: string;
  category?: C;
  /** Trimmed; only when `subject` is set. */
  subject?: string;
  evidence: File[];
}

interface ReasonDialogProps<C extends string = string> {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  description: ReactNode;
  /** A short one-line summary above the categories, e.g. a dispute title. */
  subject?: { label: string; placeholder?: string; minLength?: number; maxLength?: number };
  categories?: {
    options: readonly ReasonCategory<C>[];
    /** Without it the control is named by `ariaLabel` and shows `placeholder` only. */
    label?: string;
    ariaLabel?: string;
    placeholder?: string;
    defaultValue?: C;
    display?: 'select' | 'radio';
  };
  reasonLabel: string;
  reasonPlaceholder?: string;
  /** A function receives the trimmed length, for a running count. */
  reasonHint?: ReactNode | ((length: number) => ReactNode);
  /** Counted on the trimmed text. */
  minLength?: number;
  maxLength?: number;
  showCount?: boolean;
  rows?: number;
  /**
   * `change` (default) keeps the confirm button disabled until the form is valid.
   * `submit` leaves it enabled and shows `tooShortMessage` after a submit attempt.
   */
  validateOn?: 'change' | 'submit';
  tooShortMessage?: string;
  /** Optional supporting files, handed to `onSubmit` as `evidence`. */
  evidence?: {
    label?: string;
    hint?: string;
    accept?: string;
    multiple?: boolean;
    maxSizeMB?: number;
  };
  confirmLabel: string;
  confirmIcon?: ReactNode;
  loadingText?: string;
  cancelLabel?: string;
  tone?: 'primary' | 'danger';
  /** Resolve to close; reject to keep what was typed. Report the error via `error` or a toast. */
  onSubmit: (values: ReasonDialogValues<C>) => Promise<unknown>;
  error?: ReactNode;
}

export function ReasonDialog<C extends string = string>(props: ReasonDialogProps<C>) {
  const { open, onOpenChange } = props;
  // Lives outside the body so a close can be refused while the request is out.
  const [pending, setPending] = useState(false);
  return (
    <Dialog open={open} onOpenChange={(next) => (next || !pending) && onOpenChange(next)}>
      <DialogContent>
        <ReasonDialogBody {...props} pending={pending} setPending={setPending} />
      </DialogContent>
    </Dialog>
  );
}

// Mounted only while open, so every opening starts from an empty form.
function ReasonDialogBody<C extends string>({
  onOpenChange,
  title,
  description,
  subject,
  categories,
  reasonLabel,
  reasonPlaceholder,
  reasonHint,
  minLength = 1,
  maxLength,
  showCount,
  rows = 4,
  validateOn = 'change',
  tooShortMessage,
  evidence,
  confirmLabel,
  confirmIcon,
  loadingText,
  cancelLabel = 'Cancel',
  tone = 'primary',
  onSubmit,
  error,
  pending,
  setPending,
}: ReasonDialogProps<C> & { pending: boolean; setPending: (pending: boolean) => void }) {
  const [subjectText, setSubjectText] = useState('');
  const [category, setCategory] = useState<C | ''>(categories?.defaultValue ?? '');
  const [reason, setReason] = useState('');
  const [files, setFiles] = useState<PendingUpload[]>([]);
  const [attempted, setAttempted] = useState(false);
  // Synchronous, so a double click can't send twice before the button re-renders.
  const inFlight = useRef(false);

  const trimmed = reason.trim();
  const reasonShort = trimmed.length < minLength;
  const subjectShort = subject ? subjectText.trim().length < (subject.minLength ?? 1) : false;
  const categoryMissing = Boolean(categories) && !category;
  const valid = !reasonShort && !subjectShort && !categoryMissing;
  const categoryHint = categories?.options.find((option) => option.value === category)?.hint;
  const hint = typeof reasonHint === 'function' ? reasonHint(trimmed.length) : reasonHint;
  const reasonError =
    validateOn === 'submit' && attempted && reasonShort ? tooShortMessage : undefined;

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setAttempted(true);
    if (!valid || inFlight.current) return;
    inFlight.current = true;
    setPending(true);
    try {
      await onSubmit({
        reason: trimmed,
        category: category || undefined,
        subject: subject ? subjectText.trim() : undefined,
        evidence: files.map((item) => item.file),
      });
    } catch {
      return;
    } finally {
      inFlight.current = false;
      setPending(false);
    }
    onOpenChange(false);
  };

  const categoryControl = categories ? (
    categories.display === 'radio' ? (
      <RadioGroup
        value={category}
        onValueChange={(value) => setCategory(value)}
        options={categories.options.map(({ value, label }) => ({ value, label }))}
        aria-label={categories.label ? undefined : categories.ariaLabel}
        disabled={pending}
        required
      />
    ) : (
      <Select
        value={category}
        onValueChange={(value) => setCategory(value as C)}
        options={categories.options.map(({ value, label }) => ({ value, label }))}
        ariaLabel={categories.label ? undefined : categories.ariaLabel}
        placeholder={categories.placeholder}
        disabled={pending}
        required
      />
    )
  ) : null;

  return (
    <form noValidate onSubmit={submit} className="space-y-4">
      <div className="pr-8">
        <DialogTitle className="text-lg font-semibold text-foreground">{title}</DialogTitle>
        <DialogDescription className="mt-1 text-sm text-muted-foreground">
          {description}
        </DialogDescription>
      </div>

      {subject && (
        <Field label={subject.label} required>
          <Input
            value={subjectText}
            onChange={(event) => setSubjectText(event.target.value)}
            placeholder={subject.placeholder}
            maxLength={subject.maxLength}
            disabled={pending}
          />
        </Field>
      )}

      {categories &&
        (categories.label ? (
          <Field label={categories.label} required hint={categoryHint}>
            {categoryControl}
          </Field>
        ) : (
          <div className="space-y-1.5">
            {categoryControl}
            {categoryHint && <p className="text-xs text-muted-foreground">{categoryHint}</p>}
          </div>
        ))}

      <Field label={reasonLabel} required hint={hint} error={reasonError}>
        <Textarea
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          placeholder={reasonPlaceholder}
          rows={rows}
          maxLength={maxLength}
          showCount={showCount}
          disabled={pending}
        />
      </Field>

      {evidence && (
        <DocumentUpload
          value={files}
          onChange={setFiles}
          label={evidence.label ?? 'Evidence (optional)'}
          hint={evidence.hint}
          accept={evidence.accept}
          multiple={evidence.multiple ?? true}
          maxSizeMB={evidence.maxSizeMB}
          disabled={pending}
        />
      )}

      {error && <Alert variant="danger">{error}</Alert>}

      <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
        <Button
          type="button"
          variant="ghost"
          onClick={() => onOpenChange(false)}
          disabled={pending}
        >
          {cancelLabel}
        </Button>
        <Button
          type="submit"
          variant={tone === 'danger' ? 'danger' : 'primary'}
          icon={confirmIcon}
          isLoading={pending}
          loadingText={loadingText}
          disabled={pending || (validateOn === 'change' && !valid)}
        >
          {confirmLabel}
        </Button>
      </div>
    </form>
  );
}
