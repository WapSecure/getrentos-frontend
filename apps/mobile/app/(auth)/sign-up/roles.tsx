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
  Briefcase,
  Check,
  type SgIcon,
} from '@sureground/icons/native';
import {
  AuthScaffold,
  Button,
  FormAlert,
  LinkButton,
  PasswordField,
  PressableScale,
  Text,
  useReducedMotion,
  useTheme,
  useToast,
} from '@sureground/ui-native';
import { AUTH_CONSTANTS } from '@sureground/shared';
import { errorMessage } from '@/lib/api/client';
import { useAuth } from '@/lib/auth/AuthProvider';
import { useSignup } from '@/lib/auth/SignupContext';
import { signupFieldIssue } from '@/lib/auth/signupErrors';
import { haptics } from '@/lib/haptics';
import { REALTOR_VS_AGENT, SIGNUP_ROLES, VERIFICATION_LABEL, type SignupRoleId } from '@/lib/roles';
import { goBack } from '@/lib/goBack';

const ICONS: Record<string, SgIcon> = {
  Home,
  Building2,
  TrendingUp,
  Search,
  Users,
  UserCheck,
  Briefcase,
};

export default function SignUpRoles() {
  const { colors, spacing, radius } = useTheme();
  const reduceMotion = useReducedMotion();
  const toast = useToast();
  const { initialRolesPending, chooseInitialRoles, skipInitialRoles } = useAuth();
  const {
    draft,
    selectedRoles,
    multiRole,
    toggleRole,
    setMultiRole,
    createAccount,
    reset,
    setIssue,
  } = useSignup();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // A new Google or Apple account has no sign-up draft: it only picks its roles here.
  const social = initialRolesPending;
  const needsPassword = !social && !!draft && !draft.password;

  useEffect(() => {
    if (!draft && !social) router.replace('/(auth)/sign-up');
  }, [draft, social]);

  const submit = async () => {
    if (busy) return;
    if (selectedRoles.length === 0) {
      setError('Pick at least one way you’ll use Sureground.');
      await haptics.error();
      return;
    }
    if (needsPassword && password.length < AUTH_CONSTANTS.PASSWORD_MIN_LENGTH) {
      setPasswordError(
        `Enter your password: at least ${AUTH_CONSTANTS.PASSWORD_MIN_LENGTH} characters.`
      );
      await haptics.error();
      return;
    }
    setBusy(true);
    setError(null);
    try {
      if (social) {
        const applied = await chooseInitialRoles(selectedRoles);
        if (!applied) {
          toast.show('Your account is set up for renting. Add other roles from Account.', 'info');
        }
      } else {
        await createAccount(needsPassword ? password : undefined);
      }
      await haptics.success();
      // AuthProvider flips to authenticated → the root router takes them into the app.
    } catch (err) {
      await haptics.error();
      setBusy(false);
      const found = draft ? signupFieldIssue(err, draft.method) : null;
      if (found) {
        // Back to step 1 with everything still filled in, the refusal on its field.
        setIssue(found);
        router.dismissTo('/(auth)/sign-up');
        return;
      }
      setError(errorMessage(err, 'Could not create your account. Try again.'));
    }
  };

  return (
    <AuthScaffold
      kicker={social ? 'Almost there' : 'Step 3 of 3'}
      title="How will you use Sureground?"
      subtitle="Pick what fits today. You can add more later, with supporting documents."
      progress={social ? undefined : 1}
      progressLabel="Sign-up step 3 of 3"
      onBack={social ? undefined : () => goBack()}
      footer={
        <>
          <PressableScale
            haptic
            onPress={() => setMultiRole(!multiRole)}
            accessibilityRole="switch"
            accessibilityLabel="I’ll use it in more than one way"
            accessibilityState={{ checked: multiRole }}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              minHeight: 44,
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
          <Button label={social ? 'Continue' : 'Create account'} loading={busy} onPress={submit} />
          <FormAlert message={error} />
        </>
      }
      footerSecondary={
        <View style={{ alignItems: 'center' }}>
          {social ? (
            <LinkButton label="Not now" tone="muted" onPress={skipInitialRoles} />
          ) : (
            <LinkButton
              label="Start over"
              tone="muted"
              onPress={() => {
                reset();
                router.replace('/(auth)/sign-up');
              }}
            />
          )}
        </View>
      }
    >
      <View style={{ gap: spacing.md }}>
        {needsPassword ? (
          <PasswordField
            label="Password"
            hint="Enter the password you chose a moment ago. We don’t keep it while you verify."
            autoComplete="new-password"
            textContentType="newPassword"
            value={password}
            onChangeText={(v) => {
              setPassword(v);
              if (passwordError) setPasswordError(null);
            }}
            error={passwordError}
          />
        ) : null}
        {SIGNUP_ROLES.map((role, i) => {
          const Icon = ICONS[role.icon] ?? Home;
          const selected = selectedRoles.includes(role.id as SignupRoleId);
          return (
            <Animated.View
              key={role.id}
              entering={reduceMotion ? undefined : FadeInDown.duration(280).delay(i * 45)}
            >
              <PressableScale
                onPress={() => {
                  toggleRole(role.id);
                  if (error) setError(null);
                }}
                accessibilityRole={multiRole ? 'checkbox' : 'radio'}
                accessibilityLabel={`${role.name}. ${role.tagline}`}
                accessibilityHint={
                  role.requires.length
                    ? role.requires.map((req) => VERIFICATION_LABEL[req]).join(', ')
                    : undefined
                }
                accessibilityState={{ checked: selected }}
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
                    borderRadius: radius.md,
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
                <View style={{ flex: 1, gap: 5 }}>
                  <Text variant="bodyStrong">{role.name}</Text>
                  <Text variant="caption" color="mutedForeground">
                    {role.tagline}
                  </Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
                    {role.requires.map((req) => (
                      <View
                        key={req}
                        style={{
                          paddingVertical: 2,
                          paddingHorizontal: 7,
                          borderRadius: radius.full,
                          backgroundColor: colors.secondary,
                        }}
                      >
                        <Text variant="caption" color="mutedForeground">
                          {VERIFICATION_LABEL[req]}
                        </Text>
                      </View>
                    ))}
                  </View>
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
        <Text variant="caption" color="mutedForeground">
          {REALTOR_VS_AGENT}
        </Text>
      </View>
    </AuthScaffold>
  );
}
