'use client';

import { usePathname, useRouter } from 'next/navigation';
import { LandlordProfileDropdown } from './LandlordProfileDropdown';
import { WorkspaceNavbar } from '@/components/shared/navigation/WorkspaceNavbar';
import { landlordNavigation } from '@/lib/navigation/roles/landlord';
import { unwrap } from '@/lib/apiHelpers';
import { landlordKeys } from '@/lib/queryKeys';
import { landlordService } from '@/services/landlordService';
import { ROUTES } from '@/lib/constants/auth';
import { NotificationBell } from '@/components/shared/notifications/NotificationBell';
import { LandlordAssistant } from '../assistant/LandlordAssistant';
import { ManagerAssistant } from '@/components/agency/assistant/ManagerAssistant';
import { useViewerPlanLock } from '@/lib/navigation/gates';

interface LandlordNavbarProps {
  user: { fullName: string; email: string; roles?: string[] } | null;
}

export const LandlordNavbar = ({ user }: LandlordNavbarProps) => {
  const isLocked = useViewerPlanLock();
  const router = useRouter();
  const pathname = usePathname();
  // The agency workspace borrows this navbar: there, and for a manager without
  // a landlord role, questions are about the firm's book, not a landlord's own.
  const roles = user?.roles ?? [];
  const asManager =
    pathname?.startsWith('/agency') ||
    (roles.includes('PROPERTY_MANAGER') && !roles.includes('LANDLORD'));

  return (
    <WorkspaceNavbar
      search={{
        placeholder: 'Search properties, tenants...',
        label: 'Search properties and tenants',
        onSearch: (query) =>
          router.push(`${ROUTES.LANDLORD_PROPERTIES}?q=${encodeURIComponent(query)}`),
      }}
      assistant={asManager ? <ManagerAssistant /> : <LandlordAssistant />}
      notifications={
        <NotificationBell
          portal="landlord"
          queryKey={landlordKeys.notifications}
          fetchNotifications={() => unwrap(landlordService.getNotifications())}
          markRead={(id) => unwrap(landlordService.markNotificationRead(id))}
          markAllRead={() => unwrap(landlordService.markAllNotificationsRead())}
          refetchAfterMarking
          viewAllHref={ROUTES.LANDLORD_DASHBOARD}
        />
      }
      profileMenu={<LandlordProfileDropdown user={user} />}
      navigation={landlordNavigation}
      navigationGates={{ isLocked }}
    />
  );
};
