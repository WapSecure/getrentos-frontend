import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import Animated, {
  FadeOut,
  ZoomIn,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
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
  RadioGroup,
  Text,
  useReducedMotion,
  useTheme,
  useToast,
  withAlpha,
} from '@sureground/ui-native';
import {
  AUTH_CONSTANTS,
  ONE_ID_CHECK,
  SIGNUP_ROLE_GROUPS,
  needsSharedIdNote,
  signupRequirementLines,
} from '@sureground/shared';
import { errorMessage } from '@/lib/api/client';
import { useAuth } from '@/lib/auth/AuthProvider';
import { useSignup } from '@/lib/auth/SignupContext';
import { signupFieldIssue } from '@/lib/auth/signupErrors';
import { haptics } from '@/lib/haptics';
import { REALTOR_VS_AGENT, SIGNUP_ROLES, type SignupRole, type SignupRoleId } from '@/lib/roles';
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

const roleName = (id: string) => SIGNUP_ROLES.find((r) => r.id === id)?.name ?? id;

function RoleRow({
  role,
  selected,
  multiRole,
  onPress,
}: {
  role: SignupRole;
  selected: boolean;
  multiRole: boolean;
  onPress: () => void;
}) {
  const { colors, spacing, radius } = useTheme();
  const reduceMotion = useReducedMotion();
  const Icon = ICONS[role.icon] ?? Home;
  const tint = useSharedValue(selected ? 1 : 0);

  useEffect(() => {
    tint.value = reduceMotion
      ? selected
        ? 1
        : 0
      : withTiming(selected ? 1 : 0, { duration: 150 });
  }, [selected, reduceMotion, tint]);

  const tintStyle = useAnimatedStyle(() => ({ opacity: tint.value }));

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole={multiRole ? 'checkbox' : 'radio'}
      accessibilityLabel={`${role.name}, ${role.tagline}`}
      accessibilityState={{ checked: selected }}
      aria-checked={selected}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        minHeight: 64,
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.lg,
        backgroundColor: pressed ? colors.secondary : colors.card,
      })}
    >
      <Animated.View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: withAlpha(colors.primary, 0.05) },
          tintStyle,
        ]}
      />
      {selected ? (
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            left: 0,
            top: spacing.md,
            bottom: spacing.md,
            width: 3,
            borderTopRightRadius: 3,
            borderBottomRightRadius: 3,
            backgroundColor: colors.primary,
          }}
        />
      ) : null}
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: radius.lg,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: selected ? withAlpha(colors.primary, 0.1) : colors.secondary,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: selected ? withAlpha(colors.primary, 0.25) : 'transparent',
        }}
      >
        <Icon size={18} color={selected ? colors.primary : colors.mutedForeground} />
      </View>
      <View style={{ flex: 1, gap: spacing.xxs }}>
        <Text variant="callout" style={{ fontWeight: '600' }}>
          {role.name}
        </Text>
        <Text variant="caption" color="mutedForeground">
          {role.tagline}
        </Text>
      </View>
      <View
        style={{
          width: 22,
          height: 22,
          borderRadius: radius.md,
          borderWidth: 1.5,
          borderColor: selected ? colors.primary : colors.border,
          backgroundColor: selected ? colors.primary : 'transparent',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {selected ? (
          <Animated.View
            entering={reduceMotion ? undefined : ZoomIn.duration(140)}
            exiting={reduceMotion ? undefined : FadeOut.duration(100)}
          >
            <Check size={13} color={colors.primaryForeground} strokeWidth={3} />
          </Animated.View>
        ) : null}
      </View>
    </Pressable>
  );
}

function PickSummary({ selected }: { selected: readonly SignupRoleId[] }) {
  const { spacing } = useTheme();
  return (
    <View accessibilityLiveRegion="polite" style={{ marginBottom: spacing.sm }}>
      {selected.length === 0 ? (
        <Text variant="caption" color="mutedForeground">
          Pick everything that fits. You can add more later.
        </Text>
      ) : (
        <Text variant="caption" style={{ fontWeight: '600' }}>
          {selected.map(roleName).join(', ')}
          {selected.length > 1 ? `. You start as ${roleName(selected[0])}.` : ''}
        </Text>
      )}
    </View>
  );
}

function PickRequirements({ selected }: { selected: readonly SignupRoleId[] }) {
  const { spacing } = useTheme();
  const lines = signupRequirementLines(selected);
  if (lines.length === 0) return null;
  return (
    <View style={{ gap: spacing.xxs }}>
      <Text variant="callout" style={{ fontWeight: '600' }} headingLevel={2}>
        Checks we ask for later
      </Text>
      {lines.map((line) => (
        <Text key={line.groupId} variant="caption" color="mutedForeground">
          {line.text}.
        </Text>
      ))}
      {needsSharedIdNote(lines) ? (
        <Text variant="caption" color="mutedForeground">
          {ONE_ID_CHECK}
        </Text>
      ) : null}
    </View>
  );
}

export default function SignUpRoles() {
  const { colors, spacing, radius, shadows } = useTheme();
  const toast = useToast();
  const { initialRolesPending, chooseInitialRoles, skipInitialRoles } = useAuth();
  const {
    draft,
    selectedRoles,
    multiRole,
    toggleRole,
    setPrimaryRole,
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
      subtitle="Pick all that apply. Each one gets its own space."
      progress={social ? undefined : 1}
      progressLabel="Sign-up step 3 of 3"
      onBack={social ? undefined : () => goBack()}
      footer={
        <>
          <PickSummary selected={selectedRoles} />
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
      <View style={{ gap: spacing.xl }}>
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
        {SIGNUP_ROLE_GROUPS.map((group) => (
          <View key={group.id} role="group" aria-label={group.title} style={{ gap: spacing.sm }}>
            <Text
              headingLevel={2}
              variant="callout"
              color="mutedForeground"
              style={{ marginLeft: spacing.xs, fontWeight: '600' }}
            >
              {group.title}
            </Text>
            <View style={[{ borderRadius: radius.xl, backgroundColor: colors.card }, shadows.xs]}>
              <View
                style={{
                  borderRadius: radius.xl,
                  borderWidth: StyleSheet.hairlineWidth,
                  borderColor: colors.border,
                  backgroundColor: colors.card,
                  overflow: 'hidden',
                }}
              >
                {group.roles.map((id, index) => {
                  const role = SIGNUP_ROLES.find((r) => r.id === id);
                  if (!role) return null;
                  return (
                    <View
                      key={id}
                      style={
                        index > 0
                          ? {
                              borderTopWidth: StyleSheet.hairlineWidth,
                              borderTopColor: colors.border,
                            }
                          : undefined
                      }
                    >
                      <RoleRow
                        role={role}
                        selected={selectedRoles.includes(role.id)}
                        multiRole={multiRole}
                        onPress={() => {
                          void haptics.tap();
                          toggleRole(role.id);
                          if (error) setError(null);
                        }}
                      />
                    </View>
                  );
                })}
              </View>
            </View>
            {group.id === 'work' ? (
              <Text
                variant="caption"
                color="mutedForeground"
                style={{ marginHorizontal: spacing.xs }}
              >
                {REALTOR_VS_AGENT}
              </Text>
            ) : null}
          </View>
        ))}
        {selectedRoles.length > 1 ? (
          <RadioGroup
            label="Which do you want to start with?"
            value={selectedRoles[0]}
            onChange={(id) => setPrimaryRole(id)}
            options={selectedRoles.map((id) => ({ value: id, label: roleName(id) }))}
          />
        ) : null}
        <PickRequirements selected={selectedRoles} />
      </View>
    </AuthScaffold>
  );
}
