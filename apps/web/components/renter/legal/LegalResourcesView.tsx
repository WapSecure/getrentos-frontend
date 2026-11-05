'use client';

import { Alert, PageHeader } from '@getrentos/ui';
import { LegalResourceList } from '@/components/renter/legal/LegalResourceList';

export const LegalResourcesView = () => {
  return (
    <>
      <PageHeader
        title="Legal resources"
        description="General reference guidance on tenant rights, notice periods, deposits, and the eviction process."
      />

      <Alert variant="warning" className="mb-6">
        This is reference guidance, not legal advice. Rules vary by state and by your specific
        lease. Verify with local regulations, and consult a qualified legal professional for
        anything involving an active dispute or case.
      </Alert>

      <LegalResourceList />
    </>
  );
};
