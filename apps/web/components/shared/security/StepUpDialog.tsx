'use client';

import { useEffect, useRef, useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  Input,
} from '@getrentos/ui';
import {
  authFetch,
  registerStepUpHandler,
  rememberStepUpToken,
  type StepUpMethod,
} from '@/lib/apiHelpers';

type Pending = { resolve: (token: string | null) => void };

const COPY: Record<StepUpMethod, { label: string; hint: string }> = {
  totp: { label: 'Two-factor code', hint: 'Enter the 6-digit code from your authenticator app.' },
  password: { label: 'Password', hint: 'Enter your GetRentos password.' },
  email_code: { label: 'Code from your email', hint: 'We’ll email you a 6-digit code.' },
};

/**
 * Mounted once at the root. When the API asks for confirmation before a
 * sensitive change, this asks the account holder for their strongest factor
 * and hands the resulting token back to authFetch, which retries the request.
 */
export function StepUpDialog() {
  const pending = useRef<Pending | null>(null);
  const [open, setOpen] = useState(false);
  const [method, setMethod] = useState<StepUpMethod | null>(null);
  const [value, setValue] = useState('');
  const [reference, setReference] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    registerStepUpHandler(
      () =>
        new Promise<string | null>((resolve) => {
          pending.current = { resolve };
          setValue('');
          setReference(null);
          setSentTo(null);
          setError(null);
          setMethod(null);
          setOpen(true);
          authFetch<{ stepUpMethod: StepUpMethod }>('/users/me/security')
            .then((o) => setMethod(o.stepUpMethod))
            .catch(() => setMethod('password'));
        })
    );
    return () => registerStepUpHandler(null);
  }, []);

  const finish = (token: string | null) => {
    pending.current?.resolve(token);
    pending.current = null;
    setOpen(false);
  };

  const sendCode = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await authFetch<{ reference: string; sentTo: string }>(
        '/users/me/security/step-up/code',
        { method: 'POST' }
      );
      setReference(res.reference);
      setSentTo(res.sentTo);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not send the code.');
    } finally {
      setBusy(false);
    }
  };

  const confirm = async () => {
    if (!method) return;
    setBusy(true);
    setError(null);
    try {
      const body =
        method === 'password'
          ? { password: value }
          : method === 'totp'
            ? { code: value }
            : { code: value, reference };
      const res = await authFetch<{ stepUpToken: string; expiresIn: number }>(
        '/users/me/security/step-up',
        { method: 'POST', body: JSON.stringify(body) }
      );
      rememberStepUpToken(res.stepUpToken, res.expiresIn);
      finish(res.stepUpToken);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'That didn’t work. Try again.');
    } finally {
      setBusy(false);
    }
  };

  const needsCode = method === 'email_code' && !reference;
  const copy = method ? COPY[method] : null;

  return (
    <Dialog open={open} onOpenChange={(next) => !next && finish(null)}>
      <DialogContent className="max-w-md p-6">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-primary" aria-hidden />
          <DialogTitle className="text-lg font-semibold">Confirm it’s you</DialogTitle>
        </div>
        <DialogDescription className="mt-1 text-sm text-muted-foreground">
          This change affects where your money goes or how you sign in, so we check it’s really you.
        </DialogDescription>

        <form
          className="mt-4 space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (needsCode) void sendCode();
            else void confirm();
          }}
        >
          {!copy ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : needsCode ? (
            <p className="text-sm text-muted-foreground">{copy.hint}</p>
          ) : (
            <label className="block space-y-1">
              <span className="text-sm font-medium">{copy.label}</span>
              <Input
                autoFocus
                type={method === 'password' ? 'password' : 'text'}
                inputMode={method === 'password' ? undefined : 'numeric'}
                autoComplete={method === 'password' ? 'current-password' : 'one-time-code'}
                maxLength={method === 'password' ? 200 : 6}
                value={value}
                onChange={(e) =>
                  setValue(
                    method === 'password' ? e.target.value : e.target.value.replace(/\D/g, '')
                  )
                }
              />
              <span className="block text-xs text-muted-foreground">
                {sentTo ? `We sent a code to ${sentTo}.` : copy.hint}
              </span>
            </label>
          )}
          {error ? (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          ) : null}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => finish(null)}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={busy}
              disabled={
                busy ||
                !method ||
                (!needsCode && (method === 'password' ? !value : value.length !== 6))
              }
            >
              {needsCode ? 'Email me a code' : 'Confirm'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
