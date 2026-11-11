'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Button,
  EmptyState,
  Field,
  ListSkeleton,
  PageErrorState,
  Textarea,
  Toast,
} from '@sureground/ui';
import { ScanSearch } from '@sureground/icons';
import { unwrap } from '@/lib/apiHelpers';
import { formatDate } from '@/lib/format';
import {
  prePurchaseInspectionKeys,
  prePurchaseInspectionService,
} from '@/services/prePurchaseInspectionService';
import type { PrePurchaseInspection } from '@/types/prePurchaseInspection';
import type { TourScope } from '@/types/siteTour';
import { InspectionReportCard } from '@/components/land/watch/InspectionReportCard';

type Notify = (message: string, variant?: 'success' | 'error') => void;

const BuyerInspectionActions = ({
  inspection,
  scope,
  notify,
}: {
  inspection: PrePurchaseInspection;
  scope: TourScope;
  notify: Notify;
}) => {
  const queryClient = useQueryClient();
  const [mode, setMode] = useState<'none' | 'ask' | 'reinspect'>('none');
  const [text, setText] = useState('');
  const done = (message: string) => (updated: PrePurchaseInspection) => {
    queryClient.setQueryData<PrePurchaseInspection[]>(
      prePurchaseInspectionKeys.mine(scope),
      (list) =>
        list?.some((x) => x.id === updated.id)
          ? list.map((x) => (x.id === updated.id ? updated : x))
          : [updated, ...(list ?? [])]
    );
    void queryClient.invalidateQueries({ queryKey: prePurchaseInspectionKeys.mine(scope) });
    setMode('none');
    setText('');
    notify(message);
  };
  const fail = (reason: Error) => notify(reason.message, 'error');
  const ask = useMutation({
    mutationFn: () => unwrap(prePurchaseInspectionService.ask(scope, inspection.id, text)),
    onSuccess: done('Question sent. Sureground will answer here.'),
    onError: fail,
  });
  const reinspect = useMutation({
    mutationFn: () => unwrap(prePurchaseInspectionService.reinspect(scope, inspection.id, text)),
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
                  ? `Sureground${q.answeredAt ? ` (${formatDate(q.answeredAt)})` : ''}: ${q.answer}`
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

/** `land`: land inspections only (land routes). `all`: every inspection, homes and land. */
export const BuyerInspections = ({ scope }: { scope: TourScope }) => {
  const [toast, setToast] = useState<{ message: string; variant: 'success' | 'error' } | null>(
    null
  );
  const list = useQuery({
    queryKey: prePurchaseInspectionKeys.mine(scope),
    queryFn: () => unwrap(prePurchaseInspectionService.mine(scope)),
  });
  const notify: Notify = (message, variant = 'success') => setToast({ message, variant });

  if (list.isLoading) {
    return <ListSkeleton rows={3} variant="cards" label="Loading inspections" />;
  }
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
          description={
            scope === 'land'
              ? 'Commission one from a land listing or an estate plot.'
              : 'Commission one from a home for sale, a land listing or an estate plot.'
          }
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
                actions={
                  <BuyerInspectionActions inspection={inspection} scope={scope} notify={notify} />
                }
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
