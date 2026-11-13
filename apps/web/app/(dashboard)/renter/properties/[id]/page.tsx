'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  MapPin,
  Bed,
  Bath,
  Square,
  Star,
  Shield,
  Heart,
  GitCompare,
  Calendar,
  Check,
  Search,
  Zap,
  Lock,
} from '@sureground/icons';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  IconButton,
  PageErrorState,
  PageLoadingState,
  useOptimisticMutation,
  useToast,
} from '@sureground/ui';
import { VirtualTourViewerModal } from '@/components/renter/discover/features/VirtualTourViewerModal';
import { PropertyGallery } from '@/components/renter/property-detail/PropertyGallery';
import { PropertyLandlordCard } from '@/components/renter/property-detail/PropertyLandlordCard';
import { PropertyTrustChain } from '@/components/renter/property-detail/PropertyTrustChain';
import { ListingCheckCard } from '@/components/renter/property-detail/ListingCheckCard';
import { AffordabilityCard } from '@/components/renter/property-detail/AffordabilityCard';
import { PropertyReviews } from '@/components/renter/property-detail/PropertyReviews';
import { SimilarProperties } from '@/components/renter/property-detail/SimilarProperties';
import { GeoInsightsPanel } from '@/components/maps/GeoInsightsPanel';
import { CommuteCalculator } from '@/components/renter/discover/features/CommuteCalculator';
import { RentVsBuyCalculator } from '@/components/renter/discover/features/RentVsBuyCalculator';
import { NeighborhoodCompare } from '@/components/renter/discover/features/NeighborhoodCompare';
import { formatPrice, monthlyEquivalent } from '@/types/renter';
import { format, isValid, parseISO } from 'date-fns';
import type { TourModalMode } from '@/types/virtual-tour';
import { ROUTES, buildRoute } from '@/lib/constants/auth';
import { renterService, type SavedListingItem } from '@/services/renterService';
import { unwrap, ApiError, type Paginated } from '@/lib/apiHelpers';
import { renterKeys } from '@/lib/queryKeys';
import { trustChainLabel, formatLocation } from '@sureground/shared';
import { useFlexAvailability } from '@/hooks/useFlexAvailability';
import { RENTER_COMPARE_MAX, useRenterCompare } from '@/hooks/useRenterCompare';

const nairaFormatter = new Intl.NumberFormat('en-NG', {
  style: 'currency',
  currency: 'NGN',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

export default function PropertyDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const [tourOpen, setTourOpen] = useState(false);
  const [tourMode, setTourMode] = useState<TourModalMode>('tour');
  const toast = useToast();
  const compare = useRenterCompare();
  const { newPlansOpen: flexOpen } = useFlexAvailability();

  const propertyQuery = useQuery({
    queryKey: renterKeys.listing(params.id),
    queryFn: async () => {
      try {
        const data = await unwrap(renterService.getListing(params.id));
        renterService.recordListingView(params.id).catch(() => {});
        return data;
      } catch (error) {
        if (error instanceof ApiError && error.status === 404) return null;
        throw error;
      }
    },
  });
  const property = propertyQuery.data ?? null;

  const { data: savedListingsData } = useQuery({
    queryKey: renterKeys.savedListings,
    queryFn: () => unwrap(renterService.listSavedListings({ page: 1, pageSize: 100 })),
  });
  const savedListings = savedListingsData?.items ?? [];
  const isSaved = savedListings.some((p) => p.id === params.id);

  const saveMutation = useOptimisticMutation({
    mutationFn: (save: boolean) =>
      unwrap(
        save
          ? renterService.saveListing(property?.id ?? '')
          : renterService.unsaveListing(property?.id ?? '')
      ),
    patches: (save) => [
      {
        queryKey: renterKeys.savedListings,
        update: (old) => {
          const page = old as Paginated<SavedListingItem>;
          const items = save
            ? [...page.items, { id: params.id } as SavedListingItem]
            : page.items.filter((item) => item.id !== params.id);
          return { ...page, items };
        },
      },
    ],
    invalidate: [renterKeys.dashboardStats],
    errorMessage: 'Your saved properties did not update. Please try again.',
    onSuccess: (_data, save) =>
      save
        ? toast.success('Property saved successfully!')
        : toast.info('Property removed from saved'),
  });

  if (propertyQuery.isLoading) return <PageLoadingState />;

  if (propertyQuery.isError && !propertyQuery.data) {
    return (
      <PageErrorState
        title="Property details are unavailable"
        description="We could not load this listing. It may be a temporary connection problem."
        onRetry={() => void propertyQuery.refetch()}
        isRetrying={propertyQuery.isFetching}
      />
    );
  }

  if (!property) {
    return (
      <EmptyState
        icon={Search}
        title="Property not found"
        description="This listing may have been removed or the link is incorrect."
        action={
          <Button variant="primary" onClick={() => router.push(ROUTES.RENTER_DISCOVER)}>
            Back to discover
          </Button>
        }
      />
    );
  }

  const handleToggleSave = () => saveMutation.mutate(!isSaved);

  const handleCompare = () => {
    if (!compare.add(property)) {
      toast.info(
        `You can compare up to ${RENTER_COMPARE_MAX} properties. Remove one in Discover first.`
      );
      return;
    }
    router.push(`${ROUTES.RENTER_DISCOVER}?compare=open`);
  };

  // A date-only "2026-12-01" is read as that local day, then shown as "1 Dec 2026".
  const availableFromDate = property.availableFrom ? parseISO(property.availableFrom) : null;
  const availableFrom =
    availableFromDate && isValid(availableFromDate)
      ? format(availableFromDate, 'd MMM yyyy')
      : null;

  const openTour = (mode: TourModalMode) => {
    setTourMode(mode);
    setTourOpen(true);
  };

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.back()}
        icon={<ArrowLeft className="w-4 h-4" />}
        className="mb-4"
      >
        Back
      </Button>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <PropertyGallery
            images={property.images}
            videoTourUrl={property.videoTourUrl}
            filmedOnSite={property.videoTourFilmedOnSite}
            fallbackImage={property.image}
            onOpenTour={() => openTour('tour')}
          />

          <div>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="font-display text-[1.75rem] font-normal leading-tight tracking-[-0.01em] text-foreground sm:text-[2rem]">
                    {property.title}
                  </h1>
                  {property.trustChain?.steps.length
                    ? (() => {
                        const { label, tone } = trustChainLabel(property.trustChain);
                        return (
                          <Badge
                            variant={tone === 'verified' ? 'success' : 'neutral'}
                            icon={<Shield className="w-3 h-3" aria-hidden="true" />}
                          >
                            {label}
                          </Badge>
                        );
                      })()
                    : property.verified && (
                        <Badge
                          variant="success"
                          icon={<Shield className="w-3 h-3" aria-hidden="true" />}
                        >
                          Verified
                        </Badge>
                      )}
                </div>
                <div className="mt-1.5 flex items-center gap-1 text-muted-foreground">
                  <MapPin className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span className="text-sm">{formatLocation(property.location)}</span>
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="data-value text-2xl font-semibold text-primary sm:text-[1.75rem]">
                  {formatPrice(property.price, property.period)}
                </p>
                {monthlyEquivalent(property.price, property.period) && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {monthlyEquivalent(property.price, property.period)} equivalent
                  </p>
                )}
                <div className="flex items-center justify-end gap-1 mt-1">
                  {property.rating > 0 ? (
                    <>
                      <Star className="h-4 w-4 fill-warning text-warning" aria-hidden="true" />
                      <span className="text-sm text-foreground">{property.rating}</span>
                    </>
                  ) : (
                    <span className="text-sm text-muted-foreground">No reviews yet</span>
                  )}
                </div>
              </div>
            </div>

            <ul className="mt-5 flex flex-wrap gap-px overflow-hidden rounded-xl border border-border bg-border [&>li]:min-w-[45%] [&>li]:flex-1 [&>li]:bg-card sm:[&>li]:min-w-0">
              <li className="flex items-center gap-2.5 px-4 py-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Bed className="h-4 w-4" aria-hidden="true" />
                </span>
                <span className="text-sm text-foreground">
                  {property.bedrooms} {property.bedrooms === 1 ? 'bed' : 'beds'}
                </span>
              </li>
              <li className="flex items-center gap-2.5 px-4 py-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Bath className="h-4 w-4" aria-hidden="true" />
                </span>
                <span className="text-sm text-foreground">
                  {property.bathrooms} {property.bathrooms === 1 ? 'bath' : 'baths'}
                </span>
              </li>
              {property.size > 0 && (
                <li className="flex items-center gap-2.5 px-4 py-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Square className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <span className="text-sm text-foreground">{property.size} sqm</span>
                </li>
              )}
              {(property.acceptingApplications === false || availableFrom) && (
                <li className="flex items-center gap-2.5 px-4 py-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Calendar className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <span className="text-sm text-foreground">
                    {property.acceptingApplications === false
                      ? 'Let, not accepting applications'
                      : `Available ${availableFrom}`}
                  </span>
                </li>
              )}
            </ul>

            <div className="mt-5 flex flex-wrap gap-2">
              <Button
                variant="primary"
                size="lg"
                className="min-w-[10rem] flex-1"
                disabled={property.acceptingApplications === false}
                onClick={() => router.push(buildRoute.renterPropertyApply(property.id))}
              >
                {property.acceptingApplications === false
                  ? 'Not accepting applications'
                  : 'Apply now'}
              </Button>
              {property.acceptingApplications === false ? null : (
                <Button
                  variant="outline"
                  size="lg"
                  icon={<Calendar className="w-4 h-4" />}
                  onClick={() => openTour('booking')}
                >
                  Schedule viewing
                </Button>
              )}
              <IconButton
                variant="outline"
                label={isSaved ? 'Remove from saved' : 'Save property'}
                aria-pressed={isSaved}
                onClick={handleToggleSave}
                icon={
                  <Heart
                    className={
                      isSaved ? 'text-destructive fill-destructive' : 'text-muted-foreground'
                    }
                  />
                }
              />
              <IconButton
                variant="outline"
                label={compare.has(property.id) ? 'Open comparison' : 'Add to comparison'}
                onClick={handleCompare}
                icon={<GitCompare />}
              />
            </div>
          </div>

          {property.description && (
            <div>
              <h2 className="mb-2 text-base font-semibold tracking-[-0.015em] text-foreground">
                About this property
              </h2>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {property.description}
              </p>
            </div>
          )}

          {property.amenities && property.amenities.length > 0 && (
            <div>
              <h2 className="mb-3 text-base font-semibold tracking-[-0.015em] text-foreground">
                Amenities
              </h2>
              <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {property.amenities.map((amenity) => (
                  <li
                    key={amenity}
                    className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground"
                  >
                    <Check className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                    <span>{amenity}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <GeoInsightsPanel listingId={property.id} title={property.title} />

          <Card className="p-4">
            <h2 className="text-sm font-semibold text-foreground">Plan your move</h2>
            <div className="mt-2 flex flex-wrap gap-4 text-xs text-muted-foreground">
              <CommuteCalculator listingId={property.id} propertyLocation={property.location} />
              <RentVsBuyCalculator
                propertyPrice={property.price}
                monthlyRent={property.period === 'year' ? property.price / 12 : property.price}
              />
              <NeighborhoodCompare listingId={property.id} propertyLocation={property.location} />
            </div>
          </Card>

          {property.reviews && <PropertyReviews reviews={property.reviews} />}

          <SimilarProperties currentId={property.id} />
        </div>

        <div className="space-y-6">
          <ListingCheckCard listingId={property.id} />
          <AffordabilityCard listingId={property.id} />

          <PropertyTrustChain property={property} />

          <PropertyLandlordCard property={property} />

          {property.additionalFees && property.additionalFees.length > 0 && (
            <Card className="p-4">
              <h2 className="mb-3 text-sm font-semibold text-foreground">Cost breakdown</h2>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Rent ({property.period}ly)</span>
                  <span className="text-right">
                    <span className="text-foreground font-medium block">
                      {formatPrice(property.price, property.period)}
                    </span>
                    {monthlyEquivalent(property.price, property.period) && (
                      <span className="text-xs text-muted-foreground">
                        {monthlyEquivalent(property.price, property.period)}
                      </span>
                    )}
                  </span>
                </div>
                {property.additionalFees.map((fee) => (
                  <div key={fee.label} className="flex items-center justify-between">
                    <span className="text-muted-foreground">{fee.label}</span>
                    <span className="text-foreground font-medium">
                      {nairaFormatter.format(fee.amount)}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {property.period === 'year' && (
            <Card className="p-4">
              <h2 className="mb-3 text-sm font-semibold text-foreground">Payment options</h2>
              {property.allowsMonthlyPayment && !flexOpen ? (
                <div className="flex items-start gap-2 text-sm">
                  <Zap className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                  <p className="text-muted-foreground">
                    This landlord accepts monthly instalments via{' '}
                    <span className="text-foreground font-medium">Sureground Flex</span>, but Flex
                    isn&apos;t taking new plans right now. Coming back soon.
                  </p>
                </div>
              ) : property.allowsMonthlyPayment ? (
                <div className="space-y-3">
                  <div className="flex items-start gap-2 text-sm">
                    <Zap className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    <p className="text-muted-foreground">
                      This landlord accepts monthly instalments via{' '}
                      <span className="text-foreground font-medium">Sureground Flex</span>: we pay
                      the full year upfront, you repay us monthly.
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    fullWidth
                    className="gap-2"
                    onClick={() => router.push(`${ROUTES.RENTER_PAYMENTS}?tab=financing`)}
                  >
                    <Zap className="w-4 h-4" />
                    See monthly payment plans
                  </Button>
                </div>
              ) : (
                <div className="flex items-start gap-2 text-sm">
                  <Lock className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                  <p className="text-muted-foreground">
                    This landlord requires the full year&apos;s rent upfront: monthly instalments
                    aren&apos;t available for this property.
                  </p>
                </div>
              )}
            </Card>
          )}
        </div>
      </div>

      {tourOpen && (
        <VirtualTourViewerModal
          propertyTitle={property.title}
          propertyId={property.propertyId}
          videoTourUrl={property.videoTourUrl}
          hostName={property.landlordName}
          initialMode={tourMode}
          onClose={() => setTourOpen(false)}
        />
      )}
    </>
  );
}
