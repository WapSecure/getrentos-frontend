'use client';

import { motion } from 'framer-motion';
import { Star, Phone, Trash2, Briefcase } from 'lucide-react';
import type { Vendor } from '@/types/landlord';

interface VendorCardProps {
  vendor: Vendor;
  delay?: number;
  onRemove: (id: string) => void;
}

export const VendorCard = ({ vendor, delay = 0, onRemove }: VendorCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className="bg-white dark:bg-[#1a2a2f] rounded-2xl border border-gray-200 dark:border-white/10 p-4"
    >
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-white">{vendor.name}</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{vendor.serviceType}</p>
        </div>
        <button
          onClick={() => onRemove(vendor.id)}
          className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          title="Remove vendor"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      <div className="flex items-center gap-4 mt-4">
        <div className="flex items-center gap-1">
          <Star className="w-4 h-4 fill-[#c4a747] text-[#c4a747]" />
          <span className="text-sm font-medium text-gray-900 dark:text-white">
            {vendor.rating.toFixed(1)}
          </span>
        </div>
        <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
          <Briefcase className="w-3.5 h-3.5" />
          {vendor.jobsCompleted} jobs
        </div>
      </div>

      <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-gray-100 dark:border-white/5 text-sm text-gray-600 dark:text-gray-300">
        <Phone className="w-3.5 h-3.5 text-gray-400" />
        {vendor.phone}
      </div>
    </motion.div>
  );
};
