'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Badge,
  Button,
  ConfirmDialog,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  EmptyState,
  Field,
  FilePreviewDialog,
  Input,
  NumberInput,
  PageErrorState,
  Pagination,
  Select,
  Skeleton,
  StatCard,
  Textarea,
  Toast,
  type BadgeVariant,
  type ToastVariant,
} from '@getrentos/ui';
import {
  BedDouble,
  CalendarCheck,
  CircleDollarSign,
  Clock3,
  Gavel,
  MapPin,
  Pause,
  Percent,
  Play,
  Send,
  ShieldAlert,
  ShieldCheck,
} from 'lucide-react';
import { formatCurrency, formatDate, unwrap } from '@getrentos/shared';
import { adminShortletService } from '@/services/adminShortletService';
import type {
  AdminShortletBooking,
  AdminShortletDepositClaim,
  AdminShortletDepositClaimStatus,
  AdminShortletDispute,
  AdminShortletDisputeMessage,
  AdminShortletDisputeStatus,
  AdminShortletFeeConfig,
  AdminShortletListing,
  AdminShortletPayout,
  ShortletBookingStatus,
  ShortletListingStatus,
} from '@/types/shortlet';

const LISTINGS_PAGE_SIZE = 12;
const BOOKINGS_PAGE_SIZE = 12;

const LISTING_STATUS_VALUES: { value: 'all' | ShortletListingStatus; label: string }[] = [
  { value: 'all', label: 'All statuses' },
  { value: 'PUBLISHED', label: 'Published' },
  { value: 'PENDING_VERIFICATION', label: 'Pending verification' },
  { value: 'PAUSED', label: 'Paused' },
  { value: 'CLOSED', label: 'Closed' },
  { value: 'DRAFT', label: 'Draft' },
];

const BOOKING_STATUS_VALUES: { value: 'all' | ShortletBookingStatus; label: string }[] = [
  { value: 'all', label: 'All statuses' },
  { value: 'REQUESTED', label: 'Requested' },
  { value: 'CONFIRMED', label: 'Confirmed' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'DECLINED', label: 'Declined' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

const LISTING_STATUS_VARIANT: Record<ShortletListingStatus, BadgeVariant> = {
  PUBLISHED: 'success',
  PAUSED: 'warning',
  CLOSED: 'danger',
  DRAFT: 'neutral',
  PENDING_VERIFICATION: 'info',
};

const BOOKING_STATUS_VARIANT: Record<ShortletBookingStatus, BadgeVariant> = {
  REQUESTED: 'info',
  CONFIRMED: 'success',
  DECLINED: 'danger',
  CANCELLED: 'neutral',
  COMPLETED: 'neutral',
};

type Tab = 'listings' | 'bookings' | 'payouts' | 'disputes' | 'claims' | 'fees';

const SectionError = ({
  label,
  retry,
  retrying,
}: {
  label: string;
  retry: () => void;
  retrying: boolean;
}) => (
  <PageErrorState
    title={`Could not load ${label}`}
    description="This data is temporarily unavailable. No records are being shown as empty."
    onRetry={retry}
    isRetrying={retrying}
    className="min-h-[240px] rounded-none border-0 shadow-none"
  />
);

export const ShortletOversight = () => {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<Tab>('listings');
  const [toast, setToast] = useState<{ message: string; variant: ToastVariant } | null>(null);

  // Listings filters
  const [search, setSearch] = useState('');
  const [listingStatus, setListingStatus] = useState<'all' | ShortletListingStatus>('all');
  const [listingsPage, setListingsPage] = useState(1);

  // Bookings filters
  const [bookingStatus, setBookingStatus] = useState<'all' | ShortletBookingStatus>('all');
  const [bookingsPage, setBookingsPage] = useState(1);
  const [payoutsPage, setPayoutsPage] = useState(1);
  const [disputesPage, setDisputesPage] = useState(1);
  const [disputeStatus, setDisputeStatus] = useState<'all' | AdminShortletDisputeStatus>('all');
  const [activeDispute, setActiveDispute] = useState<AdminShortletDispute | null>(null);
  const [threadDraft, setThreadDraft] = useState('');

  // Deposit claim filters
  const [claimsPage, setClaimsPage] = useState(1);
  const [claimStatus, setClaimStatus] = useState<'all' | AdminShortletDepositClaimStatus>('all');
  const [claimSearch, setClaimSearch] = useState('');
  const [activeClaim, setActiveClaim] = useState<AdminShortletDepositClaim | null>(null);
  const [pendingModeration, setPendingModeration] = useState<{
    listing: AdminShortletListing;
    action: 'pause' | 'resume' | 'close' | 'flag' | 'approve';
  } | null>(null);
  const [pendingDisputeAction, setPendingDisputeAction] = useState<'resolve' | 'escalate' | null>(
    null
  );
  const [disputeResolution, setDisputeResolution] = useState('');

  const {
    data: overview,
    isLoading: overviewLoading,
    isError: overviewError,
    isFetching: overviewFetching,
    refetch: refetchOverview,
  } = useQuery({
    queryKey: ['admin', 'shortlets', 'overview'],
    queryFn: () => unwrap(adminShortletService.overview()),
  });

  const {
    data: listingsData,
    isLoading: listingsLoading,
    isError: listingsError,
    isFetching: listingsFetching,
    refetch: refetchListings,
  } = useQuery({
    queryKey: [
      'admin',
      'shortlets',
      'listings',
      { search, status: listingStatus, page: listingsPage },
    ],
    queryFn: () =>
      unwrap(
        adminShortletService.listListings({
          search: search.trim() || undefined,
          status: listingStatus === 'all' ? undefined : listingStatus,
          page: listingsPage,
          pageSize: LISTINGS_PAGE_SIZE,
        })
      ),
  });
  const listings = listingsData?.items ?? [];

  const {
    data: bookingsData,
    isLoading: bookingsLoading,
    isError: bookingsError,
    isFetching: bookingsFetching,
    refetch: refetchBookings,
  } = useQuery({
    queryKey: ['admin', 'shortlets', 'bookings', { status: bookingStatus, page: bookingsPage }],
    queryFn: () =>
      unwrap(
        adminShortletService.listBookings({
          status: bookingStatus === 'all' ? undefined : bookingStatus,
          page: bookingsPage,
          pageSize: BOOKINGS_PAGE_SIZE,
        })
      ),
  });
  const bookings = bookingsData?.items ?? [];

  const {
    data: payoutsData,
    isLoading: payoutsLoading,
    isError: payoutsError,
    isFetching: payoutsFetching,
    refetch: refetchPayouts,
  } = useQuery({
    queryKey: ['admin', 'shortlets', 'payouts', { page: payoutsPage }],
    queryFn: () => unwrap(adminShortletService.listPayouts({ page: payoutsPage, pageSize: 12 })),
  });
  const payouts = payoutsData?.items ?? [];

  const {
    data: disputesData,
    isLoading: disputesLoading,
    isError: disputesError,
    isFetching: disputesFetching,
    refetch: refetchDisputes,
  } = useQuery({
    queryKey: ['admin', 'shortlets', 'disputes', { status: disputeStatus, page: disputesPage }],
    queryFn: () =>
      unwrap(
        adminShortletService.listDisputes({
          status: disputeStatus === 'all' ? undefined : disputeStatus,
          page: disputesPage,
          pageSize: 12,
        })
      ),
  });
  const disputes = disputesData?.items ?? [];

  const {
    data: claimsData,
    isLoading: claimsLoading,
    isError: claimsError,
    isFetching: claimsFetching,
    refetch: refetchClaims,
  } = useQuery({
    queryKey: [
      'admin',
      'shortlets',
      'deposit-claims',
      { status: claimStatus, search: claimSearch, page: claimsPage },
    ],
    queryFn: () =>
      unwrap(
        adminShortletService.listDepositClaims({
          status: claimStatus === 'all' ? undefined : claimStatus,
          search: claimSearch.trim() || undefined,
          page: claimsPage,
          pageSize: 12,
        })
      ),
  });
  const claims = claimsData?.items ?? [];

  const adjudicate = useMutation({
    mutationFn: (input: {
      claimId: string;
      decision: 'APPROVED' | 'PARTIAL' | 'REJECTED';
      resolution?: string;
      deductedAmount?: number;
    }) =>
      unwrap(
        adminShortletService.adjudicateDepositClaim(input.claimId, {
          decision: input.decision,
          resolution: input.resolution,
          deductedAmount: input.deductedAmount,
        })
      ),
    onSuccess: (_, input) => {
      setActiveClaim(null);
      queryClient.invalidateQueries({ queryKey: ['admin', 'shortlets', 'deposit-claims'] });
      const label =
        input.decision === 'APPROVED'
          ? 'Claim approved — deposit withheld from the guest refund.'
          : input.decision === 'PARTIAL'
            ? 'Claim partially approved — remainder refunded to the guest.'
            : 'Claim rejected — deposit released to the guest.';
      setToast({ message: label, variant: 'success' });
    },
    onError: (reason: Error) => setToast({ message: reason.message, variant: 'error' }),
  });

  const {
    data: feeConfig,
    isError: feesError,
    isFetching: feesFetching,
    refetch: refetchFees,
  } = useQuery({
    queryKey: ['admin', 'shortlets', 'fees'],
    queryFn: () => unwrap(adminShortletService.getFeeConfig()),
  });

  const saveFees = useMutation({
    mutationFn: (input: { commissionPct: number; taxName?: string; taxPct: number }) =>
      unwrap(adminShortletService.updateFeeConfig(input)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'shortlets', 'fees'] });
      setToast({
        message: 'Platform fees & taxes saved — new bookings will use them.',
        variant: 'success',
      });
    },
    onError: (reason: Error) => setToast({ message: reason.message, variant: 'error' }),
  });

  const {
    data: threadMessages = [],
    isLoading: threadLoading,
    isError: threadError,
    isFetching: threadFetching,
    refetch: refetchThread,
  } = useQuery({
    queryKey: ['admin', 'shortlets', 'disputes', activeDispute?.id, 'messages'],
    queryFn: () => unwrap(adminShortletService.disputeMessages(activeDispute!.id)),
    enabled: Boolean(activeDispute),
  });

  const disputeReply = useMutation({
    mutationFn: (text: string) =>
      unwrap(adminShortletService.sendDisputeMessage(activeDispute!.id, text)),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['admin', 'shortlets', 'disputes', activeDispute?.id, 'messages'],
      });
      setThreadDraft('');
    },
    onError: (reason: Error) => setToast({ message: reason.message, variant: 'error' }),
  });

  const disputeAction = useMutation({
    mutationFn: (input: { action: 'resolve' | 'escalate'; resolution?: string }) =>
      unwrap(
        input.action === 'resolve'
          ? adminShortletService.resolveDispute(activeDispute!.id, input.resolution)
          : adminShortletService.escalateDispute(activeDispute!.id)
      ),
    onSuccess: (_, input) => {
      setActiveDispute(null);
      queryClient.invalidateQueries({ queryKey: ['admin', 'shortlets', 'disputes'] });
      setToast({
        message: input.action === 'resolve' ? 'Dispute resolved.' : 'Dispute escalated.',
        variant: 'success',
      });
    },
    onError: (reason: Error) => setToast({ message: reason.message, variant: 'error' }),
  });

  const moderation = useMutation({
    mutationFn: (input: {
      listingId: string;
      action: 'pause' | 'resume' | 'close' | 'flag' | 'approve';
    }) =>
      unwrap(
        input.action === 'pause'
          ? adminShortletService.pauseListing(input.listingId)
          : input.action === 'resume'
            ? adminShortletService.resumeListing(input.listingId)
            : input.action === 'close'
              ? adminShortletService.closeListing(input.listingId)
              : input.action === 'flag'
                ? adminShortletService.flagListing(input.listingId)
                : adminShortletService.approveListing(input.listingId)
      ),
    onSuccess: (_, input) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'shortlets'] });
      const messages: Record<string, string> = {
        pause: 'Listing paused. It no longer appears publicly.',
        resume: 'Listing resumed and is public again.',
        close: 'Listing closed permanently.',
        flag: 'Listing flagged for verification and hidden from the marketplace.',
        approve: 'Listing approved and published.',
      };
      setToast({ message: messages[input.action], variant: 'success' });
    },
    onError: (reason: Error) => setToast({ message: reason.message, variant: 'error' }),
  });

  const changeListingStatus = (value: string) => {
    setListingStatus(value as 'all' | ShortletListingStatus);
    setListingsPage(1);
  };
  const changeBookingStatus = (value: string) => {
    setBookingStatus(value as 'all' | ShortletBookingStatus);
    setBookingsPage(1);
  };
  const changeDisputeStatus = (value: string) => {
    setDisputeStatus(value as 'all' | AdminShortletDisputeStatus);
    setDisputesPage(1);
  };
  const changeClaimStatus = (value: string) => {
    setClaimStatus(value as 'all' | AdminShortletDepositClaimStatus);
    setClaimsPage(1);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Shortlet Oversight</h1>
        <p className="mt-1 text-muted-foreground">
          Platform-wide view of shortlet listings and bookings.
        </p>
      </div>

      {/* Overview cards */}
      {overviewError ? (
        <PageErrorState
          title="Could not load shortlet totals"
          description="Operational totals are temporarily unavailable. No values are being estimated."
          onRetry={() => void refetchOverview()}
          isRetrying={overviewFetching}
          className="min-h-[180px]"
        />
      ) : overview ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
          <StatCard
            icon={BedDouble}
            label="Listings"
            value={overview.totalListings}
            accent="blue"
          />
          <StatCard
            icon={ShieldCheck}
            label="Active"
            value={overview.activeListings}
            accent="green"
          />
          <StatCard icon={Pause} label="Paused" value={overview.pausedListings} accent="orange" />
          <StatCard
            icon={Clock3}
            label="Pending requests"
            value={overview.pendingRequests}
            accent="purple"
          />
          <StatCard
            icon={CalendarCheck}
            label="Confirmed"
            value={overview.confirmedBookings}
            accent="emerald"
          />
          <StatCard
            icon={CircleDollarSign}
            label="Booking value"
            value={overview.totalBookingValue}
            accent="red"
            isCurrency
          />
        </div>
      ) : overviewLoading ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
        </div>
      ) : null}

      {/* Tabs */}
      <div className="max-w-full overflow-x-auto pb-1">
        <div className="inline-flex min-w-max rounded-lg border border-border bg-card p-1 text-sm">
          {(['listings', 'bookings', 'payouts', 'disputes', 'claims', 'fees'] as Tab[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`rounded-md px-4 py-1.5 font-medium transition-colors ${
                tab === t
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-secondary'
              }`}
            >
              {t === 'listings'
                ? `Listings (${listingsData?.total ?? 0})`
                : t === 'bookings'
                  ? `Bookings (${bookingsData?.total ?? 0})`
                  : t === 'payouts'
                    ? `Payouts (${payoutsData?.total ?? 0})`
                    : t === 'disputes'
                      ? `Disputes (${disputesData?.total ?? 0})`
                      : t === 'claims'
                        ? `Deposit claims (${claimsData?.total ?? 0})`
                        : 'Fees & taxes'}
            </button>
          ))}
        </div>
      </div>

      {tab === 'listings' ? (
        <div className="rounded-xl border border-border bg-card shadow-sm">
          <div className="flex flex-wrap items-center gap-3 border-b border-border p-4">
            <div className="min-w-[220px] flex-1">
              <Input
                placeholder="Search by title, host, or city"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setListingsPage(1);
                }}
              />
            </div>
            <div className="w-44">
              <Select
                value={listingStatus}
                onValueChange={changeListingStatus}
                options={LISTING_STATUS_VALUES}
              />
            </div>
          </div>

          {listingsError ? (
            <SectionError
              label="shortlet listings"
              retry={() => void refetchListings()}
              retrying={listingsFetching}
            />
          ) : listingsLoading ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full rounded-lg" />
              ))}
            </div>
          ) : listings.length === 0 ? (
            <EmptyState
              icon={BedDouble}
              title="No shortlet listings"
              description="Try adjusting filters."
            />
          ) : (
            <div className="divide-y divide-border">
              {listings.map((l) => (
                <ListingRow
                  key={l.id}
                  listing={l}
                  busy={moderation.isPending}
                  onModerate={(action) => setPendingModeration({ listing: l, action })}
                />
              ))}
            </div>
          )}

          <Pagination
            page={listingsPage}
            pageSize={LISTINGS_PAGE_SIZE}
            total={listingsData?.total ?? 0}
            onPageChange={setListingsPage}
          />
        </div>
      ) : tab === 'bookings' ? (
        <div className="rounded-xl border border-border bg-card shadow-sm">
          <div className="flex flex-wrap items-center gap-3 border-b border-border p-4">
            <div className="w-52">
              <Select
                value={bookingStatus}
                onValueChange={changeBookingStatus}
                options={BOOKING_STATUS_VALUES}
              />
            </div>
          </div>

          {bookingsError ? (
            <SectionError
              label="shortlet bookings"
              retry={() => void refetchBookings()}
              retrying={bookingsFetching}
            />
          ) : bookingsLoading ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full rounded-lg" />
              ))}
            </div>
          ) : bookings.length === 0 ? (
            <EmptyState
              icon={CalendarCheck}
              title="No shortlet bookings"
              description="Try adjusting filters."
            />
          ) : (
            <div className="divide-y divide-border">
              {bookings.map((b) => (
                <BookingRow key={b.id} booking={b} />
              ))}
            </div>
          )}

          <Pagination
            page={bookingsPage}
            pageSize={BOOKINGS_PAGE_SIZE}
            total={bookingsData?.total ?? 0}
            onPageChange={setBookingsPage}
          />
        </div>
      ) : tab === 'payouts' ? (
        <div className="rounded-xl border border-border bg-card shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-4">
            <p className="text-sm font-medium">Host payout ledger</p>
            <p className="text-xs text-muted-foreground">
              Transfers paid to hosts for confirmed shortlet stays.
            </p>
          </div>

          {payoutsError ? (
            <SectionError
              label="host payouts"
              retry={() => void refetchPayouts()}
              retrying={payoutsFetching}
            />
          ) : payoutsLoading ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full rounded-lg" />
              ))}
            </div>
          ) : payouts.length === 0 ? (
            <EmptyState
              icon={CircleDollarSign}
              title="No payouts yet"
              description="Hosts receive payouts once they withdraw available earnings."
            />
          ) : (
            <div className="divide-y divide-border">
              {payouts.map((p) => (
                <PayoutRow key={p.id} payout={p} />
              ))}
            </div>
          )}

          <Pagination
            page={payoutsPage}
            pageSize={12}
            total={payoutsData?.total ?? 0}
            onPageChange={setPayoutsPage}
          />
        </div>
      ) : tab === 'disputes' ? (
        <div className="rounded-xl border border-border bg-card shadow-sm">
          <div className="flex flex-wrap items-center gap-3 border-b border-border p-4">
            <div className="w-52">
              <Select
                value={disputeStatus}
                onValueChange={changeDisputeStatus}
                options={DISPUTE_STATUS_VALUES}
              />
            </div>
          </div>

          {disputesError ? (
            <SectionError
              label="shortlet disputes"
              retry={() => void refetchDisputes()}
              retrying={disputesFetching}
            />
          ) : disputesLoading ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full rounded-lg" />
              ))}
            </div>
          ) : disputes.length === 0 ? (
            <EmptyState
              icon={Gavel}
              title="No shortlet disputes"
              description="Disputes raised by guests or hosts appear here."
            />
          ) : (
            <div className="divide-y divide-border">
              {disputes.map((d) => (
                <DisputeRow key={d.id} dispute={d} onOpen={() => setActiveDispute(d)} />
              ))}
            </div>
          )}

          <Pagination
            page={disputesPage}
            pageSize={12}
            total={disputesData?.total ?? 0}
            onPageChange={setDisputesPage}
          />
        </div>
      ) : tab === 'claims' ? (
        <div className="rounded-xl border border-border bg-card shadow-sm">
          <div className="flex flex-wrap items-center gap-3 border-b border-border p-4">
            <div className="min-w-[220px] flex-1">
              <Input
                placeholder="Search by host, guest, or reason"
                value={claimSearch}
                onChange={(e) => {
                  setClaimSearch(e.target.value);
                  setClaimsPage(1);
                }}
              />
            </div>
            <div className="w-44">
              <Select
                value={claimStatus}
                onValueChange={changeClaimStatus}
                options={CLAIM_STATUS_VALUES}
              />
            </div>
          </div>

          {claimsError ? (
            <SectionError
              label="deposit claims"
              retry={() => void refetchClaims()}
              retrying={claimsFetching}
            />
          ) : claimsLoading ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full rounded-lg" />
              ))}
            </div>
          ) : claims.length === 0 ? (
            <EmptyState
              icon={ShieldAlert}
              title="No deposit claims"
              description="Host claims against held deposits appear here for adjudication."
            />
          ) : (
            <div className="divide-y divide-border">
              {claims.map((c) => (
                <DepositClaimRow key={c.id} claim={c} onOpen={() => setActiveClaim(c)} />
              ))}
            </div>
          )}

          <Pagination
            page={claimsPage}
            pageSize={12}
            total={claimsData?.total ?? 0}
            onPageChange={setClaimsPage}
          />
        </div>
      ) : feesError ? (
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          <SectionError
            label="fee configuration"
            retry={() => void refetchFees()}
            retrying={feesFetching}
          />
        </div>
      ) : feeConfig ? (
        <FeeConfigForm
          key={feeConfig.updatedAt}
          feeConfig={feeConfig}
          saving={saveFees.isPending}
          onSave={(input) => saveFees.mutate(input)}
        />
      ) : (
        <div className="rounded-xl border border-border bg-card shadow-sm p-5">
          <Skeleton className="h-24 w-full rounded-lg" />
        </div>
      )}

      {activeClaim && (
        <AdjudicateClaimModal
          claim={activeClaim}
          pending={adjudicate.isPending}
          onSubmit={(input) => adjudicate.mutate({ claimId: activeClaim.id, ...input })}
          onClose={() => setActiveClaim(null)}
        />
      )}

      {activeDispute && (
        <DisputeThreadModal
          dispute={activeDispute}
          messages={threadMessages}
          loading={threadLoading}
          error={threadError}
          retrying={threadFetching}
          onRetry={() => void refetchThread()}
          draft={threadDraft}
          onDraftChange={setThreadDraft}
          replying={disputeReply.isPending}
          onReply={() => disputeReply.mutate(threadDraft)}
          actionPending={disputeAction.isPending}
          onAction={setPendingDisputeAction}
          onClose={() => setActiveDispute(null)}
        />
      )}

      <ConfirmDialog
        open={pendingModeration !== null}
        onOpenChange={(open) => !open && setPendingModeration(null)}
        title={
          pendingModeration
            ? `${pendingModeration.action[0].toUpperCase()}${pendingModeration.action.slice(1)} listing?`
            : 'Confirm listing action'
        }
        description={
          pendingModeration
            ? `${pendingModeration.listing.title} will be ${
                {
                  pause: 'hidden from guests until resumed',
                  resume: 'published to guests again',
                  close: 'permanently closed and removed from active inventory',
                  flag: 'hidden and returned to verification',
                  approve: 'approved and published to guests',
                }[pendingModeration.action]
              }.`
            : ''
        }
        confirmLabel={pendingModeration ? `${pendingModeration.action} listing` : 'Confirm'}
        onConfirm={() => {
          if (pendingModeration) {
            moderation.mutate({
              listingId: pendingModeration.listing.id,
              action: pendingModeration.action,
            });
          }
        }}
      />

      <ConfirmDialog
        open={pendingDisputeAction !== null}
        onOpenChange={(open) => {
          if (!open) {
            setPendingDisputeAction(null);
            setDisputeResolution('');
          }
        }}
        title={pendingDisputeAction === 'resolve' ? 'Resolve dispute?' : 'Escalate dispute?'}
        description={
          pendingDisputeAction === 'resolve'
            ? 'This closes the dispute and records the resolution for the parties and audit trail.'
            : 'This moves the dispute to the escalated queue for higher-level review.'
        }
        confirmLabel={pendingDisputeAction === 'resolve' ? 'Resolve dispute' : 'Escalate'}
        onConfirm={() => {
          if (pendingDisputeAction) {
            disputeAction.mutate({
              action: pendingDisputeAction,
              resolution: disputeResolution.trim() || undefined,
            });
          }
        }}
        promptLabel={pendingDisputeAction === 'resolve' ? 'Resolution' : undefined}
        promptPlaceholder="Explain the final decision to both parties…"
        promptValue={disputeResolution}
        onPromptChange={setDisputeResolution}
        promptRequired={pendingDisputeAction === 'resolve'}
        promptMinLength={10}
      />

      {toast && (
        <Toast message={toast.message} variant={toast.variant} onClose={() => setToast(null)} />
      )}
    </div>
  );
};

function ListingRow({
  listing,
  busy,
  onModerate,
}: {
  listing: AdminShortletListing;
  busy: boolean;
  onModerate: (action: 'pause' | 'resume' | 'close' | 'flag' | 'approve') => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 p-4">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <p className="truncate font-medium">{listing.title}</p>
          <Badge variant={LISTING_STATUS_VARIANT[listing.status]}>{listing.status}</Badge>
          {listing.instantBooking && <Badge variant="info">Instant</Badge>}
        </div>
        <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
          <MapPin className="h-3.5 w-3.5" /> {listing.city}, {listing.state}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          {listing.nightlyRate != null ? formatCurrency(listing.nightlyRate) : 'No rate'}
          {listing.pricingMode === 'PER_NIGHT' ? ' / night' : ' / stay'} · {listing.bookingCount}{' '}
          booking
          {listing.bookingCount === 1 ? '' : 's'} · Hosted by {listing.hostName}
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        {listing.status === 'PUBLISHED' && (
          <Button variant="outline" size="sm" onClick={() => onModerate('pause')} disabled={busy}>
            <Pause className="mr-1.5 h-4 w-4" /> Pause
          </Button>
        )}
        {listing.status === 'PUBLISHED' && (
          <Button variant="outline" size="sm" onClick={() => onModerate('flag')} disabled={busy}>
            <ShieldCheck className="mr-1.5 h-4 w-4" /> Flag for review
          </Button>
        )}
        {listing.status === 'PENDING_VERIFICATION' && (
          <Button variant="outline" size="sm" onClick={() => onModerate('approve')} disabled={busy}>
            <Play className="mr-1.5 h-4 w-4" /> Approve
          </Button>
        )}
        {listing.status === 'PAUSED' && (
          <Button variant="outline" size="sm" onClick={() => onModerate('resume')} disabled={busy}>
            <Play className="mr-1.5 h-4 w-4" /> Resume
          </Button>
        )}
        {listing.status !== 'CLOSED' && (
          <Button variant="ghost" size="sm" onClick={() => onModerate('close')} disabled={busy}>
            Close
          </Button>
        )}
      </div>
    </div>
  );
}

function BookingRow({ booking }: { booking: AdminShortletBooking }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 p-4">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <p className="truncate font-medium">{booking.propertyTitle}</p>
          <Badge variant={BOOKING_STATUS_VARIANT[booking.status]}>{booking.status}</Badge>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          {booking.guestName} → {booking.hostName} · {formatDate(booking.checkIn, 'short')} →{' '}
          {formatDate(booking.checkOut, 'short')} · {booking.nights} night
          {booking.nights > 1 ? 's' : ''}
        </p>
        {booking.paymentReference && (
          <p className="mt-0.5 text-xs text-muted-foreground">Ref {booking.paymentReference}</p>
        )}
      </div>
      <div className="text-right">
        <p className="font-semibold">{formatCurrency(booking.total)}</p>
        <p className="text-xs text-muted-foreground">{booking.city}</p>
      </div>
    </div>
  );
}

const PAYOUT_STATUS_VARIANT: Record<AdminShortletPayout['status'], BadgeVariant> = {
  SUCCESS: 'success',
  PENDING: 'info',
  FAILED: 'danger',
};

function PayoutRow({ payout }: { payout: AdminShortletPayout }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 p-4">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <p className="truncate font-medium">{payout.hostName ?? 'Host'}</p>
          <Badge variant={PAYOUT_STATUS_VARIANT[payout.status]}>{payout.status}</Badge>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          {payout.bookingCount} booking{payout.bookingCount === 1 ? '' : 's'} ·{' '}
          {formatDate(payout.createdAt, 'short')}
          {payout.transferRef && <span className="ml-1 text-xs">· Ref {payout.transferRef}</span>}
        </p>
      </div>
      <div className="text-right">
        <p className="font-semibold">{formatCurrency(payout.amount)}</p>
        {payout.paidAt && (
          <p className="text-xs text-muted-foreground">Paid {formatDate(payout.paidAt, 'short')}</p>
        )}
      </div>
    </div>
  );
}

const DISPUTE_STATUS_VALUES: { value: 'all' | AdminShortletDisputeStatus; label: string }[] = [
  { value: 'all', label: 'All statuses' },
  { value: 'OPEN', label: 'Open' },
  { value: 'UNDER_REVIEW', label: 'Under review' },
  { value: 'ESCALATED', label: 'Escalated' },
  { value: 'RESOLVED', label: 'Resolved' },
];

const DISPUTE_STATUS_VARIANT: Record<AdminShortletDisputeStatus, BadgeVariant> = {
  OPEN: 'danger',
  UNDER_REVIEW: 'info',
  ESCALATED: 'warning',
  RESOLVED: 'success',
};

function DisputeRow({ dispute, onOpen }: { dispute: AdminShortletDispute; onOpen: () => void }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 p-4">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <p className="truncate font-medium">{dispute.title}</p>
          <Badge variant={DISPUTE_STATUS_VARIANT[dispute.status]}>{dispute.status}</Badge>
          <Badge variant="neutral">{dispute.category}</Badge>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          {dispute.raisedBy} ↔ {dispute.against} · {dispute.listingTitle ?? 'Shortlet'}
          {dispute.amount != null ? ` · ${formatCurrency(dispute.amount)}` : ''} ·{' '}
          {formatDate(dispute.createdAt, 'short')}
        </p>
        <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">{dispute.description}</p>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={onOpen}>
          <Gavel className="mr-1.5 h-4 w-4" /> Review
        </Button>
      </div>
    </div>
  );
}

function DisputeThreadModal({
  dispute,
  messages,
  loading,
  error,
  retrying,
  onRetry,
  draft,
  onDraftChange,
  replying,
  onReply,
  actionPending,
  onAction,
  onClose,
}: {
  dispute: AdminShortletDispute;
  messages: AdminShortletDisputeMessage[];
  loading: boolean;
  error: boolean;
  retrying: boolean;
  onRetry: () => void;
  draft: string;
  onDraftChange: (v: string) => void;
  replying: boolean;
  onReply: () => void;
  actionPending: boolean;
  onAction: (action: 'resolve' | 'escalate') => void;
  onClose: () => void;
}) {
  const resolved = dispute.status === 'RESOLVED';
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-2xl">
        <div className="p-5">
          <DialogTitle>{dispute.title}</DialogTitle>
          <DialogDescription>
            <span className="flex flex-wrap items-center gap-2">
              <Badge variant={DISPUTE_STATUS_VARIANT[dispute.status]}>{dispute.status}</Badge>
              <Badge variant="neutral">{dispute.category}</Badge>
              <span className="text-sm text-muted-foreground">
                {dispute.raisedBy} ↔ {dispute.against} · {dispute.listingTitle ?? 'Shortlet'} ·{' '}
                {formatDate(dispute.createdAt, 'short')}
              </span>
            </span>
          </DialogDescription>
        </div>
        <div className="max-h-[60vh] space-y-4 overflow-y-auto border-t border-border p-5">
          <div className="rounded-lg border border-border bg-secondary/40 p-3 text-sm">
            <p className="font-medium text-muted-foreground">Details</p>
            <p className="mt-1">{dispute.description}</p>
            {dispute.resolution && (
              <p className="mt-2">
                <span className="font-medium">Resolution:</span> {dispute.resolution}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">Thread</p>
            {error ? (
              <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4 text-center">
                <p className="text-sm text-destructive">
                  The dispute messages could not be loaded.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-3"
                  onClick={onRetry}
                  isLoading={retrying}
                >
                  Try again
                </Button>
              </div>
            ) : loading ? (
              <Skeleton className="h-24 w-full rounded-lg" />
            ) : messages.length === 0 ? (
              <p className="text-sm text-muted-foreground">No messages yet.</p>
            ) : (
              messages.map((m) => (
                <div key={m.id} className="rounded-lg border border-border p-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">{m.senderName}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(m.timestamp, 'short')}
                    </p>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{m.text}</p>
                </div>
              ))
            )}
          </div>

          <div className="flex gap-2">
            <Textarea
              value={draft}
              onChange={(e) => onDraftChange(e.target.value)}
              placeholder="Reply as GetRentos support…"
              rows={2}
            />
            <Button onClick={onReply} disabled={replying || !draft.trim()} className="self-end">
              <Send className="mr-1.5 h-4 w-4" /> Send
            </Button>
          </div>
        </div>
        <div className="flex justify-end gap-2 border-t border-border p-4">
          {!resolved && (
            <>
              <Button
                variant="outline"
                onClick={() => onAction('escalate')}
                disabled={actionPending}
              >
                Escalate
              </Button>
              <Button onClick={() => onAction('resolve')} disabled={actionPending}>
                Resolve
              </Button>
            </>
          )}
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

const CLAIM_STATUS_VALUES: { value: 'all' | AdminShortletDepositClaimStatus; label: string }[] = [
  { value: 'all', label: 'All statuses' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'PARTIAL', label: 'Partially approved' },
  { value: 'REJECTED', label: 'Rejected' },
];

const CLAIM_STATUS_VARIANT: Record<AdminShortletDepositClaimStatus, BadgeVariant> = {
  PENDING: 'warning',
  APPROVED: 'danger',
  PARTIAL: 'warning',
  REJECTED: 'success',
};

function DepositClaimRow({
  claim,
  onOpen,
}: {
  claim: AdminShortletDepositClaim;
  onOpen: () => void;
}) {
  const resolved = claim.status !== 'PENDING';
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 p-4">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <p className="truncate font-medium">
            {formatCurrency(claim.amount)} claim · {claim.listingTitle ?? 'Shortlet'}
          </p>
          <Badge variant={CLAIM_STATUS_VARIANT[claim.status]}>{claim.status}</Badge>
          {resolved && claim.deductedAmount != null && claim.deductedAmount > 0 && (
            <span className="text-xs font-medium text-foreground/70">
              {formatCurrency(claim.deductedAmount)} withheld
            </span>
          )}
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          {claim.claimedBy} → {claim.guestName} · {formatDate(claim.createdAt, 'short')}
        </p>
        <p className="mt-0.5 flex flex-wrap items-center gap-x-1.5 text-xs text-muted-foreground">
          {claim.evidence.length > 0 && (
            <span>
              {claim.evidence.length} photo{claim.evidence.length > 1 ? 's' : ''}
            </span>
          )}
          {resolved && claim.refundedAmount != null && (
            <span>· guest refunded {formatCurrency(claim.refundedAmount)}</span>
          )}
        </p>
        <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">{claim.reason}</p>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={onOpen} disabled={claim.status !== 'PENDING'}>
          {claim.status === 'PENDING' ? (
            <>
              <ShieldAlert className="mr-1.5 h-4 w-4" /> Adjudicate
            </>
          ) : (
            'View'
          )}
        </Button>
      </div>
    </div>
  );
}

function AdjudicateClaimModal({
  claim,
  pending,
  onSubmit,
  onClose,
}: {
  claim: AdminShortletDepositClaim;
  pending: boolean;
  onSubmit: (input: {
    decision: 'APPROVED' | 'PARTIAL' | 'REJECTED';
    resolution?: string;
    deductedAmount?: number;
  }) => void;
  onClose: () => void;
}) {
  const [decision, setDecision] = useState<'APPROVED' | 'PARTIAL' | 'REJECTED'>('APPROVED');
  const [deducted, setDeducted] = useState(String(claim.amount));
  const [resolution, setResolution] = useState('');
  const [evidenceIdx, setEvidenceIdx] = useState<number | null>(null);

  const submit = () => {
    onSubmit({
      decision,
      resolution: resolution.trim() || undefined,
      ...(decision === 'PARTIAL'
        ? { deductedAmount: Number(deducted) || 0 }
        : decision === 'APPROVED'
          ? { deductedAmount: claim.amount }
          : { deductedAmount: 0 }),
    });
  };

  const canSubmit =
    (decision !== 'PARTIAL' || (Number(deducted) > 0 && Number(deducted) <= claim.amount)) &&
    resolution.trim().length >= 10 &&
    !pending;

  return (
    <>
      <Dialog open onOpenChange={(o) => !o && onClose()}>
        <DialogContent className="sm:max-w-lg">
          <div className="p-5">
            <DialogTitle className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5" /> Adjudicate deposit claim
            </DialogTitle>
            <DialogDescription>
              {claim.claimedBy} claims {formatCurrency(claim.amount)} against the deposit for{' '}
              {claim.listingTitle ?? 'this stay'} (guest: {claim.guestName}). Choosing a deduction
              refunds the guest the remainder of their deposit.
            </DialogDescription>
          </div>
          <div className="max-h-[70vh] space-y-4 overflow-y-auto border-t border-border p-5">
            <div className="rounded-lg border border-border bg-secondary/40 p-3 text-sm">
              <div className="flex items-center justify-between gap-2">
                <p className="font-medium text-muted-foreground">Claim reason</p>
                {claim.evidence.length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    {claim.evidence.length} evidence photo{claim.evidence.length > 1 ? 's' : ''}
                  </p>
                )}
              </div>
              <p className="mt-1">{claim.reason}</p>
              {claim.evidenceUrls?.length ? (
                <div className="mt-2.5 flex flex-wrap gap-2">
                  {claim.evidenceUrls.map((url, i) => (
                    <button
                      key={url}
                      type="button"
                      onClick={() => setEvidenceIdx(i)}
                      title={`View evidence photo ${i + 1}`}
                      className="group relative h-16 w-16 overflow-hidden rounded-md border border-border transition-transform hover:scale-105"
                    >
                      <img
                        src={url}
                        alt={`Evidence photo ${i + 1}`}
                        className="h-full w-full object-cover"
                      />
                      <span className="absolute inset-0 flex items-center justify-center bg-black/0 text-[10px] font-medium text-white opacity-0 transition-opacity group-hover:bg-black/40 group-hover:opacity-100">
                        View
                      </span>
                    </button>
                  ))}
                </div>
              ) : null}
            </div>

            <Field label="Decision">
              <Select
                value={decision}
                onValueChange={(v) => setDecision(v as 'APPROVED' | 'PARTIAL' | 'REJECTED')}
                options={[
                  { value: 'APPROVED', label: 'Approve in full' },
                  { value: 'PARTIAL', label: 'Partially approve' },
                  { value: 'REJECTED', label: 'Reject' },
                ]}
              />
            </Field>

            {decision === 'PARTIAL' && (
              <Field
                label={`Amount to withhold from the guest refund (max ${formatCurrency(claim.amount)})`}
              >
                <NumberInput
                  min={1}
                  max={claim.amount}
                  value={deducted}
                  onValueChange={setDeducted}
                />
              </Field>
            )}

            <Field
              label="Resolution note (shown to both parties)"
              hint="Required · At least 10 characters for the decision record."
            >
              <Textarea
                value={resolution}
                onChange={(e) => setResolution(e.target.value)}
                placeholder="e.g. Evidence confirms partial damage; deducted ₦10,000…"
                rows={3}
                required
                minLength={10}
                maxLength={2000}
              />
            </Field>

            <div className="flex justify-end gap-2 pt-1">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button onClick={submit} disabled={!canSubmit} isLoading={pending}>
                {pending ? 'Processing…' : 'Confirm decision'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      <FilePreviewDialog
        open={evidenceIdx !== null}
        onOpenChange={(open) => !open && setEvidenceIdx(null)}
        file={
          evidenceIdx !== null && claim.evidenceUrls?.[evidenceIdx]
            ? {
                url: claim.evidenceUrls[evidenceIdx],
                name: `Evidence photo ${evidenceIdx + 1}`,
                mimeType: 'image/png',
              }
            : null
        }
      />
    </>
  );
}

function FeeConfigForm({
  feeConfig,
  saving,
  onSave,
}: {
  feeConfig: AdminShortletFeeConfig;
  saving: boolean;
  onSave: (input: { commissionPct: number; taxName?: string; taxPct: number }) => void;
}) {
  const [commission, setCommission] = useState(String(feeConfig.commissionPct));
  const [taxName, setTaxName] = useState(feeConfig.taxName ?? '');
  const [taxPct, setTaxPct] = useState(String(feeConfig.taxPct));
  const [pendingInput, setPendingInput] = useState<{
    commissionPct: number;
    taxName?: string;
    taxPct: number;
  } | null>(null);

  const nextInput = {
    commissionPct: Math.min(100, Math.max(0, Number(commission) || 0)),
    taxName: taxName.trim() || undefined,
    taxPct: Math.min(100, Math.max(0, Number(taxPct) || 0)),
  };
  const isDirty =
    nextInput.commissionPct !== feeConfig.commissionPct ||
    (nextInput.taxName ?? '') !== (feeConfig.taxName ?? '') ||
    nextInput.taxPct !== feeConfig.taxPct;

  const submit = () => {
    if (isDirty) setPendingInput(nextInput);
  };

  return (
    <>
      <div className="rounded-xl border border-border bg-card shadow-sm">
        <div className="border-b border-border p-5">
          <div className="flex items-center gap-2">
            <Percent className="h-5 w-5" />
            <p className="font-medium">Platform fees & taxes</p>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            A commission is withheld from each host payout; a tax (e.g. VAT) is added to the guest
            charge. Both are snapshotted at booking time, so changes apply to new bookings only.
          </p>
        </div>
        <div className="grid gap-5 p-5 md:grid-cols-3">
          <Field
            label="Platform commission (%)"
            hint="Withheld from the host payout. Hosts see net earnings."
          >
            <NumberInput
              min={0}
              max={100}
              value={commission}
              onValueChange={setCommission}
              placeholder="e.g. 10"
            />
          </Field>
          <Field label="Tax label" hint="Shown at checkout, e.g. VAT. Empty clears it.">
            <Input
              value={taxName}
              onChange={(e) => setTaxName(e.target.value)}
              placeholder="e.g. VAT"
              maxLength={60}
            />
          </Field>
          <Field label="Tax (%)" hint="Added to the guest charge on top of the stay total.">
            <NumberInput
              integer={false}
              min={0}
              max={100}
              value={taxPct}
              onValueChange={setTaxPct}
              placeholder="e.g. 7.5"
            />
          </Field>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-3 border-t border-border p-4">
          <p className="text-xs text-muted-foreground">
            Current: {feeConfig.commissionPct}% commission
            {feeConfig.taxPct > 0
              ? ` · ${feeConfig.taxName ?? 'Tax'} ${feeConfig.taxPct}%`
              : ' · no tax'}{' '}
            · updated {formatDate(feeConfig.updatedAt, 'short')}
          </p>
          <Button onClick={submit} disabled={saving || !isDirty} isLoading={saving}>
            {saving ? 'Saving…' : 'Save fees & taxes'}
          </Button>
        </div>
      </div>
      <ConfirmDialog
        open={pendingInput !== null}
        onOpenChange={(open) => !open && setPendingInput(null)}
        title="Apply new shortlet fees?"
        description={
          pendingInput
            ? `New bookings will use ${pendingInput.commissionPct}% commission and ${pendingInput.taxPct}% ${pendingInput.taxName ?? 'tax'}. Existing bookings keep their original fee snapshot.`
            : ''
        }
        confirmLabel="Apply fee changes"
        onConfirm={() => pendingInput && onSave(pendingInput)}
      />
    </>
  );
}
