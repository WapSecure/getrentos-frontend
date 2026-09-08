import { Redirect } from 'expo-router';
import { useAuth } from '@/lib/auth/AuthProvider';

/** Entry point: send to the app or the sign-in flow based on the session. */
export default function Index() {
  const { status } = useAuth();
  if (status === 'loading') return null;
  return <Redirect href={status === 'authenticated' ? '/(app)/(renter)' : '/(auth)/welcome'} />;
}
