'use client';

import { useParams } from 'next/navigation';
import { SellerAuthorityPanel } from '@/components/land/authority/SellerAuthorityPanel';
import { LandPropertyShell } from '@/components/land/developer/LandPropertyShell';

export default function OwnerLandAuthorityPage() {
  const { propertyId } = useParams<{ propertyId: string }>();
  return (
    <LandPropertyShell propertyId={propertyId} section="authority">
      {() => <SellerAuthorityPanel propertyId={propertyId} />}
    </LandPropertyShell>
  );
}
