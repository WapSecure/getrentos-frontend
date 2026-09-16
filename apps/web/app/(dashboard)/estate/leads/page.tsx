'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BadgeCheck,
  Home,
  Inbox,
  Mail,
  Phone,
  Search,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';
import { Badge, Card, EmptyState, Input, PageLoadingState, Select } from '@getrentos/ui';
import { useSelectedEstate } from '@/app/(dashboard)/estate/layout';
import { estateMarketplaceService } from '@/services/estateMarketplaceService';
import { unwrap } from '@/lib/apiHelpers';
import { estateKeys } from '@/lib/queryKeys';
import type { EstateLead, EstateLeadMarket } from '@/types/estate-marketplace';

const formatNaira = (amount: number) =>
  `₦${amount.toLocaleString('en-NG', { maximumFractionDigits: 0 })}`;

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' });

const marketBadge = (market: EstateLeadMarket) => {
  switch (market) {
    case 'RENT':
      return <Badge variant="info">To rent</Badge>;
    case 'SALE':
      return <Badge variant="success">For sale</Badge>;
    default:
      return <Badge variant="warning">Shortlet</Badge>;
  }
};

/**
 * Turn a source status into something a manager would say out loud.
 *
 * The stages arrive from six different tables with six vocabularies
 * (`offer_made`, `viewing_scheduled`, `pending`, `requested`…), and showing those
 * raw would make the inbox read like a database dump. Unknown values fall back to
 * the de-underscored form rather than being hidden, so a new source status is
 * still legible before anyone maps it.
 */
const stageLabel = (stage: string) => {
  const labels: Record<string, string> = {
    inquiry: 'Asked about it',
    viewing_scheduled: 'Viewing booked',
    offer_made: 'Offer made',
    pending: 'Pending',
    requested: 'Requested',
    approved: 'Approved',
    rejected: 'Rejected',
    completed: 'Completed',
    confirmed: 'Confirmed',
    cancelled: 'Cancelled',
    withdrawn: 'Withdrawn',
    new: 'New',
    contacted: 'Contacted',
  };
  return labels[stage] ?? stage.replace(/_/g, ' ');
};

const StatTile = ({ label, value, hint }: { label: string; value: number; hint?: string }) => (
  <div className="rounded-2xl border border-border bg-card p-4">
    <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
    <p className="text-2xl font-bold text-foreground mt-1">{value}</p>
    {hint && <p className="text-xs text-muted-foreground mt-1">{hint}</p>}
  </div>
);

const LeadRow = ({ lead }: { lead: EstateLead }) => (
  <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border py-4 last:border-b-0">
    <div className="min-w-[240px] flex-1">
      <div className="flex flex-wrap items-center gap-2">
        <p className="font-semibold text-foreground">{lead.leadName}</p>
        {lead.verified ? (
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <BadgeCheck className="h-3.5 w-3.5 text-primary" />
            Verified
          </span>
        ) : (
          <Badge variant="neutral">Unverified</Badge>
        )}
        {marketBadge(lead.market)}
      </div>

      <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
        <span className="flex items-center gap-1">
          <Home className="h-3.5 w-3.5" />
          {lead.propertyName}
        </span>
        {lead.ownerName && <span>Owner: {lead.ownerName}</span>}
      </div>

      <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
        {lead.email && (
          <a href={`mailto:${lead.email}`} className="flex items-center gap-1 hover:text-primary">
            <Mail className="h-3.5 w-3.5" />
            {lead.email}
          </a>
        )}
        {lead.phone && (
          <a href={`tel:${lead.phone}`} className="flex items-center gap-1 hover:text-primary">
            <Phone className="h-3.5 w-3.5" />
            {lead.phone}
          </a>
        )}
        <span>Trust score {lead.trustScore}</span>
      </div>
    </div>

    <div className="text-right">
      <p className="text-sm font-medium text-foreground">{stageLabel(lead.stage)}</p>
      {lead.offerAmount != null && (
        <p className="text-sm font-semibold text-primary">{formatNaira(lead.offerAmount)}</p>
      )}
      <p className="text-xs text-muted-foreground mt-1">{formatDate(lead.inquiryDate)}</p>
      <p className="text-xs text-muted-foreground">
        {lead.listedByEstate ? 'Marketed by this estate' : 'Listed by the owner'}
      </p>
    </div>
  </div>
);

/**
 * The estate's enquiry inbox.
 *
 * The server scopes this to properties the estate currently holds marketing
 * rights for, so there is no client-side "should I be seeing this" logic to get
 * wrong — and the page says so, because a manager who cannot find an enquiry for
 * a property that merely sits inside the estate deserves an explanation rather
 * than an empty list.
 */
export default function EstateLeadsPage() {
  const { estate } = useSelectedEstate();
  const estateId = estate?.id ?? '';
  const [market, setMarket] = useState<'' | EstateLeadMarket>('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const leadsQuery = useQuery({
    queryKey: estateKeys.leads(estateId, market || undefined),
    queryFn: () =>
      unwrap(
        estateMarketplaceService.listLeads(estateId, {
          market: market || undefined,
          page,
          pageSize: 25,
        }),
      ),
    enabled: Boolean(estateId),
  });

  const leads = leadsQuery.data?.items ?? [];
  const total = leadsQuery.data?.total ?? 0;

  // Search is client-side because the page is already small (25 rows): a
  // round-trip per keystroke would make the inbox feel slower than it is.
  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return leads;
    return leads.filter(
      (lead) =>
        lead.leadName.toLowerCase().includes(term) ||
        lead.propertyName.toLowerCase().includes(term) ||
        lead.email.toLowerCase().includes(term),
    );
  }, [leads, search]);

  const stats = useMemo(() => {
    const verified = leads.filter((lead) => lead.verified).length;
    const offers = leads.filter((lead) => lead.offerAmount != null).length;
    const markets = new Set(leads.map((lead) => lead.market)).size;
    return { verified, offers, markets };
  }, [leads]);

  if (leadsQuery.isLoading) {
    return <PageLoadingState />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Enquiries</h1>
        <p className="text-muted-foreground mt-1">
          Everyone who has responded to a property {estate?.name ?? 'this estate'} markets — rentals, sales and
          shortlets in one place.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile label="Enquiries" value={total} hint="On properties you market" />
        <StatTile label="Verified enquirers" value={stats.verified} hint="Identity checked" />
        <StatTile label="Offers in" value={stats.offers} hint="On this page" />
        <StatTile label="Markets active" value={stats.markets} hint="Rent, sale, shortlet" />
      </div>

      <Card static>
        <div className="p-6">
          <div className="flex flex-wrap items-center gap-3">
            <Select
              ariaLabel="Market"
              value={market}
              onValueChange={(value) => {
                setMarket(value as '' | EstateLeadMarket);
                setPage(1);
              }}
              options={[
                { value: '', label: 'All markets' },
                { value: 'RENT', label: 'To rent' },
                { value: 'SALE', label: 'For sale' },
                { value: 'SHORTLET', label: 'Shortlets' },
              ]}
            />
            <div className="min-w-[220px] flex-1">
              <Input
                id="estate-lead-search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search an enquirer or a property"
                leadingIcon={<Search className="h-4 w-4" />}
              />
            </div>
          </div>

          {visible.length === 0 ? (
            <div className="mt-6">
              <EmptyState
                icon={Inbox}
                title={total === 0 ? 'No enquiries yet' : 'No matches'}
                description={
                  total === 0
                    ? 'When someone books a viewing, applies, offers or books a shortlet on a property you market, they appear here. Enquiries on properties that are simply inside the estate — and not marketed by you — stay with the owner.'
                    : 'No enquiry matches that search on this page.'
                }
              />
            </div>
          ) : (
            <div className="mt-4">
              {visible.map((lead) => (
                <LeadRow key={lead.id} lead={lead} />
              ))}
            </div>
          )}

          {total > 25 && (
            <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
              <p className="text-sm text-muted-foreground">
                Showing {visible.length} of {total}
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={page === 1}
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                  className="text-sm font-medium text-primary hover:underline disabled:opacity-40"
                >
                  Previous
                </button>
                <button
                  type="button"
                  disabled={page * 25 >= total}
                  onClick={() => setPage((current) => current + 1)}
                  className="text-sm font-medium text-primary hover:underline disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </Card>

      <div className="flex items-start gap-3 rounded-2xl border border-border bg-card p-4">
        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
        <p className="text-sm text-muted-foreground">
          You see enquiries for properties the owner has given you marketing rights for. A property that is merely
          inside the estate — with no agreement — stays private to its owner, and its enquiries never reach this page.
        </p>
      </div>

      <div className="flex items-start gap-3 rounded-2xl border border-border bg-card p-4">
        <TrendingUp className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
        <p className="text-sm text-muted-foreground">
          The property owner sees these same enquiries. Contact them when a lead is serious so you are presenting one
          story, not two.
        </p>
      </div>
    </div>
  );
}
