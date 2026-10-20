'use client';

import { useState } from 'react';
import Link from 'next/link';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Store,
  BadgeCheck,
  FileClock,
  Handshake,
  Landmark,
  Lock,
  ArrowUpDown,
  UserRound,
  Building2,
  ListChecks,
  Clock,
  ExternalLink,
} from 'lucide-react';
import {
  Badge,
  Button,
  CardSkeleton,
  ConfirmDialog,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  EmptyState,
  ListSkeleton,
  PageErrorState,
  Pagination,
  SearchInput,
  StatCard,
  StatGridSkeleton,
  Select,
  Skeleton,
  DocumentPreviewButton,
  Tabs,
  TabsList,
  TabsTrigger,
  useToast,
  type BadgeVariant,
} from '@getrentos/ui';
import { formatCurrency, formatDate, unwrap } from '@getrentos/shared';
import { adminMarketplaceService } from '@/services/adminMarketplaceService';
import type {
  AdminMarketplaceOffer,
  AdminMarketplaceListing,
  AdminMarketplaceOfferDetail,
  SaleListingStatus,
  SaleOfferStatus,
} from '@/types/marketplace';

const PAGE_SIZE = 10;

const LISTING_STATUS_VARIANT: Record<SaleListingStatus, BadgeVariant> = {
  PUBLISHED: 'success',
  PENDING_VERIFICATION: 'warning',
  PAUSED: 'neutral',
  CLOSED: 'danger',
  DRAFT: 'neutral',
};

const OFFER_STATUS_VARIANT: Record<SaleOfferStatus, BadgeVariant> = {
  SUBMITTED: 'info',
  COUNTERED: 'warning',
  ACCEPTED: 'success',
  REJECTED: 'danger',
  WITHDRAWN: 'neutral',
  EXPIRED: 'neutral',
  CLOSED: 'success',
};

const OFFER_STATUS_LABEL: Record<SaleOfferStatus, string> = {
  SUBMITTED: 'Submitted',
  COUNTERED: 'Countered',
  ACCEPTED: 'Accepted',
  REJECTED: 'Rejected',
  WITHDRAWN: 'Withdrawn',
  EXPIRED: 'Expired',
  CLOSED: 'Closed',
};

type ListingStatusFilter = 'all' | SaleListingStatus;
type OfferStatusFilter = 'all' | SaleOfferStatus;

type MarketplaceAction = {
  title: string;
  description: string;
  label?: string;
  /** When set, the confirm dialog collects a reason and passes it to run(). */
  needsReason?: boolean;
  run: (reason: string) => Promise<unknown>;
};

/** Confirm-dialog + toast wiring for marketplace moderation actions, mirroring the estate queues' pattern. */
function useMarketplaceActions() {
  const client = useQueryClient();
  const [action, setAction] = useState<MarketplaceAction | null>(null);
  const [reason, setReason] = useState('');
  const toast = useToast();
  const mutation = useMutation({
    mutationFn: async () => action?.run(reason.trim()),
    onSuccess: async () => {
      setAction(null);
      setReason('');
      toast.success('Action completed and audited.');
      await client.invalidateQueries({ queryKey: ['admin', 'marketplace'] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return {
    request: setAction,
    feedback: (
      <>
        <ConfirmDialog
          open={Boolean(action)}
          onOpenChange={(open) => !open && setAction(null)}
          title={action?.title ?? 'Confirm action'}
          description={action?.description ?? ''}
          confirmLabel={action?.label}
          isLoading={mutation.isPending}
          promptLabel={action?.needsReason ? 'Administrative reason' : undefined}
          promptValue={reason}
          onPromptChange={setReason}
          promptRequired={action?.needsReason}
          promptMinLength={10}
          onConfirm={() => mutation.mutate()}
        />
      </>
    ),
  };
}

export const MarketplaceOversight = () => {
  const [view, setView] = useState<'overview' | 'listings' | 'offers'>('overview');

  const {
    data: overview,
    isLoading: overviewLoading,
    isError: overviewError,
  } = useQuery({
    queryKey: ['admin', 'marketplace', 'overview'],
    queryFn: () => unwrap(adminMarketplaceService.overview()),
    enabled: view === 'overview',
  });

  if (view === 'overview') {
    return (
      <MarketplaceOverviewView
        loading={overviewLoading}
        error={overviewError}
        data={overview}
        onListings={() => setView('listings')}
        onOffers={() => setView('offers')}
      />
    );
  }

  return <MarketplaceQueueView view={view} onView={setView} onBack={() => setView('overview')} />;
};

function MarketplaceOverviewView({
  loading,
  error,
  data,
  onListings,
  onOffers,
}: {
  loading: boolean;
  error: boolean;
  data: Awaited<ReturnType<typeof adminMarketplaceService.overview>>['data'] | undefined;
  onListings: () => void;
  onOffers: () => void;
}) {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Marketplace sales</h1>
          <p className="mt-1 text-muted-foreground">
            For-sale listings, offer negotiations and escrow deals across the marketplace.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" icon={<Handshake className="h-4 w-4" />} onClick={onOffers}>
            Offer queue
          </Button>
          <Button variant="outline" icon={<Store className="h-4 w-4" />} onClick={onListings}>
            Sale listings
          </Button>
        </div>
      </div>

      {error && !data ? (
        <PageErrorState
          title="Could not load marketplace totals"
          description="Sales pulse is temporarily unavailable. No values are being estimated."
          className="min-h-[220px]"
        />
      ) : loading || !data ? (
        <StatGridSkeleton count={6} className="grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6" />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
            <StatCard icon={Store} label="Sale listings" value={data.totalListings} accent="blue" />
            <StatCard
              icon={BadgeCheck}
              label="Published"
              value={data.publishedListings}
              accent="green"
            />
            <StatCard
              icon={FileClock}
              label="Pending review"
              value={data.pendingListings}
              accent="orange"
            />
            <StatCard
              icon={Handshake}
              label="Open offers"
              value={data.openOffers}
              accent="purple"
              subtitle={`of ${data.totalOffers} total`}
            />
            <StatCard
              icon={Landmark}
              label="Active escrows"
              value={data.activeEscrows}
              accent="purple"
            />
            <StatCard
              icon={Lock}
              label="Closed deals"
              value={data.closedDeals}
              accent="red"
              subtitle={`${formatCurrency(data.totalDealValue, { compact: true })} released`}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <QuickNavCard
              icon={Store}
              title="For-sale listings"
              description="Browse SALE listings with seller, offer and escrow context."
              onClick={onListings}
            />
            <QuickNavCard
              icon={Handshake}
              title="Offer negotiations"
              description="Track buyer/seller offers, counters and linked escrow deals."
              onClick={onOffers}
            />
          </div>
        </>
      )}
    </div>
  );
}

function QuickNavCard({
  icon: Icon,
  title,
  description,
  onClick,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex items-center gap-4 rounded-2xl border border-border bg-card p-5 text-left shadow-sm transition-all hover:border-primary/40 hover:shadow-md"
    >
      <div className="rounded-xl bg-secondary p-3">
        <Icon className="h-6 w-6 text-foreground" />
      </div>
      <div>
        <p className="font-semibold">{title}</p>
        <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
      </div>
    </button>
  );
}

function MarketplaceQueueView({
  view,
  onView,
}: {
  view: 'listings' | 'offers';
  onView: (v: 'listings' | 'offers') => void;
  onBack: () => void;
}) {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {view === 'listings' ? 'Sale listings' : 'Offer negotiations'}
          </h1>
          <p className="mt-1 text-muted-foreground">
            {view === 'listings'
              ? 'Every for-sale listing with its seller and offer activity.'
              : 'Buyer offers across the marketplace with counter-offers and escrow links.'}
          </p>
        </div>
        <Tabs value={view} onValueChange={(v) => onView(v as 'listings' | 'offers')}>
          <TabsList>
            <TabsTrigger value="listings">Listings</TabsTrigger>
            <TabsTrigger value="offers">Offers</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      {view === 'listings' ? <SaleListingsPanel /> : <OfferQueuePanel />}
    </div>
  );
}

function SaleListingsPanel() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<ListingStatusFilter>('all');
  const [page, setPage] = useState(1);
  const [activeListing, setActiveListing] = useState<AdminMarketplaceListing | null>(null);
  const actions = useMarketplaceActions();

  const { data, isLoading, isError, isFetching, refetch } = useQuery({
    queryKey: ['admin', 'marketplace', 'listings', { search, status, page }],
    queryFn: () =>
      unwrap(
        adminMarketplaceService.listListings({
          search: search.trim() || undefined,
          status: status === 'all' ? undefined : status,
          page,
          pageSize: PAGE_SIZE,
        })
      ),
    placeholderData: keepPreviousData,
  });
  const items = data?.items ?? [];

  return (
    <div className="rounded-xl border border-border bg-card shadow-sm">
      <div className="flex flex-wrap items-center gap-3 border-b border-border p-4">
        <SearchInput
          value={search}
          onValueChange={(value) => {
            setSearch(value);
            setPage(1);
          }}
          label="Search"
          placeholder="Search title, city, or seller..."
          className="flex-1 min-w-[220px] max-w-sm"
        />
        <Select
          value={status}
          ariaLabel="Filter listings by status"
          onValueChange={(value) => {
            setStatus(value as ListingStatusFilter);
            setPage(1);
          }}
          searchable={false}
          className="w-full sm:w-48"
          options={[
            { value: 'all', label: 'All statuses' },
            { value: 'PUBLISHED', label: 'Published' },
            { value: 'PENDING_VERIFICATION', label: 'Pending review' },
            { value: 'PAUSED', label: 'Paused' },
            { value: 'CLOSED', label: 'Closed' },
            { value: 'DRAFT', label: 'Draft' },
          ]}
        />
      </div>

      {isLoading ? (
        <ListSkeleton rows={5} className="rounded-none border-0" />
      ) : isError && !data ? (
        <PageErrorState
          title="Could not load sale listings"
          description="The listing queue is temporarily unavailable."
          onRetry={() => void refetch()}
          isRetrying={isFetching}
          className="min-h-[220px] rounded-none border-0"
        />
      ) : items.length === 0 ? (
        <EmptyState icon={Store} title="No sale listings" description="Try adjusting filters." />
      ) : (
        <div className="divide-y divide-border">
          {items.map((l) => {
            const seller = l.sellerName;
            return (
              <button
                key={l.id}
                type="button"
                onClick={() => setActiveListing(l)}
                className="flex w-full flex-wrap items-center justify-between gap-3 p-4 text-left transition-colors hover:bg-secondary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate font-medium">{l.title}</p>
                    <Badge variant={LISTING_STATUS_VARIANT[l.status]}>{l.status}</Badge>
                  </div>
                  <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                    <Building2 className="h-3.5 w-3.5" /> {l.city}, {l.state}
                  </p>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    <UserRound className="mr-1 inline h-3.5 w-3.5" />
                    {seller}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1 text-sm">
                  <p className="font-semibold">{formatCurrency(l.price)}</p>
                  <p className="text-xs text-muted-foreground">
                    {l.offerCount} offer{l.offerCount === 1 ? '' : 's'}
                    {l.openOfferCount > 0 ? ` · ${l.openOfferCount} open` : ''}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Listed {formatDate(l.createdAt, 'short')}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      )}

      <Pagination
        page={page}
        pageSize={PAGE_SIZE}
        total={data?.total ?? 0}
        onPageChange={setPage}
      />
      {activeListing && (
        <ListingDetailDialog
          listingId={activeListing.id}
          onClose={() => setActiveListing(null)}
          actions={actions}
        />
      )}
      {actions.feedback}
    </div>
  );
}

function ListingDetailDialog({
  listingId,
  onClose,
  actions,
}: {
  listingId: string;
  onClose: () => void;
  actions: ReturnType<typeof useMarketplaceActions>;
}) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin', 'marketplace', 'listings', listingId, 'detail'],
    queryFn: () => unwrap(adminMarketplaceService.listingDetail(listingId)),
  });
  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent size="lg" showClose={false}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <DialogTitle className="text-lg font-semibold text-foreground">
              Listing inspection
            </DialogTitle>
            {data && (
              <DialogDescription className="text-sm text-muted-foreground">
                {data.title}
              </DialogDescription>
            )}
          </div>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
        {isLoading ? (
          <Skeleton className="mt-5 h-40 w-full rounded-xl" />
        ) : isError || !data ? (
          <PageErrorState
            title="Could not load listing detail"
            description="Media and publishing checks are unavailable."
            className="mt-5 min-h-[180px]"
          />
        ) : (
          <div className="mt-5 space-y-5">
            <section
              className={`rounded-xl border p-4 ${data.publishingEligibility.eligible ? 'border-success/30 bg-success-subtle' : 'border-destructive/30 bg-destructive-subtle'}`}
            >
              <h3 className="font-medium">Publishing eligibility</h3>
              <p className="mt-1 text-sm">
                {data.publishingEligibility.eligible
                  ? 'Eligible to publish: identity and ownership requirements are satisfied.'
                  : 'Publishing is blocked until every requirement below is resolved.'}
              </p>
              {!data.publishingEligibility.eligible && (
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-destructive">
                  {data.publishingEligibility.reasons.map((reason) => (
                    <li key={reason}>{reason}</li>
                  ))}
                </ul>
              )}
              <p className="mt-2 text-xs text-muted-foreground">
                Trust tier {data.publishingEligibility.trustTier} · Identity{' '}
                {data.publishingEligibility.identityVerified ? 'approved' : 'not approved'} ·
                Ownership{' '}
                {data.publishingEligibility.ownershipVerified ? 'approved' : 'not approved'}
              </p>
            </section>
            <section>
              <h3 className="font-medium">Property media</h3>
              {data.media.length === 0 ? (
                <p className="mt-2 rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                  No cover image, gallery image, or video tour has been uploaded.
                </p>
              ) : (
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  {data.media.map((file) => (
                    <div
                      key={`${file.name}-${file.url}`}
                      className="flex items-center justify-between gap-2 rounded-lg border p-3"
                    >
                      <span className="truncate text-sm">{file.name}</span>
                      <DocumentPreviewButton file={file} title={`Preview ${file.name}`} />
                    </div>
                  ))}
                </div>
              )}
            </section>
            <section>
              <h3 className="font-medium">Moderation</h3>
              <div className="mt-2 flex flex-wrap gap-2">
                {data.status === 'PUBLISHED' && (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        actions.request({
                          title: 'Pause this listing?',
                          description: 'The listing will stop showing to buyers until resumed.',
                          label: 'Pause',
                          run: () => unwrap(adminMarketplaceService.pauseListing(listingId)),
                        })
                      }
                    >
                      Pause
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        actions.request({
                          title: 'Flag for verification?',
                          description:
                            'The listing will be hidden from public search until it is approved again.',
                          label: 'Flag',
                          run: () => unwrap(adminMarketplaceService.flagListing(listingId)),
                        })
                      }
                    >
                      Flag for review
                    </Button>
                  </>
                )}
                {data.status === 'PAUSED' && (
                  <Button
                    size="sm"
                    onClick={() =>
                      actions.request({
                        title: 'Resume this listing?',
                        description: 'The listing will become visible to buyers again.',
                        label: 'Resume',
                        run: () => unwrap(adminMarketplaceService.resumeListing(listingId)),
                      })
                    }
                  >
                    Resume
                  </Button>
                )}
                {data.status === 'PENDING_VERIFICATION' && (
                  <Button
                    size="sm"
                    onClick={() =>
                      actions.request({
                        title: 'Approve this listing?',
                        description: 'The listing will be published and visible to buyers again.',
                        label: 'Approve',
                        run: () => unwrap(adminMarketplaceService.approveListing(listingId)),
                      })
                    }
                  >
                    Approve
                  </Button>
                )}
                {data.status !== 'CLOSED' && (
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() =>
                      actions.request({
                        title: 'Permanently close this listing?',
                        description:
                          'This cannot be undone: the seller would need to create a new listing.',
                        label: 'Close',
                        run: () => unwrap(adminMarketplaceService.closeListing(listingId)),
                      })
                    }
                  >
                    Close permanently
                  </Button>
                )}
              </div>
            </section>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function OfferQueuePanel() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<OfferStatusFilter>('all');
  const [page, setPage] = useState(1);
  const [activeOffer, setActiveOffer] = useState<AdminMarketplaceOffer | null>(null);
  const actions = useMarketplaceActions();

  const { data, isLoading, isError, isFetching, refetch } = useQuery({
    queryKey: ['admin', 'marketplace', 'offers', { search, status, page }],
    queryFn: () =>
      unwrap(
        adminMarketplaceService.listOffers({
          search: search.trim() || undefined,
          status: status === 'all' ? undefined : status,
          page,
          pageSize: PAGE_SIZE,
        })
      ),
    placeholderData: keepPreviousData,
  });
  const items = data?.items ?? [];

  return (
    <div className="rounded-xl border border-border bg-card shadow-sm">
      <div className="flex flex-wrap items-center gap-3 border-b border-border p-4">
        <SearchInput
          value={search}
          onValueChange={(value) => {
            setSearch(value);
            setPage(1);
          }}
          label="Search"
          placeholder="Search buyer, listing..."
          className="flex-1 min-w-[220px] max-w-sm"
        />
        <Select
          value={status}
          ariaLabel="Filter offers by status"
          onValueChange={(value) => {
            setStatus(value as OfferStatusFilter);
            setPage(1);
          }}
          searchable={false}
          className="w-full sm:w-48"
          options={[
            { value: 'all', label: 'All statuses' },
            ...(Object.keys(OFFER_STATUS_LABEL) as SaleOfferStatus[]).map((value) => ({
              value,
              label: OFFER_STATUS_LABEL[value],
            })),
          ]}
        />
      </div>

      {isLoading ? (
        <ListSkeleton rows={5} className="rounded-none border-0" />
      ) : isError && !data ? (
        <PageErrorState
          title="Could not load offers"
          description="The offer queue is temporarily unavailable."
          onRetry={() => void refetch()}
          isRetrying={isFetching}
          className="min-h-[220px] rounded-none border-0"
        />
      ) : items.length === 0 ? (
        <EmptyState icon={Handshake} title="No offers" description="Try adjusting filters." />
      ) : (
        <div className="divide-y divide-border">
          {items.map((o) => (
            <button
              key={o.id}
              type="button"
              onClick={() => setActiveOffer(o)}
              className="flex w-full flex-wrap items-center justify-between gap-3 p-4 text-left transition-colors hover:bg-secondary/40"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="truncate font-medium">{o.listingTitle}</p>
                  <Badge variant={OFFER_STATUS_VARIANT[o.status]}>
                    {OFFER_STATUS_LABEL[o.status]}
                  </Badge>
                  {o.counterOfferCount > 0 && (
                    <Badge variant="neutral">{o.counterOfferCount} counter</Badge>
                  )}
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {o.buyerName} → {o.sellerName} · {o.city}
                </p>
                {o.escrowStatus && (
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Escrow: {o.escrowStatus.replaceAll('_', ' ')}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-3">
                <p className="font-semibold">{formatCurrency(o.amount)}</p>
                <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
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

      {activeOffer && (
        <OfferDetailDialog
          offerId={activeOffer.id}
          onClose={() => setActiveOffer(null)}
          actions={actions}
        />
      )}
      {actions.feedback}
    </div>
  );
}

function OfferDetailDialog({
  offerId,
  onClose,
  actions,
}: {
  offerId: string;
  onClose: () => void;
  actions: ReturnType<typeof useMarketplaceActions>;
}) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin', 'marketplace', 'offers', offerId, 'detail'],
    queryFn: () => unwrap(adminMarketplaceService.offerDetail(offerId)),
  });

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent size="lg" padded={false}>
        {isLoading ? (
          <div className="space-y-4 p-5">
            <DialogTitle className="sr-only">Loading offer case</DialogTitle>
            <CardSkeleton lines={2} />
            <CardSkeleton lines={4} />
          </div>
        ) : isError || !data ? (
          <div className="p-8 text-center">
            <DialogTitle className="text-destructive">Could not load the offer case.</DialogTitle>
            <Button className="mt-3" variant="ghost" onClick={onClose}>
              Close
            </Button>
          </div>
        ) : (
          <OfferCase360 detail={data} onClose={onClose} actions={actions} />
        )}
      </DialogContent>
    </Dialog>
  );
}

function OfferCase360({
  detail,
  onClose,
  actions,
}: {
  detail: AdminMarketplaceOfferDetail;
  onClose: () => void;
  actions: ReturnType<typeof useMarketplaceActions>;
}) {
  const parties = [
    {
      label: 'Buyer',
      icon: UserRound,
      name: detail.buyerName,
      email: detail.buyerEmail,
    },
    {
      label: 'Seller',
      icon: Store,
      name: detail.sellerName,
      email: detail.sellerEmail,
    },
  ];

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border p-5 pr-12">
        <div className="min-w-0">
          <DialogTitle className="flex flex-wrap items-center gap-2 text-lg font-semibold text-foreground">
            {detail.listingTitle}
            <Badge variant={OFFER_STATUS_VARIANT[detail.status]}>
              {OFFER_STATUS_LABEL[detail.status]}
            </Badge>
          </DialogTitle>
          <DialogDescription className="mt-1 text-sm text-muted-foreground">
            {detail.city}, {detail.state} · Offered {formatDate(detail.createdAt, 'short')}
          </DialogDescription>
        </div>
        <p className="text-xl font-semibold">{formatCurrency(detail.amount)}</p>
      </div>

      <div className="space-y-5 p-5">
        <div className="grid gap-3 sm:grid-cols-2">
          {parties.map((p) => (
            <div key={p.label} className="rounded-xl border border-border bg-secondary/40 p-3">
              <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                <p.icon className="h-3.5 w-3.5" /> {p.label}
              </p>
              <p className="mt-1 font-medium">{p.name}</p>
              {p.email && <p className="text-xs text-muted-foreground">{p.email}</p>}
            </div>
          ))}
        </div>

        {detail.message && (
          <div className="rounded-lg border border-border bg-secondary/40 p-3 text-sm">
            <p className="font-medium text-muted-foreground">Offer message</p>
            <p className="mt-1">{detail.message}</p>
          </div>
        )}

        {detail.counterOffers.length > 0 && (
          <div>
            <p className="mb-2 text-sm font-medium">Counter-offers</p>
            <div className="space-y-2">
              {detail.counterOffers.map((c) => (
                <div key={c.id} className="rounded-lg border border-border p-3 text-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-medium">{c.fromName}</p>
                    <p className="font-semibold">{formatCurrency(c.amount)}</p>
                  </div>
                  {c.message && <p className="mt-1 text-muted-foreground">{c.message}</p>}
                  <p className="mt-1 text-xs text-muted-foreground">
                    {formatDate(c.createdAt, 'short')}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {detail.transaction && (
          <div className="rounded-xl border border-border p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="flex items-center gap-2 text-sm font-medium">
                <Landmark className="h-4 w-4" /> Escrow deal
                <Badge variant="info">{detail.transaction.escrowStatus.replaceAll('_', ' ')}</Badge>
              </p>
              <div className="flex items-center gap-3">
                <p className="font-semibold">{formatCurrency(detail.transaction.amount)}</p>
                <Link
                  href="/admin/escrow"
                  className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                >
                  Escrow Oversight <ExternalLink className="h-3 w-3" />
                </Link>
              </div>
            </div>
            {detail.transaction.events.length > 0 && (
              <div className="mt-3 space-y-1.5">
                {detail.transaction.events.map((e) => (
                  <div
                    key={e.id}
                    className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground"
                  >
                    <span className="flex items-center gap-1.5">
                      <Clock className="h-3 w-3" />
                      {e.eventType.replaceAll('_', ' ')}
                    </span>
                    <span>{formatDate(e.createdAt, 'short')}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {!detail.transaction && detail.status === 'ACCEPTED' && (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <ListChecks className="h-4 w-4" /> Accepted: escrow transaction pending.
          </p>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border p-4">
        <Link
          href={`/admin/users?search=${encodeURIComponent(detail.buyerEmail ?? detail.buyerName)}`}
          className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"
        >
          View buyer <ExternalLink className="h-3 w-3" />
        </Link>
        <div className="flex items-center gap-2">
          {(detail.status === 'SUBMITTED' || detail.status === 'COUNTERED') && (
            <Button
              size="sm"
              variant="danger"
              onClick={() =>
                actions.request({
                  title: 'Administratively expire this offer?',
                  description:
                    'The offer will be closed as expired. Use this for an abandoned negotiation the buyer or seller never resolved.',
                  label: 'Expire offer',
                  needsReason: true,
                  run: (reason) => unwrap(adminMarketplaceService.expireOffer(detail.id, reason)),
                })
              }
            >
              Expire offer
            </Button>
          )}
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
