'use client';

import type { SgIcon } from '@sureground/icons';
import { Button, EmptyState } from '@sureground/ui';
import { ROUTES } from '@/lib/constants/auth';
import { useGatemanUser } from '@/app/(dashboard)/gateman/layout';

export function NotAssignedToEstate({ icon }: { icon: SgIcon }) {
  const user = useGatemanUser();
  const managesEstate = (user?.roles ?? []).includes('ESTATE_MANAGER');

  return (
    <EmptyState
      icon={icon}
      title="You're not assigned to an estate yet"
      description="Ask your estate manager to add you to the estate's gate staff. The gate console opens here once they do."
      action={
        managesEstate ? (
          <Button href={ROUTES.ESTATE_DASHBOARD} variant="outline">
            Open your estate console
          </Button>
        ) : undefined
      }
    />
  );
}
