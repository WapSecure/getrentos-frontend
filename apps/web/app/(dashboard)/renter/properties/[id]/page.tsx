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
} from 'lucide-react';
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
} from '@getrentos/ui';
import { VirtualTourViewerModal } from '@/components/renter/discover/features/VirtualTourViewerModal';
import { PropertyGallery } from '@/components/renter/property-detail/PropertyGallery';
import { PropertyLandlordCard } from '@/components/renter/property-detail/PropertyLandlordCard';
import { PropertyTrustChain } from '@/components/renter/property-detail/PropertyTrustChain';
import { PropertyReviews } from '@/components/renter/property-detail/PropertyReviews';
import { SimilarProperties } from '@/components/renter/property-detail/SimilarProperties';
import { GeoInsightsPanel } from '@/components/maps/GeoInsightsPanel';
import { formatPrice, monthlyEquivalent } from '@/types/renter';
import type { TourModalMode } from '@/types/virtual-tour';
import { ROUTES, buildRoute } from '@/lib/constants/auth';
import { renterService, type SavedListingItem } from '@/services/renterService';
import { unwrap, type Paginated } from '@/lib/apiHelpers';
import { renterKeys } from '@/lib/queryKeys';
import { trustChainLabel } from '@getrentos/shared';

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

  const propertyQuery = useQuery({
    queryKey: renterKeys.listing(params.id),
    queryFn: async () => {
      const data = await unwrap(renterService.getListing(params.id));
      renterService.recordListingView(params.id).catch(() => {});
      return data;
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
            Back to Discover
          </Button>
        }
      />
    );
  }

  const handleToggleSave = () => saveMutation.mutate(!isSaved);

  const handleCompare = () => {
    toast.info('Added to comparison: open Discover to view your comparison list');
  };

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
                  <h1 className="text-2xl font-bold text-foreground">{property.title}</h1>
                  {property.trustChain?.steps.length
                    ? // The chain's own words, not a blanket tick: "Verified" next to
                      // a panel saying ownership isn't confirmed read as a contradiction.
                      (() => {
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
                <div className="flex items-center gap-1 text-muted-foreground mt-1">
                  <MapPin className="w-4 h-4" />
                  <span className="text-sm">{property.location}</span>
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="text-2xl font-bold text-primary">
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
                      <Star className="w-4 h-4 fill-primary text-primary" />
                      <span className="text-sm text-foreground">{property.rating}</span>
                    </>
                  ) : (
                    <span className="text-sm text-muted-foreground">No reviews yet</span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Bed className="w-4 h-4" />
                <span>
                  {property.bedrooms} {property.bedrooms === 1 ? 'bed' : 'beds'}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <Bath className="w-4 h-4" />
                <span>
                  {property.bathrooms} {property.bathrooms === 1 ? 'bath' : 'baths'}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <Square className="w-4 h-4" />
                <span>{property.size} sqm</span>
              </div>
              {property.availableFrom && (
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" />
                  <span>Available {property.availableFrom}</span>
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-2 mt-4">
              <Button
                variant="primary"
                className="flex-1"
                onClick={() => router.push(buildRoute.renterPropertyApply(property.id))}
              >
                Apply Now
              </Button>
              <Button
                variant="outline"
                icon={<Calendar className="w-4 h-4" />}
                onClick={() => openTour('booking')}
              >
                Schedule Viewing
              </Button>
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
                label="Add to comparison"
                onClick={handleCompare}
                icon={<GitCompare />}
              />
            </div>
          </div>

          {property.description && (
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-2">About this property</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {property.description}
              </p>
            </div>
          )}

          {property.amenities && property.amenities.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-3">Amenities</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {property.amenities.map((amenity) => (
                  <div
                    key={amenity}
                    className="flex items-center gap-2 text-sm text-muted-foreground"
                  >
                    <Check className="w-4 h-4 text-primary shrink-0" />
                    <span>{amenity}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <GeoInsightsPanel listingId={property.id} title={property.title} />

          {property.reviews && <PropertyReviews reviews={property.reviews} />}

          <SimilarProperties currentId={property.id} />
        </div>

        <div className="space-y-6">
          <PropertyTrustChain property={property} />

          <PropertyLandlordCard property={property} />

          {property.additionalFees && property.additionalFees.length > 0 && (
            <Card className="p-4">
              <h3 className="text-sm font-semibold text-foreground mb-3">Cost Breakdown</h3>
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
              <h3 className="text-sm font-semibold text-foreground mb-3">Payment Options</h3>
              {property.allowsMonthlyPayment ? (
                <div className="space-y-3">
                  <div className="flex items-start gap-2 text-sm">
                    <Zap className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    <p className="text-muted-foreground">
                      This landlord accepts monthly installments via{' '}
                      <span className="text-foreground font-medium">GetRentos Flex</span>: we pay
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
                    See Monthly Payment Plans
                  </Button>
                </div>
              ) : (
                <div className="flex items-start gap-2 text-sm">
                  <Lock className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                  <p className="text-muted-foreground">
                    This landlord requires the full year&apos;s rent upfront: monthly installments
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
