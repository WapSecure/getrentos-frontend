import { useEffect, useRef } from 'react';
import { router } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth/AuthProvider';
import { readPushData, registerForPush } from '@/lib/push';
import { routeForNotification } from '@/lib/notificationRoutes';
import { track } from '@/lib/analytics';

export function usePushNotifications() {
  const { status, profile, usablePortal } = useAuth();
  const qc = useQueryClient();
  const registeredFor = useRef<string | null>(null);
  const handled = useRef<string | null>(null);
  const response = Notifications.useLastNotificationResponse();

  useEffect(() => {
    if (status !== 'authenticated' || !profile?.id || !usablePortal) return;
    if (registeredFor.current === profile.id) return;
    registeredFor.current = profile.id;
    registerForPush();
  }, [status, profile?.id, usablePortal]);

  useEffect(() => {
    if (status === 'unauthenticated') registeredFor.current = null;
  }, [status]);

  useEffect(() => {
    const sub = Notifications.addNotificationReceivedListener(() => {
      qc.invalidateQueries({ predicate: (q) => String(q.queryKey[1]).includes('notification') });
    });
    return () => sub.remove();
  }, [qc]);

  // Route only once the user is signed in and routed into their portal.
  useEffect(() => {
    if (!response || status !== 'authenticated' || !usablePortal) return;
    const id = response.notification.request.identifier;
    if (handled.current === id) return;
    handled.current = id;
    const data = readPushData(response);
    track('push_opened', { type: data?.type });
    router.push(routeForNotification(data ?? {}, usablePortal) as never);
  }, [response, status, usablePortal]);
}
