'use client';

import { useId, useState, type FormEvent } from 'react';
import { Button, CurrencyInput, Field, Input, NumberInput, Textarea } from '@getrentos/ui';
import { formatCurrency } from '@/lib/format';
import type { LandLayoutInput, OwnerLandLayout } from '@/types/landDeveloper';
import { LandDocumentPicker } from '../documents/LandDocumentPicker';

interface LayoutFormProps {
  /** The parcel the estate is laid out on; its documents back the layout plan. */
  propertyId: string;
  /** Editing an existing layout; omit to create one. */
  layout?: OwnerLandLayout;
  isSaving: boolean;
  submitLabel: string;
  onSubmit: (input: LandLayoutInput) => void;
  onCancel?: () => void;
}

interface FormState {
  name: string;
  description: string;
  layoutApprovalReference: string;
  layoutPlanDocumentId: string;
  reservationHoldHours: string;
  documentationFee: number;
  surveyFee: number;
  developmentLevy: number;
}

const fromLayout = (layout?: OwnerLandLayout): FormState => ({
  name: layout?.name ?? '',
  description: layout?.description ?? '',
  layoutApprovalReference: layout?.layoutApprovalReference ?? '',
  layoutPlanDocumentId: layout?.layoutPlanDocumentId ?? '',
  reservationHoldHours: String(layout?.reservationHoldHours ?? 48),
  documentationFee: layout?.fees.documentationFee ?? 0,
  surveyFee: layout?.fees.surveyFee ?? 0,
  developmentLevy: layout?.fees.developmentLevy ?? 0,
});

/** Estate name, approval, reservation hold and the per-plot fees. */
export const LayoutForm = ({
  propertyId,
  layout,
  isSaving,
  submitLabel,
  onSubmit,
  onCancel,
}: LayoutFormProps) => {
  const id = useId();
  const [form, setForm] = useState<FormState>(() => fromLayout(layout));
  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((current) => ({ ...current, [key]: value }));

  const name = form.name.trim();
  const holdHours = Number(form.reservationHoldHours);
  const nameError = name.length > 0 && name.length < 2 ? 'At least 2 characters.' : undefined;
  const holdError =
    !Number.isInteger(holdHours) || holdHours < 1 || holdHours > 336
      ? 'Between 1 and 336 hours (14 days).'
      : undefined;
  const canSubmit = name.length >= 2 && !holdError;
  const feeTotal = form.documentationFee + form.surveyFee + form.developmentLevy;

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!canSubmit) return;
    const description = form.description.trim();
    const reference = form.layoutApprovalReference.trim();
    const documentId = form.layoutPlanDocumentId.trim();
    onSubmit({
      name,
      // On edit, an emptied field is cleared with null; on create it is left out.
      description: description || (layout ? null : undefined),
      layoutApprovalReference: reference || (layout ? null : undefined),
      layoutPlanDocumentId: documentId || (layout ? null : undefined),
      reservationHoldHours: holdHours,
      documentationFee: form.documentationFee,
      surveyFee: form.surveyFee,
      developmentLevy: form.developmentLevy,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Field label="Estate name" htmlFor={`${id}-name`} required error={nameError}>
        <Input
          id={`${id}-name`}
          value={form.name}
          maxLength={200}
          onChange={(event) => set('name', event.target.value)}
          placeholder="e.g. Palm Springs Estate Phase 2"
        />
      </Field>

      <Field label="Description" htmlFor={`${id}-description`} hint="Shown to buyers.">
        <Textarea
          id={`${id}-description`}
          value={form.description}
          maxLength={5000}
          rows={3}
          onChange={(event) => set('description', event.target.value)}
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Layout approval reference"
          htmlFor={`${id}-approval`}
          hint="State planning permit or layout approval number."
        >
          <Input
            id={`${id}-approval`}
            value={form.layoutApprovalReference}
            maxLength={120}
            onChange={(event) => set('layoutApprovalReference', event.target.value)}
            placeholder="e.g. LSPPPA/2026/1182"
          />
        </Field>
        <Field
          label="Reservation hold (hours)"
          htmlFor={`${id}-hold`}
          required
          error={holdError}
          hint="How long a buyer's reservation holds a plot."
        >
          <NumberInput
            id={`${id}-hold`}
            integer
            value={form.reservationHoldHours}
            onValueChange={(value) => set('reservationHoldHours', value)}
          />
        </Field>
      </div>

      <LandDocumentPicker
        propertyId={propertyId}
        label="Approved layout plan document"
        hint="Optional. The approved layout plan, shown to compliance and buyers as evidence."
        suggestedType="LAYOUT_PLAN"
        value={form.layoutPlanDocumentId}
        onChange={(value) => set('layoutPlanDocumentId', value)}
        disabled={isSaving}
      />

      <fieldset className="rounded-xl border border-border p-4">
        <legend className="px-1 text-sm font-medium text-foreground">Fees per plot</legend>
        <p className="mb-3 text-xs text-muted-foreground">
          Charged once on top of the plot price, in the buyer&apos;s first payment. Changes apply to
          purchases started afterwards.
        </p>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Documentation" htmlFor={`${id}-doc-fee`}>
            <CurrencyInput
              id={`${id}-doc-fee`}
              prefix="₦"
              value={form.documentationFee}
              onValueChange={(value) => set('documentationFee', value)}
              placeholder="0"
            />
          </Field>
          <Field label="Survey" htmlFor={`${id}-survey-fee`}>
            <CurrencyInput
              id={`${id}-survey-fee`}
              prefix="₦"
              value={form.surveyFee}
              onValueChange={(value) => set('surveyFee', value)}
              placeholder="0"
            />
          </Field>
          <Field label="Development levy" htmlFor={`${id}-levy`}>
            <CurrencyInput
              id={`${id}-levy`}
              prefix="₦"
              value={form.developmentLevy}
              onValueChange={(value) => set('developmentLevy', value)}
              placeholder="0"
            />
          </Field>
        </div>
        <p className="mt-3 text-sm text-muted-foreground">
          Total fees per plot:{' '}
          <span className="font-medium text-foreground">{formatCurrency(feeTotal)}</span>
        </p>
      </fieldset>

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel} disabled={isSaving}>
            Cancel
          </Button>
        )}
        <Button type="submit" variant="primary" disabled={!canSubmit} isLoading={isSaving}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
};
