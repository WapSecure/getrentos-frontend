'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { MapPin, Bed, Bath, Square, Heart, Eye, Star, Home } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { mockProperties } from '@/lib/mockProperties';
import { formatPrice } from '@/types/renter';

const recommendedProperties = mockProperties.slice(0, 4);

export const RenterRecommendedProperties = () => {
  const router = useRouter();
  const [savedIds, setSavedIds] = useState<string[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('renter_saved_properties');
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSavedIds(saved ? JSON.parse(saved) : []);
  }, []);

  const toggleSave = (propertyId: string) => {
    const current = localStorage.getItem('renter_saved_properties');
    let ids: string[] = current ? JSON.parse(current) : [];
    ids = ids.includes(propertyId) ? ids.filter((id) => id !== propertyId) : [...ids, propertyId];
    localStorage.setItem('renter_saved_properties', JSON.stringify(ids));
    setSavedIds(ids);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.4 }}
      className="bg-card rounded-xl border border-border overflow-hidden"
    >
      <div className="p-4 border-b border-border flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Recommended for You</h2>
          <p className="text-sm text-muted-foreground">
            Based on your search history and preferences
          </p>
        </div>
        <Button href="/renter/discover" variant="ghost" size="sm" className="gap-1">
          View All
          <Eye className="w-3 h-3" />
        </Button>
      </div>

      <div className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
          {recommendedProperties.map((property, index) => (
            <motion.div
              key={property.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 + index * 0.05, duration: 0.3 }}
              className="border border-border rounded-lg overflow-hidden hover:shadow-md transition-shadow"
            >
              {/* Property Image Placeholder */}
              <div className="relative h-40 bg-linear-to-br from-secondary to-muted">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center mx-auto">
                      <Home className="w-6 h-6 text-primary" />
                    </div>
                    <p className="text-xs text-gray-500 mt-2">Property Image</p>
                  </div>
                </div>
                {property.verified && (
                  <span className="absolute top-2 left-2 px-2 py-0.5 bg-green-600 text-white text-xs rounded-full">
                    Verified
                  </span>
                )}
                <button
                  onClick={() => toggleSave(property.id)}
                  className="absolute top-2 right-2 p-1.5 bg-white/90 dark:bg-gray-800/90 rounded-full hover:bg-white transition-colors"
                >
                  <Heart
                    className={`w-3 h-3 ${savedIds.includes(property.id) ? 'text-red-500 fill-red-500' : 'text-gray-600'}`}
                  />
                </button>
              </div>

              {/* Property Details */}
              <div className="p-3">
                <div className="flex justify-between items-start mb-1">
                  <h3 className="font-semibold text-foreground text-sm">{property.title}</h3>
                  <div className="flex items-center gap-0.5">
                    <Star className="w-3 h-3 fill-primary text-primary" />
                    <span className="text-xs text-muted-foreground">{property.rating}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
                  <MapPin className="w-3 h-3" />
                  <span>{property.location}</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
                  <div className="flex items-center gap-1">
                    <Bed className="w-3 h-3" />
                    <span>{property.bedrooms}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Bath className="w-3 h-3" />
                    <span>{property.bathrooms}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Square className="w-3 h-3" />
                    <span>{property.size} sqft</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold text-primary">
                    {formatPrice(property.price, property.period)}
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => router.push(`/renter/properties/${property.id}`)}
                  >
                    View Details
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};
