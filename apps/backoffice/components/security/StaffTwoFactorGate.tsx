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

/** Staff can't use admin routes until two-factor is on (STAFF_MFA_REQUIRED), so show set-up in place of the pages; any such refusal re-checks the status. */
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
  // On a failed check keep the pages up: the API still enforces it. Block only when the API would refuse (a demo backend may switch staff two-factor off).
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
