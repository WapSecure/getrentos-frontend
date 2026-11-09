'use client';

import { useEffect, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { PageHeader, PageLoadingState } from '@sureground/ui';
import { onStaffMfaRequired } from '@sureground/shared';
import { adminKeys } from '@/lib/queryKeys';
import {
  STAFF_TWO_FACTOR_EXPLAINER,
  TwoFactorSetup,
  useStaffTwoFactorStatus,
} from './TwoFactorSetup';

/**
 * Staff accounts can't use any admin route until two-factor is on (the API
 * answers STAFF_MFA_REQUIRED). Rather than a wall of failing pages, the
 * signed-in area shows the set-up screen in their place until it is.
 *
 * Any request refused with STAFF_MFA_REQUIRED re-checks the status, so turning
 * two-factor off elsewhere brings the screen straight back.
 */
export function StaffTwoFactorGate({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const status = useStaffTwoFactorStatus();

  useEffect(
    () =>
      onStaffMfaRequired(() => {
        void queryClient.invalidateQueries({ queryKey: adminKeys.twoFactor });
      }),
    [queryClient]
  );

  if (status.isLoading) return <PageLoadingState />;
  // A failed status check leaves the pages up: the API still enforces the rule,
  // and its refusal re-runs this check.
  // Only block when the API itself would refuse: a local demo backend can run
  // with staff two-factor switched off, and the gate must match it.
  if (!status.data || status.data.enabled || status.data.requiredForAdminTools === false)
    return <>{children}</>;

  return (
    <main className="p-6 lg:p-8">
      <div className="mx-auto max-w-2xl space-y-4">
        <PageHeader
          title="Turn on two-factor authentication to continue"
          description={`${STAFF_TWO_FACTOR_EXPLAINER} It takes about a minute. We'll ask you to confirm it's you first.`}
        />
        <TwoFactorSetup gate />
      </div>
    </main>
  );
}
