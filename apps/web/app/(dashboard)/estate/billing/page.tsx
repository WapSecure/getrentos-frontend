'use client';

import { Check, X, Sparkles } from 'lucide-react';
import { Button } from '@getrentos/ui';
import { usePlanTier } from '@/hooks/usePlanTier';
import { PlanBadge } from '@/components/shared/subscription/PlanBadge';

interface ComparisonRow {
  label: string;
  free: string | boolean;
  pro: string | boolean;
}

const ROWS: ComparisonRow[] = [
  { label: 'Estates managed', free: 'Up to 1', pro: 'Unlimited' },
  { label: 'Households per estate', free: 'Up to 30', pro: 'Unlimited' },
  { label: 'Resident accounts, dues, QR visitor passes', free: true, pro: true },
  { label: 'Vehicle & delivery logs, gates', free: true, pro: true },
  { label: 'Incidents, maintenance, announcements, polls, amenities', free: true, pro: true },
  { label: 'Committee roster & governance document uploads', free: true, pro: true },
  { label: 'Committee e-signature sign-off on governance documents', free: false, pro: true },
  { label: 'Branded public microsite', free: false, pro: true },
  { label: 'CSV household import', free: false, pro: true },
  { label: 'Dashboard analytics (collection stats, dues trend)', free: false, pro: true },
];

function Cell({ value }: { value: string | boolean }) {
  if (typeof value === 'string') {
    return <span className="text-sm text-foreground">{value}</span>;
  }
  return value ? (
    <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400" aria-label="Included" />
  ) : (
    <X className="h-4 w-4 text-muted-foreground/50" aria-label="Not included" />
  );
}

export default function EstateBillingPage() {
  const { isPro, isLoading } = usePlanTier();

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Billing & plan</h1>
        <p className="text-muted-foreground mt-1">
          See what&apos;s included on Free and what Pro unlocks for growing your portfolio.
        </p>
      </div>

      <div className="bg-card rounded-2xl border border-border p-6 mb-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-primary">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Your current plan</p>
              <div className="mt-0.5">
                <PlanBadge />
              </div>
            </div>
          </div>
          {!isLoading && !isPro && (
            <Button variant="primary" href="mailto:hello@getrentos.com?subject=Upgrade%20to%20Pro">
              Contact us to upgrade
            </Button>
          )}
        </div>
      </div>

      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-border">
                <th className="p-4 text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                  Feature
                </th>
                <th className="p-4 text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground w-28">
                  Free
                </th>
                <th className="p-4 text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground w-28">
                  Pro
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {ROWS.map((row) => (
                <tr key={row.label}>
                  <td className="p-4 text-sm text-foreground">{row.label}</td>
                  <td className="p-4">
                    <Cell value={row.free} />
                  </td>
                  <td className="p-4">
                    <Cell value={row.pro} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
