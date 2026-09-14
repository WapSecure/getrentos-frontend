'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ConfirmDialog, Toast } from '@getrentos/ui';

/** Triggers a browser download for an authenticated CSV blob. */
export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

type ProfessionalAction = {
  title: string;
  description: string;
  label?: string;
  run: (reason: string) => Promise<unknown>;
};

/**
 * Confirm-dialog + toast wiring for realtor/agent professional-standing
 * actions (suspend/restore/revoke/reassign), shared by both registers so
 * the two files don't duplicate the same mutation plumbing.
 */
export function useProfessionalActions(invalidateKey: 'realtors' | 'agents') {
  const client = useQueryClient();
  const [action, setAction] = useState<ProfessionalAction | null>(null);
  const [reason, setReason] = useState('');
  const [toast, setToast] = useState<{ message: string; variant: 'success' | 'error' } | null>(
    null
  );
  const mutation = useMutation({
    mutationFn: async () => action?.run(reason.trim()),
    onSuccess: async () => {
      setAction(null);
      setReason('');
      setToast({ message: 'Action completed and audited.', variant: 'success' });
      await client.invalidateQueries({ queryKey: ['admin', invalidateKey] });
    },
    onError: (error: Error) => setToast({ message: error.message, variant: 'error' }),
  });

  return {
    request: setAction,
    feedback: (
      <>
        <ConfirmDialog
          open={Boolean(action)}
          onOpenChange={(open) => !open && setAction(null)}
          title={action?.title ?? 'Confirm action'}
          description={action?.description ?? ''}
          confirmLabel={action?.label}
          isLoading={mutation.isPending}
          promptLabel="Administrative reason"
          promptValue={reason}
          onPromptChange={setReason}
          promptRequired
          promptMinLength={10}
          onConfirm={() => mutation.mutate()}
        />
        {toast && (
          <Toast message={toast.message} variant={toast.variant} onClose={() => setToast(null)} />
        )}
      </>
    ),
  };
}
