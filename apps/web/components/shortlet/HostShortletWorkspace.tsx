'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Badge,
  Button,
  CurrencyInput,
  DatePicker,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  EmptyState,
  Field,
  Input,
  Pagination,
  Select,
  Skeleton,
  Switch,
  TimePicker,
  Toast,
  type BadgeVariant,
  type ToastVariant,
} from '@getrentos/ui';
import { CalendarOff, Plus, Zap } from 'lucide-react';
import { unwrap } from '@/lib/apiHelpers';
import { ownerService } from '@/services/ownerService';
import { landlordService } from '@/services/landlordService';
import { shortletService } from '@/services/shortletService';
import { shortletKeys } from '@/lib/queryKeys';
import { formatCurrency, formatDate } from '@/lib/format';
import type {
  BlockedDateRange,
  CreateShortletListingInput,
  ShortletBookingStatus,
  ShortletListing,
} from '@/types/shortlet';

const PAGE_SIZE = 10;
type Tab = 'listings' | 'bookings';
type HostRole = 'owner' | 'landlord';
const TODAY = new Date().toISOString().slice(0, 10);

const SHORTLET_AMENITIES = [
  'WiFi',
  'Parking',
  'Swimming Pool',
  'Security',
  '24/7 Power',
  'Gym',
  'Elevator',
  'Air Conditioning',
  'Kitchen',
  'Washer',
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
  const [toast, setToast] = useState<{ message: string; variant: ToastVariant } | null>(null);

  const { data: listingsData, isLoading: listingsLoading } = useQuery({
    queryKey: [...shortletKeys.hostListings, { page: listingsPage, pageSize: PAGE_SIZE }],
    queryFn: () => unwrap(shortletService.myListings({ page: listingsPage, pageSize: PAGE_SIZE })),
  });
  const listings = listingsData?.items ?? [];

  const { data: bookingsData, isLoading: bookingsLoading } = useQuery({
    queryKey: [...shortletKeys.hostBookings, { page: bookingsPage, pageSize: PAGE_SIZE }],
    queryFn: () =>
      unwrap(shortletService.hostBookings({ page: bookingsPage, pageSize: PAGE_SIZE })),
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
      setToast({ message: 'Listing updated.', variant: 'success' });
    },
    onError: (reason: Error) => setToast({ message: reason.message, variant: 'error' }),
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
      setToast({
        message: action === 'approve' ? 'Booking approved.' : 'Booking declined.',
        variant: 'success',
      });
    },
    onError: (reason: Error) => setToast({ message: reason.message, variant: 'error' }),
  });

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Shortlet Management</h1>
          <p className="mt-1 text-muted-foreground">
            Publish short-stay listings and manage bookings.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="mr-1.5 h-4 w-4" /> New listing
        </Button>
      </div>

      <div className="mb-6 inline-flex rounded-lg border border-border bg-card p-1 text-sm">
        {(['listings', 'bookings'] as Tab[]).map((t) => (
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
            {t === 'listings' ? 'My Listings' : `Booking Requests (${bookingsData?.total ?? 0})`}
          </button>
        ))}
      </div>

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
              <div key={l.id} className="rounded-xl border border-border bg-card p-4 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">{l.title}</h3>
                      {l.status !== 'PUBLISHED' && (
                        <Badge variant={l.status === 'PAUSED' ? 'warning' : 'neutral'}>
                          {l.status}
                        </Badge>
                      )}
                      {l.instantBooking && (
                        <Badge>
                          <Zap className="mr-1 h-3 w-3" /> Instant
                        </Badge>
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
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {l.status !== 'CLOSED' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setStatus.mutate({
                            id: l.id,
                            status: l.status === 'PUBLISHED' ? 'PAUSED' : 'PUBLISHED',
                          })
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
                        disabled={setStatus.isPending}
                      >
                        Close
                      </Button>
                    )}
                    <Button variant="outline" size="sm" onClick={() => setEditTarget(l)}>
                      Edit
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setBlockTarget(l)}>
                      <CalendarOff className="mr-1.5 h-4 w-4" /> Block dates
                    </Button>
                  </div>
                </div>
              </div>
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
            <div key={b.id} className="rounded-xl border border-border bg-card p-4 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="font-medium">{b.propertyTitle}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {b.guestName ?? 'Guest'} · {b.guestCount} guest{b.guestCount > 1 ? 's' : ''} ·{' '}
                    {formatDate(b.checkIn, 'long')} → {formatDate(b.checkOut, 'long')} · {b.nights}{' '}
                    night{b.nights > 1 ? 's' : ''}
                  </p>
                  {b.notes && <p className="mt-1 text-sm text-muted-foreground">“{b.notes}”</p>}
                </div>
                <div className="text-right">
                  <Badge variant={STATUS_VARIANT[b.status]}>{b.status}</Badge>
                  <p className="mt-1 font-semibold">{formatCurrency(b.total)}</p>
                  {b.paymentReference && (
                    <p className="text-xs text-muted-foreground">Ref {b.paymentReference}</p>
                  )}
                </div>
              </div>
              {b.status === 'REQUESTED' && (
                <div className="mt-3 flex justify-end gap-2 border-t border-border pt-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => decide.mutate({ id: b.id, action: 'decline' })}
                    disabled={decide.isPending}
                  >
                    Decline
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => decide.mutate({ id: b.id, action: 'approve' })}
                    disabled={decide.isPending}
                  >
                    Approve
                  </Button>
                </div>
              )}
            </div>
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
            setToast({ message: 'Shortlet listing published.', variant: 'success' });
          }}
        />
      )}
      {editTarget && (
        <EditListingDialog
          listing={editTarget}
          onClose={() => setEditTarget(null)}
          onSaved={() => {
            setEditTarget(null);
            invalidateAll();
            setToast({ message: 'Listing updated.', variant: 'success' });
          }}
        />
      )}
      {blockTarget && (
        <BlockDatesDialog listing={blockTarget} onClose={() => setBlockTarget(null)} />
      )}

      {toast && (
        <Toast message={toast.message} variant={toast.variant} onClose={() => setToast(null)} />
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
  const [minNights, setMinNights] = useState('1');
  const [weekendUpliftPct, setWeekendUpliftPct] = useState('');
  const [instantBooking, setInstantBooking] = useState(false);
  const [maxGuests, setMaxGuests] = useState('2');
  const [checkInTime, setCheckInTime] = useState('14:00');
  const [checkOutTime, setCheckOutTime] = useState('11:00');
  const [amenities, setAmenities] = useState<string[]>([]);
  const [furnished, setFurnished] = useState(true);
  const [toast, setToast] = useState<{ message: string; variant: ToastVariant } | null>(null);

  const { data: properties, isLoading } = useQuery({
    queryKey: [role, 'properties', 'for-shortlet'],
    queryFn: async () => {
      const res =
        role === 'owner'
          ? await unwrap(ownerService.listProperties({ page: 1, pageSize: 100 }))
          : await unwrap(landlordService.listProperties({ page: 1, pageSize: 100 }));
      return res.items.map((p) => {
        const anyP = p as { id: string; title?: string; name?: string };
        return { id: anyP.id, title: anyP.title || anyP.name || anyP.id };
      });
    },
  });
  const propertyOptions = useMemo(() => properties ?? [], [properties]);

  const create = useMutation({
    mutationFn: (input: CreateShortletListingInput) => unwrap(shortletService.createListing(input)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: shortletKeys.hostListings });
      queryClient.invalidateQueries({ queryKey: shortletKeys.public });
      onCreated();
    },
    onError: (reason: Error) => setToast({ message: reason.message, variant: 'error' }),
  });

  const submit = () => {
    if (!propertyId) {
      setToast({ message: 'Choose a property to host on.', variant: 'error' });
      return;
    }
    if (!nightlyRate || Number(nightlyRate) <= 0) {
      setToast({ message: 'Enter a nightly/flat rate.', variant: 'error' });
      return;
    }
    create.mutate({
      propertyId,
      listingTitle: listingTitle.trim() || undefined,
      pricingMode,
      nightlyRate: Number(nightlyRate),
      cleaningFee: cleaningFee ? Number(cleaningFee) : undefined,
      minNights: Number(minNights) || 1,
      weekendUpliftPct: weekendUpliftPct ? Number(weekendUpliftPct) : undefined,
      instantBooking,
      maxGuests: Number(maxGuests) || 2,
      checkInTime,
      checkOutTime,
      amenities,
      furnished,
    });
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-lg">
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
          <div className="grid grid-cols-3 gap-3">
            <Field label="Min nights">
              <Input
                type="number"
                min={1}
                value={minNights}
                onChange={(e) => setMinNights(e.target.value)}
              />
            </Field>
            <Field label="Max guests">
              <Input
                type="number"
                min={1}
                value={maxGuests}
                onChange={(e) => setMaxGuests(e.target.value)}
              />
            </Field>
            <Field label="Weekend +%" hint="Optional">
              <Input
                type="number"
                min={0}
                max={100}
                value={weekendUpliftPct}
                onChange={(e) => setWeekendUpliftPct(e.target.value)}
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
          <div className="flex items-center justify-between rounded-lg border border-border p-3">
            <div>
              <p className="text-sm font-medium">Instant booking</p>
              <p className="text-xs text-muted-foreground">
                Guests book immediately without your approval.
              </p>
            </div>
            <Switch checked={instantBooking} onCheckedChange={setInstantBooking} />
          </div>
          <div className="flex items-center justify-between rounded-lg border border-border p-3">
            <div>
              <p className="text-sm font-medium">Furnished</p>
              <p className="text-xs text-muted-foreground">
                This shortlet is furnished and ready to stay.
              </p>
            </div>
            <Switch checked={furnished} onCheckedChange={setFurnished} />
          </div>
          <Field label="Amenities">
            <div className="flex flex-wrap gap-2">
              {SHORTLET_AMENITIES.map((amenity) => {
                const selected = amenities.includes(amenity);
                return (
                  <button
                    key={amenity}
                    type="button"
                    onClick={() =>
                      setAmenities((prev) =>
                        selected ? prev.filter((a) => a !== amenity) : [...prev, amenity]
                      )
                    }
                    className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                      selected
                        ? 'bg-accent border-primary text-primary'
                        : 'border-border text-muted-foreground hover:border-gray-300'
                    }`}
                  >
                    {amenity}
                  </button>
                );
              })}
            </div>
          </Field>
          <Button className="w-full" onClick={submit} disabled={create.isPending}>
            {create.isPending ? 'Publishing…' : 'Publish listing'}
          </Button>
        </div>
        {toast && (
          <Toast message={toast.message} variant={toast.variant} onClose={() => setToast(null)} />
        )}
      </DialogContent>
    </Dialog>
  );
}

// ---------- Edit listing dialog ----------

function EditListingDialog({
  listing,
  onClose,
  onSaved,
}: {
  listing: ShortletListing;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [pricingMode, setPricingMode] = useState<'PER_NIGHT' | 'FLAT_STAY'>(listing.pricingMode);
  const [nightlyRate, setNightlyRate] = useState(listing.nightlyRate?.toString() ?? '');
  const [cleaningFee, setCleaningFee] = useState(listing.cleaningFee?.toString() ?? '');
  const [minNights, setMinNights] = useState(listing.minNights.toString());
  const [weekendUpliftPct, setWeekendUpliftPct] = useState(
    listing.weekendUpliftPct?.toString() ?? ''
  );
  const [instantBooking, setInstantBooking] = useState(listing.instantBooking);
  const [maxGuests, setMaxGuests] = useState(listing.maxGuests.toString());
  const [checkInTime, setCheckInTime] = useState(listing.checkInTime ?? '14:00');
  const [checkOutTime, setCheckOutTime] = useState(listing.checkOutTime ?? '11:00');
  const [toast, setToast] = useState<{ message: string; variant: ToastVariant } | null>(null);

  const save = useMutation({
    mutationFn: () =>
      unwrap(
        shortletService.updateListing(listing.id, {
          pricingMode,
          nightlyRate: nightlyRate ? Number(nightlyRate) : undefined,
          cleaningFee: cleaningFee ? Number(cleaningFee) : undefined,
          minNights: Number(minNights) || 1,
          weekendUpliftPct: weekendUpliftPct ? Number(weekendUpliftPct) : undefined,
          instantBooking,
          maxGuests: Number(maxGuests) || 2,
          checkInTime,
          checkOutTime,
        })
      ),
    onSuccess: () => onSaved(),
    onError: (reason: Error) => setToast({ message: reason.message, variant: 'error' }),
  });

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <div className="p-5">
          <DialogTitle>Edit {listing.title}</DialogTitle>
          <DialogDescription>Update pricing and availability rules.</DialogDescription>
        </div>
        <div className="max-h-[70vh] space-y-4 overflow-y-auto border-t border-border p-5">
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
          <div className="grid grid-cols-3 gap-3">
            <Field label="Min nights">
              <Input
                type="number"
                min={1}
                value={minNights}
                onChange={(e) => setMinNights(e.target.value)}
              />
            </Field>
            <Field label="Max guests">
              <Input
                type="number"
                min={1}
                value={maxGuests}
                onChange={(e) => setMaxGuests(e.target.value)}
              />
            </Field>
            <Field label="Weekend +%">
              <Input
                type="number"
                min={0}
                max={100}
                value={weekendUpliftPct}
                onChange={(e) => setWeekendUpliftPct(e.target.value)}
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
          <div className="flex items-center justify-between rounded-lg border border-border p-3">
            <div>
              <p className="text-sm font-medium">Instant booking</p>
              <p className="text-xs text-muted-foreground">
                Guests book immediately without your approval.
              </p>
            </div>
            <Switch checked={instantBooking} onCheckedChange={setInstantBooking} />
          </div>
          <Button className="w-full" onClick={() => save.mutate()} disabled={save.isPending}>
            {save.isPending ? 'Saving…' : 'Save changes'}
          </Button>
        </div>
        {toast && (
          <Toast message={toast.message} variant={toast.variant} onClose={() => setToast(null)} />
        )}
      </DialogContent>
    </Dialog>
  );
}

// ---------- Block dates dialog ----------

function BlockDatesDialog({ listing, onClose }: { listing: ShortletListing; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [toast, setToast] = useState<{ message: string; variant: ToastVariant } | null>(null);

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
      setToast({ message: 'Dates blocked.', variant: 'success' });
    },
    onError: (reason: Error) => setToast({ message: reason.message, variant: 'error' }),
  });

  const removeBlock = useMutation({
    mutationFn: (id: string) => unwrap(shortletService.unblockDates(id)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: shortletKeys.hostBlockedDates(listing.id) });
      setToast({ message: 'Blocked range removed.', variant: 'success' });
    },
    onError: (reason: Error) => setToast({ message: reason.message, variant: 'error' }),
  });

  const submit = () => {
    if (!startDate || !endDate) {
      setToast({ message: 'Pick both dates.', variant: 'error' });
      return;
    }
    addBlock.mutate();
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
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
          <Button className="w-full" onClick={submit} disabled={addBlock.isPending}>
            {addBlock.isPending ? 'Blocking…' : 'Block dates'}
          </Button>

          {(blocked?.length ?? 0) > 0 && (
            <div className="space-y-2 border-t border-border pt-3">
              <p className="text-sm font-medium">Current blocks</p>
              {(blocked ?? []).map((b: BlockedDateRange) => (
                <div
                  key={b.id}
                  className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm"
                >
                  <span>
                    {formatDate(b.startDate, 'short')} → {formatDate(b.endDate, 'short')}
                    {b.reason ? ` · ${b.reason}` : ''}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeBlock.mutate(b.id)}
                    disabled={removeBlock.isPending}
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
        {toast && (
          <Toast message={toast.message} variant={toast.variant} onClose={() => setToast(null)} />
        )}
      </DialogContent>
    </Dialog>
  );
}
