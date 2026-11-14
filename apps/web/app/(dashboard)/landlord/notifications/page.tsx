'use client';

import { NotificationsInbox } from '@/components/shared/notifications/NotificationsInbox';
import { unwrap } from '@/lib/apiHelpers';
import { landlordKeys } from '@/lib/queryKeys';
import { landlordService } from '@/services/landlordService';

export default function LandlordNotificationsPage() {
  return (
    <NotificationsInbox
      portal="landlord"
      queryKey={landlordKeys.notifications}
      fetchPage={() => unwrap(landlordService.getNotifications())}
      markRead={(id) => unwrap(landlordService.markNotificationRead(id))}
      markAllRead={() => unwrap(landlordService.markAllNotificationsRead())}
    />
  );
}
