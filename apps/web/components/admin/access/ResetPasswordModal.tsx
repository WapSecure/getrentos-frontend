'use client';

import { useState } from 'react';
import { KeyRound, RefreshCw } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@getrentos/ui';
import { Button } from '@getrentos/ui';
import { Field } from '@getrentos/ui';
import { Input } from '@getrentos/ui';
import { adminService } from '@/services/adminService';
import { unwrap } from '@/lib/apiHelpers';
import type { AdminStaffMember } from '@/types/admin';

interface ResetPasswordModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  staff: AdminStaffMember | null;
  onReset: () => void;
}

const CHARSET = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%';

function generatePassword(length = 14): string {
  const bytes = new Uint32Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (_, i) => CHARSET[bytes[i] % CHARSET.length]).join('');
}

export const ResetPasswordModal = ({
  open,
  onOpenChange,
  staff,
  onReset,
}: ResetPasswordModalProps) => {
  const [password, setPassword] = useState(() => generatePassword());
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!staff) return;
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    setSubmitting(true);
    try {
      await unwrap(adminService.resetStaffPassword(staff.id, password));
      onOpenChange(false);
      onReset();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset password.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <div className="p-6">
          <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-destructive/10">
            <KeyRound className="h-5 w-5 text-destructive" />
          </div>
          <DialogTitle className="font-semibold text-foreground">Reset password</DialogTitle>
          <DialogDescription className="mt-1 text-sm text-muted-foreground">
            Set a new temporary password for{' '}
            <span className="font-medium text-foreground">{staff?.legalName}</span>. All of their
            existing sessions will be revoked and they will need to sign in again.
          </DialogDescription>

          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            <Field
              label="New password"
              htmlFor="reset-password"
              required
              hint="Use the generated one, or type your own."
            >
              <Input
                id="reset-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                trailingIcon={
                  <button
                    type="button"
                    onClick={() => setPassword(generatePassword())}
                    aria-label="Generate a new password"
                    className="text-muted-foreground transition-colors hover:text-foreground"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </button>
                }
              />
            </Field>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <div className="flex gap-2 pt-2">
              <Button
                type="button"
                variant="ghost"
                className="flex-1"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" variant="danger" className="flex-1" isLoading={submitting}>
                {submitting ? 'Resetting…' : 'Reset password'}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
};
