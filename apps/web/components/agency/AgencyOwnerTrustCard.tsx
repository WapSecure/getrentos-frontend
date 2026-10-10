'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, Loader2, ShieldCheck, Wallet } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/format';
import { unwrap } from '@/lib/apiHelpers';
import { agencyTrustService, AGENCY_TRUST_ENTRY_LABELS } from '@/services/agencyTrustService';

/**
 * What the firm holds for one client, from the client-money ledger.
 *
 * The balance is the firm's own account for this owner — never the platform's or
 * another firm's. When the stored balance disagrees with the sum of its own
 * entries the card says so out loud rather than quietly showing a figure the
 * ledger cannot stand behind.
 */
export function AgencyOwnerTrustCard({ ownerId }: { ownerId: string }) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['agency', 'trust', ownerId],
    queryFn: () => unwrap(agencyTrustService.getOwnerTrust(ownerId)),
  });

  return (
    <div className="mt-6">
      <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground">
        <Wallet className="h-4 w-4 text-muted-foreground" />
        Client money held
      </h2>
      <div className="rounded-2xl border border-border bg-card p-5">
        {isLoading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            Loading the ledger…
          </div>
        ) : isError ? (
          <p className="text-sm text-muted-foreground">We couldn’t load this client’s ledger.</p>
        ) : !data || data.balance === null ? (
          <p className="text-sm text-muted-foreground">
            No money has moved through your account for this client yet.
          </p>
        ) : (
          <>
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-xs text-muted-foreground">Balance you hold</p>
                <p className="text-2xl font-bold text-foreground">{formatCurrency(data.balance)}</p>
              </div>
              {data.inSync ? (
                <span className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300">
                  <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
                  Reconciled
                </span>
              ) : (
                <span className="flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-800 dark:bg-amber-900/20 dark:text-amber-300">
                  <AlertTriangle className="h-3.5 w-3.5" aria-hidden />
                  Drift: ledger sums to {formatCurrency(data.reconciledBalance)}
                </span>
              )}
            </div>

            {data.protection ? (
              <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
                <ShieldCheck
                  className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400"
                  aria-hidden
                />
                Protected under {data.protection.schemeName}
                {data.protection.coverageAmount != null
                  ? ` · up to ${formatCurrency(data.protection.coverageAmount)}`
                  : ''}
              </p>
            ) : (
              <Link
                href="/agency/protection"
                className="mt-3 inline-flex items-center gap-1.5 text-xs text-amber-700 hover:underline dark:text-amber-400"
              >
                <AlertTriangle className="h-3.5 w-3.5" aria-hidden />
                No client-money protection on record — add one
              </Link>
            )}

            {data.entries.length > 0 && (
              <div className="mt-4 overflow-hidden rounded-xl border border-border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-xs text-muted-foreground">
                      <th className="px-3 py-2 font-medium">Date</th>
                      <th className="px-3 py-2 font-medium">Movement</th>
                      <th className="px-3 py-2 font-medium">Property</th>
                      <th className="px-3 py-2 text-right font-medium">Amount</th>
                      <th className="px-3 py-2 text-right font-medium">Balance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {data.entries.map((e) => (
                      <tr key={e.id}>
                        <td className="px-3 py-2 text-muted-foreground">
                          {formatDate(e.occurredAt)}
                        </td>
                        <td className="px-3 py-2">
                          {AGENCY_TRUST_ENTRY_LABELS[e.entryType] ?? e.entryType}
                        </td>
                        <td className="px-3 py-2 text-muted-foreground">
                          <span className="block max-w-[14rem] truncate">
                            {e.propertyTitle ?? '—'}
                          </span>
                        </td>
                        <td
                          className={`px-3 py-2 text-right font-medium ${
                            e.amount >= 0
                              ? 'text-emerald-700 dark:text-emerald-400'
                              : 'text-foreground'
                          }`}
                        >
                          {e.amount >= 0 ? '+' : '−'}
                          {formatCurrency(Math.abs(e.amount))}
                        </td>
                        <td className="px-3 py-2 text-right text-muted-foreground">
                          {formatCurrency(e.balanceAfter)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
