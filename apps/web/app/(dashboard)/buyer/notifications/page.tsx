'use client';

import { NotificationsInbox } from '@/components/shared/notifications/NotificationsInbox';
import { unwrap } from '@/lib/apiHelpers';
import { buyerKeys } from '@/lib/queryKeys';
import { buyerService } from '@/services/buyerService';

export default function BuyerNotificationsPage() {
  return (
    <NotificationsInbox
      portal="buyer"
      queryKey={buyerKeys.notifications}
      fetchPage={(page, pageSize) => unwrap(buyerService.getNotifications({ page, pageSize }))}
      markRead={(id) => unwrap(buyerService.markNotificationRead(id))}
      markAllRead={() => unwrap(buyerService.markAllNotificationsRead())}
    />
  );
}
