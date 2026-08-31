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
import { BedDouble, CalendarCheck, CircleDollarSign, Eye, TrendingUp, Wallet } from 'lucide-react';
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
  const { data: views } = useQuery({
    queryKey: shortletKeys.hostAnalyticsViews,
    queryFn: () => unwrap(shortletService.hostViewsAnalytics()),
  });

  const maxMonthly = Math.max(1, ...(data?.monthly.map((m) => m.earned) ?? []));
  const maxListing = Math.max(1, ...(data?.byListing.map((l) => l.earned) ?? []));
  const maxDailyViews = Math.max(1, ...(views?.daily.map((d) => d.views) ?? []));
  const maxListingViews = Math.max(1, ...(views?.byListing.map((l) => l.views) ?? []));

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
                  label="Take-home (net)"
                  value={formatCurrency(data.totalEarned)}
                  hint={
                    data.grossEarned !== data.totalEarned
                      ? `Before fees: ${formatCurrency(data.grossEarned)}`
                      : undefined
                  }
                />
                <StatCard
                  icon={Wallet}
                  label="GetRentos fee"
                  value={formatCurrency(data.platformFees)}
                  hint={
                    data.commissionPct != null && data.commissionPct > 0
                      ? `${data.commissionPct}% commission`
                      : 'No commission set'
                  }
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
                {data.taxName && data.taxPct ? (
                  <StatCard
                    icon={CircleDollarSign}
                    label={`Guest ${data.taxName}`}
                    value={`${data.taxPct}%`}
                    hint="Added at checkout, collected by GetRentos"
                  />
                ) : null}
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

              {views && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <StatCard
                      icon={Eye}
                      label="Total views"
                      value={String(views.totalViews)}
                      hint="Times a detail page was opened"
                    />
                    <StatCard
                      icon={Eye}
                      label="Unique viewers"
                      value={String(views.totalUniqueViewers)}
                      hint="Distinct signed-in visitors"
                    />
                  </div>

                  {views.daily.length > 0 && (
                    <div>
                      <p className="mb-2 text-sm font-medium">Views — last 30 days</p>
                      <div className="flex h-28 items-end gap-1 rounded-lg border border-border p-3">
                        {views.daily.map((d) => (
                          <div
                            key={d.date}
                            className="flex h-full flex-1 items-end"
                            title={`${d.date}: ${d.views} view${d.views === 1 ? '' : 's'}`}
                          >
                            <div
                              className="w-full rounded-t bg-emerald-500/70"
                              style={{ height: `${Math.max(4, (d.views / maxDailyViews) * 100)}%` }}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {views.byListing.length > 0 && (
                    <div>
                      <p className="mb-2 text-sm font-medium">Views by listing</p>
                      <div className="divide-y divide-border rounded-lg border border-border">
                        {views.byListing.map((l) => (
                          <div key={l.listingId} className="p-3">
                            <div className="flex items-center justify-between">
                              <p className="truncate text-sm font-medium">{l.title}</p>
                              <p className="font-semibold">{l.views}</p>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {l.uniqueViewers} unique viewer{l.uniqueViewers === 1 ? '' : 's'}
                            </p>
                            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                              <div
                                className="h-full rounded-full bg-emerald-500/70"
                                style={{ width: `${(l.views / maxListingViews) * 100}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
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
