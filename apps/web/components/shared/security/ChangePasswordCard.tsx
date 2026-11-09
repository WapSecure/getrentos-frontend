'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Lock } from 'lucide-react';
import { Button, Field, Input, useToast } from '@sureground/ui';
import { AUTH_CONSTANTS } from '@sureground/shared';
import { accountSecurityService } from '@/services/accountSecurityService';

const { PASSWORD_MIN_LENGTH, PASSWORD_MAX_LENGTH } = AUTH_CONSTANTS;

/** Change password, for any role. The API also refuses a password found in a known breach. */
export const ChangePasswordCard = () => {
  const toast = useToast();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  // Errors sit on the field they are about, so assistive tech reads them with it.
  const [currentError, setCurrentError] = useState<string | null>(null);
  const [newError, setNewError] = useState<string | null>(null);
  const [confirmError, setConfirmError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () => accountSecurityService.updatePassword(currentPassword, newPassword),
    onSuccess: (res) => {
      if (res.success) {
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        toast.success('Password changed');
        return;
      }
      const message = res.message || 'Could not change your password';
      // A wrong current password belongs on that field; anything else is about the new one.
      if (/current/i.test(message)) setCurrentError(message);
      else setNewError(message);
    },
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentError(null);
    setNewError(null);
    setConfirmError(null);
    if (newPassword.length < PASSWORD_MIN_LENGTH) {
      setNewError(`Use at least ${PASSWORD_MIN_LENGTH} characters.`);
      return;
    }
    if (newPassword !== confirmPassword) {
      setConfirmError('Those passwords don’t match.');
      return;
    }
    mutation.mutate();
  };

  return (
    <div className="p-4 rounded-lg border border-border">
      <div className="flex min-w-0 items-center gap-3">
        <div className="p-2 rounded-lg bg-info-subtle">
          <Lock className="w-5 h-5 text-info" aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <h3 className="font-medium text-foreground">Password</h3>
          <p className="text-sm text-muted-foreground">
            Changing it signs you out on your other devices.
          </p>
        </div>
      </div>

      <form method="post" onSubmit={submit} className="mt-4 space-y-4">
        <Field label="Current password" error={currentError || undefined}>
          <Input
            type="password"
            autoComplete="current-password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
          />
        </Field>
        <Field
          label="New password"
          hint={`At least ${PASSWORD_MIN_LENGTH} characters, and not one used on another site`}
          error={newError || undefined}
        >
          <Input
            type="password"
            autoComplete="new-password"
            maxLength={PASSWORD_MAX_LENGTH}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
        </Field>
        <Field label="Confirm new password" error={confirmError || undefined}>
          <Input
            type="password"
            autoComplete="new-password"
            maxLength={PASSWORD_MAX_LENGTH}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </Field>
        <div className="flex justify-end">
          <Button
            type="submit"
            variant="primary"
            isLoading={mutation.isPending}
            disabled={!currentPassword || !newPassword || !confirmPassword}
          >
            Change password
          </Button>
        </div>
      </form>
    </div>
  );
};
