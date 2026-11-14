'use client';

import { NotificationsInbox } from '@/components/shared/notifications/NotificationsInbox';
import { unwrap } from '@/lib/apiHelpers';
import { realtorKeys } from '@/lib/queryKeys';
import { realtorService } from '@/services/realtorService';

export default function RealtorNotificationsPage() {
  return (
    <NotificationsInbox
      portal="realtor"
      queryKey={realtorKeys.notifications}
      fetchPage={(page, pageSize) => unwrap(realtorService.getNotifications({ page, pageSize }))}
      markRead={(id) => unwrap(realtorService.markNotificationRead(id))}
      markAllRead={() => unwrap(realtorService.markAllNotificationsRead())}
    />
  );
}
