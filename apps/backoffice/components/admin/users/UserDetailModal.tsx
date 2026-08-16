'use client';

import { Ban, CheckCircle2, ShieldAlert } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@getrentos/ui';
import { Button } from '@getrentos/ui';
import { getInitials, formatDate, formatRelativeTime } from '@getrentos/shared';
import type { PlatformUser, UserAccountStatus } from '@/types/admin';

interface UserDetailModalProps {
  user: PlatformUser | null;
  onClose: () => void;
  onChangeStatus: (userId: string, status: UserAccountStatus) => void;
}

const roleLabels: Record<string, string> = {
  renter: 'Renter',
  landlord: 'Landlord',
  owner: 'Property Owner',
  buyer: 'Buyer',
  realtor: 'Realtor',
  agent: 'Agent',
  admin: 'Admin',
};

export const UserDetailModal = ({ user, onClose, onChangeStatus }: UserDetailModalProps) => {
  return (
    <Dialog open={!!user} onOpenChange={(open) => !open && onClose()}>
      {user && (
        <DialogContent>
          <div className="p-4 border-b border-border flex justify-between items-center pr-12">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-primary to-primary/60 flex items-center justify-center text-primary-foreground font-semibold text-sm">
                {getInitials(user.fullName)}
              </div>
              <div>
                <DialogTitle className="font-semibold text-foreground">{user.fullName}</DialogTitle>
                <p className="text-xs text-muted-foreground">{user.email}</p>
              </div>
            </div>
          </div>

          <div className="p-4 space-y-4">
            <div>
              <p className="text-xs text-muted-foreground mb-1.5">Roles</p>
              <div className="flex flex-wrap gap-1.5">
                {user.roles.map((role) => (
                  <span
                    key={role}
                    className="text-xs px-2 py-1 rounded-full bg-secondary text-secondary-foreground"
                  >
                    {roleLabels[role] || role}
                  </span>
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-border divide-y divide-border overflow-hidden">
              <div className="flex items-center justify-between px-3 py-2 text-sm">
                <span className="text-muted-foreground">Trust Score</span>
                <span className="text-foreground font-medium">{user.trustScore}</span>
              </div>
              <div className="flex items-center justify-between px-3 py-2 text-sm">
                <span className="text-muted-foreground">Joined</span>
                <span className="text-foreground font-medium">{formatDate(user.joinedDate)}</span>
              </div>
              <div className="flex items-center justify-between px-3 py-2 text-sm">
                <span className="text-muted-foreground">Last Active</span>
                <span className="text-foreground font-medium">
                  {formatRelativeTime(user.lastActiveAt)}
                </span>
              </div>
            </div>
          </div>

          <div className="p-4 border-t border-border flex gap-2">
            <Button variant="ghost" className="flex-1" onClick={onClose}>
              Close
            </Button>
            {user.status !== 'suspended' ? (
              <Button
                variant="outline"
                className="flex-1 gap-1.5"
                onClick={() => onChangeStatus(user.id, 'suspended')}
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                Suspend
              </Button>
            ) : (
              <Button
                variant="outline"
                className="flex-1 gap-1.5"
                onClick={() => onChangeStatus(user.id, 'active')}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Reactivate
              </Button>
            )}
            {user.status !== 'banned' && (
              <Button
                variant="ghost"
                className="flex-1 gap-1.5 text-red-600 dark:text-red-400"
                onClick={() => onChangeStatus(user.id, 'banned')}
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
