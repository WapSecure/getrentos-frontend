'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { SlidersHorizontal } from 'lucide-react';
import { Button, CurrencyInput, type ToastVariant } from '@getrentos/ui';
import { mine, type ManagementMandateDto } from '@/services/mandateService';
import { spendApprovalService } from '@/services/spendApprovalService';
import { unwrap } from '@/lib/apiHelpers';

/**
 * Lets the owner set, per managed engagement, the most a manager may spend before
 * it needs the owner's sign-off. Shown only when the owner has a live engagement
 * — the cap has no meaning without a manager to measure against.
 */
export function SpendCapSettings({
  onToast,
}: {
  onToast: (t: { message: string; variant: ToastVariant }) => void;
}) {
  const { data } = useQuery({
    queryKey: ['mandates', 'mine'],
    queryFn: () => unwrap(mine()),
  });
  const engagements = (data ?? []).filter((m) => m.status === 'ACTIVE');

  if (engagements.length === 0) return null;

  return (
    <div className="mb-6 rounded-2xl border border-border bg-card p-5">
      <div className="mb-3 flex items-center gap-2">
        <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
        <h2 className="text-sm font-semibold text-foreground">Approval limits</h2>
      </div>
      <p className="mb-4 text-xs text-muted-foreground">
        Spend above the limit you set needs your approval. Leave it blank for no limit.
      </p>
      <div className="space-y-3">
        {engagements.map((m) => (
          <CapRow key={m.id} mandate={m} onToast={onToast} />
        ))}
      </div>
    </div>
  );
}

function CapRow({
  mandate,
  onToast,
}: {
  mandate: ManagementMandateDto;
  onToast: (t: { message: string; variant: ToastVariant }) => void;
}) {
  const [cap, setCap] = useState<number>(mandate.maintenanceApprovalCap ?? 0);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    const res = await spendApprovalService.setMandateCap(mandate.id, cap > 0 ? cap : null);
    setSaving(false);
    onToast(
      res.success
        ? { message: 'Approval limit saved.', variant: 'success' }
        : { message: res.message || 'Could not save the limit.', variant: 'error' }
    );
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <span className="min-w-0 truncate text-sm text-foreground">
        {mandate.propertyTitle ?? 'Property'}
      </span>
      <div className="flex items-center gap-2">
        <div className="w-40">
          <CurrencyInput value={cap} onValueChange={setCap} placeholder="No limit" />
        </div>
        <Button variant="secondary" size="sm" onClick={save} disabled={saving}>
          {saving ? 'Saving…' : 'Save'}
        </Button>
      </div>
    </div>
  );
}
