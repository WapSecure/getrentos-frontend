'use client';

import { MandateListView } from '@/components/agency/MandateListView';
import { AgencyTransfersCard } from '@/components/agency/AgencyTransfersCard';

export default function AgencyMandatesPage() {
  return (
    <>
      <AgencyTransfersCard />
      <MandateListView />
    </>
  );
}
