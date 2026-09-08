import { useEffect, useRef } from 'react';
import * as Linking from 'expo-linking';
import { useToast } from '@getrentos/ui-native';
import { ApiError } from '../api/client';
import { useAuth } from './AuthProvider';

/**
 * Catches an incoming magic-link deep link — `getrentos://magic-link?token=…`
 * (or a universal link with the same query) — and exchanges it for a session.
 *
 * Backend note: `/auth/magic-link/send` must be told to build the link with the
 * `getrentos://` scheme (a `redirectTo` param) for this to fire on device.
 */
export function useMagicLink() {
  const { signInWithMagicLink, status } = useAuth();
  const toast = useToast();
  const handled = useRef<Set<string>>(new Set());

  useEffect(() => {
    const handle = async (url: string | null) => {
      if (!url) return;
      const { queryParams, path } = Linking.parse(url);
      const token = typeof queryParams?.token === 'string' ? queryParams.token : null;
      const looksLikeMagicLink = !!token && (path?.includes('magic-link') ?? true);
      if (!token || !looksLikeMagicLink || handled.current.has(token)) return;
      handled.current.add(token);

      try {
        await signInWithMagicLink(token);
        toast.show('Signed in.', 'success');
      } catch (err) {
        toast.show(
          err instanceof ApiError ? err.message : 'That sign-in link is invalid or expired.',
          'error'
        );
      }
    };

    // Cold start: the app was opened by the link.
    Linking.getInitialURL().then(handle);
    // Warm: link arrived while the app was running.
    const sub = Linking.addEventListener('url', ({ url }) => handle(url));
    return () => sub.remove();
  }, [signInWithMagicLink, status, toast]);
}
