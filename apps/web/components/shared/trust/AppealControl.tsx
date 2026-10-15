'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Gavel, Clock, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { Button, Textarea, Toast, type ToastVariant } from '@getrentos/ui';
import { unwrap } from '@/lib/apiHelpers';
import {
  trustAppealService,
  type AppealTargetType,
  type TrustAppealDto,
  type TrustAppealStatus,
} from '@/services/trustAppealService';

/** Shared query key so every mounted control reuses one `listMine` fetch. */
const MY_APPEALS_KEY = ['trust', 'appeals', 'mine'] as const;

const STATUS_PRESENTATION: Record<
  TrustAppealStatus,
  { label: string; icon: React.ElementType; className: string }
> = {
  OPEN: {
    label: 'Appeal submitted — under review',
    icon: Clock,
    className: 'text-amber-700 dark:text-amber-400',
  },
  UNDER_REVIEW: {
    label: 'Appeal under review',
    icon: Clock,
    className: 'text-amber-700 dark:text-amber-400',
  },
  OVERTURNED: {
    label: 'Appeal successful — the decision has been reopened for review',
    icon: CheckCircle2,
    className: 'text-emerald-700 dark:text-emerald-400',
  },
  UPHELD: {
    label: 'Appeal reviewed — the original decision stands',
    icon: XCircle,
    className: 'text-red-700 dark:text-red-400',
  },
  CLOSED: {
    label: 'Appeal closed',
    icon: XCircle,
    className: 'text-muted-foreground',
  },
};

interface AppealControlProps {
  targetType: AppealTargetType;
  targetId: string;
  /** Short context shown in the prompt, e.g. "this claim" or "this verification". */
  subject?: string;
}

/**
 * The subject's side of a trust appeal (TG-06): contest a rejected decision, or
 * see the status of the appeal already filed against it.
 *
 * It fetches the signed-in user's appeals once (shared query key) and matches the
 * one for this target, so it can either offer the appeal form or show where the
 * existing appeal stands — a subject never files two appeals for the same
 * decision, and the backend enforces that too.
 */
export const AppealControl = ({
  targetType,
  targetId,
  subject = 'this decision',
}: AppealControlProps) => {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [toast, setToast] = useState<{ message: string; variant: ToastVariant } | null>(null);

  const { data: appeals, isLoading } = useQuery({
    queryKey: MY_APPEALS_KEY,
    queryFn: () => unwrap(trustAppealService.listMine()),
  });

  const existing: TrustAppealDto | undefined = (appeals ?? []).find(
    (a) => a.targetType === targetType && a.targetId === targetId
  );

  const file = useMutation({
    mutationFn: () =>
      unwrap(trustAppealService.file({ targetType, targetId, reason: reason.trim() })),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MY_APPEALS_KEY });
      setOpen(false);
      setReason('');
      setToast({ message: 'Appeal submitted. An officer will review it.', variant: 'success' });
    },
    onError: (e: Error) =>
      setToast({ message: e.message || 'Could not submit your appeal.', variant: 'error' }),
  });

  if (isLoading) return null;

  if (existing) {
    const p = STATUS_PRESENTATION[existing.status];
    const Icon = p.icon;
    return (
      <div className="mt-2">
        <p className={`flex items-center gap-1.5 text-xs font-medium ${p.className}`}>
          <Icon className="h-3.5 w-3.5 shrink-0" />
          {p.label}
        </p>
        {existing.resolution && (
          <p className="mt-0.5 text-xs text-muted-foreground">Officer: {existing.resolution}</p>
        )}
      </div>
    );
  }

  return (
    <div className="mt-2">
      {open ? (
        <div className="space-y-2">
          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            placeholder={`Tell us why you are appealing ${subject} (at least 10 characters).`}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
          <div className="flex gap-2">
            <Button
              size="sm"
              disabled={reason.trim().length < 10 || file.isPending}
              onClick={() => file.mutate()}
              className="gap-1.5"
            >
              {file.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Gavel className="h-4 w-4" />
              )}
              Submit appeal
            </Button>
            <Button
              size="sm"
              variant="ghost"
              disabled={file.isPending}
              onClick={() => {
                setOpen(false);
                setReason('');
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
        >
          <Gavel className="h-3.5 w-3.5" />
          Appeal this decision
        </button>
      )}

      {toast && (
        <Toast message={toast.message} variant={toast.variant} onClose={() => setToast(null)} />
      )}
    </div>
  );
};
