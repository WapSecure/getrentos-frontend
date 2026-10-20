'use client';

import { Scale } from 'lucide-react';
import { Alert } from '@getrentos/ui';
import { LegalResourceList } from '@/components/renter/legal/LegalResourceList';

export const LegalResourcesView = () => {
  return (
    <>
      <div className="mb-6 flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent text-primary">
          <Scale className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-foreground">Legal Resources</h1>
          <p className="text-muted-foreground mt-1">
            General reference guidance on tenant rights, notice periods, deposits, and the eviction
            process.
          </p>
        </div>
      </div>

      <Alert variant="warning" className="mb-6">
        This is reference guidance, not legal advice. Rules vary by state and by your specific
        lease. Verify with local regulations, and consult a qualified legal professional for
        anything involving an active dispute or case.
      </Alert>

      <LegalResourceList />
    </>
  );
};
