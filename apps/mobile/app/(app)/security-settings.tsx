import { useEffect, useMemo, useState } from 'react';
import { FaceCheckButton } from '@/components/trust/FaceCheckButton';
import { liveSelfieSupported } from '@/lib/smileid/liveSelfie';
import { Alert, Image, Pressable, ScrollView, Share, View } from 'react-native';
import { router } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ChevronRight,
  Database,
  Fingerprint,
  KeyRound,
  Mail,
  MonitorSmartphone,
  Phone,
  ScanFace,
  ShieldCheck,
  Trash2,
} from '@sureground/icons/native';
import {
  Badge,
  Button,
  Card,
  Divider,
  LinkButton,
  QueryState,
  NumberField,
  PasswordField,
  Skeleton,
  SwitchRow,
  Text,
  TextField,
  useTheme,
  useToast,
} from '@sureground/ui-native';
import { qk } from '@/lib/query/keys';
import {
  securityApi,
  type AccountSession,
  type PasskeySummary,
  type SecurityOverview,
  type TwoFactorEnrollment,
} from '@/lib/api/security';
import { errorMessage } from '@/lib/api/client';
import { isPasskeySupported, registerPasskey } from '@/lib/passkey';
import { useAuth } from '@/lib/auth/AuthProvider';
import {
  PIN_LENGTH,
  emailedProofReady,
  isCurrentPin,
  newPinReady,
  pinsMismatch,
  transactionPinBody,
} from '@/lib/stepUpSetup';
import {
  biometricSupport,
  unlockWithBiometrics,
  useAppLockEnabled,
  type BiometricSupport,
} from '@/lib/appLock';
import { DetailScreenHeader } from '@/components/dashboard/DetailScreenHeader';
import { ChangeEmailSheet } from '@/components/account/ChangeEmailSheet';
import { goBack } from '@/lib/goBack';
import {
  AUTH_CONSTANTS,
  cleanSecondFactorInput,
  formatRelativeTime,
  isSecondFactorCode,
} from '@sureground/shared';

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
        onBack={() => goBack()}
      />

      <ScrollView
        contentContainerStyle={{
          padding: spacing.xl,
          paddingBottom: insets.bottom + spacing['3xl'],
          gap: spacing.lg,
        }}
      >
        <AppLockSection />
        <QueryState query={overview} skeleton={<Skeleton height={180} />}>
          {overview.data ? (
            <>
              <EmailSection />
              <PhoneVerificationSection overview={overview.data} />
              <PasskeySection />
              <TwoFactorSection overview={overview.data} />
              <TransactionPinSection overview={overview.data} />
              {overview.data.hasPassword ? <PasswordSection /> : <SocialOnlyNote />}
              <SignedInDevicesSection />
              {isRenter ? <DataExportSection /> : null}
              {overview.data.hasPassword ? <DangerSection /> : null}
            </>
          ) : null}
        </QueryState>
      </ScrollView>
    </View>
  );
}

/** The biometric lock applies to this phone only. */
function AppLockSection() {
  const { colors } = useTheme();
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
      const ok = await unlockWithBiometrics(`Turn on ${support.label} for Sureground`);
      if (!ok) return;
      toast.show(`${support.label} lock is on.`, 'success');
    }
    setEnabled(next);
  };

  return (
    <Card elevated>
      <SwitchRow
        icon={<ScanFace size={16} color={colors.primary} />}
        label={`${support.label.charAt(0).toUpperCase()}${support.label.slice(1)} lock`}
        description={
          support.available
            ? `Ask for ${support.label} when Sureground opens, or after a minute away.`
            : `Set up ${support.label} or a screen lock in your phone's settings to use this.`
        }
        value={!!enabled}
        disabled={!support.available}
        onValueChange={toggle}
      />
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
    onError: (err) => toast.show(errorMessage(err, 'Could not send a code right now.'), 'error'),
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
    onError: (err) => toast.show(errorMessage(err, 'That code is incorrect.'), 'error'),
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
          <NumberField
            code
            label="6-digit code"
            value={otp}
            onValueChange={setOtp}
            maxLength={6}
            textContentType="oneTimeCode"
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
  const setTwoFactor = (enabled: boolean, recoveryCodesLeft = 0) =>
    qc.setQueryData<SecurityOverview>(qk.security, (old) =>
      old ? { ...old, twoFactor: { enrolled: enabled, enabled, recoveryCodesLeft } } : old
    );
  // Backup codes are shown once, right after they are made.
  const [freshCodes, setFreshCodes] = useState<string[] | null>(null);
  const codesLeft = overview.twoFactor.recoveryCodesLeft ?? 0;
  const [enrollment, setEnrollment] = useState<TwoFactorEnrollment | null>(null);
  const [token, setToken] = useState('');
  const [disableToken, setDisableToken] = useState('');
  const [showDisable, setShowDisable] = useState(false);

  const enrollMutation = useMutation({
    mutationFn: securityApi.enrollTwoFactor,
    onSuccess: setEnrollment,
    onError: (err) => toast.show(errorMessage(err, 'Could not start 2FA enrollment.'), 'error'),
  });

  const enableMutation = useMutation({
    mutationFn: () => securityApi.enableTwoFactor(token),
    onSuccess: (data) => {
      setTwoFactor(true, data.recoveryCodes.length);
      setEnrollment(null);
      setToken('');
      setFreshCodes(data.recoveryCodes);
      toast.show('Two-factor authentication enabled.', 'success');
    },
    onError: (err) => toast.show(errorMessage(err, 'That code is incorrect.'), 'error'),
  });

  const disableMutation = useMutation({
    mutationFn: () => securityApi.disableTwoFactor(disableToken),
    onSuccess: () => {
      setTwoFactor(false);
      setShowDisable(false);
      setDisableToken('');
      toast.show('Two-factor authentication disabled.', 'success');
    },
    onError: (err) => toast.show(errorMessage(err, 'That code is incorrect.'), 'error'),
  });

  const newCodesMutation = useMutation({
    mutationFn: securityApi.regenerateRecoveryCodes,
    onSuccess: (data) => {
      setTwoFactor(true, data.recoveryCodes.length);
      setFreshCodes(data.recoveryCodes);
    },
    onError: (err) => toast.show(errorMessage(err, 'Could not make new backup codes.'), 'error'),
  });

  const confirmNewCodes = () =>
    Alert.alert('Get new backup codes?', 'Your current backup codes will stop working.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Get new codes', onPress: () => newCodesMutation.mutate() },
    ]);

  if (freshCodes) {
    return (
      <Card elevated>
        <SectionHeader
          icon={<ShieldCheck size={16} color={colors.primary} />}
          title="Save your backup codes"
        />
        <Text variant="caption" color="mutedForeground">
          If you lose your phone, each code lets you sign in once. Keep them somewhere safe. You
          won’t see them again.
        </Text>
        <View
          accessibilityLabel="Backup codes"
          style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            marginTop: spacing.md,
            rowGap: spacing.xs,
          }}
        >
          {freshCodes.map((code) => (
            <Text
              key={code}
              variant="bodyStrong"
              selectable
              style={{ width: '50%', fontFamily: 'monospace' }}
            >
              {code}
            </Text>
          ))}
        </View>
        <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md }}>
          <Button
            label="Share or save"
            variant="secondary"
            style={{ flex: 1 }}
            onPress={() =>
              void Share.share({
                message: `Sureground two-factor backup codes. Each works once.\n\n${freshCodes.join('\n')}`,
              })
            }
          />
          <Button label="I’ve saved them" style={{ flex: 1 }} onPress={() => setFreshCodes(null)} />
        </View>
      </Card>
    );
  }

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
              Enter your current authenticator code, or a backup code if you no longer have your
              phone, to turn off 2FA.
            </Text>
            <TextField
              label="Authenticator or backup code"
              value={disableToken}
              onChangeText={(v) => setDisableToken(cleanSecondFactorInput(v))}
              autoCapitalize="none"
              autoCorrect={false}
              textContentType="oneTimeCode"
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
                disabled={!isSecondFactorCode(disableToken)}
                onPress={() => disableMutation.mutate()}
              />
            </View>
          </View>
        ) : (
          <View style={{ gap: spacing.sm }}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <Badge label="Enabled" tone="success" />
              <Button
                label="Turn off"
                size="sm"
                variant="secondary"
                onPress={() => setShowDisable(true)}
              />
            </View>
            <Text variant="caption" color="mutedForeground">
              {codesLeft === 0
                ? 'No backup codes left. Get new ones so a lost phone can’t lock you out.'
                : `${codesLeft} backup code${codesLeft === 1 ? '' : 's'} left for when you don’t have your phone.`}
            </Text>
            <LinkButton
              label="Get new backup codes"
              onPress={confirmNewCodes}
              disabled={newCodesMutation.isPending}
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
          <NumberField
            code
            label="6-digit code"
            value={token}
            onValueChange={setToken}
            maxLength={6}
            textContentType="oneTimeCode"
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

/** Accounts with no password (Google / Apple only) confirm with the emailed code alone. */
function TransactionPinSection({ overview }: { overview: SecurityOverview }) {
  const { colors, spacing } = useTheme();
  const toast = useToast();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [forgot, setForgot] = useState(false);
  const [password, setPassword] = useState('');
  const [currentPin, setCurrentPin] = useState('');
  const [reference, setReference] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [faceCheckId, setFaceCheckId] = useState<string | null>(null);
  const [pin, setPin] = useState('');
  const [confirm, setConfirm] = useState('');
  // A face check can stand in for the emailed code where Smile's capture is built in.
  const faceCheckAvailable = useMemo(() => liveSelfieSupported(), []);

  const reset = () => {
    setOpen(false);
    setForgot(false);
    setPassword('');
    setCurrentPin('');
    setReference(null);
    setSentTo(null);
    setCode('');
    setFaceCheckId(null);
    setPin('');
    setConfirm('');
  };

  // With a PIN already set the current one proves it, unless it's forgotten.
  const useCurrentPin = overview.hasTransactionPin && !forgot;

  const sendCode = useMutation({
    mutationFn: securityApi.sendStepUpCode,
    onSuccess: (res) => {
      setReference(res.reference);
      setSentTo(res.sentTo);
    },
    onError: (err) => toast.show(errorMessage(err, 'Could not send a code right now.'), 'error'),
  });

  const mutation = useMutation({
    mutationFn: () =>
      securityApi.setTransactionPin(
        transactionPinBody({
          password: overview.hasPassword ? password : undefined,
          pin,
          ...(useCurrentPin ? { currentPin } : faceCheckId ? { faceCheckId } : { reference, code }),
        })
      ),
    onSuccess: () => {
      qc.setQueryData<SecurityOverview>(qk.security, (old) =>
        old ? { ...old, hasTransactionPin: true } : old
      );
      qc.invalidateQueries({ queryKey: qk.security });
      reset();
      toast.show('Transaction PIN saved.', 'success');
    },
    onError: (err) => toast.show(errorMessage(err, 'Could not save your PIN.'), 'error'),
  });

  const mismatch = pinsMismatch(pin, confirm);
  const proofReady = useCurrentPin
    ? (!overview.hasPassword || password.length > 0) && isCurrentPin(currentPin)
    : faceCheckId
      ? !overview.hasPassword || password.length > 0
      : emailedProofReady({ needsPassword: overview.hasPassword, password, reference, code });
  const ready = proofReady && newPinReady(pin, confirm);

  return (
    <Card elevated>
      <SectionHeader icon={<KeyRound size={16} color={colors.primary} />} title="Transaction PIN" />
      {!open ? (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: spacing.sm,
          }}
        >
          <Text variant="callout" color="mutedForeground" style={{ flex: 1 }}>
            {overview.hasTransactionPin
              ? 'Required to release or refund money — a separate secret from your password.'
              : 'Set a 6-digit PIN to confirm money actions, so your password alone isn’t enough.'}
          </Text>
          <Button
            label={overview.hasTransactionPin ? 'Change' : 'Set PIN'}
            size="sm"
            variant="secondary"
            onPress={() => setOpen(true)}
          />
        </View>
      ) : (
        <View style={{ gap: spacing.sm }}>
          {overview.hasPassword ? (
            <PasswordField label="Current password" value={password} onChangeText={setPassword} />
          ) : null}
          {useCurrentPin ? (
            <>
              <NumberField
                code
                label="Current PIN"
                value={currentPin}
                onValueChange={setCurrentPin}
                maxLength={PIN_LENGTH}
                secureTextEntry
              />
              <LinkButton label="Forgot your PIN?" onPress={() => setForgot(true)} />
            </>
          ) : faceCheckId ? (
            <Text variant="caption" color="mutedForeground">
              Face confirmed. Choose your new PIN.
            </Text>
          ) : reference ? (
            <NumberField
              code
              label="6-digit code"
              hint={sentTo ? `We sent a code to ${sentTo}.` : undefined}
              value={code}
              onValueChange={setCode}
              maxLength={6}
              textContentType="oneTimeCode"
            />
          ) : (
            <View style={{ gap: spacing.xs }}>
              <Text variant="caption" color="mutedForeground">
                {forgot
                  ? 'We’ll email you a code so you can choose a new PIN.'
                  : 'We’ll email you a code to confirm it’s you.'}
              </Text>
              <Button
                label="Email me a code"
                size="sm"
                variant="secondary"
                loading={sendCode.isPending}
                onPress={() => sendCode.mutate()}
              />
              {forgot && faceCheckAvailable ? (
                <FaceCheckButton
                  label="Use a face check instead"
                  start={async () => {
                    const r = await securityApi.startPinFaceCheck();
                    return { id: r.faceCheckId, session: r.session };
                  }}
                  status={securityApi.pinFaceCheckStatus}
                  onApproved={setFaceCheckId}
                />
              ) : null}
            </View>
          )}
          <NumberField
            code
            label="New 6-digit PIN"
            value={pin}
            onValueChange={setPin}
            maxLength={PIN_LENGTH}
            secureTextEntry
          />
          <NumberField
            code
            label="Confirm PIN"
            value={confirm}
            onValueChange={setConfirm}
            maxLength={PIN_LENGTH}
            secureTextEntry
            error={mismatch ? 'Those PINs don’t match.' : null}
          />
          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            <Button label="Cancel" variant="ghost" style={{ flex: 1 }} onPress={reset} />
            <Button
              label="Save PIN"
              style={{ flex: 1 }}
              loading={mutation.isPending}
              disabled={!ready}
              onPress={() => mutation.mutate()}
            />
          </View>
        </View>
      )}
    </Card>
  );
}

/** Passkeys need a native build and hosted association files, so they are absent in Expo Go and on the web. */
function PasskeySection() {
  const { colors, spacing } = useTheme();
  const toast = useToast();
  const qc = useQueryClient();
  const supported = isPasskeySupported();
  const list = useQuery({
    queryKey: qk.passkeys,
    queryFn: securityApi.listPasskeys,
    enabled: supported,
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      const options = await securityApi.startPasskeyRegistration();
      const attestation = await registerPasskey(options);
      return securityApi.finishPasskeyRegistration(attestation, 'This phone');
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.passkeys });
      qc.invalidateQueries({ queryKey: qk.security });
      toast.show('Passkey added.', 'success');
    },
    onError: (err) => {
      // Cancelling the OS prompt is not an error worth shouting about.
      if (err instanceof Error && /cancel|NotAllowed|UserCancelled/i.test(err.message)) return;
      toast.show(errorMessage(err, 'Could not add that passkey.'), 'error');
    },
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) => securityApi.removePasskey(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.passkeys });
      qc.invalidateQueries({ queryKey: qk.security });
      toast.show('Passkey removed.', 'success');
    },
    onError: (err) => toast.show(errorMessage(err, 'Could not remove that passkey.'), 'error'),
  });

  if (!supported) return null;
  const passkeys: PasskeySummary[] = list.data?.passkeys ?? [];

  return (
    <Card elevated>
      <SectionHeader icon={<Fingerprint size={16} color={colors.primary} />} title="Passkey" />
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: spacing.sm,
        }}
      >
        <Text variant="callout" color="mutedForeground" style={{ flex: 1 }}>
          The strongest way to confirm money actions — Face ID, fingerprint, or a security key. It
          can’t be phished.
        </Text>
        <Button
          label="Add"
          size="sm"
          loading={addMutation.isPending}
          onPress={() => addMutation.mutate()}
        />
      </View>
      {passkeys.map((pk) => (
        <View
          key={pk.id}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: spacing.sm,
          }}
        >
          <Text variant="callout" style={{ flex: 1 }}>
            {pk.deviceName || 'Passkey'}
          </Text>
          <Pressable
            onPress={() => removeMutation.mutate(pk.id)}
            accessibilityRole="button"
            accessibilityLabel="Remove passkey"
            hitSlop={8}
          >
            <Trash2 size={16} color={colors.destructive} />
          </Pressable>
        </View>
      ))}
    </Card>
  );
}

/** A signed-out device loses access at its next refresh, within 15 minutes. */
function SignedInDevicesSection() {
  const { colors, spacing } = useTheme();
  const toast = useToast();
  const qc = useQueryClient();
  const sessions = useQuery({ queryKey: qk.sessions, queryFn: securityApi.listSessions });

  const signOutOne = useMutation({
    mutationFn: (id: string) => securityApi.signOutSession(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.sessions });
      toast.show('Signed out. That device loses access within 15 minutes.', 'success');
    },
    onError: (err) => toast.show(errorMessage(err, 'Could not sign that device out.'), 'error'),
  });

  const signOutOthers = useMutation({
    mutationFn: securityApi.signOutOtherSessions,
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: qk.sessions });
      toast.show(
        res.revoked === 1
          ? 'Signed out 1 other device.'
          : `Signed out ${res.revoked} other devices.`,
        'success'
      );
    },
    onError: (err) =>
      toast.show(errorMessage(err, 'Could not sign the other devices out.'), 'error'),
  });

  const others = sessions.data?.filter((s) => !s.current) ?? [];

  const confirmSignOutOthers = () =>
    Alert.alert(
      'Sign out other devices?',
      `This keeps you signed in here and signs out ${
        others.length === 1 ? '1 other device' : `${others.length} other devices`
      } within 15 minutes.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign out', style: 'destructive', onPress: () => signOutOthers.mutate() },
      ]
    );

  return (
    <Card elevated>
      <SectionHeader
        icon={<MonitorSmartphone size={16} color={colors.primary} />}
        title="Where you’re signed in"
      />
      <Text variant="caption" color="mutedForeground">
        If you don’t recognise a device, sign it out and change your password.
      </Text>
      <QueryState query={sessions} skeleton={<Skeleton height={96} />}>
        <View style={{ gap: spacing.sm, marginTop: spacing.md }}>
          {(sessions.data ?? []).map((session: AccountSession) => (
            <View
              key={session.id}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: spacing.sm,
              }}
            >
              <View style={{ flex: 1, gap: spacing.xs }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                  <Text variant="callout" style={{ flexShrink: 1 }}>
                    {session.device}
                  </Text>
                  {session.current ? <Badge label="This phone" tone="success" /> : null}
                </View>
                <Text variant="caption" color="mutedForeground">
                  {session.current
                    ? 'Active now'
                    : `Last active ${formatRelativeTime(session.lastActiveAt).toLowerCase()}`}
                  {session.ipAddress ? ` · ${session.ipAddress}` : ''}
                </Text>
              </View>
              {session.current ? null : (
                <LinkButton
                  label="Sign out"
                  onPress={() => signOutOne.mutate(session.id)}
                  disabled={signOutOne.isPending}
                />
              )}
            </View>
          ))}
        </View>
      </QueryState>
      {others.length > 0 ? (
        <Button
          label="Sign out other devices"
          variant="outline"
          size="sm"
          style={{ marginTop: spacing.md }}
          loading={signOutOthers.isPending}
          onPress={confirmSignOutOthers}
        />
      ) : null}
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
    onError: (err) => toast.show(errorMessage(err, 'Could not change your password.'), 'error'),
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
        <PasswordField
          label="New password"
          placeholder={`At least ${AUTH_CONSTANTS.PASSWORD_MIN_LENGTH} characters`}
          value={newPassword}
          onChangeText={setNewPassword}
        />
        <Button
          label="Update password"
          loading={mutation.isPending}
          disabled={!currentPassword || newPassword.length < AUTH_CONSTANTS.PASSWORD_MIN_LENGTH}
          onPress={() => mutation.mutate()}
        />
      </View>
    </Card>
  );
}

/** Google/Apple-only accounts have no password; the reset flow sets one. */
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
    <Pressable
      onPress={() => router.push('/(app)/data-export')}
      accessibilityRole="button"
      accessibilityLabel="Export your data"
    >
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
    onError: (err) => toast.show(errorMessage(err, 'Could not deactivate your account.'), 'error'),
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
