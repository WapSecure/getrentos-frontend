'use client';

import { useState } from 'react';
import { ShieldPlus } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@getrentos/ui';
import { Button } from '@getrentos/ui';
import { Field } from '@getrentos/ui';
import { Input } from '@getrentos/ui';
import { Select } from '@getrentos/ui';
import { adminService } from '@/services/adminService';
import { unwrap } from '@/lib/apiHelpers';
import { ADMIN_ROLE_DETAILS } from '@/lib/adminAccess';
import type { AdminStaffRole } from '@/types/admin';

interface CreateStaffModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Roles the signed-in admin is allowed to create (all for SUPER_ADMIN, otherwise subordinate). */
  creatableRoles: AdminStaffRole[];
  onCreated: (approvalStatus: 'APPROVED' | 'PENDING') => void;
}

export const CreateStaffModal = ({
  open,
  onOpenChange,
  creatableRoles,
  onCreated,
}: CreateStaffModalProps) => {
  const [email, setEmail] = useState('');
  const [legalName, setLegalName] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<AdminStaffRole>(creatableRoles[0] ?? 'support_agent');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !legalName.trim() || !password) {
      setError('Please fill in all fields.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Please enter a valid email address.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    setSubmitting(true);
    try {
      const result = await unwrap(
        adminService.createStaff({
          email: email.trim(),
          legalName: legalName.trim(),
          password,
          roles: [role],
        })
      );
      const approvalStatus: 'APPROVED' | 'PENDING' =
        result.approval?.status === 'PENDING' ? 'PENDING' : 'APPROVED';
      onOpenChange(false);
      onCreated(approvalStatus);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create staff member.');
    } finally {
      setSubmitting(false);
    }
  };

  const roleOptions = creatableRoles.map((r) => ({
    value: r,
    label: ADMIN_ROLE_DETAILS[r].label,
  }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <div className="p-6">
          <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-accent">
            <ShieldPlus className="h-5 w-5 text-primary" />
          </div>
          <DialogTitle className="font-semibold text-foreground">Add staff member</DialogTitle>
          <DialogDescription className="mt-1 text-sm text-muted-foreground">
            Provision a new internal account. Creations made by a non-super-admin require approval
            before the member can sign in.
          </DialogDescription>

          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            <Field label="Full name" htmlFor="staff-name" required>
              <Input
                id="staff-name"
                value={legalName}
                onChange={(e) => setLegalName(e.target.value)}
                placeholder="e.g. Ada Obi"
                autoComplete="off"
              />
            </Field>

            <Field label="Work email" htmlFor="staff-email" required>
              <Input
                id="staff-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ada@getrentos.com"
                autoComplete="off"
              />
            </Field>

            <Field label="Role" hint={role ? ADMIN_ROLE_DETAILS[role].description : undefined}>
              <Select
                ariaLabel="Staff role"
                value={role}
                onValueChange={(value) => setRole(value as AdminStaffRole)}
                options={roleOptions}
              />
            </Field>

            <Field
              label="Temporary password"
              htmlFor="staff-password"
              required
              hint="At least 8 characters. The member changes it after first sign-in."
            >
              <Input
                id="staff-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="new-password"
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
              <Button type="submit" className="flex-1" isLoading={submitting}>
                {submitting ? 'Creating…' : 'Create staff'}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
};
