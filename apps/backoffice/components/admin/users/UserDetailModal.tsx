'use client';

import { Ban, CheckCircle2, ShieldAlert, BadgeCheck } from '@sureground/icons';
import { Dialog, DialogContent, DialogTitle } from '@sureground/ui';
import { Badge, Button, type BadgeVariant } from '@sureground/ui';
import { FactGrid } from '@/components/admin/ops/OpsParts';
import { getInitials, formatDate, formatRelativeTime } from '@sureground/shared';
import type { PlanTier, PlatformUser, UserAccountStatus } from '@/types/admin';
import { roleLabel } from '@/lib/roleLabels';
import { UserSecurityActions } from './UserSecurityActions';

interface UserDetailModalProps {
  user: PlatformUser | null;
  onClose: () => void;
  onChangeStatus: (userId: string, status: UserAccountStatus) => void;
  isChangingStatus?: boolean;
  pendingStatus?: UserAccountStatus;
  onChangeSubscription: (userId: string, tier: PlanTier) => void;
  isChangingSubscription?: boolean;
}

const STATUS: Record<UserAccountStatus, { label: string; variant: BadgeVariant }> = {
  active: { label: 'Active', variant: 'success' },
  pending: { label: 'Pending', variant: 'warning' },
  suspended: { label: 'Suspended', variant: 'warning' },
  banned: { label: 'Banned', variant: 'danger' },
};

const planLabel = (tier: PlanTier) =>
  tier === 'ENTERPRISE' ? 'Enterprise' : tier === 'PRO' ? 'Pro' : 'Free';

export const UserDetailModal = ({
  user,
  onClose,
  onChangeStatus,
  isChangingStatus = false,
  pendingStatus,
  onChangeSubscription,
  isChangingSubscription = false,
}: UserDetailModalProps) => {
  return (
    <Dialog open={!!user} onOpenChange={(open) => !open && onClose()}>
      {user && (
        <DialogContent className="p-0">
          <div className="border-b border-border px-5 py-4 pr-12">
            <div className="flex items-center gap-3">
              <div
                aria-hidden="true"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary ring-1 ring-inset ring-primary/15"
              >
                {getInitials(user.fullName)}
              </div>
              <div className="min-w-0">
                <DialogTitle className="font-semibold tracking-[-0.01em] text-foreground [overflow-wrap:anywhere]">
                  {user.fullName}
                </DialogTitle>
                <p className="truncate text-xs text-muted-foreground" title={user.email}>
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

            <div className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2 text-sm">
              <span className="text-muted-foreground">Plan</span>
              <div className="flex items-center gap-2">
                <Badge variant={user.planTier === 'FREE' ? 'neutral' : 'primary'}>
                  {planLabel(user.planTier)}
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1 h-6 px-2 text-xs"
                  isLoading={isChangingSubscription}
                  onClick={() =>
                    onChangeSubscription(user.id, user.planTier === 'FREE' ? 'PRO' : 'FREE')
                  }
                >
                  <BadgeCheck className="w-3 h-3" />
                  {user.planTier === 'FREE' ? 'Upgrade to Pro' : 'Move to Free'}
                </Button>
              </div>
            </div>
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
