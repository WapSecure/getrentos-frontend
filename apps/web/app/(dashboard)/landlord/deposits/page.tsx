'use client';

import { DepositsView } from '@/components/landlord/deposits/DepositsView';
import { LandlordTenanciesNav } from '@/components/shared/navigation/WorkflowNavs';

export default function LandlordDepositsPage() {
  return <DepositsView sectionNav={<LandlordTenanciesNav />} />;
}
