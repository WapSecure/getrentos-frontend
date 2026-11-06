import { useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, View } from 'react-native';
import { ShieldCheck } from 'lucide-react-native';
import {
  Button,
  FormAlert,
  LinkButton,
  NumberField,
  OtpInput,
  PasswordField,
  Text,
  useTheme,
} from '@getrentos/ui-native';
import { Sheet } from '@/components/Sheet';
import { securityApi, type StepUpMethod } from '@/lib/api/security';
import { errorMessage } from '@/lib/api/client';
import { authenticatePasskey, isPasskeySupported, registerPasskey } from '@/lib/passkey';
import { biometricSupport } from '@/lib/appLock';
import { clearStepUpToken, registerStepUpPrompt, rememberStepUpToken } from '@/lib/stepUp';
import {
  PIN_LENGTH,
  addPasskeyWithEmailedCode,
  emailedProofReady,
  isCurrentPin,
  newPinReady,
  pinsMismatch,
  transactionPinBody,
} from '@/lib/stepUpSetup';

/** With no factor yet: set a PIN, or add a passkey (Face ID / fingerprint). */
type SetupChoice = 'pin' | 'passkey';

/**
 * Mounted once at the root. When the API asks for confirmation before a
 * sensitive change, this asks for the account's strongest factor and hands the
 * token back to apiFetch, which replays the request. Cancelling resolves null,
 * so the original call fails with the API's own "confirm it's you" message.
 *
 * A password alone confirms nothing, so an account with no factor sets one up
 * here first (password + emailed code, then a PIN or a passkey) and confirms
 * with it.
 */
export function StepUpSheet() {
  const { colors, spacing } = useTheme();
  const pending = useRef<((token: string | null) => void) | null>(null);
  const challenge = useRef<string | undefined>(undefined);
  const [open, setOpen] = useState(false);
  const [method, setMethod] = useState<StepUpMethod | null>(null);
  const [hasPassword, setHasPassword] = useState(true);
  const [value, setValue] = useState('');
  const [password, setPassword] = useState('');
  const [pin, setPin] = useState('');
  const [pinConfirm, setPinConfirm] = useState('');
  const [choice, setChoice] = useState<SetupChoice>('pin');
  const [reference, setReference] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [biometricLabel, setBiometricLabel] = useState('Face ID');
  const passkeyOffered = isPasskeySupported();

  useEffect(() => {
    if (!passkeyOffered) return;
    biometricSupport()
      .then((s) => setBiometricLabel(s.label))
      .catch(() => undefined);
  }, [passkeyOffered]);

  useEffect(() => {
    registerStepUpPrompt(
      ({ challengeId }) =>
        new Promise<string | null>((resolve) => {
          pending.current = resolve;
          challenge.current = challengeId;
          setValue('');
          setPassword('');
          setPin('');
          setPinConfirm('');
          setChoice('pin');
          setReference(null);
          setSentTo(null);
          setError(null);
          setMethod(null);
          setOpen(true);
          securityApi
            .overview()
            .then((o) => {
              setHasPassword(o.hasPassword);
              setMethod(o.stepUpMethod);
            })
            .catch((e) =>
              setError(errorMessage(e, 'We couldn’t check how to confirm it’s you. Try again.'))
            );
        })
    );
    return () => registerStepUpPrompt(null);
  }, []);

  // A token bound to a challenge approves one request only, so it isn't kept
  // for later ones (security gap AU-02).
  const remember = (res: { stepUpToken: string; expiresIn: number }) => {
    if (!challenge.current) rememberStepUpToken(res.stepUpToken, res.expiresIn);
  };

  const finish = (token: string | null) => {
    pending.current?.(token);
    pending.current = null;
    setOpen(false);
  };

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    setError(null);
    try {
      await fn();
    } catch (e) {
      setError(errorMessage(e, 'That didn’t work. Try again.'));
    } finally {
      setBusy(false);
    }
  };

  const sendCode = () =>
    run(async () => {
      const res = await securityApi.sendStepUpCode();
      setReference(res.reference);
      setSentTo(res.sentTo);
    });

  const confirmWith = async (body: { pin?: string; code?: string }) => {
    const res = await securityApi.confirmStepUp({ ...body, challengeId: challenge.current });
    remember(res);
    finish(res.stepUpToken);
  };

  const confirm = () =>
    run(() => confirmWith(method === 'transaction_pin' ? { pin: value } : { code: value }));

  const passkeyStepUp = async () => {
    const options = await securityApi.startPasskeyStepUp();
    const assertion = await authenticatePasskey(options); // OS biometric / security-key prompt
    const res = await securityApi.confirmStepUp({
      passkeyResponse: assertion,
      challengeId: challenge.current,
    });
    remember(res);
    finish(res.stepUpToken);
  };

  const confirmWithPasskey = () => run(passkeyStepUp);

  /** No factor yet: set the PIN with the emailed code, then confirm with it. */
  const setPinAndConfirm = () =>
    run(async () => {
      await securityApi.setTransactionPin(
        transactionPinBody({
          password: hasPassword ? password : undefined,
          pin,
          reference,
          code: value,
        })
      );
      // From here the account has a PIN, so a retry confirms with it.
      setMethod('transaction_pin');
      setValue(pin);
      await confirmWith({ pin });
    });

  /** No factor yet: add a passkey with a set-up-only token, then confirm with it. */
  const addPasskeyAndConfirm = () =>
    run(async () => {
      await addPasskeyWithEmailedCode(
        {
          confirmStepUp: securityApi.confirmStepUp,
          startPasskeyRegistration: securityApi.startPasskeyRegistration,
          finishPasskeyRegistration: securityApi.finishPasskeyRegistration,
          registerPasskey,
          rememberStepUpToken: (token, expiresIn) => rememberStepUpToken(token, expiresIn),
          clearStepUpToken,
        },
        {
          password: hasPassword ? password : undefined,
          reference: reference ?? '',
          code: value,
          deviceName: 'This phone',
        }
      );
      // From here the account has a passkey, so a retry confirms with it.
      setMethod('passkey');
      await passkeyStepUp();
    });

  const isPasskey = method === 'passkey';
  const isSetup = method === 'setup_required';
  const needsCode = isSetup && !reference;
  const proofReady = emailedProofReady({
    needsPassword: hasPassword,
    password,
    reference,
    code: value,
  });
  const ready = isSetup
    ? proofReady && (choice === 'passkey' || newPinReady(pin, pinConfirm))
    : method === 'transaction_pin'
      ? isCurrentPin(value)
      : value.length === 6;

  const usePasskeySetup = isSetup && choice === 'passkey';
  const submitLabel = isPasskey
    ? 'Use passkey'
    : needsCode
      ? 'Email me a code'
      : isSetup
        ? usePasskeySetup
          ? `Add ${biometricLabel} and confirm`
          : 'Set PIN and confirm'
        : 'Confirm';

  const submit = () =>
    isPasskey
      ? confirmWithPasskey()
      : needsCode
        ? sendCode()
        : isSetup
          ? usePasskeySetup
            ? addPasskeyAndConfirm()
            : setPinAndConfirm()
          : confirm();

  return (
    <Sheet
      open={open}
      onClose={() => finish(null)}
      title={
        isSetup
          ? usePasskeySetup
            ? `Set up ${biometricLabel}`
            : 'Set a transaction PIN'
          : 'Confirm it’s you'
      }
    >
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={{ gap: spacing.md }}>
          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            <ShieldCheck size={18} color={colors.primary} />
            <Text variant="callout" color="mutedForeground" style={{ flex: 1 }}>
              {!isSetup
                ? 'This change affects where your money goes or how you sign in, so we check it’s really you.'
                : usePasskeySetup
                  ? `Set up ${biometricLabel} to continue — you’ll use it to confirm payments and other sensitive changes.`
                  : 'Set a transaction PIN to continue — you’ll use it to confirm payments and other sensitive changes.'}
            </Text>
          </View>

          {!method ? null : isPasskey ? (
            <Text variant="callout">
              Use your device passkey — Face ID, fingerprint, or a security key.
            </Text>
          ) : needsCode ? (
            <Text variant="callout">
              {hasPassword
                ? 'We’ll email you a 6-digit code to enter with your password.'
                : 'We’ll email you a 6-digit code.'}
            </Text>
          ) : isSetup ? (
            <>
              {hasPassword ? (
                <PasswordField
                  label="Your password"
                  value={password}
                  onChangeText={setPassword}
                  autoFocus
                  autoComplete="current-password"
                />
              ) : null}
              <View style={{ gap: spacing.xs }}>
                <Text variant="callout">{`Enter the code we sent to ${sentTo}.`}</Text>
                <OtpInput value={value} onChange={setValue} invalid={!!error} />
              </View>
              {usePasskeySetup ? (
                <Text variant="callout" color="mutedForeground">
                  {`We’ll add a passkey on this phone, then ask for ${biometricLabel} to confirm.`}
                </Text>
              ) : (
                <>
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
                    value={pinConfirm}
                    onValueChange={setPinConfirm}
                    maxLength={PIN_LENGTH}
                    secureTextEntry
                    error={pinsMismatch(pin, pinConfirm) ? 'Those PINs don’t match.' : null}
                  />
                </>
              )}
              {passkeyOffered ? (
                <LinkButton
                  label={usePasskeySetup ? 'Use a PIN instead' : `Use ${biometricLabel} instead`}
                  onPress={() => setChoice(usePasskeySetup ? 'pin' : 'passkey')}
                />
              ) : null}
            </>
          ) : method === 'transaction_pin' ? (
            <NumberField
              code
              label="Transaction PIN"
              value={value}
              onValueChange={setValue}
              maxLength={PIN_LENGTH}
              secureTextEntry
              autoFocus
            />
          ) : (
            <View style={{ gap: spacing.xs }}>
              <Text variant="callout">Enter the code from your authenticator app.</Text>
              <OtpInput value={value} onChange={setValue} invalid={!!error} />
            </View>
          )}

          {error ? <FormAlert message={error} /> : null}

          <Button
            label={submitLabel}
            loading={busy}
            disabled={!method || (!isPasskey && !needsCode && !ready)}
            onPress={submit}
          />
          <Button label="Cancel" variant="ghost" onPress={() => finish(null)} />
        </View>
      </KeyboardAvoidingView>
    </Sheet>
  );
}
