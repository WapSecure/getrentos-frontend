import { useEffect, useRef } from 'react';
import { Alert } from 'react-native';
import * as Linking from 'expo-linking';
import { router } from 'expo-router';
import { useToast } from '@sureground/ui-native';
import { magicLinkToken } from '../deepLinks';
import { useAuth } from './AuthProvider';
import { signInErrorMessage } from './signupErrors';

type Status = ReturnType<typeof useAuth>['status'];

export function useMagicLink() {
  const { status, signInWithMagicLink, signOut } = useAuth();
  const toast = useToast();
  const handled = useRef<Set<string>>(new Set());
  const pending = useRef<string | null>(null);
  const deps = useRef({ status: status as Status, signInWithMagicLink, signOut, toast });

  const process = useRef(() => {
    const { status: current } = deps.current;
    // Wait for the stored session to load, or a signed-in user would be swapped without being asked.
    if (!pending.current || current === 'loading') return;
    const token = pending.current;
    pending.current = null;

    const signIn = async (replacing: boolean) => {
      try {
        // A full sign-out first, so nothing cached for the old account survives into the new one.
        if (replacing) await deps.current.signOut();
        const { requiresTwoFactor } = await deps.current.signInWithMagicLink(token);
        if (requiresTwoFactor) router.push('/(auth)/two-factor');
        else deps.current.toast.show('Signed in.', 'success');
      } catch (err) {
        deps.current.toast.show(
          signInErrorMessage(err, 'That sign-in link is invalid or expired.'),
          'error'
        );
      }
    };

    if (current !== 'authenticated') {
      void signIn(false);
      return;
    }

    // The API can't name the link's account without using up the token, so the question stays generic.
    Alert.alert(
      'Sign in as a different account?',
      'You’ll be signed out of the current one.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign in', style: 'destructive', onPress: () => void signIn(true) },
      ],
      { cancelable: true }
    );
  });

  // Latest values in a ref so the listener registers once and never re-subscribes; written in an effect, not during render.
  useEffect(() => {
    deps.current = { status, signInWithMagicLink, signOut, toast };
    process.current();
  });

  useEffect(() => {
    const capture = (url: string | null) => {
      const token = url ? magicLinkToken(url) : null;
      if (!token || handled.current.has(token)) return;
      handled.current.add(token);
      pending.current = token;
      process.current();
    };

    Linking.getInitialURL().then(capture);
    const sub = Linking.addEventListener('url', ({ url }) => capture(url));
    return () => sub.remove();
  }, []);
}
