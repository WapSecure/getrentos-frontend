'use client';

import { NumberInput } from '@getrentos/ui';

interface PropertyValueFieldsProps {
  estimatedValue: string;
  purchasePrice: string;
  onEstimatedValueChange: (value: string) => void;
  onPurchasePriceChange: (value: string) => void;
}

const inputClass =
  'w-full px-3 py-2 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary';

/** What the property is worth and what it cost — the two numbers Portfolio needs for cap rate and yield. */
export const PropertyValueFields = ({
  estimatedValue,
  purchasePrice,
  onEstimatedValueChange,
  onPurchasePriceChange,
}: PropertyValueFieldsProps) => (
  <div className="grid gap-3 sm:grid-cols-2">
    <div>
      <label className="block text-sm font-medium text-foreground mb-1">Current value (₦)</label>
      <NumberInput
        min={0}
        value={estimatedValue}
        onValueChange={onEstimatedValueChange}
        placeholder="e.g. 120000000"
        className={inputClass}
      />
      <p className="text-xs text-muted-foreground mt-1">What you would sell it for today.</p>
    </div>
    <div>
      <label className="block text-sm font-medium text-foreground mb-1">Purchase price (₦)</label>
      <NumberInput
        min={0}
        value={purchasePrice}
        onValueChange={onPurchasePriceChange}
        placeholder="e.g. 85000000"
        className={inputClass}
      />
      <p className="text-xs text-muted-foreground mt-1">What you paid for it.</p>
    </div>
  </div>
);

/** A blank field means "not given", never zero. */
export const toOptionalAmount = (value: string): number | undefined => {
  const amount = Number(value);
  return value.trim() !== '' && Number.isFinite(amount) && amount > 0 ? amount : undefined;
};
