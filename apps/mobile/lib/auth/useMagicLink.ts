import { useEffect, useRef } from 'react';
import * as Linking from 'expo-linking';
import { useToast } from '@getrentos/ui-native';
import { ApiError } from '../api/client';
import { useAuth } from './AuthProvider';

/**
 * Catches an incoming magic-link deep link — `getrentos://magic-link?token=…`
 * (or a universal link with the same query) — and exchanges it for a session.
 *
 * The listener is registered exactly once; the handler reads the latest
 * callbacks through a ref so this effect never re-subscribes on re-render.
 */
export function useMagicLink() {
  const { signInWithMagicLink } = useAuth();
  const toast = useToast();
  const handled = useRef<Set<string>>(new Set());
  const deps = useRef({ signInWithMagicLink, toast });
  deps.current = { signInWithMagicLink, toast };

  useEffect(() => {
    const handle = async (url: string | null) => {
      if (!url) return;
      const { queryParams, path } = Linking.parse(url);
      const token = typeof queryParams?.token === 'string' ? queryParams.token : null;
      const looksLikeMagicLink = !!token && (path?.includes('magic-link') ?? true);
      if (!token || !looksLikeMagicLink || handled.current.has(token)) return;
      handled.current.add(token);

      try {
        await deps.current.signInWithMagicLink(token);
        deps.current.toast.show('Signed in.', 'success');
      } catch (err) {
        deps.current.toast.show(
          err instanceof ApiError ? err.message : 'That sign-in link is invalid or expired.',
          'error'
        );
      }
    };

    Linking.getInitialURL().then(handle);
    const sub = Linking.addEventListener('url', ({ url }) => handle(url));
    return () => sub.remove();
  }, []);
}
