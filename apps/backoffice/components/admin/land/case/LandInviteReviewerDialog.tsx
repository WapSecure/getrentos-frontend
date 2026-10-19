'use client';

import { useState } from 'react';
import { UserRoundPlus } from 'lucide-react';
import {
  Button,
  Checkbox,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  Field,
  Select,
  DatePicker,
} from '@getrentos/ui';
import {
  LAND_REVIEWER_ROLES,
  type InviteLandReviewerInput,
  type LandDiligenceCheck,
  type LandReviewerRole,
} from '@/types/land';
import { humaniseEnum } from '@/lib/landDiligence';
import { fromDateInput, tomorrowDateInput } from './shared';
import { UserLookup, type PickedUser } from './UserLookup';

const MAX_CHECKS = 20;

interface LandInviteReviewerDialogProps {
  open: boolean;
  onClose: () => void;
  checks: LandDiligenceCheck[];
  canSearchUsers: boolean;
  isPending: boolean;
  onSubmit: (input: InviteLandReviewerInput) => void;
}

/**
 * Seats an outside professional on named checks of the case. Rendered only
 * while open, so every invitation starts from an empty form.
 */
export const LandInviteReviewerDialog = ({
  open,
  onClose,
  checks,
  canSearchUsers,
  isPending,
  onSubmit,
}: LandInviteReviewerDialogProps) => {
  const [user, setUser] = useState<PickedUser | null>(null);
  const [role, setRole] = useState<LandReviewerRole>('SURVEYOR');
  const [checkKeys, setCheckKeys] = useState<string[]>([]);
  const [dueAt, setDueAt] = useState('');
  const [minDate] = useState(tomorrowDateInput);

  const toggle = (key: string, on: boolean) =>
    setCheckKeys((keys) => (on ? [...keys, key] : keys.filter((existing) => existing !== key)));
  const canSubmit = Boolean(user) && checkKeys.length > 0 && checkKeys.length <= MAX_CHECKS;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && !isPending && onClose()}>
      {open && (
        <DialogContent className="max-w-lg">
          <div className="space-y-4 p-5">
            <div>
              <DialogTitle className="type-heading text-lg">Invite an outside reviewer</DialogTitle>
              <DialogDescription className="mt-1 text-sm text-muted-foreground">
                A surveyor, lawyer, valuer or inspector decides only the checks you name here and
                files a report. They never see the owner&apos;s contact details.
              </DialogDescription>
            </div>
            <Field label="Professional" required>
              <UserLookup
                value={user}
                onChange={setUser}
                canSearch={canSearchUsers}
                ariaLabel="Find the professional by name, email or user id"
              />
            </Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Role" required>
                <Select
                  value={role}
                  onValueChange={(value) => setRole(value as LandReviewerRole)}
                  ariaLabel="Reviewer role"
                  options={LAND_REVIEWER_ROLES.map((value) => ({
                    value,
                    label: humaniseEnum(value),
                  }))}
                />
              </Field>
              <Field label="Report due" hint="Optional.">
                <DatePicker value={dueAt} onChange={(next) => setDueAt(next)} min={minDate} />
              </Field>
            </div>
            <Field
              label="Checks they may decide"
              required
              hint={`${checkKeys.length} selected${checkKeys.length > MAX_CHECKS ? ` (max ${MAX_CHECKS})` : ''}`}
            >
              {checks.length === 0 ? (
                <p className="text-sm text-muted-foreground">This case has no checks yet.</p>
              ) : (
                <ul className="max-h-56 space-y-1.5 overflow-y-auto rounded-xl border border-border p-2.5">
                  {checks.map((check) => (
                    <li key={check.key}>
                      <label className="flex items-center gap-2 text-sm text-foreground">
                        <Checkbox
                          checked={checkKeys.includes(check.key)}
                          onCheckedChange={(checked) => toggle(check.key, checked)}
                          aria-label={check.label}
                        />
                        <span className="min-w-0 flex-1">{check.label}</span>
                        <span className="text-[11px] text-muted-foreground">
                          {humaniseEnum(check.status)}
                        </span>
                      </label>
                    </li>
                  ))}
                </ul>
              )}
            </Field>
            <div className="flex justify-end gap-2 pt-1">
              <Button variant="ghost" onClick={onClose} disabled={isPending}>
                Cancel
              </Button>
              <Button
                variant="primary"
                disabled={!canSubmit || isPending}
                isLoading={isPending}
                icon={<UserRoundPlus className="h-4 w-4" />}
                onClick={() =>
                  user &&
                  onSubmit({ userId: user.id, role, checkKeys, dueAt: fromDateInput(dueAt) })
                }
              >
                Send invitation
              </Button>
            </div>
          </div>
        </DialogContent>
      )}
    </Dialog>
  );
};
