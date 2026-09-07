import { Redirect, Stack } from 'expo-router';
import { useAuth } from '@/lib/auth/AuthProvider';

export default function AuthLayout() {
  const { status } = useAuth();
  if (status === 'authenticated') return <Redirect href="/(app)/(renter)" />;

  return <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }} />;
}
