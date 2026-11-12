'use client';

import { useState } from 'react';
import { UserRoundPlus } from '@sureground/icons';
import { Button, Dialog, DialogContent, DialogDescription, DialogTitle } from '@sureground/ui';
import type { DiasporaQueueItem } from '@/types/diaspora';
import { UserLookup, type PickedUser } from '@/components/admin/land/case/UserLookup';

interface AssignQueueItemDialogProps {
  item: DiasporaQueueItem | null;
  canSearchUsers: boolean;
  isPending: boolean;
  onClose: () => void;
  onAssign: (item: DiasporaQueueItem, staff: PickedUser) => void;
}

export const AssignQueueItemDialog = ({
  item,
  canSearchUsers,
  isPending,
  onClose,
  onAssign,
}: AssignQueueItemDialogProps) => {
  const [staff, setStaff] = useState<PickedUser | null>(null);
  const close = () => {
    setStaff(null);
    onClose();
  };

  return (
    <Dialog open={Boolean(item)} onOpenChange={(open) => !open && !isPending && close()}>
      {item && (
        <DialogContent className="max-w-lg">
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              if (staff) onAssign(item, staff);
            }}
          >
            <div>
              <DialogTitle className="type-heading text-lg">Assign to a staff member</DialogTitle>
              <DialogDescription className="mt-1 text-sm text-muted-foreground">
                {item.title}. They are notified, and the assignment is recorded in the audit log.
              </DialogDescription>
            </div>
            <UserLookup
              value={staff}
              onChange={setStaff}
              staffOnly
              canSearch={canSearchUsers}
              ariaLabel="Find a staff member to assign"
            />
            <div className="flex justify-end gap-2 pt-1">
              <Button type="button" variant="ghost" onClick={close} disabled={isPending}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={!staff || isPending}
                isLoading={isPending}
                icon={<UserRoundPlus className="h-4 w-4" />}
              >
                Assign
              </Button>
            </div>
          </form>
        </DialogContent>
      )}
    </Dialog>
  );
};
