'use client';

import { useState } from 'react';
import { KeyRound } from '@sureground/icons';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@sureground/ui';
import { Alert, Button } from '@sureground/ui';
import { adminService } from '@/services/adminService';
import { unwrap } from '@sureground/shared';
import type { AdminStaffMember } from '@/types/admin';

interface ResetPasswordModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  staff: AdminStaffMember | null;
  onReset: () => void;
}

/** Nobody types a password for someone else: we lock theirs and email them a link to choose one. */
export const ResetPasswordModal = ({
  open,
  onOpenChange,
  staff,
  onReset,
}: ResetPasswordModalProps) => {
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!staff) return;
    setError(null);
    setSubmitting(true);
    try {
      await unwrap(adminService.resetStaffPassword(staff.id));
      onOpenChange(false);
      onReset();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send the reset link.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0">
        <div className="p-6">
          <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-destructive/10">
            <KeyRound className="h-5 w-5 text-destructive" />
          </div>
          <DialogTitle className="font-semibold text-foreground">Reset password</DialogTitle>
          <DialogDescription className="mt-1 text-sm text-muted-foreground">
            <span className="font-medium text-foreground">{staff?.legalName}</span>&rsquo;s current
            password stops working straight away and they are signed out everywhere. We email them a
            link to choose a new one; it works once and expires in 72 hours.
          </DialogDescription>

          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            {error && <Alert variant="danger">{error}</Alert>}

            <div className="flex gap-2 pt-2">
              <Button
                type="button"
                variant="ghost"
                className="flex-1"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="danger"
                className="flex-1"
                isLoading={submitting}
                loadingText="Sending…"
              >
                Reset and email link
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
};
