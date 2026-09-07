import { Stack } from 'expo-router';
import { SignupProvider } from '@/lib/auth/SignupContext';

export default function SignUpLayout() {
  return (
    <SignupProvider>
      <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="verify" />
        <Stack.Screen name="roles" />
      </Stack>
    </SignupProvider>
  );
}
