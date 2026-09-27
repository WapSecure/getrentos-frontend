'use client';

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  Input,
} from '@getrentos/ui';
import { authFetch } from '@/lib/apiHelpers';

/**
 * The sign-in email changes only after the new address proves itself with a
 * code. The API also asks the account holder to confirm it's them first
 * (StepUpDialog handles that automatically), and emails the old address.
 */
export function ChangeEmailButton({ onChanged }: { onChanged?: (email: string) => void }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [reference, setReference] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const reset = () => {
    setNewEmail('');
    setReference(null);
    setCode('');
    setError(null);
  };

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    setError(null);
    try {
      await fn();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'That didn’t go through. Try again.');
    } finally {
      setBusy(false);
    }
  };

  const start = () =>
    run(async () => {
      const res = await authFetch<{ reference: string; sentTo: string }>(
        '/users/me/security/email',
        {
          method: 'POST',
          body: JSON.stringify({ newEmail: newEmail.trim() }),
        }
      );
      setReference(res.reference);
      setSentTo(res.sentTo);
    });

  const confirm = () =>
    run(async () => {
      const res = await authFetch<{ email: string }>('/users/me/security/email/confirm', {
        method: 'POST',
        body: JSON.stringify({ reference, otp: code }),
      });
      onChanged?.(res.email);
      void qc.invalidateQueries();
      setOpen(false);
      reset();
    });

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-1 text-sm font-medium text-primary hover:underline"
      >
        Change email
      </button>
      <Dialog
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) reset();
        }}
      >
        <DialogContent className="max-w-md">
          <DialogTitle className="text-lg font-semibold">Change your sign-in email</DialogTitle>
          <DialogDescription className="mt-1 text-sm text-muted-foreground">
            {reference
              ? `Enter the 6-digit code we sent to ${sentTo}.`
              : 'We’ll send a code to the new address to make sure it’s yours.'}
          </DialogDescription>
          <form
            className="mt-4 space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              void (reference ? confirm() : start());
            }}
          >
            {reference ? (
              <Input
                autoFocus
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                aria-label="Code"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              />
            ) : (
              <Input
                autoFocus
                type="email"
                autoComplete="email"
                aria-label="New email"
                placeholder="you@example.com"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
              />
            )}
            {error ? (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            ) : null}
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                isLoading={busy}
                disabled={busy || (reference ? code.length !== 6 : !newEmail.includes('@'))}
              >
                {reference ? 'Confirm' : 'Send code'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
