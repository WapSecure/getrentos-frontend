'use client';

import { CurrencyInput, Field } from '@getrentos/ui';

interface PropertyValueFieldsProps {
  estimatedValue: string;
  purchasePrice: string;
  onEstimatedValueChange: (value: string) => void;
  onPurchasePriceChange: (value: string) => void;
}

/** What the property is worth and what it cost: the two numbers Portfolio needs for cap rate and yield. */
export const PropertyValueFields = ({
  estimatedValue,
  purchasePrice,
  onEstimatedValueChange,
  onPurchasePriceChange,
}: PropertyValueFieldsProps) => (
  <div className="grid gap-3 sm:grid-cols-2">
    <Field label="Current value (₦)" hint="What you would sell it for today.">
      <CurrencyInput
        prefix="₦"
        value={estimatedValue}
        onValueChange={(v) => onEstimatedValueChange(v === 0 ? '' : String(v))}
        placeholder="e.g. 120000000"
      />
    </Field>
    <Field label="Purchase price (₦)" hint="What you paid for it.">
      <CurrencyInput
        prefix="₦"
        value={purchasePrice}
        onValueChange={(v) => onPurchasePriceChange(v === 0 ? '' : String(v))}
        placeholder="e.g. 85000000"
      />
    </Field>
  </div>
);

/** A blank field means "not given", never zero. */
export const toOptionalAmount = (value: string): number | undefined => {
  const amount = Number(value);
  return value.trim() !== '' && Number.isFinite(amount) && amount > 0 ? amount : undefined;
};
