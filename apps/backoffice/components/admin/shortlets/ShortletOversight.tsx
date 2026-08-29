'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  EmptyState,
  Input,
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
  Play,
  Send,
  ShieldCheck,
} from 'lucide-react';
import { formatCurrency, formatDate, unwrap } from '@getrentos/shared';
import { adminShortletService } from '@/services/adminShortletService';
import type {
  AdminShortletBooking,
  AdminShortletDispute,
  AdminShortletDisputeMessage,
  AdminShortletDisputeStatus,
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

type Tab = 'listings' | 'bookings' | 'payouts' | 'disputes';

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

  const { data: overview } = useQuery({
    queryKey: ['admin', 'shortlets', 'overview'],
    queryFn: () => unwrap(adminShortletService.overview()),
  });

  const { data: listingsData, isLoading: listingsLoading } = useQuery({
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

  const { data: bookingsData, isLoading: bookingsLoading } = useQuery({
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

  const { data: payoutsData, isLoading: payoutsLoading } = useQuery({
    queryKey: ['admin', 'shortlets', 'payouts', { page: payoutsPage }],
    queryFn: () => unwrap(adminShortletService.listPayouts({ page: payoutsPage, pageSize: 12 })),
  });
  const payouts = payoutsData?.items ?? [];

  const { data: disputesData, isLoading: disputesLoading } = useQuery({
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

  const { data: threadMessages = [], isLoading: threadLoading } = useQuery({
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
    mutationFn: (action: 'resolve' | 'escalate') =>
      unwrap(
        action === 'resolve'
          ? adminShortletService.resolveDispute(activeDispute!.id)
          : adminShortletService.escalateDispute(activeDispute!.id)
      ),
    onSuccess: (_, action) => {
      setActiveDispute(null);
      queryClient.invalidateQueries({ queryKey: ['admin', 'shortlets', 'disputes'] });
      setToast({
        message: action === 'resolve' ? 'Dispute resolved.' : 'Dispute escalated.',
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Shortlet Oversight</h1>
        <p className="mt-1 text-muted-foreground">
          Platform-wide view of shortlet listings and bookings.
        </p>
      </div>

      {/* Overview cards */}
      {overview ? (
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
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="inline-flex rounded-lg border border-border bg-card p-1 text-sm">
        {(['listings', 'bookings', 'payouts', 'disputes'] as Tab[]).map((t) => (
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
                  : `Disputes (${disputesData?.total ?? 0})`}
          </button>
        ))}
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

          {listingsLoading ? (
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
                  onModerate={(action) => moderation.mutate({ listingId: l.id, action })}
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

          {bookingsLoading ? (
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

          {payoutsLoading ? (
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
      ) : (
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

          {disputesLoading ? (
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
      )}

      {activeDispute && (
        <DisputeThreadModal
          dispute={activeDispute}
          messages={threadMessages}
          loading={threadLoading}
          draft={threadDraft}
          onDraftChange={setThreadDraft}
          replying={disputeReply.isPending}
          onReply={() => disputeReply.mutate(threadDraft)}
          actionPending={disputeAction.isPending}
          onAction={(action) => disputeAction.mutate(action)}
          onClose={() => setActiveDispute(null)}
        />
      )}

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
            {loading ? (
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
