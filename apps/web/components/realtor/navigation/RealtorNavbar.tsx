'use client';

import { useRouter } from 'next/navigation';
import { RealtorProfileDropdown } from './RealtorProfileDropdown';
import { WorkspaceNavbar } from '@/components/shared/navigation/WorkspaceNavbar';
import { realtorNavigation } from '@/lib/navigation/roles/realtor';
import { unwrap } from '@/lib/apiHelpers';
import { realtorKeys } from '@/lib/queryKeys';
import { realtorService } from '@/services/realtorService';
import { ROUTES } from '@/lib/constants/auth';
import { NotificationBell } from '@/components/shared/notifications/NotificationBell';
import { RealtorAssistant } from '../assistant/RealtorAssistant';

interface RealtorNavbarProps {
  user: { fullName: string; email: string } | null;
}

const NOTIFICATIONS_PAGE_SIZE = 50;

export const RealtorNavbar = ({ user }: RealtorNavbarProps) => {
  const router = useRouter();

  return (
    <WorkspaceNavbar
      search={{
        placeholder: 'Search clients, listings, leads...',
        label: 'Search clients, listings and leads',
        onSearch: (query) =>
          router.push(`${ROUTES.REALTOR_LISTINGS}?q=${encodeURIComponent(query)}`),
      }}
      assistant={<RealtorAssistant />}
      notifications={
        <NotificationBell
          portal="realtor"
          queryKey={realtorKeys.notifications}
          pageSize={NOTIFICATIONS_PAGE_SIZE}
          paginate
          fetchNotifications={({ page, pageSize }) =>
            unwrap(realtorService.getNotifications({ page, pageSize }))
          }
          markRead={(id) => unwrap(realtorService.markNotificationRead(id))}
          markAllRead={() => unwrap(realtorService.markAllNotificationsRead())}
          refetchAfterMarking
          realtime={false}
          viewAllHref={ROUTES.REALTOR_DASHBOARD}
        />
      }
      profileMenu={<RealtorProfileDropdown user={user} />}
      navigation={realtorNavigation}
    />
  );
};
