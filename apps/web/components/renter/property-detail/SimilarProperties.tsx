import Link from 'next/link';
import { Home, MapPin } from 'lucide-react';
import { mockProperties } from '@/lib/mockProperties';
import { formatPrice } from '@/types/renter';

interface SimilarPropertiesProps {
  currentId: string;
}

export const SimilarProperties = ({ currentId }: SimilarPropertiesProps) => {
  const similar = mockProperties.filter((p) => p.id !== currentId).slice(0, 3);

  if (similar.length === 0) return null;

  return (
    <div>
      <h3 className="text-sm font-semibold text-foreground mb-3">Similar Properties</h3>
      <div className="grid sm:grid-cols-3 gap-3">
        {similar.map((property) => (
          <Link
            key={property.id}
            href={`/renter/properties/${property.id}`}
            className="block rounded-lg border border-border overflow-hidden hover:shadow-md transition-shadow"
          >
            <div className="h-24 bg-linear-to-br from-secondary to-muted flex items-center justify-center">
              <Home className="w-6 h-6 text-gray-400 dark:text-gray-600" />
            </div>
            <div className="p-2.5">
              <p className="text-sm font-medium text-foreground truncate">{property.title}</p>
              <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                <MapPin className="w-3 h-3 shrink-0" />
                <span className="truncate">{property.location}</span>
              </div>
              <p className="text-sm font-semibold text-primary mt-1">
                {formatPrice(property.price, property.period)}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};
