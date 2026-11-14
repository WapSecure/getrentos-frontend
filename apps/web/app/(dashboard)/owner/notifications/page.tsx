'use client';

import { NotificationsInbox } from '@/components/shared/notifications/NotificationsInbox';
import { unwrap } from '@/lib/apiHelpers';
import { ownerKeys } from '@/lib/queryKeys';
import { ownerService } from '@/services/ownerService';

export default function OwnerNotificationsPage() {
  return (
    <NotificationsInbox
      portal="owner"
      queryKey={ownerKeys.notifications}
      fetchPage={(page, pageSize) => unwrap(ownerService.getNotifications({ page, pageSize }))}
      markRead={(id) => unwrap(ownerService.markNotificationRead(id))}
      markAllRead={() => unwrap(ownerService.markAllNotificationsRead())}
    />
  );
}
