import { useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, View } from 'react-native';
import { ShieldCheck } from 'lucide-react-native';
import { Button, FormAlert, OtpInput, PasswordField, Text, useTheme } from '@getrentos/ui-native';
import { Sheet } from '@/components/Sheet';
import { securityApi, type StepUpMethod } from '@/lib/api/security';
import { ApiError } from '@/lib/api/client';
import { registerStepUpPrompt, rememberStepUpToken } from '@/lib/stepUp';

/**
 * Mounted once at the root. When the API asks for confirmation before a
 * sensitive change, this asks for the account's strongest factor and hands the
 * token back to apiFetch, which replays the request. Cancelling resolves null,
 * so the original call fails with the API's own "confirm it's you" message.
 */
export function StepUpSheet() {
  const { colors, spacing } = useTheme();
  const pending = useRef<((token: string | null) => void) | null>(null);
  const [open, setOpen] = useState(false);
  const [method, setMethod] = useState<StepUpMethod | null>(null);
  const [value, setValue] = useState('');
  const [reference, setReference] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    registerStepUpPrompt(
      () =>
        new Promise<string | null>((resolve) => {
          pending.current = resolve;
          setValue('');
          setReference(null);
          setSentTo(null);
          setError(null);
          setMethod(null);
          setOpen(true);
          securityApi
            .overview()
            .then((o) => setMethod(o.stepUpMethod))
            .catch(() => setMethod('password'));
        })
    );
    return () => registerStepUpPrompt(null);
  }, []);

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
      setError(e instanceof ApiError ? e.message : 'That didn’t work. Try again.');
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

  const confirm = () =>
    run(async () => {
      const res = await securityApi.confirmStepUp(
        method === 'password'
          ? { password: value }
          : method === 'totp'
            ? { code: value }
            : { code: value, reference: reference ?? undefined }
      );
      rememberStepUpToken(res.stepUpToken, res.expiresIn);
      finish(res.stepUpToken);
    });

  const needsCode = method === 'email_code' && !reference;
  const ready = method === 'password' ? value.length > 0 : value.length === 6;

  return (
    <Sheet open={open} onClose={() => finish(null)} title="Confirm it’s you">
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={{ gap: spacing.md }}>
          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            <ShieldCheck size={18} color={colors.primary} />
            <Text variant="callout" color="mutedForeground" style={{ flex: 1 }}>
              This change affects where your money goes or how you sign in, so we check it’s really
              you.
            </Text>
          </View>

          {!method ? null : needsCode ? (
            <Text variant="callout">We’ll email you a 6-digit code.</Text>
          ) : method === 'password' ? (
            <PasswordField
              label="Your password"
              value={value}
              onChangeText={setValue}
              autoFocus
              autoComplete="current-password"
            />
          ) : (
            <View style={{ gap: spacing.xs }}>
              <Text variant="callout">
                {method === 'totp'
                  ? 'Enter the code from your authenticator app.'
                  : `Enter the code we sent to ${sentTo}.`}
              </Text>
              <OtpInput value={value} onChange={setValue} invalid={!!error} />
            </View>
          )}

          {error ? <FormAlert message={error} /> : null}

          <Button
            label={needsCode ? 'Email me a code' : 'Confirm'}
            loading={busy}
            disabled={!method || (!needsCode && !ready)}
            onPress={() => (needsCode ? sendCode() : confirm())}
          />
          <Button label="Cancel" variant="ghost" onPress={() => finish(null)} />
        </View>
      </KeyboardAvoidingView>
    </Sheet>
  );
}
