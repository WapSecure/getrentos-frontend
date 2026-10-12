'use client';

import { useParams } from 'next/navigation';
import { LandPropertyShell } from '@/components/land/developer/LandPropertyShell';
import { RiskBreakdownCard } from '@/components/land/developer/RiskBreakdownCard';
import { SellerAnalyticsPanel } from '@/components/land/developer/SellerAnalyticsPanel';

/** Listing performance, market position and risk for one land parcel. */
export default function OwnerLandAnalyticsPage() {
  const { propertyId } = useParams<{ propertyId: string }>();
  return (
    <LandPropertyShell propertyId={propertyId} section="analytics">
      {() => (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
          <SellerAnalyticsPanel propertyId={propertyId} />
          <RiskBreakdownCard propertyId={propertyId} />
        </div>
      )}
    </LandPropertyShell>
  );
}
