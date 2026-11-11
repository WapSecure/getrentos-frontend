'use client';

import { useQuery } from '@tanstack/react-query';
import { ListingCard } from '@sureground/ui';
import { buildRoute } from '@/lib/constants/auth';
import { unwrap } from '@/lib/apiHelpers';
import { publicMarketService } from '@/services/publicMarketService';

interface SimilarPropertiesProps {
  /** The listing id (renter "property" ids are listing ids). */
  currentId: string;
}

/** Ranked on the server: nearby, a comparable yearly rent and about the same bedrooms. */
export const SimilarProperties = ({ currentId }: SimilarPropertiesProps) => {
  const { data: similar = [] } = useQuery({
    queryKey: ['public-market', 'rent', 'similar', currentId],
    queryFn: () => unwrap(publicMarketService.similar('rent', currentId, 3)),
    staleTime: 5 * 60_000,
  });

  if (similar.length === 0) return null;

  return (
    <div>
      <h3 className="text-sm font-semibold text-foreground mb-3">Similar properties</h3>
      <div className="grid gap-x-4 gap-y-6 sm:grid-cols-3">
        {similar.map((property) => (
          <ListingCard
            key={property.id}
            headingLevel="h4"
            href={buildRoute.renterPropertyDetail(property.id)}
            title={property.title}
            location={property.location}
            price={property.price}
            priceUnit={property.priceUnit}
            priceCompact
            image={property.image}
            imageSrcSet={property.imageSrcSet}
            imagePreview={property.imagePreview}
            imageAlt={property.title}
            facts={{ beds: property.bedrooms, baths: property.bathrooms }}
          />
        ))}
      </div>
    </div>
  );
};
