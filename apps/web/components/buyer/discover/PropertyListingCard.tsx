'use client';

import { motion } from 'framer-motion';
import { MapPin, BedDouble, Bath, Ruler, Heart, ShieldCheck, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { formatCurrency } from '@/lib/format';
import type { BuyerPropertyListing } from '@/types/buyer';

interface PropertyListingCardProps {
  listing: BuyerPropertyListing;
  isSaved: boolean;
  onToggleSave: () => void;
  onViewDetails: () => void;
  delay?: number;
}

export const PropertyListingCard = ({
  listing,
  isSaved,
  onToggleSave,
  onViewDetails,
  delay = 0,
}: PropertyListingCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className="group bg-white dark:bg-[#1a2a2f] rounded-2xl border border-gray-200 dark:border-white/10 overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer"
      onClick={onViewDetails}
    >
      <div className="relative h-44 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-[#2a3a3f] dark:to-[#1a2a2f]">
        <div className="absolute inset-0 flex items-center justify-center">
          <Building2 className="w-12 h-12 text-gray-400 dark:text-gray-600" />
        </div>
        {listing.ownerVerified && (
          <div className="absolute top-3 left-3 inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium text-green-700 bg-green-50 dark:text-green-400 dark:bg-green-900/20">
            <ShieldCheck className="w-3 h-3" />
            Verified Owner
          </div>
        )}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleSave();
          }}
          className="absolute top-3 right-3 p-1.5 rounded-lg bg-white/90 dark:bg-black/50 backdrop-blur-sm hover:bg-white dark:hover:bg-black/70 transition-colors"
        >
          <Heart
            className={`w-4 h-4 ${isSaved ? 'text-red-500 fill-red-500' : 'text-gray-700 dark:text-gray-300'}`}
          />
        </button>
        <div className="absolute bottom-3 left-3 bg-[#c4a747] text-[#0a1a1f] px-2.5 py-1 rounded-lg text-sm font-bold">
          {formatCurrency(listing.askingPrice, { compact: true })}
        </div>
      </div>

      <div className="p-4">
        <h3 className="font-semibold text-gray-900 dark:text-white truncate">{listing.title}</h3>
        <p className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 mt-1">
          <MapPin className="w-3 h-3" />
          {listing.city}, {listing.state}
        </p>

        <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-100 dark:border-white/5 text-xs text-gray-500 dark:text-gray-400">
          {listing.bedrooms !== undefined && (
            <span className="flex items-center gap-1">
              <BedDouble className="w-3.5 h-3.5" />
              {listing.bedrooms}
            </span>
          )}
          {listing.bathrooms !== undefined && (
            <span className="flex items-center gap-1">
              <Bath className="w-3.5 h-3.5" />
              {listing.bathrooms}
            </span>
          )}
          {listing.propertySize !== undefined && (
            <span className="flex items-center gap-1">
              <Ruler className="w-3.5 h-3.5" />
              {listing.propertySize} sqm
            </span>
          )}
        </div>

        <Button
          variant="outline"
          size="sm"
          fullWidth
          className="mt-4"
          onClick={(e) => {
            e.stopPropagation();
            onViewDetails();
          }}
        >
          View Details
        </Button>
      </div>
    </motion.div>
  );
};
