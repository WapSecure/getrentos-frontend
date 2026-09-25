'use client';

import { useState } from 'react';
import { useQueryClient, type QueryKey } from '@tanstack/react-query';
import { ConfirmDialog, Toast } from '@getrentos/ui';
import { ApiError, unwrap } from '@getrentos/shared';
import type { ApiResponse } from '@getrentos/shared';

/**
 * One administrator-initiated change with a confirmation step and feedback.
 *
 * The back office has a lot of these (correct a lifecycle state, release escrow,
 * decide an invoice…) and they all need the same four things: a description of
 * what is about to happen, a reason for the audit trail, a single in-flight guard
 * so a double-click cannot fire twice, and a visible outcome. Owning that in one
 * place stops each screen from losing a different one of them — an action that
 * fails silently makes an admin click it again.
 */
export interface AdminAction {
  /** Identifies the row being acted on, so only that row shows a pending state. */
  key: string;
  title: string;
  description: string;
  confirmLabel: string;
  successMessage: string;
  /** Ask for a reason and require at least `reasonMinLength` characters. */
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
