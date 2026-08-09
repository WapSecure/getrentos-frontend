'use client';

import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Bed,
  Bath,
  Square,
  MapPin,
  Star,
  TrendingUp,
  Shield,
  Home,
  GitCompare,
} from 'lucide-react';
import { Property } from '@/types/renter';

interface DiscoverCompareDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  properties: Property[];
  onRemove: (id: string) => void;
}

export const DiscoverCompareDrawer = ({
  isOpen,
  onClose,
  properties,
  onRemove,
}: DiscoverCompareDrawerProps) => {
  const formatPrice = (price: number, period: string) => {
    const formatter = new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
    return `${formatter.format(price)}${period === 'month' ? '/mo' : period === 'year' ? '/yr' : '/wk'}`;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-40"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-4xl bg-background shadow-xl z-50 overflow-y-auto"
          >
            <div className="sticky top-0 bg-background border-b border-border p-4 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-semibold text-foreground">Compare Properties</h2>
                <p className="text-sm text-muted-foreground">
                  {properties.length} of 4 properties selected
                </p>
              </div>
              <button onClick={onClose} className="p-2 rounded-lg hover:bg-secondary">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              {properties.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                    <GitCompare className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-foreground">No properties selected</h3>
                  <p className="text-muted-foreground mt-1">
                    Click the compare icon on any property to add it here
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                          Features
                        </th>
                        {properties.map((property) => (
                          <th key={property.id} className="text-left py-3 px-4 min-w-[200px]">
                            <div className="flex justify-between items-start">
                              <span className="font-semibold text-foreground">
                                {property.title}
                              </span>
                              <button
                                onClick={() => onRemove(property.id)}
                                className="text-gray-400 hover:text-red-500"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      <tr>
                        <td className="py-3 px-4 text-sm text-muted-foreground">Price</td>
                        {properties.map((property) => (
                          <td key={property.id} className="py-3 px-4">
                            <span className="font-semibold text-primary">
                              {formatPrice(property.price, property.period)}
                            </span>
                          </td>
                        ))}
                      </tr>
                      <tr>
                        <td className="py-3 px-4 text-sm text-muted-foreground">Location</td>
                        {properties.map((property) => (
                          <td key={property.id} className="py-3 px-4">
                            <div className="flex items-center gap-1 text-sm">
                              <MapPin className="w-3 h-3 text-gray-400" />
                              {property.location}
                            </div>
                          </td>
                        ))}
                      </tr>
                      <tr>
                        <td className="py-3 px-4 text-sm text-muted-foreground">Bedrooms</td>
                        {properties.map((property) => (
                          <td key={property.id} className="py-3 px-4">
                            <div className="flex items-center gap-1">
                              <Bed className="w-4 h-4 text-gray-400" />
                              {property.bedrooms}
                            </div>
                          </td>
                        ))}
                      </tr>
                      <tr>
                        <td className="py-3 px-4 text-sm text-muted-foreground">Bathrooms</td>
                        {properties.map((property) => (
                          <td key={property.id} className="py-3 px-4">
                            <div className="flex items-center gap-1">
                              <Bath className="w-4 h-4 text-gray-400" />
                              {property.bathrooms}
                            </div>
                          </td>
                        ))}
                      </tr>
                      <tr>
                        <td className="py-3 px-4 text-sm text-muted-foreground">Size</td>
                        {properties.map((property) => (
                          <td key={property.id} className="py-3 px-4">
                            <div className="flex items-center gap-1">
                              <Square className="w-4 h-4 text-gray-400" />
                              {property.size} sqft
                            </div>
                          </td>
                        ))}
                      </tr>
                      <tr>
                        <td className="py-3 px-4 text-sm text-muted-foreground">Rating</td>
                        {properties.map((property) => (
                          <td key={property.id} className="py-3 px-4">
                            <div className="flex items-center gap-1">
                              <Star className="w-4 h-4 fill-primary text-primary" />
                              {property.rating}
                            </div>
                          </td>
                        ))}
                      </tr>
                      <tr>
                        <td className="py-3 px-4 text-sm text-muted-foreground">Verified</td>
                        {properties.map((property) => (
                          <td key={property.id} className="py-3 px-4">
                            {property.verified ? (
                              <span className="inline-flex items-center gap-1 text-green-600">
                                <Shield className="w-4 h-4" />
                                Yes
                              </span>
                            ) : (
                              <span className="text-gray-400">No</span>
                            )}
                          </td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
