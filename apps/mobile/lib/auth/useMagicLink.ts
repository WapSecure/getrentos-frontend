import { useEffect, useRef } from 'react';
import * as Linking from 'expo-linking';
import { router } from 'expo-router';
import { useToast } from '@sureground/ui-native';
import { errorMessage } from '../api/client';
import { useAuth } from './AuthProvider';

export function useMagicLink() {
  const { signInWithMagicLink } = useAuth();
  const toast = useToast();
  const handled = useRef<Set<string>>(new Set());
  const deps = useRef({ signInWithMagicLink, toast });
  // Latest callbacks in a ref so the listener registers once and never re-subscribes; written in an effect, not during render.
  useEffect(() => {
    deps.current = { signInWithMagicLink, toast };
  });

  useEffect(() => {
    const handle = async (url: string | null) => {
      if (!url) return;
      const { queryParams, path } = Linking.parse(url);
      const token = typeof queryParams?.token === 'string' ? queryParams.token : null;
      const looksLikeMagicLink = !!token && (path?.includes('magic-link') ?? true);
      if (!token || !looksLikeMagicLink || handled.current.has(token)) return;
      handled.current.add(token);

      try {
        const { requiresTwoFactor } = await deps.current.signInWithMagicLink(token);
        if (requiresTwoFactor) router.push('/(auth)/two-factor');
        else deps.current.toast.show('Signed in.', 'success');
      } catch (err) {
        deps.current.toast.show(
          errorMessage(err, 'That sign-in link is invalid or expired.'),
          'error'
        );
      }
    };

    Linking.getInitialURL().then(handle);
    const sub = Linking.addEventListener('url', ({ url }) => handle(url));
    return () => sub.remove();
  }, []);
}
