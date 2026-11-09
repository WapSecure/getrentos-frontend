'use client';

import { useRouter } from 'next/navigation';
import { OwnerProfileDropdown } from './OwnerProfileDropdown';
import { WorkspaceNavbar } from '@/components/shared/navigation/WorkspaceNavbar';
import { ownerNavigation } from '@/lib/navigation/roles/owner';
import { unwrap } from '@/lib/apiHelpers';
import { ownerKeys } from '@/lib/queryKeys';
import { ownerService } from '@/services/ownerService';
import { ROUTES } from '@/lib/constants/auth';
import { NotificationBell } from '@/components/shared/notifications/NotificationBell';
import { OwnerAssistant } from '../assistant/OwnerAssistant';

interface OwnerNavbarProps {
  user: { fullName: string; email: string } | null;
}

export const OwnerNavbar = ({ user }: OwnerNavbarProps) => {
  const router = useRouter();

  return (
    <WorkspaceNavbar
      search={{
        placeholder: 'Search properties, buyers...',
        onSearch: (query) =>
          router.push(`${ROUTES.OWNER_PROPERTIES}?q=${encodeURIComponent(query)}`),
      }}
      assistant={<OwnerAssistant />}
      notifications={
        <NotificationBell
          portal="owner"
          queryKey={ownerKeys.notifications}
          pageSize={50}
          fetchNotifications={() =>
            unwrap(ownerService.getNotifications({ page: 1, pageSize: 50 }))
          }
          markRead={(id) => unwrap(ownerService.markNotificationRead(id))}
          markAllRead={() => unwrap(ownerService.markAllNotificationsRead())}
          refetchAfterMarking
          viewAllHref={ROUTES.OWNER_DASHBOARD}
        />
      }
      profileMenu={<OwnerProfileDropdown user={user} />}
      navigation={ownerNavigation}
    />
  );
};
