'use client';

import { motion } from 'framer-motion';
import {
  MapPin,
  Megaphone,
  FileEdit,
  ShieldAlert,
  Pause,
  XCircle,
  BedDouble,
  Bath,
} from 'lucide-react';
import { formatCurrency } from '@/lib/format';
import type { RealtorListing, RealtorListingStatus } from '@/types/realtor';

const statusConfig: Record<
  RealtorListingStatus,
  { label: string; icon: React.ElementType; className: string }
> = {
  draft: {
    label: 'Draft',
    icon: FileEdit,
    className: 'text-gray-700 bg-gray-100 dark:text-gray-400 dark:bg-gray-800',
  },
  pending_approval: {
    label: 'Pending Approval',
    icon: ShieldAlert,
    className: 'text-yellow-700 bg-yellow-50 dark:text-yellow-400 dark:bg-yellow-900/20',
  },
  published: {
    label: 'Published',
    icon: Megaphone,
    className: 'text-green-700 bg-green-50 dark:text-green-400 dark:bg-green-900/20',
  },
  paused: {
    label: 'Paused',
    icon: Pause,
    className: 'text-orange-700 bg-orange-50 dark:text-orange-400 dark:bg-orange-900/20',
  },
  closed: {
    label: 'Closed',
    icon: XCircle,
    className: 'text-red-700 bg-red-50 dark:text-red-400 dark:bg-red-900/20',
  },
};

interface RealtorListingCardProps {
  listing: RealtorListing;
  onClick?: () => void;
  delay?: number;
}

export const RealtorListingCard = ({ listing, onClick, delay = 0 }: RealtorListingCardProps) => {
  const status = statusConfig[listing.status];
  const StatusIcon = status.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      onClick={onClick}
      className="group bg-white dark:bg-[#1a2a2f] rounded-2xl border border-gray-200 dark:border-white/10 overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer"
    >
      <div className="relative h-40 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-[#2a3a3f] dark:to-[#1a2a2f]">
        <div className="absolute inset-0 flex items-center justify-center">
          <Megaphone className="w-12 h-12 text-gray-400 dark:text-gray-600" />
        </div>
        <div
          className={`absolute top-3 left-3 inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${status.className}`}
        >
          <StatusIcon className="w-3 h-3" />
          {status.label}
        </div>
        <div className="absolute top-3 right-3 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium text-[#c4a747] bg-[#c4a747]/10">
          {listing.category === 'sale' ? 'For Sale' : 'For Rent'}
        </div>
      </div>

      <div className="p-4">
        <h3 className="font-semibold text-gray-900 dark:text-white truncate">{listing.title}</h3>
        <p className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 mt-1">
          <MapPin className="w-3 h-3" />
          {listing.city}, {listing.state}
        </p>
        <p className="text-xs text-gray-400 mt-0.5">Client: {listing.clientName}</p>

        <p className="text-lg font-bold text-[#c4a747] mt-3">
          {formatCurrency(listing.price, { compact: true })}
          {listing.category === 'rental' ? '/yr' : ''}
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
        </div>
      </div>
    </motion.div>
  );
};
