'use client';

import { Ban, CalendarDays, CheckCircle2, ShieldAlert, BadgeCheck } from '@sureground/icons';
import { useState } from 'react';
import {
  Badge,
  Button,
  DatePicker,
  Dialog,
  DialogContent,
  DialogTitle,
  Field,
  type BadgeVariant,
} from '@sureground/ui';
import { FactGrid } from '@/components/admin/ops/OpsParts';
import { getInitials, formatDate, formatRelativeTime } from '@sureground/shared';
import type { PlanTier, PlatformUser, UserAccountStatus } from '@/types/admin';
import { roleLabel } from '@/lib/roleLabels';
import {
  initialStaffGrantDay,
  isStaffGrantDayAllowed,
  latestStaffGrantDay,
  planLabel,
  tomorrowInLagos,
} from '@/lib/planDates';
import { UserSecurityActions } from './UserSecurityActions';
import { UserLegalNameAction } from './UserLegalNameAction';

interface UserDetailModalProps {
  user: PlatformUser | null;
  onClose: () => void;
  onChangeStatus: (userId: string, status: UserAccountStatus) => void;
  isChangingStatus?: boolean;
  pendingStatus?: UserAccountStatus;
  onChangeSubscription: (userId: string, tier: PlanTier, endDate?: string) => void;
  isChangingSubscription?: boolean;
  canManageSubscription?: boolean;
  /** Holds users.manage and the user is not the signed-in staff member. */
  canCorrectLegalName?: boolean;
  onLegalNameChanged?: (userId: string, legalName: string) => void;
}

const STATUS: Record<UserAccountStatus, { label: string; variant: BadgeVariant }> = {
  active: { label: 'Active', variant: 'success' },
  pending: { label: 'Pending', variant: 'warning' },
  suspended: { label: 'Suspended', variant: 'warning' },
  banned: { label: 'Banned', variant: 'danger' },
};

// Enterprise is staff-granted (no self-serve checkout), so every tier must be reachable here.
const PLAN_TIERS: PlanTier[] = ['FREE', 'PRO', 'ENTERPRISE'];

export const UserDetailModal = ({
  user,
  onClose,
  onChangeStatus,
  isChangingStatus = false,
  pendingStatus,
  onChangeSubscription,
  isChangingSubscription = false,
  canManageSubscription = false,
  canCorrectLegalName = false,
  onLegalNameChanged,
}: UserDetailModalProps) => {
  return (
    <Dialog open={!!user} onOpenChange={(open) => !open && onClose()}>
      {user && (
        <DialogContent size="lg" padded={false} className="max-h-[88dvh] overscroll-contain">
          <div className="border-b border-border px-5 py-4 pr-12">
            <div className="flex items-center gap-3">
              <div
                aria-hidden="true"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary ring-1 ring-inset ring-primary/15"
              >
                {getInitials(user.fullName)}
              </div>
              <div className="min-w-0">
                <DialogTitle className="text-lg font-semibold tracking-[-0.01em] text-foreground [overflow-wrap:anywhere]">
                  {user.fullName}
                </DialogTitle>
                <p className="truncate text-sm text-muted-foreground" title={user.email}>
                  {user.email}
                </p>
              </div>
              <Badge variant={STATUS[user.status].variant} dot className="ml-auto">
                {STATUS[user.status].label}
              </Badge>
            </div>
          </div>

          <div className="space-y-4 px-5 py-4">
            <FactGrid
              className="rounded-lg border border-border bg-secondary/30 p-3"
              facts={[
                {
                  label: 'Trust score',
                  value: <span className="tabular-nums">{user.trustScore}</span>,
                },
                { label: 'Joined', value: formatDate(user.joinedDate) },
                { label: 'Last active', value: formatRelativeTime(user.lastActiveAt) },
              ]}
              columns={3}
            />
            <div>
              <p className="text-xs text-muted-foreground mb-1.5">Roles</p>
              <div className="flex flex-wrap gap-1.5">
                {[...new Set(user.roles)].map((role) => (
                  <Badge key={role} variant="neutral">
                    {roleLabel(role)}
                  </Badge>
                ))}
              </div>
            </div>

            {canCorrectLegalName && (
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border px-3 py-2 text-sm">
                <span className="text-muted-foreground">Legal name</span>
                <UserLegalNameAction
                  userId={user.id}
                  currentName={user.fullName}
                  onChanged={(legalName) => onLegalNameChanged?.(user.id, legalName)}
                />
              </div>
            )}

            <PlanControl
              key={user.id}
              user={user}
              canManage={canManageSubscription}
              isChanging={isChangingSubscription}
              onChange={onChangeSubscription}
            />
          </div>

          <UserSecurityActions userId={user.id} />

          <div className="flex gap-2 border-t border-border bg-secondary/30 px-5 py-4">
            {/* Opening a profile lands on Close, not on a billing or account action. */}
            <Button
              variant="ghost"
              className="flex-1"
              onClick={onClose}
              disabled={isChangingStatus}
              autoFocus
            >
              Close
            </Button>
            {user.status !== 'suspended' ? (
              <Button
                variant="outline"
                className="flex-1 gap-1.5"
                onClick={() => onChangeStatus(user.id, 'suspended')}
                isLoading={pendingStatus === 'suspended'}
                disabled={isChangingStatus}
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                Suspend
              </Button>
            ) : (
              <Button
                variant="outline"
                className="flex-1 gap-1.5"
                onClick={() => onChangeStatus(user.id, 'active')}
                isLoading={pendingStatus === 'active'}
                disabled={isChangingStatus}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Reactivate
              </Button>
            )}
            {user.status !== 'banned' && (
              <Button
                variant="ghost"
                className="flex-1 gap-1.5 text-destructive"
                onClick={() => onChangeStatus(user.id, 'banned')}
                isLoading={pendingStatus === 'banned'}
                disabled={isChangingStatus}
              >
                <Ban className="w-3.5 h-3.5" />
                Ban
              </Button>
            )}
          </div>
        </DialogContent>
      )}
    </Dialog>
  );
};

function PlanControl({
  user,
  canManage,
  isChanging,
  onChange,
}: {
  user: PlatformUser;
  canManage: boolean;
  isChanging: boolean;
  onChange: (userId: string, tier: PlanTier, endDate?: string) => void;
}) {
  const [endDate, setEndDate] = useState(() => initialStaffGrantDay(user.planExpiresAt));
  const endDateValid = isStaffGrantDayAllowed(endDate);
  const paid = user.planTier !== 'FREE';

  return (
    <div className="space-y-3 rounded-lg border border-border px-3 py-2 text-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-muted-foreground">Plan</span>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={user.planTier === 'FREE' ? 'neutral' : 'primary'}>
            {planLabel(user.planTier)}
          </Badge>
          {paid ? (
            <span className="text-xs text-muted-foreground">
              {user.planExpiresAt ? `Ends ${formatDate(user.planExpiresAt)}` : 'No end date'}
            </span>
          ) : null}
        </div>
      </div>
      {canManage && user.planBilledByCard ? (
        <p className="text-xs text-muted-foreground">
          This customer pays by card, so the plan can’t be changed here. They can change or cancel
          it from billing in their account.
        </p>
      ) : null}
      {canManage && !user.planBilledByCard ? (
        <>
          <Field
            label="End date for Pro or Enterprise"
            required
            hint={
              paid
                ? 'At most 12 months from today. Use Change end date to update the current plan.'
                : 'A plan granted by staff must end within 12 months.'
            }
            error={
              endDate && !endDateValid
                ? 'Choose a date from tomorrow up to 12 months from today.'
                : undefined
            }
          >
            <DatePicker
              value={endDate}
              onChange={setEndDate}
              min={tomorrowInLagos()}
              max={latestStaffGrantDay()}
              placeholder="Choose an end date"
            />
          </Field>
          <div className="flex flex-wrap gap-2">
            {paid ? (
              <Button
                variant="outline"
                size="sm"
                className="gap-1"
                isLoading={isChanging}
                disabled={!endDateValid}
                onClick={() => onChange(user.id, user.planTier, endDate)}
              >
                <CalendarDays className="h-3.5 w-3.5" />
                Change end date
              </Button>
            ) : null}
            {PLAN_TIERS.filter((tier) => tier !== user.planTier).map((tier) => (
              <Button
                key={tier}
                variant="outline"
                size="sm"
                className="gap-1"
                isLoading={isChanging}
                disabled={tier !== 'FREE' && !endDateValid}
                onClick={() => onChange(user.id, tier, tier === 'FREE' ? undefined : endDate)}
              >
                <BadgeCheck className="h-3.5 w-3.5" />
                Move to {planLabel(tier)}
              </Button>
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}
