'use client';

import { useEffect, useState } from 'react';
import { ListingCard } from '@sureground/ui';
import type { Property } from '@/types/renter';
import { buildRoute } from '@/lib/constants/auth';
import { renterService } from '@/services/renterService';

interface SimilarPropertiesProps {
  currentId: string;
}

export const SimilarProperties = ({ currentId }: SimilarPropertiesProps) => {
  const [similar, setSimilar] = useState<Property[]>([]);

  useEffect(() => {
    const load = async () => {
      const res = await renterService.listListings({ pageSize: 100 });
      if (res.success && res.data) {
        setSimilar(res.data.items.filter((p) => p.id !== currentId).slice(0, 3));
      }
    };
    load();
  }, [currentId]);

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
            priceUnit={property.period}
            priceCompact
            image={property.image}
            imageAlt={property.title}
            facts={{ beds: property.bedrooms, baths: property.bathrooms }}
          />
        ))}
      </div>
    </div>
  );
};
