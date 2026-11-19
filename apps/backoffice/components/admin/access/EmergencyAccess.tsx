'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Siren } from '@sureground/icons';
import {
  Alert,
  Button,
  Checkbox,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  Field,
  Textarea,
  useToast,
} from '@sureground/ui';
import { formatDateTime, unwrap } from '@sureground/shared';
import { useAdminUser } from '@/app/(dashboard)/admin/layout';
import { adminService } from '@/services/adminService';
import { PERMISSION_LABELS } from '@/lib/adminAccess';
import type { AdminPermission } from '@/types/admin';

// Mirrors the backend EMERGENCY_PERMISSIONS: the money execution the head of operations gave up.
const EMERGENCY_PERMISSIONS: AdminPermission[] = [
  'escrow.approve',
  'rentfinance.approve',
  'shortlet.payout',
];
const MIN_REASON = 20;

export const EmergencyAccess = () => {
  const user = useAdminUser();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [picked, setPicked] = useState<AdminPermission[]>([]);
  const [reason, setReason] = useState('');

  const take = useMutation({
    mutationFn: () => unwrap(adminService.takeEmergencyAccess(picked, reason.trim())),
    onSuccess: (result) => {
      toast.success(
        `Emergency access is on until ${formatDateTime(result.expiresAt)}. Every super admin has been told and will review it.`
      );
      setOpen(false);
      // The new permissions arrive with the next load of /admin/access/me.
      window.setTimeout(() => window.location.reload(), 1500);
    },
    onError: (error: Error) =>
      toast.error(error.message || 'Emergency access could not be turned on.'),
  });

  if (!user?.roles?.includes('BACKOFFICE_ADMIN')) return null;

  if (user.emergency) {
    return (
      <Alert variant="warning" icon={Siren} className="mb-5">
        Emergency access is on until {formatDateTime(user.emergency.expiresAt)}:{' '}
        {user.emergency.permissions.map((p) => PERMISSION_LABELS[p] ?? p).join(', ')}. Money
        movements still need a second officer at ₦5m and above.
      </Alert>
    );
  }

  return (
    <>
      <Button variant="outline" className="gap-1.5" onClick={() => setOpen(true)}>
        <Siren className="h-4 w-4" />
        Emergency access
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent size="lg" padded={false}>
          <form
            method="post"
            className="space-y-5 p-6 sm:p-7"
            onSubmit={(event) => {
              event.preventDefault();
              take.mutate();
            }}
          >
            <div>
              <DialogTitle className="font-semibold text-foreground">
                Take emergency access
              </DialogTitle>
              <DialogDescription className="mt-1 text-sm text-muted-foreground">
                Only when money must move and no escrow officer or finance approver can act. It
                lasts four hours, every super admin is told at once, and one of them reviews it
                afterwards. Payments of ₦5m and above still need a second officer.
              </DialogDescription>
            </div>
            <fieldset className="space-y-2.5">
              <legend className="mb-2 text-sm font-medium text-foreground">What you need</legend>
              {EMERGENCY_PERMISSIONS.map((permission) => (
                <Checkbox
                  key={permission}
                  checked={picked.includes(permission)}
                  onCheckedChange={(checked) =>
                    setPicked((prev) =>
                      checked ? [...prev, permission] : prev.filter((p) => p !== permission)
                    )
                  }
                  label={PERMISSION_LABELS[permission]}
                />
              ))}
            </fieldset>
            <Field
              label="What cannot wait"
              htmlFor="emergency-reason"
              required
              hint="Say what is due and why no finance officer can act. Super admins see this."
            >
              <Textarea
                id="emergency-reason"
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                rows={3}
              />
            </Field>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="ghost"
                className="flex-1"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={!picked.length || reason.trim().length < MIN_REASON}
                isLoading={take.isPending}
                loadingText="Turning on…"
              >
                Turn on for 4 hours
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};
