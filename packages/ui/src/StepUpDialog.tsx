'use client';

import { useEffect, useRef, useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import {
  authFetch,
  cleanSecondFactorInput,
  isSecondFactorCode,
  registerStepUpHandler,
  SECOND_FACTOR_CODE_MAX_LENGTH,
  rememberStepUpToken,
  TRANSACTION_PIN_LENGTH,
  type StepUpMethod,
} from '@sureground/shared';
import { Alert } from './Alert';
import { Button } from './Button';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from './Dialog';
import { Field } from './Field';
import { Input } from './Input';
import { NumberInput } from './NumberInput';

type Pending = { resolve: (token: string | null) => void; challengeId?: string };
type StepUpToken = { stepUpToken: string; expiresIn: number };

export type PasskeyAuthenticator = (options: unknown) => Promise<unknown>;

export interface StepUpDialogProps {
  /** Without it, an account whose strongest factor is a passkey can't confirm here. */
  authenticateWithPasskey?: PasskeyAuthenticator;
  description?: string;
  /** False for staff: they can't use a PIN and earn a set-up-only token for two-factor instead. */
  canSetPin?: boolean;
  /** A summary the request itself carries (`withStepUpSummary`) wins over this one. */
  summary?: string;
}

const COPY: Record<Exclude<StepUpMethod, 'setup_required'>, { label: string; hint: string }> = {
  passkey: {
    label: 'Passkey',
    hint: 'Use your device passkey — Face ID, fingerprint, or a security key.',
  },
  totp: {
    label: 'Two-factor code',
    hint: 'Enter the 6-digit code from your authenticator app, or a backup code if you don’t have your phone.',
  },
  transaction_pin: { label: 'Transaction PIN', hint: 'Enter your transaction PIN.' },
};

const isCode = (v: string) => /^\d{6}$/.test(v);
const isNewPin = (v: string) => /^\d{6}$/.test(v);
/** Older accounts may still have a 4-digit PIN. */
const isCurrentPin = (v: string) => /^(\d{4}|\d{6})$/.test(v);

// A password alone confirms nothing, so an account with no factor sets one up here first.
export function StepUpDialog({
  authenticateWithPasskey,
  description = 'This change affects where your money goes or how you sign in, so we check it’s really you.',
  canSetPin = true,
  summary: summaryProp,
}: StepUpDialogProps = {}) {
  const pending = useRef<Pending | null>(null);
  const [open, setOpen] = useState(false);
  const [requestSummary, setRequestSummary] = useState<string | null>(null);
  const [method, setMethod] = useState<StepUpMethod | null>(null);
  const [hasPassword, setHasPassword] = useState(true);
  const [value, setValue] = useState('');
  const [password, setPassword] = useState('');
  const [pin, setPin] = useState('');
  const [pinConfirm, setPinConfirm] = useState('');
  const [reference, setReference] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    registerStepUpHandler(
      ({ challengeId, summary: requested }) =>
        new Promise<string | null>((resolve) => {
          pending.current = { resolve, challengeId };
          setRequestSummary(requested ?? null);
          setValue('');
          setPassword('');
          setPin('');
          setPinConfirm('');
          setReference(null);
          setSentTo(null);
          setError(null);
          setMethod(null);
          setOpen(true);
          authFetch<{ stepUpMethod: StepUpMethod; hasPassword?: boolean }>('/users/me/security')
            .then((o) => {
              setHasPassword(o.hasPassword !== false);
              setMethod(o.stepUpMethod);
            })
            .catch((e) =>
              setError(
                e instanceof Error && e.message
                  ? e.message
                  : 'We couldn’t check how to confirm it’s you. Try again.'
              )
            );
        })
    );
    return () => registerStepUpHandler(null);
  }, []);

  // A challenge-bound token approves one request only, so it must not be kept for later ones.
  const remember = (res: StepUpToken) => {
    if (!pending.current?.challengeId) rememberStepUpToken(res.stepUpToken, res.expiresIn);
  };

  const finish = (token: string | null) => {
    pending.current?.resolve(token);
    pending.current = null;
    setOpen(false);
  };

  const run = async (fn: () => Promise<void>, fallback = 'That didn’t work. Try again.') => {
    setBusy(true);
    setError(null);
    try {
      await fn();
    } catch (e) {
      setError(e instanceof Error && e.message ? e.message : fallback);
    } finally {
      setBusy(false);
    }
  };

  const stepUp = (body: Record<string, unknown>) =>
    authFetch<StepUpToken>('/users/me/security/step-up', {
      method: 'POST',
      body: JSON.stringify(body),
    });

  const sendCode = () =>
    run(async () => {
      const res = await authFetch<{ reference: string; sentTo: string }>(
        '/users/me/security/step-up/code',
        { method: 'POST' }
      );
      setReference(res.reference);
      setSentTo(res.sentTo);
    }, 'Could not send the code.');

  const confirmWithPasskey = () =>
    run(async () => {
      if (!authenticateWithPasskey) {
        throw new Error('Passkeys are not available here. Use the main Sureground app to confirm.');
      }
      const options = await authFetch<unknown>('/users/me/security/step-up/passkey/options', {
        method: 'POST',
      });
      const assertion = await authenticateWithPasskey(options);
      const res = await stepUp({
        passkeyResponse: assertion,
        challengeId: pending.current?.challengeId,
      });
      remember(res);
      finish(res.stepUpToken);
    }, 'That passkey check did not pass. Try again.');

  const confirmWith = async (body: { pin?: string; code?: string }) => {
    const res = await stepUp({ ...body, challengeId: pending.current?.challengeId });
    remember(res);
    finish(res.stepUpToken);
  };

  const confirm = () =>
    run(() => confirmWith(method === 'transaction_pin' ? { pin: value } : { code: value }));

  const setPinAndConfirm = () =>
    run(async () => {
      await authFetch('/users/me/security/transaction-pin', {
        method: 'POST',
        body: JSON.stringify({
          ...(hasPassword ? { currentPassword: password } : {}),
          pin,
          reference: reference ?? undefined,
          code: value,
        }),
      });
      // From here the account has a PIN, so a retry confirms with it.
      setMethod('transaction_pin');
      setValue(pin);
      await confirmWith({ pin });
    });

  // This set-up-only token isn't bound to a challenge, so it is kept for the enrol and enable calls that follow.
  const confirmForSetup = () =>
    run(async () => {
      const res = await stepUp({
        ...(hasPassword ? { password } : {}),
        reference: reference ?? undefined,
        code: value,
      });
      rememberStepUpToken(res.stepUpToken, res.expiresIn);
      finish(res.stepUpToken);
    });

  const isPasskey = method === 'passkey';
  const isSetup = method === 'setup_required';
  const needsCode = isSetup && !reference;
  const pinMismatch = pinConfirm.length === TRANSACTION_PIN_LENGTH && pin !== pinConfirm;
  const setupReady =
    (!hasPassword || password.length > 0) &&
    isCode(value) &&
    (!canSetPin || (isNewPin(pin) && pin === pinConfirm));
  const ready = isSetup
    ? setupReady
    : method === 'transaction_pin'
      ? isCurrentPin(value)
      : isSecondFactorCode(value);

  const title = isSetup && canSetPin ? 'Set a transaction PIN' : 'Confirm it’s you';
  const intro = !isSetup
    ? description
    : canSetPin
      ? 'Set a transaction PIN to continue — you’ll use it to confirm payments and other sensitive changes.'
      : 'Confirm with your password and a code we email you, then set up two-factor authentication to continue.';

  const submit = () => {
    if (isPasskey) void confirmWithPasskey();
    else if (needsCode) void sendCode();
    else if (isSetup) void (canSetPin ? setPinAndConfirm() : confirmForSetup());
    else void confirm();
  };

  const summary = requestSummary ?? summaryProp ?? null;

  return (
    <Dialog open={open} onOpenChange={(next) => !next && finish(null)}>
      <DialogContent className="max-w-md p-6">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-primary" aria-hidden />
          <DialogTitle className="text-lg font-semibold">{title}</DialogTitle>
        </div>
        <DialogDescription className="mt-1 text-sm text-muted-foreground">
          {intro}
        </DialogDescription>
        {summary ? (
          <div className="mt-3 rounded-lg border border-border bg-secondary/40 px-3 py-2">
            <p className="text-xs text-muted-foreground">You’re confirming</p>
            <p className="text-sm font-medium text-foreground">{summary}</p>
          </div>
        ) : null}

        <form
          className="mt-4 space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          {!method ? (
            error ? null : (
              <p className="text-sm text-muted-foreground">Loading…</p>
            )
          ) : isPasskey ? (
            <p className="text-sm text-muted-foreground">{COPY.passkey.hint}</p>
          ) : needsCode ? (
            <p className="text-sm text-muted-foreground">
              {hasPassword
                ? 'We’ll email you a 6-digit code to enter with your password.'
                : 'We’ll email you a 6-digit code.'}
            </p>
          ) : isSetup ? (
            <>
              {hasPassword ? (
                <Field label="Your password">
                  <Input
                    autoFocus
                    type="password"
                    autoComplete="current-password"
                    maxLength={200}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </Field>
              ) : null}
              <Field label="Code from your email" hint={`We sent a code to ${sentTo}.`}>
                <NumberInput
                  autoFocus={!hasPassword}
                  autoComplete="one-time-code"
                  maxLength={6}
                  value={value}
                  onValueChange={setValue}
                />
              </Field>
              {canSetPin ? (
                <>
                  <Field label="New 6-digit PIN">
                    <NumberInput
                      masked
                      maxLength={TRANSACTION_PIN_LENGTH}
                      value={pin}
                      onValueChange={setPin}
                    />
                  </Field>
                  <Field
                    label="Confirm PIN"
                    error={pinMismatch ? 'Those PINs don’t match.' : undefined}
                  >
                    <NumberInput
                      masked
                      maxLength={TRANSACTION_PIN_LENGTH}
                      value={pinConfirm}
                      onValueChange={setPinConfirm}
                    />
                  </Field>
                </>
              ) : null}
            </>
          ) : (
            <Field label={COPY[method].label} hint={COPY[method].hint}>
              <Input
                autoFocus
                type={method === 'transaction_pin' ? 'password' : 'text'}
                // A backup code has letters, so only the PIN gets the number pad.
                inputMode={method === 'totp' ? 'text' : 'numeric'}
                autoCapitalize="none"
                autoComplete={method === 'transaction_pin' ? 'off' : 'one-time-code'}
                maxLength={
                  method === 'transaction_pin'
                    ? TRANSACTION_PIN_LENGTH
                    : method === 'totp'
                      ? SECOND_FACTOR_CODE_MAX_LENGTH
                      : 6
                }
                value={value}
                onChange={(e) =>
                  setValue(
                    method === 'totp'
                      ? cleanSecondFactorInput(e.target.value)
                      : e.target.value.replace(/\D/g, '')
                  )
                }
              />
            </Field>
          )}
          {error ? <Alert variant="danger">{error}</Alert> : null}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => finish(null)}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={busy}
              disabled={busy || !method || (!isPasskey && !needsCode && !ready)}
            >
              {isPasskey
                ? 'Use passkey'
                : needsCode
                  ? 'Email me a code'
                  : isSetup && canSetPin
                    ? 'Set PIN and confirm'
                    : 'Confirm'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
