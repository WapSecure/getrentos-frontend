'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, BookOpen, Check, Copy } from 'lucide-react';
import { Button, Card, Skeleton } from '@getrentos/ui';
import { unwrap } from '@/lib/apiHelpers';
import { renterKeys } from '@/lib/queryKeys';
import { renterService } from '@/services/renterService';

/**
 * "Your lease, explained": what the renter's own lease says, any notice served,
 * and advice on a pending renewal with a counter-offer they can copy and send.
 */
export function LeaseGuideCard() {
  const [copied, setCopied] = useState(false);
  const {
    data: g,
    isLoading,
    isError,
  } = useQuery({
    queryKey: renterKeys.leaseGuide,
    queryFn: () => unwrap(renterService.getLeaseGuide()),
    staleTime: 10 * 60_000,
  });

  if (isLoading) {
    return (
      <Card className="p-5 space-y-3">
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-20 w-full" />
      </Card>
    );
  }
  if (isError || !g) return null;

  const notice = g.facts.notices[0];
  const copy = async () => {
    if (!g.counterOfferDraft) return;
    await navigator.clipboard.writeText(g.counterOfferDraft).catch(() => undefined);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <Card className="p-5 space-y-4" aria-labelledby="lease-guide-title">
      <div className="flex items-center gap-2">
        <BookOpen className="h-5 w-5 text-primary" aria-hidden="true" />
        <h2 id="lease-guide-title" className="text-base font-semibold text-foreground">
          Your lease, explained
        </h2>
      </div>

      {notice && (
        <div
          role="alert"
          className="flex gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm"
        >
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" aria-hidden="true" />
          <p className="text-foreground">
            You have been served a <strong>{notice.kind}</strong>
            {notice.served ? ` on ${notice.served}` : ''}
            {notice.expires ? `, running out on ${notice.expires}` : ''}. Consider speaking to a
            lawyer.
          </p>
        </div>
      )}

      <ul className="list-disc space-y-1.5 pl-5 text-sm text-foreground">
        {g.summary.map((point) => (
          <li key={point}>{point}</li>
        ))}
      </ul>

      {g.renewalAdvice && (
        <section className="space-y-2 rounded-lg bg-secondary/40 p-4">
          <h3 className="text-sm font-semibold text-foreground">About your renewal offer</h3>
          <p className="text-sm text-foreground">{g.renewalAdvice}</p>
          {g.facts.market.median && (
            <p className="text-xs text-muted-foreground">
              Similar homes on GetRentos: typically {g.facts.market.median} a year
              {g.facts.market.typicalRange
                ? ` (most between ${g.facts.market.typicalRange.low} and ${g.facts.market.typicalRange.high})`
                : ''}
              , from {g.facts.market.similarHomes} listings.
            </p>
          )}
          {g.termsToAsk.length > 0 && (
            <div>
              <p className="text-xs font-medium text-foreground">
                Worth asking about the landlord’s terms
              </p>
              <ul className="list-disc pl-5 text-xs text-muted-foreground">
                {g.termsToAsk.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
            </div>
          )}
          {g.counterOfferDraft && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-foreground">A message you could send</p>
              <blockquote className="rounded-md border border-border bg-background p-3 text-sm text-foreground">
                {g.counterOfferDraft}
              </blockquote>
              <Button size="sm" variant="outline" className="gap-1.5" onClick={copy}>
                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? 'Copied' : 'Copy message'}
              </Button>
            </div>
          )}
        </section>
      )}

      <p className="text-[11px] text-muted-foreground">
        {g.disclaimer}
        {g.source === 'ai' ? ' Wording is automated from your lease details.' : ''}
      </p>
    </Card>
  );
}
