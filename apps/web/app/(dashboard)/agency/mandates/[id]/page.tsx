'use client';

import { MandateDetailView } from '@/components/agency/MandateDetailView';

/**
 * One engagement. `MandateListView` links here, so this route has to exist —
 * before it did, every "Details" link 404'd.
 */
export default function AgencyMandateDetailPage() {
  return <MandateDetailView />;
}
