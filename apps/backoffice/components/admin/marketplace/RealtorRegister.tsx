'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Briefcase,
  Search,
  Star,
  UserRound,
  MapPin,
  Building2,
  Landmark,
  BadgeCheck,
  Handshake,
  CircleDollarSign,
  FileText,
} from 'lucide-react';
import {
  Badge,
  Button,
  EmptyState,
  PageErrorState,
  Pagination,
  LegacyInput,
  type BadgeVariant,
} from '@getrentos/ui';
import { cn } from '@getrentos/shared';
import { formatCurrency, formatDate, unwrap } from '@getrentos/shared';
import { adminMarketplaceService } from '@/services/adminMarketplaceService';
import type { AdminRealtor, AdminRealtorDetail, LicenseStatus } from '@/types/marketplace';

const PAGE_SIZE = 10;

const LICENSE_VARIANT: Record<LicenseStatus, BadgeVariant> = {
  APPROVED: 'success',
  PENDING_REVIEW: 'warning',
  NEEDS_CLARIFICATION: 'warning',
  REJECTED: 'danger',
  NONE: 'neutral',
};

const LICENSE_LABEL: Record<LicenseStatus, string> = {
  APPROVED: 'Licensed',
  PENDING_REVIEW: 'Pending review',
  NEEDS_CLARIFICATION: 'Needs clarification',
  REJECTED: 'Rejected',
  NONE: 'No license',
};

type LicenseFilter = 'all' | LicenseStatus;

export const RealtorRegister = () => {
  const [search, setSearch] = useState('');
  const [license, setLicense] = useState<LicenseFilter>('all');
  const [page, setPage] = useState(1);
  const [active, setActive] = useState<AdminRealtor | null>(null);

  const { data, isLoading, isError, isFetching, refetch } = useQuery({
    queryKey: ['admin', 'realtors', { search, license, page }],
    queryFn: () =>
      unwrap(
        adminMarketplaceService.listRealtors({
          search: search.trim() || undefined,
          licenseStatus: license === 'all' ? undefined : license,
          page,
          pageSize: PAGE_SIZE,
        })
      ),
  });
  const items = data?.items ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Realtors</h1>
          <p className="mt-1 text-muted-foreground">
            Professional register — licenses, business settings, payout readiness, deals and
            reviews.
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card shadow-sm">
        <div className="flex flex-wrap items-center gap-3 border-b border-border p-4">
          <div className="relative flex-1 min-w-[220px] max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <LegacyInput
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search name or email..."
              className="w-full pl-9"
            />
          </div>
          <select
            value={license}
            onChange={(e) => {
              setLicense(e.target.value as LicenseFilter);
              setPage(1);
            }}
            className="rounded-lg border border-border bg-card px-3 py-2 text-sm"
          >
            <option value="all">All licenses</option>
            <option value="APPROVED">Licensed</option>
            <option value="PENDING_REVIEW">Pending review</option>
            <option value="REJECTED">Rejected</option>
            <option value="NONE">No license</option>
          </select>
        </div>

        {isError ? (
          <PageErrorState
            title="Could not load realtors"
            description="The realtor register is temporarily unavailable."
            onRetry={() => void refetch()}
            isRetrying={isFetching}
            className="min-h-[220px] rounded-none border-0"
          />
        ) : isLoading ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-16 animate-pulse rounded-lg bg-secondary" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <EmptyState
            icon={Briefcase}
            title="No realtors"
            description="Try adjusting your filters."
          />
        ) : (
          <div className="divide-y divide-border">
            {items.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => setActive(r)}
                className="flex w-full flex-wrap items-center justify-between gap-3 p-4 text-left transition-colors hover:bg-secondary/40"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate font-medium">{r.legalName}</p>
                    <Badge variant={LICENSE_VARIANT[r.licenseStatus]}>
                      {LICENSE_LABEL[r.licenseStatus]}
                    </Badge>
                    {r.payoutReady && <Badge variant="success">Payable</Badge>}
                  </div>
                  <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                    <UserRound className="h-3.5 w-3.5" /> {r.email ?? 'No email'}
                    {r.licenseNumber ? ` · License ${r.licenseNumber}` : ''}
                  </p>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {r.activeClientCount} active client{r.activeClientCount === 1 ? '' : 's'} ·{' '}
                    {r.dealsClosed} deal{r.dealsClosed === 1 ? '' : 's'} closed · {r.listingCount}{' '}
                    listing{r.listingCount === 1 ? '' : 's'}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right text-sm">
                    <p className="font-semibold">{r.commissionRate}%</p>
                    <p className="text-xs text-muted-foreground">commission</p>
                  </div>
                  <div className="text-right text-sm">
                    <p className="flex items-center justify-end gap-1 font-semibold">
                      <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                      {r.averageRating || '—'}
                    </p>
                    <p className="text-xs text-muted-foreground">{r.reviewCount} reviews</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        <Pagination
          page={page}
          pageSize={PAGE_SIZE}
          total={data?.total ?? 0}
          onPageChange={setPage}
        />
      </div>

      {active && <RealtorDetailDialog realtorId={active.id} onClose={() => setActive(null)} />}
    </div>
  );
};

function RealtorDetailDialog({ realtorId, onClose }: { realtorId: string; onClose: () => void }) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin', 'realtors', realtorId, 'detail'],
    queryFn: () => unwrap(adminMarketplaceService.realtorDetail(realtorId)),
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[88vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-border bg-card shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground">Loading realtor…</div>
        ) : isError || !data ? (
          <div className="p-8 text-center">
            <p className="text-destructive">Could not load the realtor case.</p>
            <Button className="mt-3" variant="ghost" onClick={onClose}>
              Close
            </Button>
          </div>
        ) : (
          <RealtorCase360 detail={data} onClose={onClose} />
        )}
      </div>
    </div>
  );
}

function RealtorCase360({ detail, onClose }: { detail: AdminRealtorDetail; onClose: () => void }) {
  const stats = [
    {
      icon: Building2,
      label: 'Listings',
      value: detail.listingCount,
      sub: `${detail.publishedListingCount} published`,
    },
    {
      icon: UserRound,
      label: 'Active clients',
      value: detail.activeClientCount,
      sub: `${detail.pendingClientCount} pending`,
    },
    { icon: Handshake, label: 'Open offers', value: detail.openOfferCount },
    { icon: MapPin, label: 'Leads', value: detail.leadCount },
  ];

  const commission = detail.commissions;

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border p-5">
        <div>
          <h2 className="flex flex-wrap items-center gap-2 text-lg font-semibold">
            {detail.legalName}
            {detail.licenses[0] && (
              <Badge variant={LICENSE_VARIANT[detail.licenses[0].status as LicenseStatus]}>
                {LICENSE_LABEL[detail.licenses[0].status as LicenseStatus]}
              </Badge>
            )}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {detail.email ?? 'No email'}
            {detail.phone ? ` · ${detail.phone}` : ''} · Joined {formatDate(detail.createdAt)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={detail.accountStatus === 'ACTIVE' ? 'success' : 'neutral'}>
            {detail.accountStatus}
          </Badge>
          <Badge variant="neutral">Trust {detail.trustScore}</Badge>
        </div>
      </div>

      <div className="space-y-5 p-5">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="rounded-xl border border-border bg-secondary/40 p-3">
              <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                <s.icon className="h-3.5 w-3.5" /> {s.label}
              </p>
              <p className="mt-1 text-xl font-semibold">{s.value}</p>
              {s.sub && <p className="text-xs text-muted-foreground">{s.sub}</p>}
            </div>
          ))}
        </div>

        {commission && (
          <div className="rounded-xl border border-border p-4">
            <p className="flex items-center gap-2 text-sm font-medium">
              <CircleDollarSign className="h-4 w-4" /> Commission summary
            </p>
            <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4">
              <MiniStat label="Earned" value={formatCurrency(commission.totalEarned)} />
              <MiniStat label="Pending" value={formatCurrency(commission.pending)} />
              <MiniStat label="Paid" value={formatCurrency(commission.paid)} />
              <MiniStat label="Deals" value={String(commission.dealsClosed)} />
            </div>
          </div>
        )}

        {detail.businessSettings && (
          <div className="rounded-xl border border-border p-4">
            <p className="text-sm font-medium">Business settings</p>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
              <Badge variant="neutral">{detail.businessSettings.commissionRate}% commission</Badge>
              {detail.businessSettings.serviceAreas.map((a) => (
                <Badge key={a} variant="info">
                  {a}
                </Badge>
              ))}
              {detail.businessSettings.propertyTypes.map((t) => (
                <Badge key={t} variant="info">
                  {t}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {detail.payout && (
          <div className="rounded-xl border border-border p-4">
            <p className="flex items-center gap-2 text-sm font-medium">
              <Landmark className="h-4 w-4" /> Payout account
              {detail.payout.verified ? (
                <Badge variant="success">Verified</Badge>
              ) : (
                <Badge variant="warning">Not verified</Badge>
              )}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {detail.payout.bankName ?? 'Bank not set'}
              {detail.payout.accountNumberMasked ? ` · ${detail.payout.accountNumberMasked}` : ''}
              {detail.payout.accountName ? ` · ${detail.payout.accountName}` : ''}
            </p>
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          {detail.recentClients.length > 0 && (
            <div>
              <p className="mb-2 text-sm font-medium">Recent clients</p>
              <div className="space-y-2">
                {detail.recentClients.map((c) => (
                  <div
                    key={c.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border p-2.5 text-sm"
                  >
                    <p className="font-medium">{c.clientName}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Badge variant="neutral">{c.status}</Badge>
                      <span>{c.propertyCount ?? 0} props</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {detail.recentListings.length > 0 && (
            <div>
              <p className="mb-2 text-sm font-medium">Recent listings</p>
              <div className="space-y-2">
                {detail.recentListings.map((l) => (
                  <div
                    key={l.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border p-2.5 text-sm"
                  >
                    <p className="truncate font-medium">{l.title}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Badge variant="neutral">{l.status}</Badge>
                      <span>{formatCurrency(l.price, { compact: true })}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {detail.licenses.length > 1 && (
          <div>
            <p className="mb-2 text-sm font-medium">License history</p>
            <div className="space-y-2">
              {detail.licenses.map((l) => (
                <div
                  key={l.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border p-2.5 text-sm"
                >
                  <p className="flex items-center gap-2 font-medium">
                    <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                    {l.licenseNumber}
                  </p>
                  <div className="flex items-center gap-2">
                    <Badge variant={LICENSE_VARIANT[l.status as LicenseStatus]}>
                      {LICENSE_LABEL[l.status as LicenseStatus]}
                    </Badge>
                    {l.rejectionReason && (
                      <span className="text-xs text-muted-foreground">{l.rejectionReason}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-end gap-2 border-t border-border p-4">
        <BadgeCheck className="mr-auto h-4 w-4 text-muted-foreground" />
        <Button variant="ghost" onClick={onClose}>
          Close
        </Button>
      </div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-secondary/40 p-2.5">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p
        className={cn(
          'mt-0.5 font-semibold',
          label === 'Paid' && 'text-green-600 dark:text-green-400'
        )}
      >
        {value}
      </p>
    </div>
  );
}
