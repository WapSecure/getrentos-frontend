'use client';

import { Button, CurrencyInput, Field } from '@sureground/ui';
import { formatCurrency } from '@/lib/format';

export interface ListingFeeValues {
  /** '' = not stated, '0' = none. */
  serviceCharge: string;
  agencyFee: string;
  legalFee: string;
}

export const EMPTY_FEES: ListingFeeValues = { serviceCharge: '', agencyFee: '', legalFee: '' };

export const feesToPayload = (fees: ListingFeeValues) => ({
  serviceCharge: fees.serviceCharge === '' ? undefined : Number(fees.serviceCharge),
  agencyFee: fees.agencyFee === '' ? undefined : Number(fees.agencyFee),
  legalFee: fees.legalFee === '' ? undefined : Number(fees.legalFee),
});

const FEES: { key: keyof ListingFeeValues; label: string; hint: string; tenPercent: boolean }[] = [
  {
    key: 'serviceCharge',
    label: 'Service charge (₦ a year)',
    hint: 'Estate dues, security, waste and shared power.',
    tenPercent: false,
  },
  { key: 'agencyFee', label: 'Agency fee (₦)', hint: 'Paid once, to the agent.', tenPercent: true },
  {
    key: 'legalFee',
    label: 'Legal fee (₦)',
    hint: 'Paid once, for the agreement.',
    tenPercent: true,
  },
];

interface ListingFeeFieldsProps {
  value: ListingFeeValues;
  onChange: (next: ListingFeeValues) => void;
  /** Rent for one year, for the 10% shortcut. */
  annualRent?: number;
}

/** Amounts in naira. The 10% shortcut only fills the box; what is saved is the amount shown. */
export function ListingFeeFields({ value, onChange, annualRent }: ListingFeeFieldsProps) {
  const set = (key: keyof ListingFeeValues, next: string) => onChange({ ...value, [key]: next });
  const tenPercent = annualRent && annualRent > 0 ? Math.round(annualRent / 10) : null;

  return (
    <fieldset className="space-y-3">
      <legend className="text-sm font-medium text-foreground">Fees tenants pay to move in</legend>
      <p className="text-xs text-muted-foreground">
        Renters see these with the rent. Leave a fee blank if you haven’t decided, or choose “None”
        if there isn’t one.
      </p>
      {FEES.map((fee) => (
        <Field key={fee.key} label={fee.label} hint={fee.hint}>
          <div className="flex flex-wrap items-center gap-2">
            <div className="min-w-0 flex-1">
              <CurrencyInput
                prefix="₦"
                allowZero
                value={value[fee.key]}
                onValueChange={(v) => set(fee.key, v === 0 ? '' : String(v))}
                placeholder="Not stated"
                aria-label={fee.label}
              />
            </div>
            {fee.tenPercent && tenPercent && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => set(fee.key, String(tenPercent))}
              >
                10% ({formatCurrency(tenPercent, { compact: true })})
              </Button>
            )}
            <Button
              type="button"
              variant={value[fee.key] === '0' ? 'secondary' : 'ghost'}
              size="sm"
              aria-pressed={value[fee.key] === '0'}
              onClick={() => set(fee.key, value[fee.key] === '0' ? '' : '0')}
            >
              None
            </Button>
          </div>
        </Field>
      ))}
    </fieldset>
  );
}
