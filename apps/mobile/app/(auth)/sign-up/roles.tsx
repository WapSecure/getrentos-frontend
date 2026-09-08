import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import {
  Home,
  Building2,
  TrendingUp,
  Search,
  Users,
  UserCheck,
  Check,
  type LucideIcon,
} from 'lucide-react-native';
import { AuthScaffold, Button, PressableScale, Text, useTheme } from '@getrentos/ui-native';
import { ApiError } from '@/lib/api/client';
import { useSignup } from '@/lib/auth/SignupContext';
import { haptics } from '@/lib/haptics';
import { SIGNUP_ROLES, type SignupRoleId } from '@/lib/roles';

const ICONS: Record<string, LucideIcon> = {
  Home,
  Building2,
  TrendingUp,
  Search,
  Users,
  UserCheck,
};

export default function SignUpRoles() {
  const { colors, spacing, radius } = useTheme();
  const { draft, selectedRoles, multiRole, toggleRole, setMultiRole, createAccount } = useSignup();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!draft) router.replace('/(auth)/sign-up');
  }, [draft]);

  const submit = async () => {
    if (selectedRoles.length === 0 || busy) return;
    setBusy(true);
    setError(null);
    try {
      await createAccount();
      await haptics.success();
      // AuthProvider flips to authenticated → (auth) layout redirects into the app.
    } catch (err) {
      await haptics.error();
      setError(err instanceof ApiError ? err.message : 'Could not create your account. Try again.');
      setBusy(false);
    }
  };

  return (
    <AuthScaffold
      kicker="Almost there"
      title="How will you use GetRentos?"
      subtitle="Pick what fits today — you can add more roles later, with supporting documents."
      progress={1}
      onBack={() => router.back()}
      footer={
        <>
          <PressableScale
            haptic
            onPress={() => setMultiRole(!multiRole)}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingVertical: spacing.xs,
            }}
          >
            <Text variant="callout" color="mutedForeground">
              I’ll use it in more than one way
            </Text>
            <View
              style={{
                width: 46,
                height: 28,
                borderRadius: 14,
                padding: 3,
                backgroundColor: multiRole ? colors.primary : colors.border,
                alignItems: multiRole ? 'flex-end' : 'flex-start',
              }}
            >
              <View
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: 11,
                  backgroundColor: colors.card,
                }}
              />
            </View>
          </PressableScale>
          <Button
            label={`Create account${selectedRoles.length > 1 ? ` · ${selectedRoles.length} roles` : ''}`}
            loading={busy}
            disabled={selectedRoles.length === 0}
            onPress={submit}
          />
          {error ? (
            <Text variant="callout" color="destructive" center>
              {error}
            </Text>
          ) : null}
        </>
      }
    >
      <View style={{ gap: spacing.md }}>
        {SIGNUP_ROLES.map((role, i) => {
          const Icon = ICONS[role.icon] ?? Home;
          const selected = selectedRoles.includes(role.id as SignupRoleId);
          return (
            <Animated.View key={role.id} entering={FadeInDown.duration(280).delay(i * 45)}>
              <PressableScale
                onPress={() => toggleRole(role.id)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: spacing.md,
                  padding: spacing.lg,
                  borderRadius: radius.lg,
                  borderWidth: 1.5,
                  borderColor: selected ? colors.primary : colors.border,
                  backgroundColor: selected ? colors.accent : colors.card,
                }}
              >
                <View
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 13,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: selected ? colors.primary : colors.secondary,
                  }}
                >
                  <Icon
                    size={20}
                    color={selected ? colors.primaryForeground : colors.mutedForeground}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text variant="bodyStrong">{role.name}</Text>
                  <Text variant="caption" color="mutedForeground">
                    {role.tagline}
                  </Text>
                </View>
                <View
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: 11,
                    borderWidth: 1.5,
                    borderColor: selected ? colors.primary : colors.border,
                    backgroundColor: selected ? colors.primary : 'transparent',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {selected ? (
                    <Check size={13} color={colors.primaryForeground} strokeWidth={3} />
                  ) : null}
                </View>
              </PressableScale>
            </Animated.View>
          );
        })}
      </View>
    </AuthScaffold>
  );
}
