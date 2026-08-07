'use client';

import { MapPin } from 'lucide-react';

export const DiscoverMapView = () => {
  return (
    <div className="bg-white dark:bg-[#1a2a2f] rounded-xl border border-gray-200 dark:border-white/10 overflow-hidden h-[600px] flex items-center justify-center">
      <div className="text-center">
        <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-3" />
        <p className="text-gray-500 dark:text-gray-400">Map view coming soon</p>
        <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
          Interactive map will be available in the next update
        </p>
      </div>
    </div>
  );
};
