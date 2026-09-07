'use client';

import { useState } from 'react';
import Image from 'next/image';
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
  Ban,
  Banknote,
  CalendarCheck,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  Gavel,
  MapPin,
  Pause,
  Percent,
  Play,
  RotateCcw,
  Send,
  ShieldAlert,
  ShieldCheck,
  Star,
  Trash2,
  Wallet,
  XCircle,
} from 'lucide-react';
import { formatCurrency, formatDate, unwrap } from '@getrentos/shared';
import { adminShortletService } from '@/services/adminShortletService';
import { useAdminUser } from '@/app/(dashboard)/admin/layout';
import { hasAdminPermission } from '@/lib/adminAccess';
import type {
  AdminShortletBooking,
  AdminShortletDepositClaim,
  AdminShortletDepositClaimStatus,
  AdminShortletDispute,
  AdminShortletDisputeMessage,
  AdminShortletDisputeStatus,
  AdminShortletFeeConfig,
  AdminShortletGuestReview,
  AdminShortletListing,
  AdminShortletPayout,
  AdminShortletPayoutAccount,
  AdminShortletPayoutDetail,
  AdminShortletReview,
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

const PAYMENT_STATUS_VARIANT: Record<AdminShortletBooking['paymentStatus'], BadgeVariant> = {
  UNPAID: 'neutral',
  PROCESSING: 'info',
  PAID: 'success',
  REFUNDED: 'warning',
};

type Tab =
  | 'listings'
  | 'bookings'
  | 'payouts'
  | 'payout-accounts'
  | 'reviews'
  | 'disputes'
  | 'claims'
  | 'fees';

const REVIEW_RATING_VALUES: { value: 'all' | number; label: string }[] = [
  { value: 'all', label: 'All ratings' },
  { value: 5, label: '5 stars' },
  { value: 4, label: '4 stars' },
  { value: 3, label: '3 stars' },
  { value: 2, label: '2 stars' },
  { value: 1, label: '1 star' },
];

export type BookingIntervention = 'decline' | 'cancel' | 'refund' | 'complete';

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

  // Payout accounts register
  const [payoutAccountsSearch, setPayoutAccountsSearch] = useState('');
  const [payoutAccountsPage, setPayoutAccountsPage] = useState(1);
  const [activePayout, setActivePayout] = useState<AdminShortletPayout | null>(null);
  const [pendingRetry, setPendingRetry] = useState<AdminShortletPayout | null>(null);
  const [pendingHostPayout, setPendingHostPayout] = useState<AdminShortletPayoutAccount | null>(
    null
  );

  // Booking interventions (decline/cancel/refund/complete)
  const [pendingIntervention, setPendingIntervention] = useState<{
    booking: AdminShortletBooking;
    action: BookingIntervention;
  } | null>(null);

  // Review moderation queues (guest reviews of stays + host reviews of guests)
  const [reviewKind, setReviewKind] = useState<'guest' | 'host'>('guest');
  const [reviewsSearch, setReviewsSearch] = useState('');
  const [reviewsRating, setReviewsRating] = useState<'all' | number>('all');
  const [reviewsPage, setReviewsPage] = useState(1);
  const [pendingRemoval, setPendingRemoval] = useState<
    | { kind: 'guest'; review: AdminShortletReview }
    | { kind: 'host'; review: AdminShortletGuestReview }
    | null
  >(null);

  const adminUser = useAdminUser();
  const canPayout = hasAdminPermission(adminUser?.roles, 'shortlet.payout');
  const canModerate = hasAdminPermission(adminUser?.roles, 'shortlet.moderate');

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
    data: payoutAccountsData,
    isLoading: payoutAccountsLoading,
    isError: payoutAccountsError,
    isFetching: payoutAccountsFetching,
    refetch: refetchPayoutAccounts,
  } = useQuery({
    queryKey: [
      'admin',
      'shortlets',
      'payout-accounts',
      { search: payoutAccountsSearch, page: payoutAccountsPage },
    ],
    queryFn: () =>
      unwrap(
        adminShortletService.listPayoutAccounts({
          search: payoutAccountsSearch.trim() || undefined,
          page: payoutAccountsPage,
          pageSize: 12,
        })
      ),
    enabled: canPayout || canModerate,
  });
  const payoutAccounts = payoutAccountsData?.items ?? [];

  const {
    data: payoutDetail,
    isLoading: payoutDetailLoading,
    isError: payoutDetailError,
    isFetching: payoutDetailFetching,
    refetch: refetchPayoutDetail,
  } = useQuery({
    queryKey: ['admin', 'shortlets', 'payouts', activePayout?.id, 'detail'],
    queryFn: () => unwrap(adminShortletService.payoutDetail(activePayout!.id)),
    enabled: Boolean(activePayout),
  });

  const {
    data: reviewsData,
    isLoading: reviewsLoading,
    isError: reviewsError,
    isFetching: reviewsFetching,
    refetch: refetchReviews,
  } = useQuery({
    queryKey: [
      'admin',
      'shortlets',
      reviewKind === 'guest' ? 'reviews' : 'guest-reviews',
      { search: reviewsSearch, rating: reviewsRating, page: reviewsPage },
    ],
    queryFn: () =>
      unwrap(
        reviewKind === 'guest'
          ? adminShortletService.listReviews({
              search: reviewsSearch.trim() || undefined,
              rating: reviewsRating === 'all' ? undefined : reviewsRating,
              page: reviewsPage,
              pageSize: 12,
            })
          : adminShortletService.listGuestReviews({
              search: reviewsSearch.trim() || undefined,
              rating: reviewsRating === 'all' ? undefined : reviewsRating,
              page: reviewsPage,
              pageSize: 12,
            })
      ),
    enabled: canModerate || canPayout,
  });
  const reviews = reviewsData?.items ?? [];

  const retryPayout = useMutation({
    mutationFn: (payoutId: string) => unwrap(adminShortletService.retryPayout(payoutId)),
    onSuccess: () => {
      setPendingRetry(null);
      setActivePayout(null);
      queryClient.invalidateQueries({ queryKey: ['admin', 'shortlets', 'payouts'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'shortlets', 'payout-accounts'] });
      setToast({ message: 'Payout retried successfully.', variant: 'success' });
    },
    onError: (reason: Error) => setToast({ message: reason.message, variant: 'error' }),
  });

  const requestHostPayout = useMutation({
    mutationFn: (hostId: string) => unwrap(adminShortletService.requestHostPayout(hostId)),
    onSuccess: () => {
      setPendingHostPayout(null);
      queryClient.invalidateQueries({ queryKey: ['admin', 'shortlets', 'payouts'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'shortlets', 'payout-accounts'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'shortlets', 'bookings'] });
      setToast({ message: 'Host payout initiated.', variant: 'success' });
    },
    onError: (reason: Error) => setToast({ message: reason.message, variant: 'error' }),
  });

  const interveneBooking = useMutation({
    mutationFn: (input: { bookingId: string; action: BookingIntervention }) =>
      unwrap(
        input.action === 'decline'
          ? adminShortletService.declineBooking(input.bookingId)
          : input.action === 'cancel'
            ? adminShortletService.cancelBooking(input.bookingId)
            : input.action === 'refund'
              ? adminShortletService.refundBooking(input.bookingId)
              : adminShortletService.completeBooking(input.bookingId)
      ),
    onSuccess: (_, input) => {
      setPendingIntervention(null);
      queryClient.invalidateQueries({ queryKey: ['admin', 'shortlets', 'bookings'] });
      const msg: Record<BookingIntervention, string> = {
        decline: 'Booking declined.',
        cancel: 'Booking cancelled and refund processed per policy.',
        refund: 'Booking fully refunded.',
        complete: 'Booking completed and deposit released.',
      };
      setToast({ message: msg[input.action], variant: 'success' });
    },
    onError: (reason: Error) => setToast({ message: reason.message, variant: 'error' }),
  });

  const removeReview = useMutation({
    mutationFn: (input: { kind: 'guest' | 'host'; id: string }) =>
      unwrap(
        input.kind === 'guest'
          ? adminShortletService.removeReview(input.id)
          : adminShortletService.removeGuestReview(input.id)
      ),
    onSuccess: (_, input) => {
      setPendingRemoval(null);
      queryClient.invalidateQueries({
        queryKey: ['admin', 'shortlets', input.kind === 'guest' ? 'reviews' : 'guest-reviews'],
      });
      setToast({
        message: input.kind === 'guest' ? 'Guest review removed.' : 'Host review removed.',
        variant: 'success',
      });
    },
    onError: (reason: Error) => setToast({ message: reason.message, variant: 'error' }),
  });

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
          {(
            [
              'listings',
              'bookings',
              'payouts',
              'payout-accounts',
              'reviews',
              'disputes',
              'claims',
              'fees',
            ] as Tab[]
          ).map((t) => (
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
                    : t === 'payout-accounts'
                      ? `Payout accounts (${payoutAccountsData?.total ?? 0})`
                      : t === 'reviews'
                        ? `Reviews (${reviewsData?.total ?? 0})`
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
                <BookingRow
                  key={b.id}
                  booking={b}
                  canModerate={canModerate}
                  canPayout={canPayout}
                  busy={interveneBooking.isPending}
                  onIntervene={(action) => setPendingIntervention({ booking: b, action })}
                />
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
                <PayoutRow key={p.id} payout={p} onOpen={() => setActivePayout(p)} />
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
      ) : tab === 'payout-accounts' ? (
        <div className="rounded-xl border border-border bg-card shadow-sm">
          <div className="flex flex-wrap items-center gap-3 border-b border-border p-4">
            <div className="min-w-[220px] flex-1">
              <Input
                placeholder="Search hosts by name"
                value={payoutAccountsSearch}
                onChange={(e) => {
                  setPayoutAccountsSearch(e.target.value);
                  setPayoutAccountsPage(1);
                }}
              />
            </div>
          </div>

          {payoutAccountsError ? (
            <SectionError
              label="payout accounts"
              retry={() => void refetchPayoutAccounts()}
              retrying={payoutAccountsFetching}
            />
          ) : payoutAccountsLoading ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full rounded-lg" />
              ))}
            </div>
          ) : payoutAccounts.length === 0 ? (
            <EmptyState
              icon={Wallet}
              title="No payout accounts"
              description="Hosts must add a payout bank account before they can be paid."
            />
          ) : (
            <div className="divide-y divide-border">
              {payoutAccounts.map((a) => (
                <PayoutAccountRow
                  key={a.id}
                  account={a}
                  canPayout={canPayout}
                  busy={requestHostPayout.isPending}
                  onPayout={() => setPendingHostPayout(a)}
                />
              ))}
            </div>
          )}

          <Pagination
            page={payoutAccountsPage}
            pageSize={12}
            total={payoutAccountsData?.total ?? 0}
            onPageChange={setPayoutAccountsPage}
          />
        </div>
      ) : tab === 'reviews' ? (
        <div className="rounded-xl border border-border bg-card shadow-sm">
          <div className="flex flex-wrap items-center gap-3 border-b border-border p-4">
            <div className="flex rounded-lg border border-border p-0.5 text-sm">
              {(
                [
                  { value: 'guest', label: 'Guest reviews' },
                  { value: 'host', label: 'Host reviews' },
                ] as const
              ).map((k) => (
                <button
                  key={k.value}
                  type="button"
                  onClick={() => {
                    setReviewKind(k.value);
                    setReviewsPage(1);
                  }}
                  className={`rounded-md px-3 py-1 font-medium transition-colors ${
                    reviewKind === k.value
                      ? 'bg-secondary text-foreground'
                      : 'text-muted-foreground hover:bg-secondary/50'
                  }`}
                >
                  {k.label}
                </button>
              ))}
            </div>
            <div className="min-w-[180px] flex-1">
              <Input
                placeholder="Search comment, name, or listing"
                value={reviewsSearch}
                onChange={(e) => {
                  setReviewsSearch(e.target.value);
                  setReviewsPage(1);
                }}
              />
            </div>
            <div className="w-40">
              <Select
                value={String(reviewsRating)}
                onValueChange={(v) => {
                  setReviewsRating(v === 'all' ? 'all' : Number(v));
                  setReviewsPage(1);
                }}
                options={REVIEW_RATING_VALUES.map((r) => ({
                  value: String(r.value),
                  label: r.label,
                }))}
              />
            </div>
          </div>

          {reviewsError ? (
            <SectionError
              label={reviewKind === 'guest' ? 'guest reviews' : 'host reviews'}
              retry={() => void refetchReviews()}
              retrying={reviewsFetching}
            />
          ) : reviewsLoading ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full rounded-lg" />
              ))}
            </div>
          ) : reviews.length === 0 ? (
            <EmptyState icon={Star} title="No reviews yet" description="Try adjusting filters." />
          ) : (
            <div className="divide-y divide-border">
              {reviews.map((r) => (
                <ReviewRow
                  key={r.id}
                  review={r}
                  canRemove={canModerate}
                  busy={removeReview.isPending}
                  onRemove={() =>
                    setPendingRemoval({
                      kind: reviewKind,
                      review: r as AdminShortletReview,
                    })
                  }
                />
              ))}
            </div>
          )}

          <Pagination
            page={reviewsPage}
            pageSize={12}
            total={reviewsData?.total ?? 0}
            onPageChange={setReviewsPage}
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

      {activePayout && (
        <PayoutDetailModal
          payout={activePayout}
          detail={payoutDetail}
          loading={payoutDetailLoading}
          error={payoutDetailError}
          retrying={payoutDetailFetching}
          onRetry={() => void refetchPayoutDetail()}
          canRetry={canPayout && activePayout.status === 'FAILED'}
          retryPending={retryPayout.isPending}
          onRetryPayout={() => setPendingRetry(activePayout)}
          onClose={() => setActivePayout(null)}
        />
      )}

      <ConfirmDialog
        open={pendingRetry !== null}
        onOpenChange={(open) => !open && setPendingRetry(null)}
        title="Retry this payout?"
        description={
          pendingRetry
            ? `A new transfer will be attempted for ${formatCurrency(pendingRetry.amount)} to ${
                pendingRetry.hostName ?? 'the host'
              }. Covered bookings will be marked paid out on success.`
            : ''
        }
        confirmLabel="Retry payout"
        onConfirm={() => pendingRetry && retryPayout.mutate(pendingRetry.id)}
      />

      <ConfirmDialog
        open={pendingHostPayout !== null}
        onOpenChange={(open) => !open && setPendingHostPayout(null)}
        title="Initiate host payout?"
        description={
          pendingHostPayout
            ? `${pendingHostPayout.hostName}'s full available shortlet earnings will be transferred to ${pendingHostPayout.bankName} ••• ${pendingHostPayout.accountNumber}.`
            : ''
        }
        confirmLabel="Initiate payout"
        onConfirm={() => pendingHostPayout && requestHostPayout.mutate(pendingHostPayout.hostId)}
      />

      <ConfirmDialog
        open={pendingIntervention !== null}
        onOpenChange={(open) => !open && setPendingIntervention(null)}
        title={
          pendingIntervention
            ? {
                decline: 'Decline this booking?',
                cancel: 'Cancel this booking?',
                refund: 'Refund this booking?',
                complete: 'Complete this booking?',
              }[pendingIntervention.action]
            : 'Confirm booking action'
        }
        description={
          pendingIntervention
            ? {
                decline: 'The guest will be notified and the request closed.',
                cancel:
                  'The guest will be refunded per the cancellation policy and the held deposit returned.',
                refund: 'The full stay payment and held deposit will be returned to the guest.',
                complete:
                  'The stay is marked completed and the held deposit released to the guest.',
              }[pendingIntervention.action]
            : ''
        }
        confirmLabel={
          pendingIntervention
            ? {
                decline: 'Decline booking',
                cancel: 'Cancel & refund',
                refund: 'Refund in full',
                complete: 'Complete booking',
              }[pendingIntervention.action]
            : 'Confirm'
        }
        onConfirm={() => {
          if (pendingIntervention) {
            interveneBooking.mutate({
              bookingId: pendingIntervention.booking.id,
              action: pendingIntervention.action,
            });
          }
        }}
      />

      <ConfirmDialog
        open={pendingRemoval !== null}
        onOpenChange={(open) => !open && setPendingRemoval(null)}
        title="Remove this review?"
        description={
          pendingRemoval
            ? `This ${pendingRemoval.kind === 'guest' ? 'guest review of the stay' : 'host review of the guest'} will be permanently removed and its rating pulled from the aggregate.`
            : ''
        }
        confirmLabel="Remove review"
        onConfirm={() => {
          if (pendingRemoval) {
            removeReview.mutate({
              kind: pendingRemoval.kind,
              id: pendingRemoval.review.id,
            });
          }
        }}
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

function BookingRow({
  booking,
  canModerate,
  canPayout,
  busy,
  onIntervene,
}: {
  booking: AdminShortletBooking;
  canModerate: boolean;
  canPayout: boolean;
  busy: boolean;
  onIntervene: (action: BookingIntervention) => void;
}) {
  const canDecline = booking.status === 'REQUESTED';
  const canCancel =
    (booking.status === 'REQUESTED' || booking.status === 'CONFIRMED') &&
    booking.paymentStatus !== 'PROCESSING';
  const canRefund =
    booking.status === 'CONFIRMED' && booking.paymentStatus === 'PAID' && !booking.paidOut;
  const canComplete = booking.status === 'CONFIRMED';
  const showActions =
    (canModerate && (canDecline || canComplete)) || (canPayout && (canCancel || canRefund));

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 p-4">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <p className="truncate font-medium">{booking.propertyTitle}</p>
          <Badge variant={BOOKING_STATUS_VARIANT[booking.status]}>{booking.status}</Badge>
          <Badge variant={PAYMENT_STATUS_VARIANT[booking.paymentStatus]}>
            {booking.paymentStatus}
          </Badge>
          {booking.paidOut && <Badge variant="neutral">Paid out</Badge>}
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          {booking.guestName} → {booking.hostName} · {formatDate(booking.checkIn, 'short')} →{' '}
          {formatDate(booking.checkOut, 'short')} · {booking.nights} night
          {booking.nights > 1 ? 's' : ''}
        </p>
        <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
          {booking.paymentReference && <span>Ref {booking.paymentReference}</span>}
          {booking.depositStatus === 'HELD' && booking.deposit != null && (
            <span>· Deposit held {formatCurrency(booking.deposit)}</span>
          )}
          {booking.paymentStatus === 'REFUNDED' && booking.refundAmount != null && (
            <span>· Refunded {formatCurrency(booking.refundAmount)}</span>
          )}
        </p>
      </div>
      <div className="flex flex-col items-end gap-2">
        <div className="text-right">
          <p className="font-semibold">{formatCurrency(booking.total)}</p>
          <p className="text-xs text-muted-foreground">{booking.city}</p>
        </div>
        {showActions && (
          <div className="flex flex-wrap justify-end gap-1.5">
            {canModerate && canDecline && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onIntervene('decline')}
                disabled={busy}
              >
                <XCircle className="mr-1 h-3.5 w-3.5" /> Decline
              </Button>
            )}
            {canModerate && canComplete && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onIntervene('complete')}
                disabled={busy}
              >
                <CheckCircle2 className="mr-1 h-3.5 w-3.5" /> Complete
              </Button>
            )}
            {canPayout && canCancel && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onIntervene('cancel')}
                disabled={busy}
              >
                <Ban className="mr-1 h-3.5 w-3.5" /> Cancel
              </Button>
            )}
            {canPayout && canRefund && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onIntervene('refund')}
                disabled={busy}
              >
                <Banknote className="mr-1 h-3.5 w-3.5" /> Refund
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

const PAYOUT_STATUS_VARIANT: Record<AdminShortletPayout['status'], BadgeVariant> = {
  SUCCESS: 'success',
  PENDING: 'info',
  FAILED: 'danger',
};

function PayoutRow({ payout, onOpen }: { payout: AdminShortletPayout; onOpen: () => void }) {
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
      <div className="flex items-center gap-2">
        <div className="text-right">
          <p className="font-semibold">{formatCurrency(payout.amount)}</p>
          {payout.paidAt && (
            <p className="text-xs text-muted-foreground">
              Paid {formatDate(payout.paidAt, 'short')}
            </p>
          )}
        </div>
        <Button variant="outline" size="sm" onClick={onOpen}>
          Details
        </Button>
      </div>
    </div>
  );
}

function PayoutAccountRow({
  account,
  canPayout,
  busy,
  onPayout,
}: {
  account: AdminShortletPayoutAccount;
  canPayout: boolean;
  busy: boolean;
  onPayout: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 p-4">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <p className="truncate font-medium">{account.hostName}</p>
          <Badge variant={account.recipientReady ? 'success' : 'warning'}>
            {account.recipientReady ? 'Payable' : 'Not ready'}
          </Badge>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          {account.bankName} ·•• {account.accountNumber} · {account.accountName}
        </p>
        {account.hostEmail && (
          <p className="mt-0.5 text-xs text-muted-foreground">{account.hostEmail}</p>
        )}
      </div>
      {canPayout && account.recipientReady && (
        <Button variant="outline" size="sm" onClick={onPayout} disabled={busy}>
          <Banknote className="mr-1.5 h-4 w-4" /> Initiate payout
        </Button>
      )}
    </div>
  );
}

function ReviewRow({
  review,
  canRemove,
  busy,
  onRemove,
}: {
  review: AdminShortletReview;
  canRemove: boolean;
  busy: boolean;
  onRemove: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 p-4">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <p className="truncate font-medium">
            <span className="text-amber-500" aria-hidden>
              {'★'.repeat(review.rating)}
            </span>
            <span
              className="ml-1.5 text-sm text-muted-foreground"
              aria-label={`${review.rating} stars`}
            >
              {review.rating}/5
            </span>
          </p>
          <p className="text-sm text-muted-foreground">
            {review.guestName} → {review.hostName}
          </p>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          {review.listingTitle ?? 'Shortlet'} · {formatDate(review.createdAt, 'short')}
        </p>
        {review.comment && (
          <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{review.comment}</p>
        )}
      </div>
      {canRemove && (
        <Button variant="ghost" size="sm" onClick={onRemove} disabled={busy}>
          <Trash2 className="mr-1.5 h-4 w-4" /> Remove
        </Button>
      )}
    </div>
  );
}

function PayoutDetailModal({
  payout,
  detail,
  loading,
  error,
  retrying,
  onRetry,
  canRetry,
  retryPending,
  onRetryPayout,
  onClose,
}: {
  payout: AdminShortletPayout;
  detail?: AdminShortletPayoutDetail;
  loading: boolean;
  error: boolean;
  retrying: boolean;
  onRetry: () => void;
  canRetry: boolean;
  retryPending: boolean;
  onRetryPayout: () => void;
  onClose: () => void;
}) {
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-2xl">
        <div className="p-5">
          <DialogTitle>Payout detail</DialogTitle>
          <DialogDescription>
            <span className="flex flex-wrap items-center gap-2">
              <Badge variant={PAYOUT_STATUS_VARIANT[payout.status]}>{payout.status}</Badge>
              <span className="text-sm text-muted-foreground">
                {payout.hostName ?? 'Host'} · {formatDate(payout.createdAt, 'short')}
                {payout.transferRef ? ` · Ref ${payout.transferRef}` : ''}
              </span>
            </span>
          </DialogDescription>
        </div>
        <div className="max-h-[60vh] space-y-4 overflow-y-auto border-t border-border p-5">
          <div className="grid gap-3 rounded-lg border border-border bg-secondary/40 p-4 sm:grid-cols-2">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Amount
              </p>
              <p className="text-lg font-semibold">
                {detail ? formatCurrency(detail.amount) : formatCurrency(payout.amount)}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Bookings covered
              </p>
              <p className="text-lg font-semibold">
                {detail ? detail.bookingCount : payout.bookingCount}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Paid to
              </p>
              <p className="text-sm font-medium">{payout.hostName ?? 'Host'}</p>
              {detail?.hostEmail && (
                <p className="text-xs text-muted-foreground">{detail.hostEmail}</p>
              )}
            </div>
            {detail?.account && (
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Account
                </p>
                <p className="text-sm font-medium">
                  {detail.account.bankName} ·•• {detail.account.accountNumber}
                </p>
                <p className="text-xs text-muted-foreground">{detail.account.accountName}</p>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">Covered bookings</p>
            {error ? (
              <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4 text-center">
                <p className="text-sm text-destructive">The payout detail could not be loaded.</p>
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
            ) : detail?.bookings && detail.bookings.length > 0 ? (
              <div className="divide-y divide-border rounded-lg border border-border">
                {detail.bookings.map((b) => (
                  <div key={b.id} className="flex flex-wrap items-center justify-between gap-2 p-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {b.listingTitle ?? 'Shortlet stay'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(b.checkIn, 'short')} → {formatDate(b.checkOut, 'short')} ·{' '}
                        {formatDate(b.createdAt, 'short')}
                      </p>
                    </div>
                    <p className="text-sm font-semibold">{formatCurrency(b.total)}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No bookings covered by this payout.</p>
            )}
          </div>
        </div>
        <div className="flex justify-end gap-2 border-t border-border p-4">
          {canRetry && (
            <Button variant="outline" onClick={onRetryPayout} isLoading={retryPending}>
              <RotateCcw className="mr-1.5 h-4 w-4" /> Retry payout
            </Button>
          )}
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
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
                      <Image
                        src={url}
                        alt={`Evidence photo ${i + 1}`}
                        fill
                        sizes="64px"
                        unoptimized
                        className="object-cover"
                      />
                      <span className="absolute inset-0 flex items-center justify-center bg-black/0 text-[10px] font-medium text-white opacity-0 transition-opacity group-hover:bg-black/40 group-hover:opacity-100 group-focus-visible:bg-black/40 group-focus-visible:opacity-100">
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
