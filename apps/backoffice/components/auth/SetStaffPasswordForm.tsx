'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Eye, EyeOff, KeyRound, ShieldCheck } from '@sureground/icons';
import { Alert, Button, Field, IconButton, Input, Logo } from '@sureground/ui';
import { AUTH_CONSTANTS, ERROR_MESSAGES, ROUTES, authService } from '@sureground/shared';

/** Staff choose their own password from the single-use link in their invite or reset email. */
export function SetStaffPasswordForm() {
  const params = useSearchParams();
  // Read the token once on first render; the effect below then clears it from the address bar.
  const [token] = useState<string | null>(() => params.get('token'));
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  // Take the token out of the address bar so it is not left in browser history.
  useEffect(() => {
    if (token) window.history.replaceState(null, '', window.location.pathname);
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!token) return;
    if (password.length < AUTH_CONSTANTS.PASSWORD_MIN_LENGTH) {
      setError(ERROR_MESSAGES.PASSWORD_TOO_SHORT);
      return;
    }
    if (password !== confirm) {
      setError('The two passwords do not match.');
      return;
    }
    setSubmitting(true);
    const result = await authService.acceptStaffInvite(token, password);
    setSubmitting(false);
    if (!result.success) {
      setError(
        result.error ?? 'This link is invalid or has expired. Ask a super admin for a new one.'
      );
      return;
    }
    setDone(true);
  };

  return (
    <div className="w-full max-w-md">
      <div className="mb-8 text-center">
        <Logo href={ROUTES.ADMIN_LOGIN} size="lg" className="mx-auto mb-4 w-fit" />
        <h1 className="text-2xl font-bold text-foreground">Set your password</h1>
        <p className="mt-2 text-sm text-muted-foreground">Sureground staff account</p>
      </div>

      {done ? (
        <div className="space-y-4">
          <Alert variant="success" icon={ShieldCheck} title="Your password is set">
            Sign in with your work email and new password. You will then be asked to turn on
            two-factor authentication before you can use the admin tools.
          </Alert>
          <Button href={ROUTES.ADMIN_LOGIN} variant="primary" size="lg" fullWidth>
            Go to sign in
          </Button>
        </div>
      ) : !token ? (
        <div className="space-y-4">
          <Alert variant="warning" title="This link is incomplete">
            Open the link from your email again. If it has expired, ask a super admin to send a new
            one.
          </Alert>
          <p className="text-center text-sm">
            <Link href={ROUTES.ADMIN_LOGIN} className="text-primary underline underline-offset-2">
              Back to sign in
            </Link>
          </p>
        </div>
      ) : (
        <form method="post" onSubmit={handleSubmit} className="space-y-4">
          <Field
            label="New password"
            htmlFor="staff-new-password"
            required
            hint={`At least ${AUTH_CONSTANTS.PASSWORD_MIN_LENGTH} characters. Only you will know it.`}
          >
            <Input
              id="staff-new-password"
              type={show ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              trailingIcon={
                <IconButton
                  size="sm"
                  className="-mr-2"
                  label={show ? 'Hide password' : 'Show password'}
                  icon={show ? <EyeOff /> : <Eye />}
                  onClick={() => setShow((v) => !v)}
                />
              }
            />
          </Field>
          <Field label="Confirm password" htmlFor="staff-confirm-password" required>
            <Input
              id="staff-confirm-password"
              type={show ? 'text' : 'password'}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              autoComplete="new-password"
            />
          </Field>

          {error && <Alert variant="danger">{error}</Alert>}

          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            isLoading={submitting}
            loadingText="Saving…"
            icon={<KeyRound className="h-4 w-4" />}
          >
            Set password
          </Button>
        </form>
      )}
    </div>
  );
}
