'use client';

import { useState } from 'react';
import { CheckCircle2, CircleDashed, ListChecks, XCircle } from 'lucide-react';
import { Badge, Button, Textarea } from '@getrentos/ui';
import { formatDate } from '@getrentos/shared';
import type { LandClosingChecklistItem, LandClosingCondition } from '@/types/landPurchase';
import { LandCaseSection } from '@/components/admin/land/case/shared';

const VARIANT: Record<string, 'success' | 'info' | 'neutral' | 'danger'> = {
  PENDING: 'neutral',
  DELIVERED: 'info',
  SATISFIED: 'success',
  WAIVED: 'success',
  FAILED: 'danger',
};
const ICON = {
  DONE: <CheckCircle2 className="h-4 w-4 text-success" aria-hidden />,
  OPEN: <CircleDashed className="h-4 w-4 text-muted-foreground" aria-hidden />,
  BLOCKED: <XCircle className="h-4 w-4 text-destructive" aria-hidden />,
};

/**
 * Conditions precedent and the closing checklist. Staff with
 * `verifications.approve` can decide a condition met or not met; a failure
 * lets the buyer cancel with everything refunded.
 */
export const LandPurchaseConditions = ({
  conditions,
  checklist,
  canDecide,
  busyKey,
  onDecide,
}: {
  conditions: LandClosingCondition[];
  checklist?: LandClosingChecklistItem[];
  canDecide: boolean;
  busyKey: string | null;
  onDecide: (key: string, status: 'SATISFIED' | 'FAILED', note: string) => void;
}) => {
  const [deciding, setDeciding] = useState<string | null>(null);
  const [note, setNote] = useState('');
  if (conditions.length === 0) return null;
  const open = (c: LandClosingCondition) =>
    c.status === 'PENDING' || c.status === 'DELIVERED' || c.status === 'FAILED';

  return (
    <LandCaseSection
      title="Conditions precedent"
      icon={ListChecks}
      description="Nothing is released to the developer while any is open or not met."
    >
      <ul className="space-y-2">
        {conditions.map((c) => (
          <li key={c.key} className="rounded-xl border border-border p-3 text-sm">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <p className="font-medium text-foreground">{c.label}</p>
              <Badge variant={c.failed && c.status !== 'FAILED' ? 'danger' : VARIANT[c.status]}>
                {c.failed && c.status !== 'FAILED' ? 'Overdue' : c.status.toLowerCase()}
              </Badge>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {c.basis ?? (c.deadline ? `Due by ${formatDate(c.deadline)}` : '')}
              {c.deliveredNote ? ` · developer: “${c.deliveredNote}”` : ''}
              {c.note ? ` · ${c.note}` : ''}
            </p>
            {canDecide &&
              open(c) &&
              (deciding === c.key ? (
                <div className="mt-2 space-y-2">
                  <Textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    rows={2}
                    maxLength={2000}
                    placeholder="Basis for the decision (kept in the audit trail)"
                  />
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="xs"
                      disabled={note.trim().length < 5}
                      isLoading={busyKey === c.key}
                      onClick={() => {
                        onDecide(c.key, 'SATISFIED', note);
                        setDeciding(null);
                        setNote('');
                      }}
                    >
                      Mark met
                    </Button>
                    {c.status !== 'FAILED' && (
                      <Button
                        size="xs"
                        variant="danger"
                        disabled={note.trim().length < 5}
                        isLoading={busyKey === c.key}
                        onClick={() => {
                          onDecide(c.key, 'FAILED', note);
                          setDeciding(null);
                          setNote('');
                        }}
                      >
                        Mark not met
                      </Button>
                    )}
                    <Button size="xs" variant="ghost" onClick={() => setDeciding(null)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  size="xs"
                  variant="outline"
                  className="mt-2"
                  onClick={() => setDeciding(c.key)}
                >
                  Decide
                </Button>
              ))}
          </li>
        ))}
      </ul>
      {checklist && checklist.length > 0 && (
        <div className="mt-4">
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            Closing checklist
          </h3>
          <ul className="space-y-1.5 text-sm">
            {checklist.map((item) => (
              <li key={item.key} className="flex items-start gap-2">
                {ICON[item.state]}
                <span>
                  {item.label}
                  {item.detail && <span className="text-muted-foreground"> · {item.detail}</span>}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </LandCaseSection>
  );
};
