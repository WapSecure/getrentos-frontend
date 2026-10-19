'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button, EmptyState, Field, PageErrorState, Textarea, Toast } from '@getrentos/ui';
import { ScanSearch } from 'lucide-react';
import { unwrap } from '@/lib/apiHelpers';
import { formatDate } from '@/lib/format';
import {
  prePurchaseInspectionKeys,
  prePurchaseInspectionService,
} from '@/services/landPrePurchaseInspectionService';
import type { PrePurchaseInspection } from '@/types/landPrePurchaseInspection';
import { InspectionReportCard } from '../watch/InspectionReportCard';

type Notify = (message: string, variant?: 'success' | 'error') => void;

/** Questions on the report and the follow-ups a buyer can ask for. */
const BuyerInspectionActions = ({
  inspection,
  notify,
}: {
  inspection: PrePurchaseInspection;
  notify: Notify;
}) => {
  const queryClient = useQueryClient();
  const [mode, setMode] = useState<'none' | 'ask' | 'reinspect'>('none');
  const [text, setText] = useState('');
  const done = (message: string) => (updated: PrePurchaseInspection) => {
    queryClient.setQueryData<PrePurchaseInspection[]>(prePurchaseInspectionKeys.mine, (list) =>
      list?.some((x) => x.id === updated.id)
        ? list.map((x) => (x.id === updated.id ? updated : x))
        : [updated, ...(list ?? [])]
    );
    void queryClient.invalidateQueries({ queryKey: prePurchaseInspectionKeys.mine });
    setMode('none');
    setText('');
    notify(message);
  };
  const fail = (reason: Error) => notify(reason.message, 'error');
  const ask = useMutation({
    mutationFn: () => unwrap(prePurchaseInspectionService.ask(inspection.id, text)),
    onSuccess: done('Question sent. GetRentos will answer here.'),
    onError: fail,
  });
  const reinspect = useMutation({
    mutationFn: () => unwrap(prePurchaseInspectionService.reinspect(inspection.id, text)),
    onSuccess: done('Reinspection requested.'),
    onError: fail,
  });
  const accepted = inspection.status === 'ACCEPTED';

  return (
    <div className="mt-3 space-y-3">
      {inspection.questions.length > 0 && (
        <ul className="space-y-2">
          {inspection.questions.map((q) => (
            <li key={q.id} className="rounded-lg bg-secondary/50 p-3 text-sm">
              <p className="text-foreground">You asked: {q.question}</p>
              <p className="mt-1 text-muted-foreground">
                {q.answer
                  ? `GetRentos${q.answeredAt ? ` (${formatDate(q.answeredAt)})` : ''}: ${q.answer}`
                  : 'Waiting for an answer.'}
              </p>
            </li>
          ))}
        </ul>
      )}
      {accepted &&
        (mode === 'none' ? (
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={() => setMode('ask')}>
              Ask about the report
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setMode('reinspect')}>
              Ask for a reinspection
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            <Field
              label={mode === 'ask' ? 'Your question' : 'What should the inspector look at again?'}
              htmlFor={`inspection-${inspection.id}-${mode}`}
            >
              <Textarea
                id={`inspection-${inspection.id}-${mode}`}
                rows={2}
                maxLength={2000}
                value={text}
                onChange={(e) => setText(e.target.value)}
              />
            </Field>
            <div className="flex gap-2">
              <Button
                size="sm"
                disabled={text.trim().length < 10 || ask.isPending || reinspect.isPending}
                isLoading={ask.isPending || reinspect.isPending}
                onClick={() => (mode === 'ask' ? ask.mutate() : reinspect.mutate())}
              >
                {mode === 'ask' ? 'Send question' : 'Request reinspection'}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setMode('none')}>
                Back
              </Button>
            </div>
          </div>
        ))}
      <p className="text-xs text-muted-foreground">{inspection.disclaimer}</p>
    </div>
  );
};

/** The buyer's pre-purchase inspections: where each stands, and the report once accepted. */
export const BuyerInspections = () => {
  const [toast, setToast] = useState<{ message: string; variant: 'success' | 'error' } | null>(
    null
  );
  const list = useQuery({
    queryKey: prePurchaseInspectionKeys.mine,
    queryFn: () => unwrap(prePurchaseInspectionService.mine()),
  });
  const notify: Notify = (message, variant = 'success') => setToast({ message, variant });

  if (list.isLoading)
    return <div className="h-40 animate-pulse rounded-2xl bg-secondary" aria-busy="true" />;
  if (list.isError) {
    return (
      <PageErrorState
        description={list.error instanceof Error ? list.error.message : undefined}
        onRetry={() => list.refetch()}
        isRetrying={list.isRefetching}
      />
    );
  }
  const items = list.data ?? [];
  return (
    <>
      {items.length === 0 ? (
        <EmptyState
          icon={ScanSearch}
          title="No inspections yet"
          description="Commission one from a land listing or an estate plot."
        />
      ) : (
        <ul className="space-y-4">
          {items.map((inspection) => (
            <li key={inspection.id} className="space-y-1">
              <p className="text-sm font-semibold text-foreground">
                {inspection.land}
                <span className="font-normal text-muted-foreground">
                  {' '}
                  · {inspection.city}, {inspection.state}
                  {inspection.reinspectionOfId ? ' · reinspection' : ''}
                </span>
              </p>
              <InspectionReportCard
                inspection={inspection}
                actions={<BuyerInspectionActions inspection={inspection} notify={notify} />}
              />
            </li>
          ))}
        </ul>
      )}
      {toast && (
        <Toast message={toast.message} variant={toast.variant} onClose={() => setToast(null)} />
      )}
    </>
  );
};
