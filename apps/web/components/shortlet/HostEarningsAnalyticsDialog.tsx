'use client';

import { useQuery } from '@tanstack/react-query';
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  Skeleton,
} from '@getrentos/ui';
import { BedDouble, CalendarCheck, CircleDollarSign, TrendingUp, Wallet } from 'lucide-react';
import { unwrap } from '@/lib/apiHelpers';
import { shortletService } from '@/services/shortletService';
import { shortletKeys } from '@/lib/queryKeys';
import { formatCurrency } from '@/lib/format';

function StatCard({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: typeof Wallet;
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-secondary/40 p-4">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className="h-4 w-4" />
        <span className="text-xs">{label}</span>
      </div>
      <p className="mt-1 text-xl font-semibold">{value}</p>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function HostEarningsAnalyticsDialog({ onClose }: { onClose: () => void }) {
  const { data, isLoading } = useQuery({
    queryKey: shortletKeys.hostAnalytics,
    queryFn: () => unwrap(shortletService.hostEarningsAnalytics()),
  });

  const maxMonthly = Math.max(1, ...(data?.monthly.map((m) => m.earned) ?? []));
  const maxListing = Math.max(1, ...(data?.byListing.map((l) => l.earned) ?? []));

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-2xl">
        <div className="p-5">
          <DialogTitle>Earnings analytics</DialogTitle>
          <DialogDescription>Your shortlet earnings across all listings.</DialogDescription>
        </div>
        <div className="max-h-[75vh] space-y-5 overflow-y-auto border-t border-border p-5">
          {isLoading || !data ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-20 w-full rounded-lg" />
                ))}
              </div>
              <Skeleton className="h-40 w-full rounded-lg" />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                <StatCard
                  icon={CircleDollarSign}
                  label="Total earned"
                  value={formatCurrency(data.totalEarned)}
                />
                <StatCard icon={Wallet} label="Paid out" value={formatCurrency(data.paidOut)} />
                <StatCard
                  icon={TrendingUp}
                  label="Available"
                  value={formatCurrency(data.available)}
                />
                <StatCard
                  icon={CalendarCheck}
                  label="Bookings"
                  value={String(data.bookingsCount)}
                />
                <StatCard icon={BedDouble} label="Nights sold" value={String(data.nightsSold)} />
                <StatCard
                  icon={CircleDollarSign}
                  label="Avg nightly rate"
                  value={data.avgNightlyRate != null ? formatCurrency(data.avgNightlyRate) : '—'}
                />
              </div>

              {data.monthly.length > 0 && (
                <div>
                  <p className="mb-2 text-sm font-medium">Monthly earnings</p>
                  <div className="flex h-36 items-end gap-2 rounded-lg border border-border p-3">
                    {data.monthly.map((m) => (
                      <div key={m.month} className="flex flex-1 flex-col items-center gap-1">
                        <div className="flex w-full flex-1 items-end">
                          <div
                            className="w-full rounded-t bg-primary/70"
                            style={{ height: `${Math.max(4, (m.earned / maxMonthly) * 100)}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-muted-foreground">
                          {m.month.slice(5)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {data.byListing.length > 0 && (
                <div>
                  <p className="mb-2 text-sm font-medium">Earnings by listing</p>
                  <div className="divide-y divide-border rounded-lg border border-border">
                    {data.byListing.map((l) => (
                      <div key={l.listingId} className="p-3">
                        <div className="flex items-center justify-between">
                          <p className="truncate text-sm font-medium">{l.title}</p>
                          <p className="font-semibold">{formatCurrency(l.earned)}</p>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {l.bookings} booking{l.bookings === 1 ? '' : 's'} · {l.nights} night
                          {l.nights === 1 ? '' : 's'}
                        </p>
                        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full rounded-full bg-primary"
                            style={{ width: `${(l.earned / maxListing) * 100}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
          <div className="flex justify-end">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
