import { useEffect, useState } from 'react';
import { Alert, Image, Pressable, ScrollView, Switch, View } from 'react-native';
import { router } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ChevronRight,
  Database,
  KeyRound,
  Mail,
  Phone,
  ScanFace,
  ShieldCheck,
  Trash2,
} from 'lucide-react-native';
import {
  Badge,
  Button,
  Card,
  Divider,
  ErrorState,
  PasswordField,
  Skeleton,
  Text,
  TextField,
  useTheme,
  useToast,
} from '@getrentos/ui-native';
import { qk } from '@/lib/query/keys';
import { securityApi, type SecurityOverview, type TwoFactorEnrollment } from '@/lib/api/security';
import { ApiError } from '@/lib/api/client';
import { useAuth } from '@/lib/auth/AuthProvider';
import {
  biometricSupport,
  unlockWithBiometrics,
  useAppLockEnabled,
  type BiometricSupport,
} from '@/lib/appLock';
import { DetailScreenHeader } from '@/components/dashboard/DetailScreenHeader';
import { ChangeEmailSheet } from '@/components/account/ChangeEmailSheet';

export default function SecuritySettings() {
  const { colors, spacing } = useTheme();
  const insets = useSafeAreaInsets();
  const { profile } = useAuth();
  const overview = useQuery({ queryKey: qk.security, queryFn: securityApi.overview });
  // The export covers renting data (applications, leases, payments) and is renter-only.
  const isRenter = profile?.roles.includes('RENTER') ?? false;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <DetailScreenHeader
        eyebrow="Account protection"
        title="Security"
        subtitle="Identity, password and two-factor authentication"
        onBack={() => router.back()}
      />

      <ScrollView
        contentContainerStyle={{
          padding: spacing.xl,
          paddingBottom: insets.bottom + spacing['3xl'],
          gap: spacing.lg,
        }}
      >
        <AppLockSection />
        {overview.isError && !overview.data ? (
          <ErrorState onRetry={() => overview.refetch()} />
        ) : !overview.data ? (
          <Skeleton height={180} />
        ) : (
          <>
            <EmailSection />
            <PhoneVerificationSection overview={overview.data} />
            <TwoFactorSection overview={overview.data} />
            {overview.data.hasPassword ? <PasswordSection /> : <SocialOnlyNote />}
            {isRenter ? <DataExportSection /> : null}
            {overview.data.hasPassword ? <DangerSection /> : null}
          </>
        )}
      </ScrollView>
    </View>
  );
}

/** Face ID / fingerprint before the app opens: on this phone only. */
function AppLockSection() {
  const { colors, spacing } = useTheme();
  const toast = useToast();
  const { enabled, setEnabled } = useAppLockEnabled();
  const [support, setSupport] = useState<BiometricSupport | null>(null);

  useEffect(() => {
    biometricSupport().then(setSupport);
  }, []);

  if (!support) return null;

  const toggle = async (next: boolean) => {
    if (next) {
      // Prove it works before relying on it, so nobody locks themselves out.
      const ok = await unlockWithBiometrics(`Turn on ${support.label} for GetRentos`);
      if (!ok) return;
      toast.show(`${support.label} lock is on.`, 'success');
    }
    setEnabled(next);
  };

  return (
    <Card elevated>
      <SectionHeader
        icon={<ScanFace size={16} color={colors.primary} />}
        title={`${support.label.charAt(0).toUpperCase()}${support.label.slice(1)} lock`}
      />
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
        <Text variant="callout" color="mutedForeground" style={{ flex: 1 }}>
          {support.available
            ? `Ask for ${support.label} when GetRentos opens, or after a minute away.`
            : `Set up ${support.label} or a screen lock in your phone's settings to use this.`}
        </Text>
        <Switch
          value={!!enabled}
          disabled={!support.available}
          onValueChange={toggle}
          accessibilityLabel={`${support.label} lock`}
          trackColor={{ true: colors.primary, false: colors.border }}
        />
      </View>
    </Card>
  );
}

function SectionHeader({ icon, title }: { icon: React.ReactNode; title: string }) {
  const { spacing } = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        marginBottom: spacing.sm,
      }}
    >
      {icon}
      <Text variant="bodyStrong">{title}</Text>
    </View>
  );
}

function EmailSection() {
  const { colors, spacing } = useTheme();
  const { profile } = useAuth();
  const [open, setOpen] = useState(false);
  return (
    <Card elevated>
      <SectionHeader icon={<Mail size={16} color={colors.primary} />} title="Sign-in email" />
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
        <Text variant="callout" color="mutedForeground" style={{ flex: 1 }} numberOfLines={1}>
          {profile?.email ?? 'No email on this account'}
        </Text>
        <Button label="Change" size="sm" variant="secondary" onPress={() => setOpen(true)} />
      </View>
      <ChangeEmailSheet open={open} onClose={() => setOpen(false)} />
    </Card>
  );
}

function PhoneVerificationSection({ overview }: { overview: SecurityOverview }) {
  const { colors, spacing } = useTheme();
  const toast = useToast();
  const qc = useQueryClient();
  const [reference, setReference] = useState<string | null>(null);
  const [otp, setOtp] = useState('');

  const sendMutation = useMutation({
    mutationFn: securityApi.sendPhoneVerification,
    onSuccess: (res) => {
      setReference(res.reference);
      toast.show('Verification code sent.', 'success');
    },
    onError: (err) =>
      toast.show(
        err instanceof ApiError ? err.message : 'Could not send a code right now.',
        'error'
      ),
  });

  const confirmMutation = useMutation({
    mutationFn: () => securityApi.confirmPhoneVerification(reference!, otp),
    onSuccess: () => {
      qc.setQueryData<SecurityOverview>(qk.security, (old) =>
        old ? { ...old, phoneVerified: true } : old
      );
      setReference(null);
      setOtp('');
      toast.show('Phone number verified.', 'success');
    },
    onError: (err) =>
      toast.show(err instanceof ApiError ? err.message : 'That code is incorrect.', 'error'),
  });

  if (!overview.phone) return null;

  return (
    <Card elevated>
      <SectionHeader icon={<Phone size={16} color={colors.primary} />} title="Phone number" />
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text variant="callout" color="mutedForeground">
          {overview.phone}
        </Text>
        {overview.phoneVerified ? (
          <Badge label="Verified" tone="success" />
        ) : reference ? null : (
          <Button
            label="Verify"
            size="sm"
            variant="secondary"
            loading={sendMutation.isPending}
            onPress={() => sendMutation.mutate()}
          />
        )}
      </View>
      {!overview.phoneVerified && reference ? (
        <View style={{ gap: spacing.sm, marginTop: spacing.md }}>
          <TextField
            label="6-digit code"
            value={otp}
            onChangeText={setOtp}
            keyboardType="number-pad"
            maxLength={6}
          />
          <Button
            label="Confirm code"
            loading={confirmMutation.isPending}
            disabled={otp.length !== 6}
            onPress={() => confirmMutation.mutate()}
          />
        </View>
      ) : null}
    </Card>
  );
}

function TwoFactorSection({ overview }: { overview: SecurityOverview }) {
  const { colors, spacing } = useTheme();
  const toast = useToast();
  const qc = useQueryClient();
  const setTwoFactor = (enabled: boolean) =>
    qc.setQueryData<SecurityOverview>(qk.security, (old) =>
      old ? { ...old, twoFactor: { enrolled: enabled, enabled } } : old
    );
  const [enrollment, setEnrollment] = useState<TwoFactorEnrollment | null>(null);
  const [token, setToken] = useState('');
  const [disableToken, setDisableToken] = useState('');
  const [showDisable, setShowDisable] = useState(false);

  const enrollMutation = useMutation({
    mutationFn: securityApi.enrollTwoFactor,
    onSuccess: setEnrollment,
    onError: (err) =>
      toast.show(
        err instanceof ApiError ? err.message : 'Could not start 2FA enrollment.',
        'error'
      ),
  });

  const enableMutation = useMutation({
    mutationFn: () => securityApi.enableTwoFactor(token),
    onSuccess: () => {
      setTwoFactor(true);
      setEnrollment(null);
      setToken('');
      toast.show('Two-factor authentication enabled.', 'success');
    },
    onError: (err) =>
      toast.show(err instanceof ApiError ? err.message : 'That code is incorrect.', 'error'),
  });

  const disableMutation = useMutation({
    mutationFn: () => securityApi.disableTwoFactor(disableToken),
    onSuccess: () => {
      setTwoFactor(false);
      setShowDisable(false);
      setDisableToken('');
      toast.show('Two-factor authentication disabled.', 'success');
    },
    onError: (err) =>
      toast.show(err instanceof ApiError ? err.message : 'That code is incorrect.', 'error'),
  });

  return (
    <Card elevated>
      <SectionHeader
        icon={<ShieldCheck size={16} color={colors.primary} />}
        title="Two-factor authentication"
      />

      {overview.twoFactor.enabled ? (
        showDisable ? (
          <View style={{ gap: spacing.sm }}>
            <Text variant="caption" color="mutedForeground">
              Enter your current authenticator code to turn off 2FA.
            </Text>
            <TextField
              label="6-digit code"
              value={disableToken}
              onChangeText={setDisableToken}
              keyboardType="number-pad"
              maxLength={6}
            />
            <View style={{ flexDirection: 'row', gap: spacing.sm }}>
              <Button
                label="Cancel"
                variant="ghost"
                style={{ flex: 1 }}
                onPress={() => setShowDisable(false)}
              />
              <Button
                label="Turn off"
                variant="destructive"
                style={{ flex: 1 }}
                loading={disableMutation.isPending}
                disabled={disableToken.length !== 6}
                onPress={() => disableMutation.mutate()}
              />
            </View>
          </View>
        ) : (
          <View
            style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
          >
            <Badge label="Enabled" tone="success" />
            <Button
              label="Turn off"
              size="sm"
              variant="secondary"
              onPress={() => setShowDisable(true)}
            />
          </View>
        )
      ) : enrollment ? (
        <View style={{ gap: spacing.md }}>
          <Text variant="caption" color="mutedForeground">
            Scan this QR code with your authenticator app, then enter the 6-digit code it generates.
          </Text>
          <View style={{ alignItems: 'center' }}>
            <Image source={{ uri: enrollment.qrDataUrl }} style={{ width: 160, height: 160 }} />
          </View>
          <TextField
            label="6-digit code"
            value={token}
            onChangeText={setToken}
            keyboardType="number-pad"
            maxLength={6}
          />
          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            <Button
              label="Cancel"
              variant="ghost"
              style={{ flex: 1 }}
              onPress={() => setEnrollment(null)}
            />
            <Button
              label="Confirm & enable"
              style={{ flex: 1 }}
              loading={enableMutation.isPending}
              disabled={token.length !== 6}
              onPress={() => enableMutation.mutate()}
            />
          </View>
        </View>
      ) : (
        <View
          style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
        >
          <Text variant="callout" color="mutedForeground">
            Add an extra layer of security to your account.
          </Text>
          <Button
            label="Set up"
            size="sm"
            loading={enrollMutation.isPending}
            onPress={() => enrollMutation.mutate()}
          />
        </View>
      )}
    </Card>
  );
}

function PasswordSection() {
  const { colors, spacing } = useTheme();
  const toast = useToast();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const mutation = useMutation({
    mutationFn: () => securityApi.updatePassword(currentPassword, newPassword),
    onSuccess: () => {
      setCurrentPassword('');
      setNewPassword('');
      toast.show('Password updated.', 'success');
    },
    onError: (err) =>
      toast.show(
        err instanceof ApiError ? err.message : 'Could not change your password.',
        'error'
      ),
  });

  return (
    <Card elevated>
      <SectionHeader icon={<KeyRound size={16} color={colors.primary} />} title="Password" />
      <View style={{ gap: spacing.sm }}>
        <PasswordField
          label="Current password"
          value={currentPassword}
          onChangeText={setCurrentPassword}
        />
        <PasswordField label="New password" value={newPassword} onChangeText={setNewPassword} />
        <Button
          label="Update password"
          loading={mutation.isPending}
          disabled={!currentPassword || newPassword.length < 8}
          onPress={() => mutation.mutate()}
        />
      </View>
    </Card>
  );
}

/**
 * Google/Apple-only accounts have no password to change or confirm with. The
 * reset flow sets one, which then unlocks password change and deactivation.
 */
function SocialOnlyNote() {
  const { colors } = useTheme();
  return (
    <Card elevated>
      <SectionHeader icon={<KeyRound size={16} color={colors.primary} />} title="Password" />
      <Text variant="callout" color="mutedForeground">
        You sign in with Google or Apple, so there’s no password on this account. To add one, sign
        out and use “Forgot password” with your email.
      </Text>
    </Card>
  );
}

function DataExportSection() {
  const { colors, spacing } = useTheme();
  return (
    <Pressable onPress={() => router.push('/(app)/data-export')}>
      <Card elevated>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
          <Database size={16} color={colors.primary} />
          <Text variant="bodyStrong" style={{ flex: 1 }}>
            Export your data
          </Text>
          <ChevronRight size={16} color={colors.mutedForeground} />
        </View>
        <Text variant="caption" color="mutedForeground" style={{ marginTop: 4 }}>
          Download a copy of your applications, lease, payments and documents.
        </Text>
      </Card>
    </Pressable>
  );
}

function DangerSection() {
  const { colors, spacing } = useTheme();
  const toast = useToast();
  const { signOut } = useAuth();
  const [password, setPassword] = useState('');
  const [confirming, setConfirming] = useState(false);

  const mutation = useMutation({
    mutationFn: () => securityApi.deactivate(password),
    onSuccess: async () => {
      toast.show('Your account has been deactivated.', 'success');
      await signOut();
    },
    onError: (err) =>
      toast.show(
        err instanceof ApiError ? err.message : 'Could not deactivate your account.',
        'error'
      ),
  });

  const onPress = () => {
    if (!confirming) {
      setConfirming(true);
      return;
    }
    if (!password) return;
    Alert.alert(
      'Deactivate account',
      'This will deactivate your account. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Deactivate', style: 'destructive', onPress: () => mutation.mutate() },
      ]
    );
  };

  return (
    <Card>
      <SectionHeader
        icon={<Trash2 size={16} color={colors.destructive} />}
        title="Deactivate account"
      />
      <Text variant="caption" color="mutedForeground">
        This permanently deactivates your account and cannot be undone.
      </Text>
      {confirming ? (
        <View style={{ gap: spacing.sm, marginTop: spacing.md }}>
          <PasswordField
            label="Confirm your password"
            value={password}
            onChangeText={setPassword}
          />
          <Divider />
        </View>
      ) : null}
      <Button
        label="Deactivate my account"
        variant="destructive"
        style={{ marginTop: spacing.md }}
        loading={mutation.isPending}
        disabled={confirming && !password}
        onPress={onPress}
      />
    </Card>
  );
}
