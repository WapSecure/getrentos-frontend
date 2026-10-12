'use client';

import { useId } from 'react';
import { CurrencyInput } from '@getrentos/ui';
import { formatCurrency } from '@/lib/format';
import type { LandPaymentPlanTerms } from '@/types/landDeveloper';
import { priceExample } from './planPricing';

interface PlanPriceExampleProps {
  terms: Pick<LandPaymentPlanTerms, 'durationMonths' | 'initialDepositBps' | 'priceUpliftBps'>;
  /** Layout fees per plot (documentation + survey + levy). */
  fees: number;
  plotPrice: number;
  onPlotPriceChange?: (price: number) => void;
}

const Row = ({ label, value, strong }: { label: string; value: string; strong?: boolean }) => (
  <div className="flex items-baseline justify-between gap-3">
    <dt className="text-muted-foreground">{label}</dt>
    <dd className={strong ? 'font-semibold text-foreground' : 'text-foreground'}>{value}</dd>
  </div>
);

/** What a buyer would pay under these terms, worked through on one plot price. */
export const PlanPriceExample = ({
  terms,
  fees,
  plotPrice,
  onPlotPriceChange,
}: PlanPriceExampleProps) => {
  const id = useId();
  const example = priceExample(plotPrice, fees, terms);
  const outright = example.durationMonths === 0;

  return (
    <div className="rounded-xl border border-border bg-secondary/40 p-4 text-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-medium text-foreground">Price example</p>
        {onPlotPriceChange && (
          <label htmlFor={id} className="flex items-center gap-2 text-xs text-muted-foreground">
            On a plot of
            <span className="w-36">
              <CurrencyInput
                id={id}
                prefix="₦"
                value={plotPrice}
                onValueChange={onPlotPriceChange}
                className="h-8 text-sm"
              />
            </span>
          </label>
        )}
      </div>
      {plotPrice <= 0 ? (
        <p className="mt-2 text-muted-foreground">Enter a plot price to see the example.</p>
      ) : (
        <dl className="mt-3 space-y-1.5">
          <Row label="Plot price" value={formatCurrency(example.plotPrice)} />
          {example.priceUplift > 0 && (
            <Row label="Installment premium" value={formatCurrency(example.priceUplift)} />
          )}
          {example.fees > 0 && <Row label="Fees" value={formatCurrency(example.fees)} />}
          <Row label="Total price" value={formatCurrency(example.totalPrice)} strong />
          <div className="my-2 border-t border-border" />
          <Row
            label={outright ? 'Paid up front' : 'Deposit + fees to start'}
            value={formatCurrency(example.initialPayment)}
            strong
          />
          {!outright && example.monthlyInstallment > 0 && (
            <Row
              label={`Then ${example.durationMonths} monthly payment${example.durationMonths === 1 ? '' : 's'} of`}
              value={formatCurrency(example.monthlyInstallment)}
              strong
            />
          )}
          {!outright && example.finalInstallment !== example.monthlyInstallment && (
            <p className="text-xs text-muted-foreground">
              The last payment is {formatCurrency(example.finalInstallment)} so the total comes to
              the naira.
            </p>
          )}
        </dl>
      )}
    </div>
  );
};
