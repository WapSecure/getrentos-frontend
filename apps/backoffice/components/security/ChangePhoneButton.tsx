'use client';

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  Alert,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  Field,
  Input,
  NumberInput,
} from '@sureground/ui';
import { authFetch } from '@sureground/shared';

/** Changes only after the new number is verified by code; the API also asks for step-up, signs out other devices and emails an alert. */
export function ChangePhoneButton({ onChanged }: { onChanged?: (phone: string) => void }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [newPhone, setNewPhone] = useState('');
  const [reference, setReference] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const reset = () => {
    setNewPhone('');
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
        '/users/me/security/phone',
        {
          method: 'POST',
          body: JSON.stringify({ newPhone: newPhone.trim() }),
        }
      );
      setReference(res.reference);
      setSentTo(res.sentTo);
    });

  const confirm = () =>
    run(async () => {
      const res = await authFetch<{ phone: string }>('/users/me/security/phone/confirm', {
        method: 'POST',
        body: JSON.stringify({ reference, otp: code }),
      });
      onChanged?.(res.phone);
      void qc.invalidateQueries();
      setOpen(false);
      reset();
    });

  const digits = newPhone.replace(/\D/g, '').length;

  return (
    <>
      <Button variant="link" onClick={() => setOpen(true)} className="mt-1 font-medium">
        Change phone number
      </Button>
      <Dialog
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) reset();
        }}
      >
        <DialogContent size="md">
          <DialogTitle className="text-lg font-semibold text-foreground">
            Change your phone number
          </DialogTitle>
          <DialogDescription className="mt-1 text-sm text-muted-foreground">
            {reference
              ? `Enter the 6-digit code we sent to ${sentTo}.`
              : 'We’ll text a code to the new number to make sure it’s yours.'}
          </DialogDescription>
          <form
            className="mt-4 space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              void (reference ? confirm() : start());
            }}
          >
            {reference ? (
              <Field label="Verification code">
                <NumberInput
                  autoFocus
                  autoComplete="one-time-code"
                  maxLength={6}
                  value={code}
                  onValueChange={setCode}
                />
              </Field>
            ) : (
              <Field label="New phone number">
                <Input
                  autoFocus
                  type="tel"
                  autoComplete="tel"
                  placeholder="+234 801 234 5678"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                />
              </Field>
            )}
            {error ? <Alert variant="danger">{error}</Alert> : null}
            <div className="flex flex-wrap justify-end gap-2 pt-2">
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                isLoading={busy}
                disabled={reference ? code.length !== 6 : digits < 7}
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
