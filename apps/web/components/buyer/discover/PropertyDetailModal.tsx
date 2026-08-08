'use client';

import { AnimatePresence, motion } from 'framer-motion';
import {
  X,
  MapPin,
  BedDouble,
  Bath,
  Ruler,
  ShieldCheck,
  Heart,
  CalendarClock,
  Handshake,
  MessageSquare,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { formatCurrency, formatDate } from '@/lib/format';
import type { BuyerPropertyListing } from '@/types/buyer';

interface PropertyDetailModalProps {
  listing: BuyerPropertyListing | null;
  isSaved: boolean;
  onClose: () => void;
  onToggleSave: () => void;
  onRequestViewing: () => void;
  onMakeOffer: () => void;
  onMessageOwner: () => void;
}

export const PropertyDetailModal = ({
  listing,
  isSaved,
  onClose,
  onToggleSave,
  onRequestViewing,
  onMakeOffer,
  onMessageOwner,
}: PropertyDetailModalProps) => {
  if (!listing) return null;

  return (
    <AnimatePresence>
      {listing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-white dark:bg-[#1a2a2f] rounded-xl max-w-lg w-full overflow-hidden max-h-[90vh] flex flex-col"
          >
            <div className="relative h-48 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-[#2a3a3f] dark:to-[#1a2a2f] flex-shrink-0">
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-5xl">🏠</span>
              </div>
              <button
                onClick={onClose}
                className="absolute top-3 right-3 p-1.5 rounded-lg bg-white/90 dark:bg-black/50 backdrop-blur-sm hover:bg-white dark:hover:bg-black/70"
              >
                <X className="w-4 h-4" />
              </button>
              <button
                onClick={onToggleSave}
                className="absolute top-3 right-14 p-1.5 rounded-lg bg-white/90 dark:bg-black/50 backdrop-blur-sm hover:bg-white dark:hover:bg-black/70"
              >
                <Heart
                  className={`w-4 h-4 ${isSaved ? 'text-red-500 fill-red-500' : 'text-gray-700 dark:text-gray-300'}`}
                />
              </button>
              <div className="absolute bottom-3 left-4 bg-[#c4a747] text-[#0a1a1f] px-3 py-1.5 rounded-lg text-lg font-bold">
                {formatCurrency(listing.askingPrice)}
              </div>
            </div>

            <div className="p-4 space-y-4 overflow-y-auto flex-1">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {listing.title}
                </h3>
                <p className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 mt-1">
                  <MapPin className="w-3.5 h-3.5" />
                  {listing.address}, {listing.city}, {listing.state}
                </p>
              </div>

              <div className="flex items-center gap-5 text-sm text-gray-600 dark:text-gray-300">
                {listing.bedrooms !== undefined && (
                  <span className="flex items-center gap-1.5">
                    <BedDouble className="w-4 h-4 text-gray-400" />
                    {listing.bedrooms} beds
                  </span>
                )}
                {listing.bathrooms !== undefined && (
                  <span className="flex items-center gap-1.5">
                    <Bath className="w-4 h-4 text-gray-400" />
                    {listing.bathrooms} baths
                  </span>
                )}
                {listing.propertySize !== undefined && (
                  <span className="flex items-center gap-1.5">
                    <Ruler className="w-4 h-4 text-gray-400" />
                    {listing.propertySize} sqm
                  </span>
                )}
              </div>

              <p className="text-sm text-gray-600 dark:text-gray-300">{listing.description}</p>

              {listing.features.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                    Features
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {listing.features.map((feature) => (
                      <span
                        key={feature}
                        className="text-xs px-2.5 py-1 rounded-full bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300"
                      >
                        {feature}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-3 flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-400">Listed by</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {listing.ownerName}
                  </p>
                </div>
                {listing.ownerVerified && (
                  <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium text-green-700 bg-green-50 dark:text-green-400 dark:bg-green-900/20">
                    <ShieldCheck className="w-3 h-3" />
                    Verified
                  </span>
                )}
              </div>

              <p className="text-xs text-gray-400">Listed {formatDate(listing.listedDate)}</p>
            </div>

            <div className="p-4 border-t border-gray-200 dark:border-white/10 grid grid-cols-3 gap-2 flex-shrink-0">
              <Button variant="outline" size="sm" className="gap-1.5" onClick={onMessageOwner}>
                <MessageSquare className="w-3.5 h-3.5" />
                Message
              </Button>
              <Button variant="outline" size="sm" className="gap-1.5" onClick={onRequestViewing}>
                <CalendarClock className="w-3.5 h-3.5" />
                View
              </Button>
              <Button variant="primary" size="sm" className="gap-1.5" onClick={onMakeOffer}>
                <Handshake className="w-3.5 h-3.5" />
                Offer
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
