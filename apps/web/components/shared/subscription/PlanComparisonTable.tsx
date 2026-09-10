'use client';

import { Check, X } from 'lucide-react';
import type { PlanEntitlementRow } from '@/services/subscriptionService';

function Cell({ value }: { value: boolean | string }) {
  if (typeof value === 'string') {
    return <span className="text-sm text-foreground">{value}</span>;
  }
  return value ? (
    <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400" aria-label="Included" />
  ) : (
    <X className="h-4 w-4 text-muted-foreground/50" aria-label="Not included" />
  );
}

/**
 * Free-vs-Pro value matrix. Rows come from the backend pricing catalog so the
 * two plans can never be described inconsistently across personas.
 */
export function PlanComparisonTable({
  rows,
  proLabel = 'Pro',
}: {
  rows: PlanEntitlementRow[];
  proLabel?: string;
}) {
  return (
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
                {proLabel}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((row) => (
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
  );
}
