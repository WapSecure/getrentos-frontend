'use client';

import { useMemo, useState } from 'react';
import { HostFeeNote } from './HostFeeNote';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Badge,
  Button,
  Card,
  CurrencyInput,
  DatePicker,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  EmptyState,
  Field,
  Input,
  NumberInput,
  Pagination,
  Select,
  Skeleton,
  Switch,
  Tabs,
  TabsList,
  TabsTrigger,
  TimePicker,
  useToast,
  type BadgeVariant,
} from '@getrentos/ui';
import {
  BarChart3,
  CalendarOff,
  CalendarSync,
  ClipboardList,
  Banknote,
  Gavel,
  MessageSquare,
  Plus,
  ShieldAlert,
  Star,
  Tags,
  Zap,
} from 'lucide-react';
import { unwrap, VerificationRequiredError } from '@/lib/apiHelpers';
import { VerificationRequiredNotice } from '@/components/shared/verification/VerificationRequiredNotice';
import { ROUTES } from '@/lib/constants/auth';
import { ownerService } from '@/services/ownerService';
import { landlordService } from '@/services/landlordService';
import { shortletService } from '@/services/shortletService';
import { shortletKeys } from '@/lib/queryKeys';
import { formatCurrency, formatDate } from '@/lib/format';
import { ShortletMediaManager, type ShortletMediaState } from './ShortletMediaManager';
import { ShortletMessagesInbox } from './ShortletMessagesInbox';
import { ShortletPayoutsDialog } from './ShortletPayoutsDialog';
import { ShortletGuestReviewDialog } from './ShortletGuestReviewDialog';
import { ShortletDisputesInbox } from './ShortletDisputesInbox';
import { ShortletOpenDisputeDialog } from './ShortletOpenDisputeDialog';
import { ShortletOpenDepositClaimDialog } from './ShortletOpenDepositClaimDialog';
import { ShortletDepositClaimsInbox } from './ShortletDepositClaimsInbox';
import { HostEarningsAnalyticsDialog } from './HostEarningsAnalyticsDialog';
import { ShortletPeakPricingDialog } from './ShortletPeakPricingDialog';
import { ShortletCalendarSyncDialog } from './ShortletCalendarSyncDialog';
import { HostCancelBookingDialog } from './HostCancelBookingDialog';
import { ShortletEssentialsDialog } from './ShortletEssentialsDialog';
import { GuestSummaryLine } from './GuestSummaryLine';
import { SHORTLET_AMENITIES } from '@/lib/shortlet/essentials';
import type {
  BlockedDateRange,
  CreateShortletListingInput,
  ShortletBooking,
  ShortletBookingStatus,
  ShortletCancellationPolicy,
  ShortletListing,
} from '@/types/shortlet';

const PAGE_SIZE = 10;
type Tab = 'listings' | 'bookings';
type HostRole = 'owner' | 'landlord';
const TODAY = new Date().toISOString().slice(0, 10);

const CANCELLATION_POLICIES: { value: ShortletCancellationPolicy; label: string; hint: string }[] =
  [
    {
      value: 'FLEXIBLE',
      label: 'Flexible',
      hint: 'Full refund up to 1 day before check-in.',
    },
    {
      value: 'MODERATE',
      label: 'Moderate',
      hint: 'Full refund 5+ days before; 50% up to 1 day before.',
    },
    {
      value: 'STRICT',
      label: 'Strict',
      hint: 'Full refund 7+ days before; 50% 3+ days before; nothing after.',
    },
  ];

const STATUS_VARIANT: Record<ShortletBookingStatus, BadgeVariant> = {
  REQUESTED: 'info',
  CONFIRMED: 'success',
  DECLINED: 'danger',
  CANCELLED: 'neutral',
  COMPLETED: 'neutral',
};

export const HostShortletWorkspace = ({ role }: { role: HostRole }) => {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<Tab>('listings');
  const [listingsPage, setListingsPage] = useState(1);
  const [bookingsPage, setBookingsPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<ShortletListing | null>(null);
  const [blockTarget, setBlockTarget] = useState<ShortletListing | null>(null);
  const [pricingTarget, setPricingTarget] = useState<ShortletListing | null>(null);
  const [syncTarget, setSyncTarget] = useState<ShortletListing | null>(null);
  const [essentialsTarget, setEssentialsTarget] = useState<ShortletListing | null>(null);
  const [cancelTarget, setCancelTarget] = useState<ShortletBooking | null>(null);
  const [messagesOpen, setMessagesOpen] = useState(false);
  const [payoutsOpen, setPayoutsOpen] = useState(false);
  const [disputesOpen, setDisputesOpen] = useState(false);
  const [claimsOpen, setClaimsOpen] = useState(false);
  const [disputeTarget, setDisputeTarget] = useState<ShortletBooking | null>(null);
  const [claimTarget, setClaimTarget] = useState<ShortletBooking | null>(null);
  const [guestReviewTarget, setGuestReviewTarget] = useState<ShortletBooking | null>(null);
  const [analyticsOpen, setAnalyticsOpen] = useState(false);
  const toast = useToast();

  const { data: listingsData, isLoading: listingsLoading } = useQuery({
    queryKey: [...shortletKeys.hostListings, { page: listingsPage, pageSize: PAGE_SIZE }],
    queryFn: () => unwrap(shortletService.myListings({ page: listingsPage, pageSize: PAGE_SIZE })),
    placeholderData: keepPreviousData,
  });
  const listings = listingsData?.items ?? [];

  const { data: bookingsData, isLoading: bookingsLoading } = useQuery({
    queryKey: [...shortletKeys.hostBookings, { page: bookingsPage, pageSize: PAGE_SIZE }],
    queryFn: () =>
      unwrap(shortletService.hostBookings({ page: bookingsPage, pageSize: PAGE_SIZE })),
    placeholderData: keepPreviousData,
  });
  const bookings = bookingsData?.items ?? [];

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: shortletKeys.hostListings });
    queryClient.invalidateQueries({ queryKey: shortletKeys.hostBookings });
    queryClient.invalidateQueries({ queryKey: shortletKeys.public });
  };

  const setStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'PUBLISHED' | 'PAUSED' | 'CLOSED' }) =>
      unwrap(shortletService.setListingStatus(id, status)),
    onSuccess: () => {
      invalidateAll();
      toast.success('Listing updated.');
    },
    onError: (reason: Error) => toast.error(reason.message),
  });

  const decide = useMutation({
    mutationFn: ({ id, action }: { id: string; action: 'approve' | 'decline' }) =>
      unwrap(
        action === 'approve'
          ? shortletService.approveBooking(id)
          : shortletService.declineBooking(id)
      ),
    onSuccess: (_, { action }) => {
      queryClient.invalidateQueries({ queryKey: shortletKeys.hostBookings });
      toast.success(action === 'approve' ? 'Booking approved.' : 'Booking declined.');
    },
    onError: (reason: Error) => toast.error(reason.message),
  });

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Shortlet Management</h1>
          <p className="mt-1 text-muted-foreground">
            Publish short-stay listings and manage bookings.
          </p>
          <HostFeeNote />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setMessagesOpen(true)}
            icon={<MessageSquare className="h-4 w-4" />}
          >
            Messages
          </Button>
          <Button
            variant="outline"
            onClick={() => setDisputesOpen(true)}
            icon={<Gavel className="h-4 w-4" />}
          >
            Disputes
          </Button>
          <Button
            variant="outline"
            onClick={() => setClaimsOpen(true)}
            icon={<ShieldAlert className="h-4 w-4" />}
          >
            Deposit claims
          </Button>
          <Button
            variant="outline"
            onClick={() => setAnalyticsOpen(true)}
            icon={<BarChart3 className="h-4 w-4" />}
          >
            Analytics
          </Button>
          <Button
            variant="outline"
            onClick={() => setPayoutsOpen(true)}
            icon={<Banknote className="h-4 w-4" />}
          >
            Payouts
          </Button>
          <Button onClick={() => setCreateOpen(true)} icon={<Plus className="h-4 w-4" />}>
            New listing
          </Button>
        </div>
      </div>

      <Tabs value={tab} onValueChange={(value) => setTab(value as Tab)} className="mb-6">
        <TabsList className="max-w-full">
          {(['listings', 'bookings'] as Tab[]).map((t) => (
            <TabsTrigger key={t} value={t} className="px-4 text-sm">
              {t === 'listings' ? 'My Listings' : `Booking Requests (${bookingsData?.total ?? 0})`}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {tab === 'listings' ? (
        listingsLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full rounded-xl" />
            ))}
          </div>
        ) : listings.length === 0 ? (
          <EmptyState
            icon={Plus}
            title="No shortlet listings"
            description="Publish your first short-stay listing to start earning."
          />
        ) : (
          <div className="space-y-3">
            {listings.map((l) => (
              <Card key={l.id} className="p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-medium">{l.title}</h3>
                      {l.status !== 'PUBLISHED' && (
                        <Badge
                          variant={
                            l.status === 'PAUSED'
                              ? 'warning'
                              : l.status === 'PENDING_VERIFICATION'
                                ? 'info'
                                : 'neutral'
                          }
                        >
                          {l.status === 'PENDING_VERIFICATION' ? 'Under review' : l.status}
                        </Badge>
                      )}
                      {l.instantBooking && (
                        <Badge icon={<Zap className="h-3 w-3" />}>Instant</Badge>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {l.city}, {l.state} ·{' '}
                      {l.pricingMode === 'PER_NIGHT' ? 'per night' : 'flat stay'}
                    </p>
                    <p className="mt-1 text-sm">
                      {l.nightlyRate != null ? formatCurrency(l.nightlyRate) : 'No rate'} · min{' '}
                      {l.minNights} night
                      {l.minNights > 1 ? 's' : ''}
                      {l.cleaningFee ? ` · ${formatCurrency(l.cleaningFee)} cleaning` : ''}
                      {l.deposit ? ` · ${formatCurrency(l.deposit)} deposit` : ''}
                    </p>
                    {peakSummary(l) && (
                      <p className="mt-1 text-xs text-muted-foreground">{peakSummary(l)}</p>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {l.status !== 'CLOSED' && l.status !== 'PENDING_VERIFICATION' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setStatus.mutate({
                            id: l.id,
                            status: l.status === 'PUBLISHED' ? 'PAUSED' : 'PUBLISHED',
                          })
                        }
                        isLoading={
                          setStatus.isPending &&
                          setStatus.variables?.id === l.id &&
                          setStatus.variables.status !== 'CLOSED'
                        }
                        disabled={setStatus.isPending}
                      >
                        {l.status === 'PUBLISHED' ? 'Pause' : 'Resume'}
                      </Button>
                    )}
                    {l.status !== 'CLOSED' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setStatus.mutate({ id: l.id, status: 'CLOSED' })}
                        isLoading={
                          setStatus.isPending &&
                          setStatus.variables?.id === l.id &&
                          setStatus.variables.status === 'CLOSED'
                        }
                        disabled={setStatus.isPending}
                      >
                        Close
                      </Button>
                    )}
                    <Button variant="outline" size="sm" onClick={() => setEditTarget(l)}>
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPricingTarget(l)}
                      icon={<Tags className="h-4 w-4" />}
                    >
                      Pricing &amp; seasons
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setBlockTarget(l)}
                      icon={<CalendarOff className="h-4 w-4" />}
                    >
                      Block dates
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEssentialsTarget(l)}
                      icon={<ClipboardList className="h-4 w-4" />}
                    >
                      Rules &amp; essentials
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSyncTarget(l)}
                      icon={<CalendarSync className="h-4 w-4" />}
                    >
                      Calendar sync
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
            <Pagination
              page={listingsPage}
              pageSize={PAGE_SIZE}
              total={listingsData?.total ?? 0}
              onPageChange={setListingsPage}
            />
          </div>
        )
      ) : bookingsLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full rounded-xl" />
          ))}
        </div>
      ) : bookings.length === 0 ? (
        <EmptyState
          icon={CalendarOff}
          title="No booking requests"
          description="When guests request your shortlets, they appear here."
        />
      ) : (
        <div className="space-y-3">
          {bookings.map((b) => (
            <Card key={b.id} className="p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <h3 className="font-medium">{b.propertyTitle}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {b.guestName ?? 'Guest'} · {b.guestCount} guest{b.guestCount > 1 ? 's' : ''} ·{' '}
                    {formatDate(b.checkIn, 'long')} → {formatDate(b.checkOut, 'long')} · {b.nights}{' '}
                    night{b.nights > 1 ? 's' : ''}
                  </p>
                  {b.guestSummary ? (
                    <GuestSummaryLine summary={b.guestSummary} />
                  ) : (
                    b.guestRatingAverage != null && (
                      <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                        <Star className="h-3.5 w-3.5 fill-warning text-warning" />
                        {b.guestRatingAverage.toFixed(1)} guest rating
                        {b.guestRatingCount != null ? ` (${b.guestRatingCount})` : ''}
                      </p>
                    )
                  )}
                  {b.notes && <p className="mt-1 text-sm text-muted-foreground">“{b.notes}”</p>}
                </div>
                <div className="shrink-0 text-right">
                  <Badge variant={STATUS_VARIANT[b.status]}>{b.status}</Badge>
                  <p className="mt-1 font-semibold">{formatCurrency(b.total)}</p>
                  {b.platformFee != null && b.platformFee > 0 && (
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Fee −{formatCurrency(b.platformFee)}
                      {b.hostNet != null ? ` · you earn ${formatCurrency(b.hostNet)}` : ''}
                    </p>
                  )}
                  {b.deposit != null && b.depositStatus === 'HELD' && (
                    <p className="mt-0.5 text-xs text-warning">
                      {formatCurrency(b.deposit)} deposit held
                      {b.depositClaimStatus === 'PENDING' && b.depositClaimAmount != null
                        ? ` · claim pending ${formatCurrency(b.depositClaimAmount)}`
                        : ''}
                    </p>
                  )}
                  {b.deposit != null && b.depositStatus === 'REFUNDED' && (
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Deposit refunded {formatCurrency(b.depositRefundedAmount ?? b.deposit)}
                    </p>
                  )}
                  {(b.depositClaimStatus === 'APPROVED' || b.depositClaimStatus === 'PARTIAL') &&
                    (b.depositClaimDeducted ?? 0) > 0 && (
                      <p className="mt-0.5 text-xs text-success">
                        Claim {b.depositClaimStatus.toLowerCase()} ·{' '}
                        {formatCurrency(b.depositClaimDeducted ?? b.depositClaimAmount ?? 0)}{' '}
                        withheld
                      </p>
                    )}
                  {b.depositClaimStatus === 'REJECTED' && (
                    <p className="mt-0.5 text-xs text-muted-foreground">Claim rejected</p>
                  )}
                  {b.paymentReference && (
                    <p className="text-xs text-muted-foreground">Ref {b.paymentReference}</p>
                  )}
                </div>
              </div>
              {(b.status === 'CONFIRMED' || b.status === 'COMPLETED') &&
                b.depositStatus === 'HELD' &&
                // The deposit covers the stay, so a claim only makes sense once
                // the guest has checked out. The API refuses it before then.
                b.checkOut <= TODAY &&
                b.depositClaimStatus !== 'PENDING' && (
                  <div className="mt-3 flex justify-end gap-2 border-t border-border pt-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setClaimTarget(b)}
                      icon={<ShieldAlert className="h-4 w-4" />}
                    >
                      Claim deposit
                    </Button>
                  </div>
                )}
              {b.status === 'REQUESTED' && (
                <div className="mt-3 flex justify-end gap-2 border-t border-border pt-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => decide.mutate({ id: b.id, action: 'decline' })}
                    isLoading={
                      decide.isPending &&
                      decide.variables?.id === b.id &&
                      decide.variables.action === 'decline'
                    }
                    disabled={decide.isPending}
                  >
                    Decline
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => decide.mutate({ id: b.id, action: 'approve' })}
                    isLoading={
                      decide.isPending &&
                      decide.variables?.id === b.id &&
                      decide.variables.action === 'approve'
                    }
                    disabled={decide.isPending}
                  >
                    Approve
                  </Button>
                </div>
              )}
              {(b.status === 'CONFIRMED' || b.status === 'COMPLETED') && (
                <div className="mt-3 flex flex-wrap justify-end gap-2 border-t border-border pt-3">
                  {b.status === 'COMPLETED' && !b.guestReviewed && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setGuestReviewTarget(b)}
                      icon={<Star className="h-4 w-4" />}
                    >
                      Review guest
                    </Button>
                  )}
                  {b.status === 'COMPLETED' && b.guestReviewed && (
                    <Badge variant="success" icon={<Star className="h-3 w-3" />} className="mt-0.5">
                      Reviewed
                    </Badge>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDisputeTarget(b)}
                    icon={<Gavel className="h-4 w-4" />}
                  >
                    Open dispute
                  </Button>
                  {b.status === 'CONFIRMED' && b.checkIn > TODAY && (
                    <Button variant="ghost" size="sm" onClick={() => setCancelTarget(b)}>
                      Cancel stay
                    </Button>
                  )}
                </div>
              )}
              {b.status === 'CANCELLED' && b.cancelledBy && (
                <p className="mt-3 border-t border-border pt-3 text-xs text-muted-foreground">
                  {b.cancelledBy === 'HOST'
                    ? 'You cancelled this stay'
                    : b.cancelledBy === 'GUEST'
                      ? 'The guest cancelled this stay'
                      : 'Support cancelled this stay'}
                  {b.cancellationReason ? `: “${b.cancellationReason}”` : '.'}
                </p>
              )}
            </Card>
          ))}
          <Pagination
            page={bookingsPage}
            pageSize={PAGE_SIZE}
            total={bookingsData?.total ?? 0}
            onPageChange={setBookingsPage}
          />
        </div>
      )}

      {createOpen && (
        <CreateListingDialog
          role={role}
          onClose={() => setCreateOpen(false)}
          onCreated={() => {
            setCreateOpen(false);
            invalidateAll();
            toast.success('Shortlet listing published.');
          }}
        />
      )}
      {editTarget && (
        <EditListingDialog
          listing={editTarget}
          role={role}
          onClose={() => setEditTarget(null)}
          onSaved={() => {
            setEditTarget(null);
            invalidateAll();
            toast.success('Listing updated.');
          }}
        />
      )}
      {cancelTarget && (
        <HostCancelBookingDialog
          booking={cancelTarget}
          onClose={() => setCancelTarget(null)}
          onDone={(message) => {
            setCancelTarget(null);
            toast.success(message);
          }}
        />
      )}
      {essentialsTarget && (
        <ShortletEssentialsDialog
          listing={essentialsTarget}
          onClose={() => setEssentialsTarget(null)}
        />
      )}
      {syncTarget && (
        <ShortletCalendarSyncDialog listing={syncTarget} onClose={() => setSyncTarget(null)} />
      )}
      {pricingTarget && (
        <ShortletPeakPricingDialog listing={pricingTarget} onClose={() => setPricingTarget(null)} />
      )}
      {blockTarget && (
        <BlockDatesDialog listing={blockTarget} onClose={() => setBlockTarget(null)} />
      )}
      <Dialog open={messagesOpen} onOpenChange={(o) => !o && setMessagesOpen(false)}>
        <DialogContent className="sm:max-w-3xl p-0">
          <ShortletMessagesInbox role="host" />
        </DialogContent>
      </Dialog>
      {payoutsOpen && (
        <ShortletPayoutsDialog
          onClose={() => setPayoutsOpen(false)}
          verificationHref={
            role === 'owner' ? ROUTES.OWNER_VERIFICATION : ROUTES.LANDLORD_VERIFICATION
          }
          trustProfileHref={role === 'owner' ? ROUTES.OWNER_TRUST_PROFILE : undefined}
        />
      )}
      <Dialog open={disputesOpen} onOpenChange={(o) => !o && setDisputesOpen(false)}>
        <DialogContent className="sm:max-w-3xl p-0">
          <ShortletDisputesInbox />
        </DialogContent>
      </Dialog>
      <Dialog open={claimsOpen} onOpenChange={(o) => !o && setClaimsOpen(false)}>
        <DialogContent className="sm:max-w-2xl p-0">
          <ShortletDepositClaimsInbox role="host" />
        </DialogContent>
      </Dialog>
      {analyticsOpen && <HostEarningsAnalyticsDialog onClose={() => setAnalyticsOpen(false)} />}
      {guestReviewTarget && (
        <ShortletGuestReviewDialog
          booking={guestReviewTarget}
          onClose={() => setGuestReviewTarget(null)}
          onSubmitted={() => {
            setGuestReviewTarget(null);
            queryClient.invalidateQueries({ queryKey: shortletKeys.hostBookings });
            toast.success('Guest review submitted. Thanks!');
          }}
        />
      )}
      {disputeTarget && (
        <ShortletOpenDisputeDialog
          booking={disputeTarget}
          onClose={() => setDisputeTarget(null)}
          onOpened={() => {
            setDisputeTarget(null);
            queryClient.invalidateQueries({ queryKey: shortletKeys.disputes });
            toast.success('Dispute opened: the other party has been notified.');
          }}
        />
      )}
      {claimTarget && (
        <ShortletOpenDepositClaimDialog
          booking={claimTarget}
          onClose={() => setClaimTarget(null)}
          onOpened={() => {
            setClaimTarget(null);
            queryClient.invalidateQueries({ queryKey: shortletKeys.hostBookings });
            queryClient.invalidateQueries({ queryKey: shortletKeys.depositClaims });
            toast.success('Deposit claim filed: an admin will review it.');
          }}
        />
      )}
    </div>
  );
};

// ---------- Create listing dialog ----------

function CreateListingDialog({
  role,
  onClose,
  onCreated,
}: {
  role: HostRole;
  onClose: () => void;
  onCreated: () => void;
}) {
  const queryClient = useQueryClient();
  const [propertyId, setPropertyId] = useState('');
  const [listingTitle, setListingTitle] = useState('');
  const [pricingMode, setPricingMode] = useState<'PER_NIGHT' | 'FLAT_STAY'>('PER_NIGHT');
  const [nightlyRate, setNightlyRate] = useState('');
  const [cleaningFee, setCleaningFee] = useState('');
  const [deposit, setDeposit] = useState('');
  const [minNights, setMinNights] = useState('1');
  const [weekendUpliftPct, setWeekendUpliftPct] = useState('');
  const [instantBooking, setInstantBooking] = useState(false);
  const [maxGuests, setMaxGuests] = useState('2');
  const [checkInTime, setCheckInTime] = useState('14:00');
  const [checkOutTime, setCheckOutTime] = useState('11:00');
  const [amenities, setAmenities] = useState<string[]>([]);
  const [furnished, setFurnished] = useState(true);
  const [cancellationPolicy, setCancellationPolicy] =
    useState<ShortletCancellationPolicy>('FLEXIBLE');
  const [media, setMedia] = useState<ShortletMediaState>({
    imageKeys: [],
    videoKey: '',
    videoUrl: '',
    tourUrl: '',
  });
  const toast = useToast();

  const { data: properties, isLoading } = useQuery({
    queryKey: [role, 'properties', 'for-shortlet'],
    queryFn: async () => {
      const res =
        role === 'owner'
          ? await unwrap(ownerService.listProperties({ page: 1, pageSize: 100 }))
          : await unwrap(landlordService.listProperties({ page: 1, pageSize: 100 }));
      return res.items.map((p) => {
        const anyP = p as {
          id: string;
          title?: string;
          name?: string;
          galleryImageKeys?: string[];
          galleryImageUrls?: string[];
          galleryImages?: string[];
        };
        return {
          id: anyP.id,
          title: anyP.title || anyP.name || anyP.id,
          galleryKeys: anyP.galleryImageKeys ?? [],
          galleryUrls: anyP.galleryImageUrls ?? anyP.galleryImages ?? [],
        };
      });
    },
  });
  const propertyOptions = useMemo(() => properties ?? [], [properties]);

  // Photos already on the selected property, offered as one-click suggestions.
  const mediaSuggestions = useMemo(() => {
    const selected = propertyOptions.find((p) => p.id === propertyId);
    if (!selected) return [];
    return selected.galleryKeys
      .map((key, i) => ({ key, url: selected.galleryUrls[i] ?? '' }))
      .filter((s) => s.url);
  }, [propertyOptions, propertyId]);

  const create = useMutation({
    mutationFn: (input: CreateShortletListingInput) => unwrap(shortletService.createListing(input)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: shortletKeys.hostListings });
      queryClient.invalidateQueries({ queryKey: shortletKeys.public });
      onCreated();
    },
    onError: (reason: Error) => {
      // The trust-tier gate (publishing a shortlet needs an identity-verified
      // Tier 2 account) surfaces as an inline verification notice by the
      // publish button, not a toast — so the host sees exactly what to do.
      if (reason instanceof VerificationRequiredError) return;
      toast.error(reason.message);
    },
  });

  const submit = () => {
    if (!propertyId) {
      toast.error('Choose a property to host on.');
      return;
    }
    if (!nightlyRate || Number(nightlyRate) <= 0) {
      toast.error('Enter a nightly/flat rate.');
      return;
    }
    create.mutate({
      propertyId,
      listingTitle: listingTitle.trim() || undefined,
      pricingMode,
      nightlyRate: Number(nightlyRate),
      cleaningFee: cleaningFee ? Number(cleaningFee) : undefined,
      deposit: deposit ? Number(deposit) : undefined,
      minNights: Number(minNights) || 1,
      weekendUpliftPct: weekendUpliftPct ? Number(weekendUpliftPct) : undefined,
      instantBooking,
      maxGuests: Number(maxGuests) || 2,
      checkInTime,
      checkOutTime,
      amenities,
      furnished,
      imageKeys: media.imageKeys,
      videoKey: media.videoKey || undefined,
      videoUrl: media.videoUrl || undefined,
      tourUrl: media.tourUrl || undefined,
      cancellationPolicy,
    });
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-lg p-0">
        <div className="p-5">
          <DialogTitle>New Shortlet Listing</DialogTitle>
          <DialogDescription>
            Publish a furnished short-stay listing on one of your properties.
          </DialogDescription>
        </div>
        <div className="max-h-[70vh] space-y-4 overflow-y-auto border-t border-border p-5">
          <Field label="Property">
            <Select
              value={propertyId}
              onValueChange={setPropertyId}
              placeholder={isLoading ? 'Loading properties…' : 'Select a property'}
              options={propertyOptions.map((p) => ({ value: p.id, label: p.title }))}
            />
          </Field>
          <Field label="Listing title" hint="Defaults to the property name">
            <Input
              value={listingTitle}
              onChange={(e) => setListingTitle(e.target.value)}
              placeholder="e.g. Lagos Island Penthouse"
            />
          </Field>
          <Field label="Cancellation policy" hint="How much guests get back if they cancel.">
            <Select
              value={cancellationPolicy}
              onValueChange={(v) => setCancellationPolicy(v as ShortletCancellationPolicy)}
              options={CANCELLATION_POLICIES.map((p) => ({ value: p.value, label: p.label }))}
            />
            <p className="mt-1 text-xs text-muted-foreground">
              {CANCELLATION_POLICIES.find((p) => p.value === cancellationPolicy)?.hint}
            </p>
          </Field>
          <Field label="Pricing">
            <Select
              value={pricingMode}
              onValueChange={(v) => setPricingMode(v as 'PER_NIGHT' | 'FLAT_STAY')}
              options={[
                { value: 'PER_NIGHT', label: 'Per night' },
                { value: 'FLAT_STAY', label: 'Flat rate per stay' },
              ]}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field
              label={pricingMode === 'PER_NIGHT' ? 'Nightly rate' : 'Flat rate'}
              hint="Naira (₦)"
            >
              <CurrencyInput
                prefix="₦"
                value={nightlyRate}
                onValueChange={(v) => setNightlyRate(v === 0 ? '' : String(v))}
              />
            </Field>
            <Field label="Cleaning fee" hint="Optional, Naira (₦)">
              <CurrencyInput
                prefix="₦"
                value={cleaningFee}
                onValueChange={(v) => setCleaningFee(v === 0 ? '' : String(v))}
              />
            </Field>
          </div>
          <Field
            label="Security deposit"
            hint="Refundable, returned to the guest after check-out. Naira (₦)"
          >
            <CurrencyInput
              prefix="₦"
              value={deposit}
              onValueChange={(v) => setDeposit(v === 0 ? '' : String(v))}
            />
          </Field>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Min nights">
              <NumberInput min={1} value={minNights} onValueChange={setMinNights} />
            </Field>
            <Field label="Max guests">
              <NumberInput min={1} value={maxGuests} onValueChange={setMaxGuests} />
            </Field>
            <Field label="Weekend +%" hint="Optional">
              <NumberInput
                min={0}
                max={100}
                value={weekendUpliftPct}
                onValueChange={setWeekendUpliftPct}
              />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Check-in time">
              <TimePicker value={checkInTime} onChange={setCheckInTime} />
            </Field>
            <Field label="Check-out time">
              <TimePicker value={checkOutTime} onChange={setCheckOutTime} />
            </Field>
          </div>
          <Switch
            checked={instantBooking}
            onCheckedChange={setInstantBooking}
            label="Instant booking"
            description="Guests book immediately without your approval."
            className="rounded-lg border border-border p-3"
          />
          <Switch
            checked={furnished}
            onCheckedChange={setFurnished}
            label="Furnished"
            description="This shortlet is furnished and ready to stay."
            className="rounded-lg border border-border p-3"
          />
          <Field label="Amenities">
            <div className="flex flex-wrap gap-2">
              {SHORTLET_AMENITIES.map((amenity) => {
                const selected = amenities.includes(amenity);
                return (
                  <button
                    key={amenity}
                    type="button"
                    aria-pressed={selected}
                    onClick={() =>
                      setAmenities((prev) =>
                        selected ? prev.filter((a) => a !== amenity) : [...prev, amenity]
                      )
                    }
                    className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                      selected
                        ? 'bg-accent border-primary text-primary'
                        : 'border-border text-muted-foreground hover:border-foreground/20'
                    }`}
                  >
                    {amenity}
                  </button>
                );
              })}
            </div>
          </Field>
          <div className="rounded-lg border border-border p-3">
            <ShortletMediaManager
              value={media}
              onChange={setMedia}
              suggestions={mediaSuggestions}
            />
          </div>
          {create.error ? (
            <VerificationRequiredNotice
              error={create.error}
              href={role === 'owner' ? ROUTES.OWNER_VERIFICATION : ROUTES.LANDLORD_VERIFICATION}
              verificationHref={
                role === 'owner' ? ROUTES.OWNER_VERIFICATION : ROUTES.LANDLORD_VERIFICATION
              }
              scoreHref={role === 'owner' ? ROUTES.OWNER_TRUST_PROFILE : undefined}
            />
          ) : null}
          <Button
            className="w-full"
            onClick={submit}
            isLoading={create.isPending}
            loadingText="Publishing…"
          >
            Publish listing
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ---------- Edit listing dialog ----------

function EditListingDialog({
  listing,
  role,
  onClose,
  onSaved,
}: {
  listing: ShortletListing;
  role: HostRole;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [pricingMode, setPricingMode] = useState<'PER_NIGHT' | 'FLAT_STAY'>(listing.pricingMode);
  const [nightlyRate, setNightlyRate] = useState(listing.nightlyRate?.toString() ?? '');
  const [cleaningFee, setCleaningFee] = useState(listing.cleaningFee?.toString() ?? '');
  const [deposit, setDeposit] = useState(listing.deposit?.toString() ?? '');
  const [minNights, setMinNights] = useState(listing.minNights.toString());
  const [weekendUpliftPct, setWeekendUpliftPct] = useState(
    listing.weekendUpliftPct?.toString() ?? ''
  );
  const [instantBooking, setInstantBooking] = useState(listing.instantBooking);
  const [maxGuests, setMaxGuests] = useState(listing.maxGuests.toString());
  const [checkInTime, setCheckInTime] = useState(listing.checkInTime ?? '14:00');
  const [checkOutTime, setCheckOutTime] = useState(listing.checkOutTime ?? '11:00');
  const [cancellationPolicy, setCancellationPolicy] = useState<ShortletCancellationPolicy>(
    listing.cancellationPolicy ?? 'FLEXIBLE'
  );
  const [media, setMedia] = useState<ShortletMediaState>({
    imageKeys: listing.imageKeys ?? [],
    videoKey: listing.videoKey ?? '',
    videoUrl: listing.videoKey ? '' : (listing.videoUrl ?? ''),
    tourUrl: listing.tourUrl ?? '',
  });
  const toast = useToast();

  // Photos already on the underlying property, offered as one-click suggestions.
  const { data: properties } = useQuery({
    queryKey: [role, 'properties', 'for-shortlet'],
    queryFn: async () => {
      const res =
        role === 'owner'
          ? await unwrap(ownerService.listProperties({ page: 1, pageSize: 100 }))
          : await unwrap(landlordService.listProperties({ page: 1, pageSize: 100 }));
      return res.items.map((p) => {
        const anyP = p as {
          id: string;
          title?: string;
          name?: string;
          galleryImageKeys?: string[];
          galleryImageUrls?: string[];
          galleryImages?: string[];
        };
        return {
          id: anyP.id,
          title: anyP.title || anyP.name || anyP.id,
          galleryKeys: anyP.galleryImageKeys ?? [],
          galleryUrls: anyP.galleryImageUrls ?? anyP.galleryImages ?? [],
        };
      });
    },
  });
  const mediaSuggestions = useMemo(() => {
    const selected = (properties ?? []).find((p) => p.id === listing.propertyId);
    if (!selected) return [];
    return selected.galleryKeys
      .map((key, i) => ({ key, url: selected.galleryUrls[i] ?? '' }))
      .filter((s) => s.url);
  }, [properties, listing.propertyId]);

  const save = useMutation({
    mutationFn: () =>
      unwrap(
        shortletService.updateListing(listing.id, {
          pricingMode,
          nightlyRate: nightlyRate ? Number(nightlyRate) : undefined,
          cleaningFee: cleaningFee ? Number(cleaningFee) : undefined,
          deposit: deposit ? Number(deposit) : undefined,
          minNights: Number(minNights) || 1,
          weekendUpliftPct: weekendUpliftPct ? Number(weekendUpliftPct) : undefined,
          instantBooking,
          maxGuests: Number(maxGuests) || 2,
          checkInTime,
          checkOutTime,
          imageKeys: media.imageKeys,
          videoKey: media.videoKey || undefined,
          videoUrl: media.videoUrl || undefined,
          tourUrl: media.tourUrl || undefined,
          cancellationPolicy,
        })
      ),
    onSuccess: () => onSaved(),
    onError: (reason: Error) => toast.error(reason.message),
  });

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-lg p-0">
        <div className="p-5">
          <DialogTitle>Edit {listing.title}</DialogTitle>
          <DialogDescription>Update pricing and availability rules.</DialogDescription>
        </div>
        <div className="max-h-[70vh] space-y-4 overflow-y-auto border-t border-border p-5">
          <Field label="Cancellation policy" hint="How much guests get back if they cancel.">
            <Select
              value={cancellationPolicy}
              onValueChange={(v) => setCancellationPolicy(v as ShortletCancellationPolicy)}
              options={CANCELLATION_POLICIES.map((p) => ({ value: p.value, label: p.label }))}
            />
            <p className="mt-1 text-xs text-muted-foreground">
              {CANCELLATION_POLICIES.find((p) => p.value === cancellationPolicy)?.hint}
            </p>
          </Field>
          <Field label="Pricing">
            <Select
              value={pricingMode}
              onValueChange={(v) => setPricingMode(v as 'PER_NIGHT' | 'FLAT_STAY')}
              options={[
                { value: 'PER_NIGHT', label: 'Per night' },
                { value: 'FLAT_STAY', label: 'Flat rate per stay' },
              ]}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field
              label={pricingMode === 'PER_NIGHT' ? 'Nightly rate' : 'Flat rate'}
              hint="Naira (₦)"
            >
              <CurrencyInput
                prefix="₦"
                value={nightlyRate}
                onValueChange={(v) => setNightlyRate(v === 0 ? '' : String(v))}
              />
            </Field>
            <Field label="Cleaning fee" hint="Naira (₦)">
              <CurrencyInput
                prefix="₦"
                value={cleaningFee}
                onValueChange={(v) => setCleaningFee(v === 0 ? '' : String(v))}
              />
            </Field>
          </div>
          <Field
            label="Security deposit"
            hint="Refundable, returned to the guest after check-out. Naira (₦)"
          >
            <CurrencyInput
              prefix="₦"
              value={deposit}
              onValueChange={(v) => setDeposit(v === 0 ? '' : String(v))}
            />
          </Field>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Min nights">
              <NumberInput min={1} value={minNights} onValueChange={setMinNights} />
            </Field>
            <Field label="Max guests">
              <NumberInput min={1} value={maxGuests} onValueChange={setMaxGuests} />
            </Field>
            <Field label="Weekend +%">
              <NumberInput
                min={0}
                max={100}
                value={weekendUpliftPct}
                onValueChange={setWeekendUpliftPct}
              />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Check-in time">
              <TimePicker value={checkInTime} onChange={setCheckInTime} />
            </Field>
            <Field label="Check-out time">
              <TimePicker value={checkOutTime} onChange={setCheckOutTime} />
            </Field>
          </div>
          <Switch
            checked={instantBooking}
            onCheckedChange={setInstantBooking}
            label="Instant booking"
            description="Guests book immediately without your approval."
            className="rounded-lg border border-border p-3"
          />
          <div className="rounded-lg border border-border p-3">
            <ShortletMediaManager
              value={media}
              onChange={setMedia}
              initialImages={listing.images ?? []}
              initialVideoPreview={listing.videoKey ? listing.videoUrl : undefined}
              suggestions={mediaSuggestions}
            />
          </div>
          <Button
            className="w-full"
            onClick={() => save.mutate()}
            isLoading={save.isPending}
            loadingText="Saving…"
          >
            Save changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ---------- Block dates dialog ----------

/** One line naming the peak-season rules in force, or null when there are none. */
function peakSummary(l: ShortletListing): string | null {
  const parts: string[] = [];
  const seasons = l.seasons ?? [];
  if (seasons.length > 0) {
    parts.push(seasons.length === 1 ? `Season: ${seasons[0].name}` : `${seasons.length} seasons`);
  }
  if (l.weeklyDiscountPct) parts.push(`${l.weeklyDiscountPct}% off 7+ nights`);
  if (l.monthlyDiscountPct) parts.push(`${l.monthlyDiscountPct}% off 28+ nights`);
  if (l.lastMinuteDiscountPct) parts.push(`${l.lastMinuteDiscountPct}% last-minute`);
  if (l.advanceNoticeDays) parts.push(`${l.advanceNoticeDays}d notice`);
  if (l.prepDays) parts.push(`${l.prepDays}d prep`);
  return parts.length > 0 ? parts.join(' · ') : null;
}

function BlockDatesDialog({ listing, onClose }: { listing: ShortletListing; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const toast = useToast();

  const { data: blocked } = useQuery({
    queryKey: shortletKeys.hostBlockedDates(listing.id),
    queryFn: () => unwrap(shortletService.listBlockedDates(listing.id)),
  });

  const addBlock = useMutation({
    mutationFn: () =>
      unwrap(
        shortletService.blockDates(listing.id, {
          startDate,
          endDate,
          reason: reason.trim() || undefined,
        })
      ),
    onSuccess: () => {
      setStartDate('');
      setEndDate('');
      setReason('');
      queryClient.invalidateQueries({ queryKey: shortletKeys.hostBlockedDates(listing.id) });
      queryClient.invalidateQueries({ queryKey: shortletKeys.public });
      toast.success('Dates blocked.');
    },
    onError: (reason: Error) => toast.error(reason.message),
  });

  const removeBlock = useMutation({
    mutationFn: (id: string) => unwrap(shortletService.unblockDates(id)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: shortletKeys.hostBlockedDates(listing.id) });
      toast.success('Blocked range removed.');
    },
    onError: (reason: Error) => toast.error(reason.message),
  });

  const submit = () => {
    if (!startDate || !endDate) {
      toast.error('Pick both dates.');
      return;
    }
    addBlock.mutate();
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md p-0">
        <div className="p-5">
          <DialogTitle>Block dates · {listing.title}</DialogTitle>
          <DialogDescription>Unavailable check-in dates for this listing.</DialogDescription>
        </div>
        <div className="max-h-[70vh] space-y-4 overflow-y-auto border-t border-border p-5">
          <div className="grid grid-cols-2 gap-3">
            <Field label="From">
              <DatePicker
                value={startDate}
                onChange={setStartDate}
                min={TODAY}
                placeholder="Select start"
              />
            </Field>
            <Field label="To (exclusive)">
              <DatePicker
                value={endDate}
                onChange={setEndDate}
                min={startDate || TODAY}
                placeholder="Select end"
              />
            </Field>
          </div>
          <Field label="Reason" hint="Optional">
            <Input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Maintenance"
            />
          </Field>
          <Button
            className="w-full"
            onClick={submit}
            isLoading={addBlock.isPending}
            loadingText="Blocking…"
          >
            Block dates
          </Button>

          {(blocked?.length ?? 0) > 0 && (
            <div className="space-y-2 border-t border-border pt-3">
              <p className="text-sm font-medium">Current blocks</p>
              {(blocked ?? []).map((b: BlockedDateRange) => (
                <div
                  key={b.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2 text-sm"
                >
                  <span className="min-w-0">
                    {formatDate(b.startDate, 'short')} → {formatDate(b.endDate, 'short')}
                    {b.reason && !b.importedFrom && !b.lockedByCancellation ? ` · ${b.reason}` : ''}
                  </span>
                  {b.importedFrom ? (
                    <Badge variant="neutral">From {b.importedFrom}</Badge>
                  ) : b.lockedByCancellation ? (
                    <Badge variant="neutral">Closed: you cancelled a stay</Badge>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeBlock.mutate(b.id)}
                      isLoading={removeBlock.isPending && removeBlock.variables === b.id}
                      disabled={removeBlock.isPending}
                    >
                      Remove
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
