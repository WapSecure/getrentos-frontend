'use client';

import { InspectionsView } from '@/components/landlord/inspections/InspectionsView';
import { LandlordTenanciesNav } from '@/components/shared/navigation/WorkflowNavs';

export default function LandlordInspectionsPage() {
  return <InspectionsView sectionNav={<LandlordTenanciesNav />} />;
}
