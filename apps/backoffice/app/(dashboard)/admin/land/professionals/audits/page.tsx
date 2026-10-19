'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, CircleAlert, ClipboardCheck } from 'lucide-react';
import { Button, EmptyState, Select, Textarea, Toast, type ToastVariant } from '@getrentos/ui';
import { formatDate, unwrap } from '@getrentos/shared';
import { useAdminUser } from '../../../layout';
import { hasAdminPermission } from '@/lib/adminAccess';
import { readLandApiError } from '@/lib/landDiligence';
import {
  adminLandProfessionalService,
  landProfessionalKeys,
} from '@/services/adminLandProfessionalService';
import {
  LAND_PROFESSIONAL_ROLE_LABELS,
  type LandReviewAuditOutcome,
  type PendingReviewAudit,
} from '@/types/landProfessional';

const OUTCOMES = [
  { value: 'PASS', label: 'Pass: sound work' },
  { value: 'FINDINGS', label: 'Findings: minor issues' },
  { value: 'FAIL', label: 'Fail: unreliable work' },
];

const AuditItem = ({
  item,
  canDecide,
  onRecord,
  saving,
}: {
  item: PendingReviewAudit;
  canDecide: boolean;
  onRecord: (outcome: LandReviewAuditOutcome, note: string) => void;
  saving: boolean;
}) => {
  const [outcome, setOutcome] = useState<LandReviewAuditOutcome | ''>('');
  const [note, setNote] = useState('');
  return (
    <li className="rounded-2xl border border-border bg-card p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="font-medium text-foreground">
          {item.professionalName} · {LAND_PROFESSIONAL_ROLE_LABELS[item.role]}
        </p>
        <Link
          href={`/admin/land/diligence/${encodeURIComponent(item.propertyId)}`}
          className="text-sm text-primary hover:underline"
        >
          {item.propertyTitle}
        </Link>
      </div>
      {item.completedAt && (
        <p className="text-xs text-muted-foreground">Reported {formatDate(item.completedAt)}</p>
      )}
      <p className="mt-3 max-h-60 overflow-y-auto whitespace-pre-line rounded-xl bg-secondary/50 p-3 text-sm text-foreground">
        {item.report || 'No report text.'}
      </p>
      {canDecide && (
        <div className="mt-4 grid gap-3 sm:grid-cols-[220px_minmax(0,1fr)_auto] sm:items-start">
          <Select
            value={outcome}
            onValueChange={(v) => setOutcome(v as LandReviewAuditOutcome)}
            ariaLabel="Audit outcome"
            placeholder="Outcome"
            options={OUTCOMES}
          />
          <Textarea
            rows={2}
            maxLength={4000}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            aria-label="Audit note"
            placeholder="What you re-checked (registry, charting, site) and what you found."
          />
          <Button
            disabled={!outcome || note.trim().length < 5 || saving}
            isLoading={saving}
            onClick={() => onRecord(outcome as LandReviewAuditOutcome, note.trim())}
          >
            Record
          </Button>
        </div>
      )}
    </li>
  );
};

/** Completed outside reviews picked at random for a staff quality audit (§19.1). */
export default function AdminLandReviewAuditsPage() {
  const user = useAdminUser();
  const queryClient = useQueryClient();
  const canView = hasAdminPermission(user?.roles, 'verifications.review');
  const canDecide = hasAdminPermission(user?.roles, 'verifications.approve');
  const [toast, setToast] = useState<{ message: string; variant: ToastVariant } | null>(null);
  const query = useQuery({
    queryKey: landProfessionalKeys.audits,
    queryFn: () => unwrap(adminLandProfessionalService.audits()),
    enabled: canView,
  });
  const record = useMutation({
    mutationFn: (v: { seatId: string; outcome: LandReviewAuditOutcome; note: string }) =>
      unwrap(adminLandProfessionalService.recordAudit(v.seatId, v.outcome, v.note)),
    onSuccess: (next) => {
      queryClient.setQueryData(landProfessionalKeys.audits, next);
      setToast({ message: 'Audit recorded on the professional’s record.', variant: 'success' });
    },
    onError: (error) =>
      setToast({
        message: readLandApiError(error, 'Could not record the audit.').message,
        variant: 'error',
      }),
  });

  if (!canView) {
    return (
      <EmptyState
        icon={CircleAlert}
        title="You do not have access to review audits"
        description="This needs the verifications review permission."
      />
    );
  }
  const items = query.data ?? [];
  return (
    <>
      <Link
        href="/admin/land/professionals"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden /> Land professionals
      </Link>
      <div className="mb-6">
        <h1 className="type-title">Review audits</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          About one in five completed reports is picked for a second look. Re-check the sources the
          professional relied on; repeated findings or a failure are grounds to suspend.
        </p>
      </div>
      {query.isLoading ? (
        <div className="h-40 animate-pulse rounded-2xl bg-secondary" aria-busy="true" />
      ) : items.length === 0 ? (
        <EmptyState
          icon={ClipboardCheck}
          title="No audits waiting"
          description="Sampled reports will appear here."
        />
      ) : (
        <ul className="space-y-4">
          {items.map((item) => (
            <AuditItem
              key={item.seatId}
              item={item}
              canDecide={canDecide}
              saving={record.isPending && record.variables?.seatId === item.seatId}
              onRecord={(outcome, note) => record.mutate({ seatId: item.seatId, outcome, note })}
            />
          ))}
        </ul>
      )}
      {toast && (
        <Toast message={toast.message} variant={toast.variant} onClose={() => setToast(null)} />
      )}
    </>
  );
}
