'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { KeyRound, LogOut } from 'lucide-react';
import { Button, ConfirmDialog, useToast } from '@sureground/ui';
import { unwrap } from '@sureground/shared';
import { adminService } from '@/services/adminService';

type Action = 'signOut' | 'resetTwoFactor';

const COPY: Record<Action, { title: string; description: string; confirm: string }> = {
  signOut: {
    title: 'Sign this person out everywhere?',
    description:
      'Every device they are signed in on is signed out within 15 minutes. Use it when an account may have been taken over.',
    confirm: 'Sign out everywhere',
  },
  resetTwoFactor: {
    title: 'Reset two-factor for this person?',
    description:
      'Their authenticator app and backup codes are removed and every device is signed out. They set two-factor up again at their next sign-in.',
    confirm: 'Reset two-factor',
  },
};

export const UserSecurityActions = ({ userId }: { userId: string }) => {
  const toast = useToast();
  const [action, setAction] = useState<Action | null>(null);
  const [reason, setReason] = useState('');

  const mutation = useMutation({
    mutationFn: (current: Action) =>
      current === 'signOut'
        ? unwrap(adminService.signOutUserEverywhere(userId, reason.trim()))
        : unwrap(adminService.resetUserTwoFactor(userId, reason.trim())),
    onSuccess: (_, current) => {
      toast.success(
        current === 'signOut'
          ? 'Signed out everywhere. Devices lose access within 15 minutes.'
          : 'Two-factor reset and every device signed out.'
      );
      setAction(null);
      setReason('');
    },
    onError: (err) =>
      toast.error(err instanceof Error ? err.message : 'That did not work. Try again.'),
  });

  const open = (next: Action) => {
    setReason('');
    setAction(next);
  };

  return (
    <div className="px-4 pb-4">
      <p className="mb-2 text-xs font-medium text-muted-foreground">Account security</p>
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" className="gap-1.5" onClick={() => open('signOut')}>
          <LogOut className="w-3.5 h-3.5" />
          Sign out everywhere
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5"
          onClick={() => open('resetTwoFactor')}
        >
          <KeyRound className="w-3.5 h-3.5" />
          Reset two-factor
        </Button>
      </div>
      {action && (
        <ConfirmDialog
          open
          onOpenChange={(next) => !next && setAction(null)}
          title={COPY[action].title}
          description={COPY[action].description}
          confirmLabel={COPY[action].confirm}
          promptLabel="Reason (kept in the audit log)"
          promptPlaceholder="For example: customer reported a sign-in they didn't make"
          promptValue={reason}
          onPromptChange={setReason}
          promptRequired
          promptMinLength={3}
          onConfirm={() => mutation.mutate(action)}
          isLoading={mutation.isPending}
        />
      )}
    </div>
  );
};
