import { formatCurrency } from '@/lib/format';
import type { LandPlanPriceExample, PublicLandPaymentPlan } from '@/types/landBuyer';
import { bpsToPercent, type PlotQuote } from './landSaleLogic';

const Row = ({ label, value, strong }: { label: string; value: string; strong?: boolean }) => (
  <div className="flex items-center justify-between gap-3 py-1">
    <dt className="text-muted-foreground">{label}</dt>
    <dd className={strong ? 'font-semibold text-foreground' : 'text-foreground'}>{value}</dd>
  </div>
);

/** The plan's terms in plain words. */
export const planTermsLine = (plan: PublicLandPaymentPlan) =>
  plan.durationMonths === 0
    ? 'Pay in full to start. No price uplift.'
    : `${bpsToPercent(plan.initialDepositBps)} deposit, then ${plan.durationMonths} monthly installments. ${
        plan.priceUpliftBps
          ? `${bpsToPercent(plan.priceUpliftBps)} added to the plot price.`
          : 'No price uplift.'
      }`;

/**
 * One payment plan with a worked price. `quote` is the selected plot's price
 * under this plan; without one the API's example (on the cheapest available
 * plot) is shown.
 */
export const PaymentPlanCard = ({
  plan,
  quote,
  quoteLabel,
}: {
  plan: PublicLandPaymentPlan;
  quote?: PlotQuote | null;
  quoteLabel?: string;
}) => {
  const worked: LandPlanPriceExample | PlotQuote | undefined = quote ?? plan.example;
  return (
    <article className="rounded-2xl border border-border bg-card p-4">
      <h3 className="font-semibold text-foreground">{plan.name}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{planTermsLine(plan)}</p>

      {worked ? (
        <>
          <p className="mt-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {quote ? (quoteLabel ?? 'For this plot') : 'Example on the cheapest available plot'}
          </p>
          <dl className="mt-1 divide-y divide-border/60 text-sm">
            <Row label="Plot price" value={formatCurrency(worked.plotPrice)} />
            {worked.priceUplift > 0 && (
              <Row label="Installment uplift" value={formatCurrency(worked.priceUplift)} />
            )}
            <Row label="Fees" value={formatCurrency(worked.fees)} />
            <Row label="Total price" value={formatCurrency(worked.totalPrice)} strong />
            <Row
              label={worked.durationMonths === 0 ? 'Due to start' : 'Deposit + fees to start'}
              value={formatCurrency(worked.initialPayment)}
              strong
            />
            {worked.durationMonths > 0 && (
              <Row
                label={`Then monthly × ${worked.durationMonths}`}
                value={`≈ ${formatCurrency(worked.monthlyInstallment)}`}
              />
            )}
          </dl>
        </>
      ) : null}

      <details className="mt-3 text-xs text-muted-foreground">
        <summary className="cursor-pointer font-medium text-foreground">
          If a payment is late
        </summary>
        <ul className="mt-2 list-disc space-y-1 pl-4">
          <li>
            {plan.gracePeriodDays} days&apos; grace, then a one-off late fee of{' '}
            {bpsToPercent(plan.lateFeeBps)} of that installment.
          </li>
          <li>
            {plan.defaultAfterDays} days overdue puts the purchase in default and the developer may
            revoke it.
          </li>
          <li>
            Cancelling or revocation refunds what you paid less a{' '}
            {bpsToPercent(plan.revocationChargeBps)} forfeiture charge. Late fees are not refunded.
          </li>
        </ul>
      </details>
    </article>
  );
};
