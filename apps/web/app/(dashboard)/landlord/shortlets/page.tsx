'use client';

import { HostShortletWorkspace } from '@/components/shortlet/HostShortletWorkspace';
import { ProFeatureGate } from '@/components/shared/subscription/ProFeatureGate';

export default function LandlordShortletsPage() {
  return (
    <ProFeatureGate
      title="Shortlet hosting is a Pro feature"
      description="Upgrade to Pro to list, manage bookings, and receive payouts for short-stay units."
    >
      <HostShortletWorkspace role="landlord" />
    </ProFeatureGate>
  );
}
