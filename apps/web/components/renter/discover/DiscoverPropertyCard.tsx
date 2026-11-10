'use client';

import { Calendar, GitCompare, Heart, Star } from '@sureground/icons';
import { Button, IconButton, ListingCard, ListingCardAction } from '@sureground/ui';
import { Property, monthlyEquivalent } from '@/types/renter';
import { VirtualTourBadge } from './features/VirtualTourBadge';
import { PropertyScore } from './features/PropertyScore';
import { TrustChainBadge } from '@/components/shared/trust/TrustChainBadge';
import { LandlordMetrics } from './features/LandlordMetrics';

interface DiscoverPropertyCardProps {
  property: Property;
  href: string;
  eager?: boolean;
  isSaved: boolean;
  onSave: () => void;
  onCompare: () => void;
  onOpen: () => void;
  onScheduleViewing: () => void;
  onApply: () => void;
  onOpenTour: () => void;
}

export const DiscoverPropertyCard = ({
  property,
  href,
  eager,
  isSaved,
  onSave,
  onCompare,
  onOpen,
  onScheduleViewing,
  onApply,
  onOpenTour,
}: DiscoverPropertyCardProps) => {
  const letOut = property.acceptingApplications === false;
  const monthly = property.price > 0 ? monthlyEquivalent(property.price, property.period) : null;

  return (
    <ListingCard
      href={href}
      onOpen={onOpen}
      title={property.title}
      location={property.location}
      price={property.price}
      priceUnit={property.period}
      priceNote={property.period === 'year' ? monthly : undefined}
      image={property.image}
      imageAlt={property.title}
      eager={eager}
      status={letOut ? 'Let' : 'For rent'}
      badges={<TrustChainBadge chain={property.trustChain} fallbackVerified={property.verified} />}
      facts={{
        beds: property.bedrooms,
        baths: property.bathrooms,
        size: property.size,
      }}
      actions={
        <>
          <VirtualTourBadge hasTour={Boolean(property.videoTourUrl)} onOpenTour={onOpenTour} />
          <ListingCardAction
            onClick={onSave}
            // Icon-only and repeated on every card, so the label names the property and the saved state.
            label={
              isSaved
                ? `Remove ${property.title} from your shortlist`
                : `Save ${property.title} to your shortlist`
            }
            title={isSaved ? 'Remove from shortlist' : 'Save to shortlist'}
            aria-pressed={isSaved}
            icon={<Heart fill={isSaved ? 'currentColor' : 'none'} />}
          />
        </>
      }
      meta={
        <div className="space-y-2.5">
          {(property.rating > 0 || property.score !== undefined) && (
            <div className="flex items-center gap-3">
              {property.rating > 0 && (
                <span className="inline-flex items-center gap-1">
                  <Star className="h-3.5 w-3.5 fill-warning text-warning" aria-hidden="true" />
                  <span className="data-value text-foreground">{property.rating}</span>
                  <span className="sr-only">rating</span>
                </span>
              )}
              <PropertyScore score={property.score} size="sm" />
            </div>
          )}
          <LandlordMetrics
            rating={property.landlordRating}
            totalReviews={property.landlordReviews}
            verifiedBadge={property.landlordVerified || false}
          />
        </div>
      }
      footer={
        <div className="flex items-center gap-2 border-t border-border/70 pt-4">
          <Button variant="primary" onClick={onApply} disabled={letOut} className="min-w-0 flex-1">
            {letOut ? 'Let, not accepting applications' : 'Apply for this property'}
          </Button>
          {!letOut && (
            <IconButton
              variant="outline"
              className="h-11 w-11 sm:h-10 sm:w-10"
              onClick={onScheduleViewing}
              label={`Schedule a viewing for ${property.title}`}
              title="Schedule a viewing"
              icon={<Calendar />}
            />
          )}
          <IconButton
            variant="outline"
            className="h-11 w-11 sm:h-10 sm:w-10"
            onClick={onCompare}
            label={`Compare ${property.title} with another property`}
            title="Compare with another property"
            icon={<GitCompare />}
          />
        </div>
      }
    />
  );
};
