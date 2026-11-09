'use client';

import { RoleSidebar } from '@/components/shared/dashboard/GroupedSidebar';
import { useSelectedEstate } from '@/app/(dashboard)/estate/layout';
import { estatePlanLock } from '@/lib/navigation/gates';
import { estateNavigation } from '@/lib/navigation/roles/estate';

export const EstateSidebar = () => {
  const { estate } = useSelectedEstate();
  return (
    <RoleSidebar
      config={estateNavigation}
      // The estate's plan, not the viewer's: entitlement comes from the estate owner.
      gates={{ isLocked: estatePlanLock(estate?.planTier) }}
      workspaceLabel={estate?.name ?? estateNavigation.workspaceLabel}
    />
  );
};
