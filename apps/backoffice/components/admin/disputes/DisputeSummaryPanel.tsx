'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Scale } from 'lucide-react';
import { Button, Skeleton } from '@getrentos/ui';
import { unwrap } from '@getrentos/shared';
import { adminKeys } from '@/lib/queryKeys';
import { adminService } from '@/services/adminService';

const List = ({ title, items }: { title: string; items: string[] }) =>
  items.length ? (
    <div>
      <p className="font-medium text-foreground">{title}</p>
      <ul className="mt-0.5 list-disc space-y-0.5 pl-5 text-muted-foreground">
        {items.map((x) => (
          <li key={x}>{x}</li>
        ))}
      </ul>
    </div>
  ) : null;

/**
 * "Summarise this case": the record worked out by GetRentos, each side's
 * position, what is agreed, what to verify and missing evidence. A neutral
 * reading for staff; it never decides. Loads only when asked.
 */
export function DisputeSummaryPanel({ disputeId }: { disputeId: string }) {
  const [asked, setAsked] = useState(false);
  const { data, isLoading, isError } = useQuery({
    queryKey: adminKeys.disputeSummary(disputeId),
    queryFn: () => unwrap(adminService.getDisputeSummary(disputeId)),
    enabled: asked,
    staleTime: 5 * 60_000,
    retry: false,
  });

  if (!asked) {
    return (
      <Button
        variant="outline"
        size="sm"
        icon={<Scale className="h-4 w-4" aria-hidden />}
        onClick={() => setAsked(true)}
      >
        Summarise this case
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
        The summary did not load. The case record below is complete.
      </p>
    );
  }
  return (
    <section
      aria-labelledby={`dispute-summary-${disputeId}`}
      className="space-y-3 rounded-lg border border-border p-3 text-sm"
    >
      <h3 id={`dispute-summary-${disputeId}`} className="font-semibold text-foreground">
        Case summary
      </h3>
      <p className="text-foreground">{data.summary}</p>
      {(data.buyerSays || data.sellerSays) && (
        <div className="grid gap-2 sm:grid-cols-2">
          {data.buyerSays && (
            <div className="rounded-md bg-muted/40 p-2">
              <p className="text-xs font-medium text-muted-foreground">Buyer</p>
              <p className="text-foreground">{data.buyerSays}</p>
            </div>
          )}
          {data.sellerSays && (
            <div className="rounded-md bg-muted/40 p-2">
              <p className="text-xs font-medium text-muted-foreground">Seller</p>
              <p className="text-foreground">{data.sellerSays}</p>
            </div>
          )}
        </div>
      )}
      <List title="Both agree" items={data.agreed} />
      <List title="To verify" items={data.toVerify} />
      <List title="Missing evidence" items={data.missingEvidence} />
      <List title="The record" items={data.facts} />
      <p className="text-[11px] text-muted-foreground">{data.disclaimer}</p>
    </section>
  );
}
