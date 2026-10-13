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
  NumberInput,
} from '@getrentos/ui';
import type { LandPaymentPlan, LandPaymentPlanInput } from '@/types/landDeveloper';
import { PlanPriceExample } from './PlanPriceExample';
import { bpsToPercent, percentToBps, planTermProblems } from './planPricing';

interface PlanFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Editing this plan; omit to create one. */
  plan?: LandPaymentPlan | null;
  fees: number;
  samplePlotPrice: number;
  isSaving: boolean;
  onSubmit: (input: LandPaymentPlanInput) => void;
}

interface NumberSpec {
  key: keyof Omit<FormState, 'name'>;
  label: string;
  hint: string;
  min: number;
  max: number;
  integer: boolean;
  suffix: string;
}

interface FormState {
  name: string;
  durationMonths: string;
  depositPercent: string;
  upliftPercent: string;
  gracePeriodDays: string;
  lateFeePercent: string;
  defaultAfterDays: string;
  forfeiturePercent: string;
}

const SPECS: NumberSpec[] = [
  {
    key: 'durationMonths',
    label: 'Duration',
    hint: '0 months is an outright purchase.',
    min: 0,
    max: 120,
    integer: true,
    suffix: 'months',
  },
  {
    key: 'depositPercent',
    label: 'Deposit',
    hint: 'Share of the price paid to start.',
    min: 0,
    max: 100,
    integer: false,
    suffix: '%',
  },
  {
    key: 'upliftPercent',
    label: 'Installment premium',
    hint: 'Added to the price for paying over time.',
    min: 0,
    max: 100,
    integer: false,
    suffix: '%',
  },
  {
    key: 'gracePeriodDays',
    label: 'Grace period',
    hint: 'Days after a due date before a late fee.',
    min: 0,
    max: 60,
    integer: true,
    suffix: 'days',
  },
  {
    key: 'lateFeePercent',
    label: 'Late fee',
    hint: 'Charged once on a late installment.',
    min: 0,
    max: 20,
    integer: false,
    suffix: '%',
  },
  {
    key: 'defaultAfterDays',
    label: 'Default after',
    hint: 'Days overdue before the purchase defaults.',
    min: 1,
    max: 365,
    integer: true,
    suffix: 'days',
  },
  {
    key: 'forfeiturePercent',
    label: 'Forfeiture on revocation',
    hint: 'Kept from what was paid if you revoke.',
    min: 0,
    max: 50,
    integer: false,
    suffix: '%',
  },
];

const fromPlan = (plan?: LandPaymentPlan | null): FormState => ({
  name: plan?.name ?? '',
  durationMonths: String(plan?.durationMonths ?? 12),
  depositPercent: String(bpsToPercent(plan?.initialDepositBps ?? 3000)),
  upliftPercent: String(bpsToPercent(plan?.priceUpliftBps ?? 0)),
  gracePeriodDays: String(plan?.gracePeriodDays ?? 7),
  lateFeePercent: String(bpsToPercent(plan?.lateFeeBps ?? 0)),
  defaultAfterDays: String(plan?.defaultAfterDays ?? 60),
  forfeiturePercent: String(bpsToPercent(plan?.revocationChargeBps ?? 2000)),
});

const PlanForm = ({
  plan,
  fees,
  samplePlotPrice,
  isSaving,
  onSubmit,
  onCancel,
}: Omit<PlanFormDialogProps, 'open' | 'onOpenChange'> & { onCancel: () => void }) => {
  const id = useId();
  const [form, setForm] = useState<FormState>(() => fromPlan(plan));
  const [examplePrice, setExamplePrice] = useState(samplePlotPrice || 10_000_000);

  const fieldError = (spec: NumberSpec): string | undefined => {
    const raw = form[spec.key];
    const value = Number(raw);
    if (raw.trim() === '' || !Number.isFinite(value)) return 'Required.';
    if (spec.integer && !Number.isInteger(value)) return 'Use a whole number.';
    if (!spec.integer && (raw.trim().split('.')[1]?.length ?? 0) > 2) {
      return 'At most 2 decimal places.';
    }
    if (value < spec.min || value > spec.max) return `Between ${spec.min} and ${spec.max}.`;
    return undefined;
  };

  const input: LandPaymentPlanInput = {
    name: form.name.trim(),
    durationMonths: Number(form.durationMonths) || 0,
    initialDepositBps: percentToBps(form.depositPercent),
    priceUpliftBps: percentToBps(form.upliftPercent),
    gracePeriodDays: Number(form.gracePeriodDays) || 0,
    lateFeeBps: percentToBps(form.lateFeePercent),
    defaultAfterDays: Number(form.defaultAfterDays) || 0,
    revocationChargeBps: percentToBps(form.forfeiturePercent),
  };
  const errors = SPECS.map(fieldError);
  const nameError =
    input.name.length > 0 && input.name.length < 2 ? 'At least 2 characters.' : undefined;
  const termProblems = errors.some(Boolean) ? [] : planTermProblems(input);
  const valid = input.name.length >= 2 && !errors.some(Boolean) && termProblems.length === 0;

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (valid) onSubmit(input);
  };

  return (
    <form onSubmit={handleSubmit} className="mt-4 space-y-4">
      <Field label="Plan name" htmlFor={`${id}-name`} required error={nameError}>
        <Input
          id={`${id}-name`}
          value={form.name}
          maxLength={80}
          placeholder="e.g. 12 months"
          onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
        />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        {SPECS.map((spec, index) => (
          <Field
            key={spec.key}
            label={spec.label}
            htmlFor={`${id}-${spec.key}`}
            hint={spec.hint}
            error={errors[index]}
          >
            <NumberInput
              id={`${id}-${spec.key}`}
              integer={spec.integer}
              value={form[spec.key]}
              onValueChange={(value) => setForm((current) => ({ ...current, [spec.key]: value }))}
              trailingIcon={<span className="text-xs text-muted-foreground">{spec.suffix}</span>}
            />
          </Field>
        ))}
      </div>
      {termProblems.length > 0 && (
        <ul className="space-y-1 text-sm text-destructive">
          {termProblems.map((problem) => (
            <li key={problem}>{problem}</li>
          ))}
        </ul>
      )}
      <PlanPriceExample
        terms={input}
        fees={fees}
        plotPrice={examplePrice}
        onPlotPriceChange={setExamplePrice}
      />
      {plan && (
        <p className="text-xs text-muted-foreground">
          Changes apply to new purchases only. Live contracts keep the terms they started on.
        </p>
      )}
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button type="button" variant="ghost" onClick={onCancel} disabled={isSaving}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" disabled={!valid} isLoading={isSaving}>
          {plan ? 'Save plan' : 'Create plan'}
        </Button>
      </div>
    </form>
  );
};

/** Create or edit a payment plan, with a live example of what a buyer would pay. */
export const PlanFormDialog = ({ open, onOpenChange, plan, ...rest }: PlanFormDialogProps) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="max-w-2xl">
      <DialogTitle className="text-lg font-semibold text-foreground">
        {plan ? `Edit ${plan.name}` : 'New payment plan'}
      </DialogTitle>
      <DialogDescription className="mt-1 text-sm text-muted-foreground">
        Buyers choose a plan when they turn a reservation into a purchase.
      </DialogDescription>
      <PlanForm
        key={plan?.id ?? 'new'}
        plan={plan}
        {...rest}
        onCancel={() => onOpenChange(false)}
      />
    </DialogContent>
  </Dialog>
);
