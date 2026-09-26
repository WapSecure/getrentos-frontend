import { useEffect, useRef } from 'react';
import { router } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth/AuthProvider';
import { readPushData, registerForPush } from '@/lib/push';
import { routeForNotification } from '@/lib/notificationRoutes';
import { track } from '@/lib/analytics';

/**
 * Registers the phone for push once a user can use the app, and opens the right
 * screen when a notification is tapped — whether the app was running or the tap
 * launched it.
 */
export function usePushNotifications() {
  const { status, profile, usablePortal } = useAuth();
  const qc = useQueryClient();
  const registeredFor = useRef<string | null>(null);
  const handled = useRef<string | null>(null);
  const response = Notifications.useLastNotificationResponse();

  // Register once per signed-in user (re-registers if someone else signs in).
  useEffect(() => {
    if (status !== 'authenticated' || !profile?.id || !usablePortal) return;
    if (registeredFor.current === profile.id) return;
    registeredFor.current = profile.id;
    registerForPush();
  }, [status, profile?.id, usablePortal]);

  useEffect(() => {
    if (status === 'unauthenticated') registeredFor.current = null;
  }, [status]);

  // A new notification while open: refresh anything that might show it.
  useEffect(() => {
    const sub = Notifications.addNotificationReceivedListener(() => {
      qc.invalidateQueries({ predicate: (q) => String(q.queryKey[1]).includes('notification') });
    });
    return () => sub.remove();
  }, [qc]);

  // Tapped: route once the user is signed in and routed into their portal.
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
