'use client';

import { useState } from 'react';
import { useQueryClient, type QueryKey } from '@tanstack/react-query';
import { ConfirmDialog, Toast } from '@sureground/ui';
import { ApiError, unwrap } from '@sureground/shared';
import type { ApiResponse } from '@sureground/shared';

// One place for the confirmation, audit reason, in-flight guard and visible outcome, so no admin action fails silently or fires twice.
export interface AdminAction {
  key: string;
  title: string;
  description: string;
  confirmLabel: string;
  successMessage: string;
  reasonRequired?: boolean;
  reasonMinLength?: number;
  run: (reason?: string) => Promise<ApiResponse<unknown>>;
}

export function useAdminAction({ invalidateKeys }: { invalidateKeys: QueryKey[] }) {
  const queryClient = useQueryClient();
  const [pendingAction, setPendingAction] = useState<AdminAction | null>(null);
  const [processingKey, setProcessingKey] = useState<string | null>(null);
  const [reason, setReason] = useState('');
  const [toast, setToast] = useState<{ message: string; variant: 'success' | 'error' } | null>(
    null
  );

  const executeAction = async () => {
    if (!pendingAction || processingKey) return;
    const action = pendingAction;
    setPendingAction(null);
    setProcessingKey(action.key);
    try {
      await unwrap(action.run(reason.trim() || undefined));
      setToast({ message: action.successMessage, variant: 'success' });
      await Promise.all(
        invalidateKeys.map((key) => queryClient.invalidateQueries({ queryKey: key }))
      );
    } catch (error) {
      setToast({
        message:
          error instanceof ApiError
            ? error.message
            : 'That action could not be completed. Please try again.',
        variant: 'error',
      });
    } finally {
      setProcessingKey(null);
    }
  };

  const feedback = (
    <>
      <ConfirmDialog
        open={pendingAction !== null}
        onOpenChange={(open) => {
          if (!open) {
            setPendingAction(null);
            setReason('');
          }
        }}
        title={pendingAction?.title ?? 'Confirm action'}
        description={pendingAction?.description ?? ''}
        confirmLabel={pendingAction?.confirmLabel ?? 'Confirm'}
        onConfirm={() => void executeAction()}
        promptLabel={pendingAction?.reasonRequired ? 'Reason' : undefined}
        promptPlaceholder="Explain the decision for other administrators…"
        promptValue={reason}
        onPromptChange={setReason}
        promptRequired={pendingAction?.reasonRequired}
        promptMinLength={pendingAction?.reasonMinLength ?? 10}
      />
      {toast && (
        <Toast message={toast.message} variant={toast.variant} onClose={() => setToast(null)} />
      )}
    </>
  );

  return { request: setPendingAction, processingKey, feedback };
}
