'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Bed, Bath, Square, MapPin, Star, Shield, ShieldCheck, GitCompare } from 'lucide-react';
import { Property } from '@/types/renter';
import { trustChainLabel } from '@getrentos/shared';
import { EmptyState, IconButton } from '@getrentos/ui';

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
              <IconButton label="Close comparison" icon={<X />} onClick={onClose} />
            </div>

            <div className="p-6">
              {properties.length === 0 ? (
                <EmptyState
                  icon={GitCompare}
                  title="No properties selected"
                  description="Click the compare icon on any property to add it here"
                />
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
                            <div className="flex justify-between items-start gap-2">
                              <span className="font-semibold text-foreground">
                                {property.title}
                              </span>
                              <IconButton
                                label={`Remove ${property.title} from comparison`}
                                icon={<X />}
                                size="sm"
                                variant="danger"
                                onClick={() => onRemove(property.id)}
                              />
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
                              <MapPin className="w-3 h-3 text-muted-foreground" />
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
                              <Bed className="w-4 h-4 text-muted-foreground" />
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
                              <Bath className="w-4 h-4 text-muted-foreground" />
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
                              <Square className="w-4 h-4 text-muted-foreground" />
                              {property.size} sqm
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
                              <span className="inline-flex items-center gap-1 text-success">
                                <Shield className="w-4 h-4" />
                                Yes
                              </span>
                            ) : (
                              <span className="text-muted-foreground">No</span>
                            )}
                          </td>
                        ))}
                      </tr>
                      <tr>
                        <td className="py-3 px-4 text-sm text-muted-foreground">Trust chain</td>
                        {properties.map((property) => (
                          <td key={property.id} className="py-3 px-4">
                            {property.trustChain ? (
                              <span
                                title={property.trustChain.steps
                                  .map((s) => `${s.met ? '✓' : '○'} ${s.label}`)
                                  .join('\n')}
                                className={`inline-flex items-center gap-1 ${
                                  trustChainLabel(property.trustChain).tone === 'verified'
                                    ? 'text-success'
                                    : 'text-muted-foreground'
                                }`}
                              >
                                <ShieldCheck className="w-4 h-4" />
                                {trustChainLabel(property.trustChain).label}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">—</span>
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
