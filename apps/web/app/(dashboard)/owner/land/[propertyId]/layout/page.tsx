'use client';

import { useParams } from 'next/navigation';
import { LandPropertyShell } from '@/components/land/developer/LandPropertyShell';
import { LayoutWorkspace } from '@/components/land/developer/LayoutWorkspace';

/** A developer's estate layout on one land parcel: plots, payment plans and inventory. */
export default function OwnerLandLayoutPage() {
  const { propertyId } = useParams<{ propertyId: string }>();
  return (
    <LandPropertyShell propertyId={propertyId} section="layout">
      {(record) => <LayoutWorkspace record={record} />}
    </LandPropertyShell>
  );
}
