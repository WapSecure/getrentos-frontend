'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AlertOctagon, CheckCircle2, Circle, ClipboardCheck, Clock } from 'lucide-react';
import { Button, Skeleton } from '@sureground/ui';
import { unwrap } from '@/lib/apiHelpers';
import { buyerKeys } from '@/lib/queryKeys';
import { buyerService } from '@/services/buyerService';
import type { BuyerDiligence } from '@/types/buyerDiligence';

const STATUS: Record<
  BuyerDiligence['items'][number]['status'],
  { icon: React.ElementType; className: string; label: string }
> = {
  done: { icon: CheckCircle2, className: 'text-success', label: 'Done' },
  in_progress: { icon: Clock, className: 'text-warning', label: 'In progress' },
  to_do: { icon: Circle, className: 'text-muted-foreground', label: 'To do' },
  concern: { icon: AlertOctagon, className: 'text-destructive', label: 'Concern' },
};

/**
 * "Check before you buy": title, consent, survey and charting, registry
 * search, viewing, seller, warning signs, lawyer and escrow, marked from what
 * is on file, with questions for the seller. Loads only when asked.
 */
export function DiligenceChecklist({ listingId }: { listingId: string }) {
  const [asked, setAsked] = useState(false);
  const { data, isLoading, isError } = useQuery({
    queryKey: buyerKeys.diligence(listingId),
    queryFn: () => unwrap(buyerService.getDiligence(listingId)),
    enabled: asked,
    staleTime: 5 * 60_000,
    retry: false,
  });

  if (!asked) {
    return (
      <Button
        variant="outline"
        size="sm"
        icon={<ClipboardCheck className="h-4 w-4" aria-hidden />}
        onClick={() => setAsked(true)}
      >
        Check before you buy
      </Button>
    );
  }
  if (isLoading) {
    return (
      <div className="space-y-2 rounded-lg border border-border p-3">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-16 w-full" />
      </div>
    );
  }
  if (isError || !data) {
    return (
      <p className="text-xs text-muted-foreground">
        The checklist did not load. Ask the seller for the title document and use a property lawyer
        before you pay.
      </p>
    );
  }

  return (
    <section
      aria-labelledby={`diligence-${listingId}`}
      className="space-y-3 rounded-lg border border-border p-3"
    >
      <h3 id={`diligence-${listingId}`} className="text-sm font-semibold text-foreground">
        Check before you buy
      </h3>
      <p className="text-sm text-foreground">{data.summary}</p>
      {data.price.vsSimilar && (
        <p className="text-xs text-muted-foreground">{data.price.vsSimilar}</p>
      )}
      <ul className="space-y-2">
        {data.items.map((item) => {
          const s = STATUS[item.status];
          const Icon = s.icon;
          return (
            <li key={item.key} className="flex items-start gap-2 text-sm">
              <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${s.className}`} aria-hidden="true" />
              <div className="min-w-0">
                <p className="font-medium text-foreground">
                  <span className="sr-only">{s.label}: </span>
                  {item.title}
                </p>
                <p className="text-muted-foreground">{item.finding}</p>
                <p className="text-xs text-muted-foreground">Why it matters: {item.why}</p>
              </div>
            </li>
          );
        })}
      </ul>
      {data.questions.length > 0 && (
        <div className="text-sm">
          <p className="font-medium text-foreground">Ask the seller</p>
          <ul className="mt-1 list-disc space-y-0.5 pl-5 text-muted-foreground">
            {data.questions.map((q) => (
              <li key={q}>{q}</li>
            ))}
          </ul>
        </div>
      )}
      <p className="text-2xs text-muted-foreground">{data.disclaimer}</p>
    </section>
  );
}
