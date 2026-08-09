'use client';

import { MapPin } from 'lucide-react';

export const DiscoverMapView = () => {
  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden h-[600px] flex items-center justify-center">
      <div className="text-center">
        <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-3" />
        <p className="text-muted-foreground">Map view coming soon</p>
        <p className="text-sm text-muted-foreground mt-1">
          Interactive map will be available in the next update
        </p>
      </div>
    </div>
  );
};
