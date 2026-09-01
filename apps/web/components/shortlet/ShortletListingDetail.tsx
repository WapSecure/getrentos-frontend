'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getAuthToken } from '@getrentos/shared';
import { Badge, Button, EmptyState, Skeleton, Toast, type ToastVariant } from '@getrentos/ui';
import {
  Armchair,
  BedDouble,
  CalendarCheck,
  Clock,
  Heart,
  Image as ImageIcon,
  Map as MapIcon,
  MapPin,
  MessageSquare,
  PlayCircle,
  Ruler,
  ShieldCheck,
  Star,
  Users,
  Video,
  Zap,
} from 'lucide-react';
import { unwrap } from '@/lib/apiHelpers';
import { shortletService } from '@/services/shortletService';
import { shortletKeys } from '@/lib/queryKeys';
import { ROUTES } from '@/lib/constants/auth';
import { useShortletWishlist } from '@/hooks/useShortletWishlist';
import { formatCurrency, formatDate } from '@/lib/format';
import { ShortletBookingDialog } from './ShortletBookingDialog';
import { ShortletMessageHostDialog } from './ShortletMessageHostDialog';
import type {
  ShortletBooking,
  ShortletCancellationPolicy,
  ShortletListing,
} from '@/types/shortlet';

type MediaTab = 'photos' | 'video' | 'tour';

const CANCELLATION_RULE: Record<ShortletCancellationPolicy, string> = {
  FLEXIBLE: 'Full refund up to 1 day before check-in.',
  MODERATE: 'Full refund 5+ days before; 50% up to 1 day before check-in.',
  STRICT: 'Full refund 7+ days before; 50% from 3 days; no refund within 3 days.',
};

export function ShortletListingDetail({
  listingId,
  initialListing,
}: {
  listingId: string;
  /** Server-rendered listing (ISR) used to hydrate the query instantly. */
  initialListing?: ShortletListing;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isSignedIn] = useState(() => Boolean(getAuthToken()));
  const wishlist = useShortletWishlist();
  const [bookingOpen, setBookingOpen] = useState(false);
  const [createdBooking, setCreatedBooking] = useState<ShortletBooking | null>(null);
  const [messageOpen, setMessageOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; variant: ToastVariant } | null>(null);
  const [activeImage, setActiveImage] = useState(0);
  const [mediaTab, setMediaTab] = useState<MediaTab>('photos');

  // Record one view/impression per page visit (fire-and-forget).
  const viewRecorded = useRef(false);
  useEffect(() => {
    if (viewRecorded.current || !listingId) return;
    viewRecorded.current = true;
    shortletService.recordView(listingId).catch(() => undefined);
  }, [listingId]);

  const { data: listing, isLoading } = useQuery({
    queryKey: shortletKeys.listing(listingId),
    queryFn: () => unwrap(shortletService.getListing(listingId)),
    // Hydrate from the ISR-rendered payload; avoid an immediate refetch.
    initialData: initialListing,
    staleTime: 5 * 60_000,
  });

  const { data: reviewsData, isLoading: reviewsLoading } = useQuery({
    queryKey: [...shortletKeys.listing(listingId), 'reviews'],
    queryFn: () => unwrap(shortletService.reviews(listingId, 1, 50)),
    enabled: Boolean(listing),
  });
  const reviews = reviewsData?.items ?? [];

  const book = useMutation({
    mutationFn: (input: { checkIn: string; checkOut: string; guestCount?: number }) =>
      unwrap(
        shortletService.book(listingId, {
          checkIn: input.checkIn,
          checkOut: input.checkOut,
          guestCount: input.guestCount,
        })
      ),
    onSuccess: (booking: ShortletBooking) => {
      queryClient.invalidateQueries({ queryKey: shortletKeys.guestBookings });
      if (booking.status === 'CONFIRMED') {
        setCreatedBooking(booking);
        return;
      }
      setBookingOpen(false);
      setToast({
        message: 'Booking request sent — the host will confirm shortly.',
        variant: 'success',
      });
    },
    onError: (reason: Error) => setToast({ message: reason.message, variant: 'error' }),
  });

  const pay = useMutation({
    mutationFn: (bookingId: string) => unwrap(shortletService.payBooking(bookingId)),
    onSuccess: (res) => {
      if (res.authorizationUrl) {
        window.location.href = res.authorizationUrl;
        return;
      }
      setBookingOpen(false);
      setCreatedBooking(null);
      queryClient.invalidateQueries({ queryKey: shortletKeys.guestBookings });
      setToast({ message: 'Payment received — your stay is confirmed.', variant: 'success' });
    },
    onError: (reason: Error) => setToast({ message: reason.message, variant: 'error' }),
  });

  const openBooking = () => {
    if (!isSignedIn) {
      router.push(ROUTES.LOGIN);
      return;
    }
    setBookingOpen(true);
  };

  // `isError` may be true after a failed background refresh even though the
  // ISR-rendered `listing` is still present — only treat it as missing when
  // there is genuinely no listing to show.
  if (isLoading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8">
        <Skeleton className="h-96 w-full rounded-xl" />
        <div className="mt-6 grid gap-6 md:grid-cols-3">
          <Skeleton className="h-64 rounded-xl md:col-span-2" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-16">
        <EmptyState
          icon={BedDouble}
          title="Listing not found"
          description="This shortlet may have been removed or is unavailable."
        />
      </div>
    );
  }

  const hasVideo = Boolean(listing.videoUrl);
  const hasTour = Boolean(listing.tourUrl);
  const tab: MediaTab =
    mediaTab === 'video' && !hasVideo
      ? 'photos'
      : mediaTab === 'tour' && !hasTour
        ? 'photos'
        : mediaTab;
  const showTabs = hasVideo || hasTour;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <button
        onClick={() => router.back()}
        className="mb-4 text-sm text-muted-foreground hover:text-foreground"
      >
        ← Back
      </button>

      {/* Media hero */}
      <div className="overflow-hidden rounded-xl border border-border bg-secondary/40">
        {showTabs && (
          <div className="flex gap-1 border-b border-border bg-card p-2">
            <button
              type="button"
              onClick={() => setMediaTab('photos')}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                tab === 'photos'
                  ? 'bg-secondary text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <ImageIcon className="h-4 w-4" /> Photos
            </button>
            {hasVideo && (
              <button
                type="button"
                onClick={() => setMediaTab('video')}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                  tab === 'video'
                    ? 'bg-secondary text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Video className="h-4 w-4" /> Video
              </button>
            )}
            {hasTour && (
              <button
                type="button"
                onClick={() => setMediaTab('tour')}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                  tab === 'tour'
                    ? 'bg-secondary text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <MapIcon className="h-4 w-4" /> 360 Tour
              </button>
            )}
          </div>
        )}

        {tab === 'video' && listing.videoUrl ? (
          <video src={listing.videoUrl} controls className="aspect-video w-full bg-black" />
        ) : tab === 'tour' && listing.tourUrl ? (
          <iframe
            src={listing.tourUrl}
            title="Virtual tour"
            className="aspect-video w-full"
            allowFullScreen
            loading="lazy"
          />
        ) : listing.images.length > 0 ? (
          <>
            <div className="relative aspect-[16/9] w-full bg-secondary/50">
              <Image
                src={listing.images[activeImage]}
                alt={listing.title}
                fill
                sizes="(max-width: 768px) 100vw, 66vw"
                className="object-cover"
                priority={activeImage === 0}
              />
              <div className="absolute left-3 top-3 flex gap-2">
                {listing.instantBooking && (
                  <Badge className="bg-primary text-primary-foreground">
                    <Zap className="mr-1 h-3 w-3" /> Instant
                  </Badge>
                )}
                {listing.isVerified && <Badge variant="info">Verified host</Badge>}
              </div>
              {listing.images.length > 1 && (
                <div className="absolute bottom-3 right-3 rounded-full bg-black/60 px-2.5 py-1 text-xs text-white">
                  {activeImage + 1} / {listing.images.length}
                </div>
              )}
            </div>
            {listing.images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto p-2">
                {listing.images.map((url, i) => (
                  <button
                    key={url}
                    type="button"
                    onClick={() => setActiveImage(i)}
                    className={`relative h-16 w-24 shrink-0 overflow-hidden rounded-lg border-2 transition ${
                      i === activeImage
                        ? 'border-primary'
                        : 'border-transparent opacity-70 hover:opacity-100'
                    }`}
                  >
                    <Image
                      src={url}
                      alt=""
                      fill
                      sizes="96px"
                      className="object-cover"
                      loading="lazy"
                    />
                  </button>
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="flex aspect-[16/9] w-full items-center justify-center bg-secondary/50">
            <BedDouble className="h-16 w-16 text-muted-foreground" />
          </div>
        )}
      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-3">
        {/* Left column */}
        <div className="space-y-6 md:col-span-2">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{listing.title}</h1>
            <p className="mt-1 flex items-center gap-1 text-muted-foreground">
              <MapPin className="h-4 w-4" />{' '}
              {listing.address || `${listing.city}, ${listing.state}`}
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Badge variant="success">{listing.hostName}</Badge>
              {listing.hostVerified && <Badge variant="info">Verified host</Badge>}
              {listing.furnished && (
                <Badge variant="neutral">
                  <Armchair className="mr-1 h-3 w-3" /> Furnished
                </Badge>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-lg border border-border p-3 text-center">
              <Users className="mx-auto h-5 w-5 text-muted-foreground" />
              <p className="mt-1 text-sm font-medium">{listing.maxGuests} guests</p>
            </div>
            {listing.bedrooms != null && (
              <div className="rounded-lg border border-border p-3 text-center">
                <BedDouble className="mx-auto h-5 w-5 text-muted-foreground" />
                <p className="mt-1 text-sm font-medium">{listing.bedrooms} bed</p>
              </div>
            )}
            {listing.bathrooms != null && (
              <div className="rounded-lg border border-border p-3 text-center">
                <Users className="mx-auto h-5 w-5 text-muted-foreground" />
                <p className="mt-1 text-sm font-medium">{listing.bathrooms} bath</p>
              </div>
            )}
            {listing.propertySize != null && (
              <div className="rounded-lg border border-border p-3 text-center">
                <Ruler className="mx-auto h-5 w-5 text-muted-foreground" />
                <p className="mt-1 text-sm font-medium">{listing.propertySize} m²</p>
              </div>
            )}
          </div>

          {listing.description && (
            <section>
              <h2 className="mb-2 text-lg font-semibold">About this stay</h2>
              <p className="whitespace-pre-line text-muted-foreground">{listing.description}</p>
            </section>
          )}

          {listing.amenities.length > 0 && (
            <section>
              <h2 className="mb-2 text-lg font-semibold">Amenities</h2>
              <div className="flex flex-wrap gap-2">
                {listing.amenities.map((a) => (
                  <Badge key={a} variant="neutral">
                    {a}
                  </Badge>
                ))}
              </div>
            </section>
          )}

          <section>
            <h2 className="mb-2 text-lg font-semibold">Good to know</h2>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="h-4 w-4" /> Check-in from {listing.checkInTime ?? '14:00'}
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="h-4 w-4" /> Check-out by {listing.checkOutTime ?? '11:00'}
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <CalendarCheck className="h-4 w-4" /> Min {listing.minNights} night
                {listing.minNights > 1 ? 's' : ''}
              </div>
              {listing.maxNights != null && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <CalendarCheck className="h-4 w-4" /> Max {listing.maxNights} nights
                </div>
              )}
              <div className="flex items-center gap-2 text-muted-foreground">
                <CalendarCheck className="h-4 w-4" />
                <span className="capitalize">
                  {listing.cancellationPolicy.toLowerCase()} cancellation
                </span>
                — {CANCELLATION_RULE[listing.cancellationPolicy]}
              </div>
              {listing.deposit != null && listing.deposit > 0 && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <ShieldCheck className="h-4 w-4" />
                  {formatCurrency(listing.deposit)} refundable security deposit
                </div>
              )}
            </div>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold">Reviews</h2>
            <div className="mb-3 flex items-center gap-3">
              {listing.ratingAverage != null ? (
                <div className="flex items-center gap-1 text-xl font-semibold">
                  <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
                  {listing.ratingAverage.toFixed(1)}
                </div>
              ) : null}
              <span className="text-sm text-muted-foreground">
                {listing.reviewCount} review{listing.reviewCount === 1 ? '' : 's'}
              </span>
            </div>
            {reviewsLoading ? (
              <Skeleton className="h-24 w-full rounded-lg" />
            ) : reviews.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No reviews yet — be the first to stay and share your experience.
              </p>
            ) : (
              <div className="space-y-3">
                {reviews.map((r) => (
                  <div key={r.id} className="rounded-lg border border-border p-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">{r.guestName}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(r.createdAt, 'long')}
                      </p>
                    </div>
                    <div className="mt-1 flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <Star
                          key={n}
                          className={`h-3.5 w-3.5 ${
                            n <= r.rating
                              ? 'fill-amber-400 text-amber-400'
                              : 'text-muted-foreground/40'
                          }`}
                        />
                      ))}
                    </div>
                    {r.comment && <p className="mt-2 text-sm text-muted-foreground">{r.comment}</p>}
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Right column: booking card */}
        <div className="md:sticky md:top-6 md:self-start">
          <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <p className="text-2xl font-semibold">
              {listing.nightlyRate != null ? formatCurrency(listing.nightlyRate) : '—'}
              {listing.pricingMode === 'PER_NIGHT' && (
                <span className="text-sm font-normal text-muted-foreground"> / night</span>
              )}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {listing.pricingMode === 'PER_NIGHT'
                ? `Min ${listing.minNights} night${listing.minNights > 1 ? 's' : ''}`
                : 'Flat rate for the whole stay'}
            </p>
            <div className="mt-3 space-y-1.5 text-sm">
              {listing.cleaningFee ? (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Cleaning fee</span>
                  <span>{formatCurrency(listing.cleaningFee)}</span>
                </div>
              ) : null}
              {listing.deposit != null && listing.deposit > 0 ? (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Security deposit</span>
                  <span>{formatCurrency(listing.deposit)}</span>
                </div>
              ) : null}
              {listing.weekendUpliftPct ? (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Weekend uplift</span>
                  <span>+{listing.weekendUpliftPct}%</span>
                </div>
              ) : null}
            </div>
            <Button className="mt-4 w-full" onClick={openBooking}>
              <PlayCircle className="mr-1.5 h-4 w-4" />
              {listing.instantBooking ? 'Book now — instant confirmation' : 'Request to book'}
            </Button>
            {isSignedIn && (
              <Button
                variant="outline"
                className="mt-2 w-full"
                onClick={() => setMessageOpen(true)}
              >
                <MessageSquare className="mr-1.5 h-4 w-4" /> Message host
              </Button>
            )}
            {isSignedIn && (
              <Button
                variant={wishlist.isSaved(listing.id) ? 'secondary' : 'outline'}
                className="mt-2 w-full"
                onClick={() => wishlist.toggle.mutate(listing.id)}
                disabled={wishlist.toggle.isPending}
              >
                <Heart
                  className={`mr-1.5 h-4 w-4 ${wishlist.isSaved(listing.id) ? 'fill-destructive text-destructive' : ''}`}
                />
                {wishlist.isSaved(listing.id) ? 'Saved' : 'Save listing'}
              </Button>
            )}
            <p className="mt-2 text-center text-xs text-muted-foreground">
              {listing.instantBooking
                ? 'Instant booking is enabled for this stay.'
                : 'The host will confirm your request before it is booked.'}
            </p>
          </div>
        </div>
      </div>

      {bookingOpen && (
        <ShortletBookingDialog
          listing={listing}
          onClose={() => {
            setBookingOpen(false);
            setCreatedBooking(null);
          }}
          createdBooking={createdBooking}
          paying={pay.isPending}
          onPay={(id) => pay.mutate(id)}
          onBook={(input) => book.mutate(input)}
          busy={book.isPending}
        />
      )}

      {messageOpen && (
        <ShortletMessageHostDialog
          listing={listing}
          onClose={() => setMessageOpen(false)}
          onSent={() => {
            setMessageOpen(false);
            setToast({ message: 'Message sent to the host.', variant: 'success' });
          }}
        />
      )}
      {toast && (
        <Toast message={toast.message} variant={toast.variant} onClose={() => setToast(null)} />
      )}
    </div>
  );
}
