'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { PenLine } from '@sureground/icons';
import { Button, ReasonDialog, useToast } from '@sureground/ui';
import { unwrap } from '@sureground/shared';
import { adminService } from '@/services/adminService';

interface UserLegalNameActionProps {
  userId: string;
  currentName: string;
  onChanged: (legalName: string) => void;
}

export const UserLegalNameAction = ({
  userId,
  currentName,
  onChanged,
}: UserLegalNameActionProps) => {
  const toast = useToast();
  const [open, setOpen] = useState(false);

  const mutation = useMutation({
    mutationFn: ({ legalName, reason }: { legalName: string; reason: string }) =>
      unwrap(adminService.setUserLegalName(userId, legalName, reason)),
    onSuccess: (result) => {
      toast.success(`Legal name changed to ${result.legalName}.`);
      onChanged(result.legalName);
    },
    onError: (err) =>
      toast.error(
        err instanceof Error ? err.message : 'The legal name was not changed. Try again.'
      ),
  });

  return (
    <>
      <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setOpen(true)}>
        <PenLine className="w-3.5 h-3.5" />
        Correct legal name
      </Button>
      <ReasonDialog
        open={open}
        onOpenChange={setOpen}
        title="Correct legal name"
        description={`Currently "${currentName}". Change it only to match their identity document: bank, payout and compliance checks compare against it, and they cannot change it themselves once their identity is verified.`}
        subject={{
          label: 'Legal name as on their ID',
          placeholder: 'Full legal name',
          minLength: 2,
          maxLength: 200,
        }}
        reasonLabel="Reason (kept in the audit log)"
        reasonPlaceholder="For example: checked against their passport after a typo at sign-up"
        minLength={3}
        maxLength={500}
        confirmLabel="Change legal name"
        onSubmit={({ subject, reason }) =>
          mutation.mutateAsync({ legalName: subject ?? '', reason })
        }
      />
    </>
  );
};
