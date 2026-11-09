'use client';

import { useRouter } from 'next/navigation';
import { BuyerProfileDropdown } from './BuyerProfileDropdown';
import { WorkspaceNavbar } from '@/components/shared/navigation/WorkspaceNavbar';
import { buyerNavigation } from '@/lib/navigation/roles/buyer';
import { unwrap } from '@/lib/apiHelpers';
import { buyerKeys } from '@/lib/queryKeys';
import { buyerService } from '@/services/buyerService';
import { ROUTES } from '@/lib/constants/auth';
import { NotificationBell } from '@/components/shared/notifications/NotificationBell';
import { BuyerAssistant } from '../assistant/BuyerAssistant';

interface BuyerNavbarProps {
  user: { fullName: string; email: string } | null;
}

export const BuyerNavbar = ({ user }: BuyerNavbarProps) => {
  const router = useRouter();

  return (
    <WorkspaceNavbar
      search={{
        placeholder: 'Search properties, locations...',
        label: 'Search properties',
        onSearch: (query) => router.push(`${ROUTES.BUYER_DISCOVER}?q=${encodeURIComponent(query)}`),
      }}
      assistant={<BuyerAssistant />}
      notifications={
        <NotificationBell
          portal="buyer"
          queryKey={buyerKeys.notifications}
          pageSize={20}
          fetchNotifications={() =>
            unwrap(buyerService.getNotifications({ page: 1, pageSize: 20 }))
          }
          markRead={(id) => unwrap(buyerService.markNotificationRead(id))}
          markAllRead={() => unwrap(buyerService.markAllNotificationsRead())}
          refetchAfterMarking
          viewAllHref={ROUTES.BUYER_DASHBOARD}
        />
      }
      profileMenu={<BuyerProfileDropdown user={user} />}
      navigation={buyerNavigation}
    />
  );
};
