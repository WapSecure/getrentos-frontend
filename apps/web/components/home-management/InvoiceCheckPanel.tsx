'use client';

import { useQuery } from '@tanstack/react-query';
import { ClipboardCheck } from 'lucide-react';
import { Skeleton } from '@sureground/ui';
import { CheckList } from '@/components/shared/checks/CheckList';
import { unwrap } from '@/lib/apiHelpers';
import { homeManagementKeys } from '@/lib/queryKeys';
import { homeManagementService } from '@/services/homeManagementService';

export function InvoiceCheckPanel({ invoiceId }: { invoiceId: string }) {
  const { data, isLoading } = useQuery({
    queryKey: homeManagementKeys.invoiceCheck(invoiceId),
    queryFn: () => unwrap(homeManagementService.checkWorkOrderInvoice(invoiceId)),
    staleTime: 5 * 60_000,
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="space-y-2 rounded-lg border border-border p-3">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-12 w-full" />
      </div>
    );
  }
  if (!data) return null;

  return (
    <section
      aria-labelledby={`invoice-check-${invoiceId}`}
      className="space-y-3 rounded-lg border border-border p-3"
    >
      <div className="flex items-center gap-2">
        <ClipboardCheck className="h-4 w-4 text-primary" aria-hidden="true" />
        <h3 id={`invoice-check-${invoiceId}`} className="text-sm font-semibold text-foreground">
          Before you decide
        </h3>
      </div>
      <p className="text-sm text-foreground">{data.summary}</p>
      <CheckList items={data.checks} />
      {data.questions.length > 0 && (
        <div className="text-sm">
          <p className="font-medium text-foreground">You could ask the vendor</p>
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
