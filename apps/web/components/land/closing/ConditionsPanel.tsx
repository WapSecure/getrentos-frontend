'use client';

import { useState } from 'react';
import { CheckCircle2, CircleDashed, Clock, XCircle } from 'lucide-react';
import { Badge, Button, Textarea } from '@getrentos/ui';
import { formatDate } from '@/lib/format';
import type { LandClosingChecklistItem, LandClosingCondition } from '@/types/landClosing';

const STATUS: Record<
  LandClosingCondition['status'],
  { label: string; variant: 'success' | 'info' | 'neutral' | 'danger' | 'warning' }
> = {
  PENDING: { label: 'Open', variant: 'neutral' },
  DELIVERED: { label: 'Awaiting buyer', variant: 'info' },
  SATISFIED: { label: 'Met', variant: 'success' },
  WAIVED: { label: 'Waived by buyer', variant: 'success' },
  FAILED: { label: 'Not met', variant: 'danger' },
};

const CHECK_ICON = {
  DONE: <CheckCircle2 className="h-4 w-4 shrink-0 text-success" aria-hidden />,
  OPEN: <CircleDashed className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />,
  BLOCKED: <XCircle className="h-4 w-4 shrink-0 text-destructive" aria-hidden />,
};

/**
 * Conditions precedent on a plot purchase and the closing checklist built
 * from them. The buyer confirms or waives; the developer marks deliverable
 * conditions met with a note.
 */
export const ConditionsPanel = ({
  conditions,
  checklist,
  role,
  busyKey,
  onConfirm,
  onWaive,
  onDeliver,
  sellerLabel = 'Developer',
}: {
  conditions: LandClosingCondition[];
  checklist?: LandClosingChecklistItem[];
  role: 'buyer' | 'developer';
  busyKey: string | null;
  onConfirm?: (key: string) => void;
  onWaive?: (key: string) => void;
  onDeliver?: (key: string, note: string) => void;
  /** Who delivers conditions: the developer on a plot, the seller on a resale. */
  sellerLabel?: string;
}) => {
  const [delivering, setDelivering] = useState<string | null>(null);
  const [note, setNote] = useState('');
  if (conditions.length === 0) return null;
  const open = (c: LandClosingCondition) => c.status === 'PENDING' || c.status === 'DELIVERED';

  return (
    <div className="space-y-4">
      <ul className="space-y-3">
        {conditions.map((condition) => {
          const status =
            condition.failed && open(condition) ? STATUS.FAILED : STATUS[condition.status];
          return (
            <li key={condition.key} className="rounded-xl border border-border p-3 text-sm">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <p className="font-medium text-foreground">{condition.label}</p>
                <Badge variant={status.variant}>{status.label}</Badge>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {condition.basis ? (
                  condition.basis
                ) : condition.deadline && open(condition) ? (
                  <span className="inline-flex items-center gap-1">
                    <Clock className="h-3 w-3" aria-hidden /> Due by{' '}
                    {formatDate(condition.deadline)}
                  </span>
                ) : null}
              </p>
              {condition.deliveredNote && (
                <p className="mt-1 text-xs text-foreground">
                  {sellerLabel}: “{condition.deliveredNote}”
                </p>
              )}
              {condition.note && (
                <p className="mt-1 text-xs text-muted-foreground">{condition.note}</p>
              )}

              {role === 'buyer' && open(condition) && !condition.failed && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {condition.status === 'DELIVERED' && onConfirm && (
                    <Button
                      size="sm"
                      onClick={() => onConfirm(condition.key)}
                      isLoading={busyKey === condition.key}
                    >
                      Confirm it is met
                    </Button>
                  )}
                  {onWaive && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onWaive(condition.key)}
                      disabled={busyKey === condition.key}
                    >
                      Waive this condition
                    </Button>
                  )}
                </div>
              )}

              {role === 'developer' &&
                condition.deliveredByDeveloper &&
                condition.status === 'PENDING' &&
                onDeliver &&
                (delivering === condition.key ? (
                  <div className="mt-2 space-y-2">
                    <Textarea
                      value={note}
                      onChange={(event) => setNote(event.target.value)}
                      rows={2}
                      maxLength={2000}
                      placeholder="What was done, so the buyer can check it"
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => {
                          onDeliver(condition.key, note.trim());
                          setDelivering(null);
                          setNote('');
                        }}
                        isLoading={busyKey === condition.key}
                      >
                        Mark met
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setDelivering(null)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-2"
                    onClick={() => setDelivering(condition.key)}
                  >
                    Mark met
                  </Button>
                ))}
            </li>
          );
        })}
      </ul>
      <p className="text-xs text-muted-foreground">{conditions[0].remedy}</p>

      {checklist && checklist.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-foreground">Closing checklist</h3>
          <ul className="mt-2 space-y-1.5 text-sm">
            {checklist.map((item) => (
              <li key={item.key} className="flex items-start gap-2">
                {CHECK_ICON[item.state]}
                <span className="text-foreground">
                  {item.label}
                  {item.detail && <span className="text-muted-foreground"> · {item.detail}</span>}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
