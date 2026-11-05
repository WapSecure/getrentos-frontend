'use client';

import { Scale } from 'lucide-react';
import { Alert, Badge, Button, Select, Skeleton } from '@getrentos/ui';
import { REPLY_LANGUAGES, type ReplyLanguage } from '@/lib/replyLanguage';
import type { RenewalAdvice } from '@/types/renewalAdvice';

const OPTION_TITLE = { renew: 'Renew', relet: 'Re-let' } as const;

interface RenewalAdvicePanelProps {
  advice: RenewalAdvice | undefined;
  isLoading: boolean;
  isFetching: boolean;
  language: ReplyLanguage;
  onLanguageChange: (language: ReplyLanguage) => void;
  /** Put the suggested rent, end date and note into the offer. */
  onUse: (advice: RenewalAdvice) => void;
}

/**
 * "Renew or re-let?": the tenant's record on this lease, the market, the
 * notice deadline and what each path brings in over the first year, all
 * worked out by GetRentos. It never decides for the landlord. Hidden if it
 * fails: the offer form below still works on its own.
 */
export function RenewalAdvicePanel({
  advice,
  isLoading,
  isFetching,
  language,
  onLanguageChange,
  onUse,
}: RenewalAdvicePanelProps) {
  if (isLoading) {
    return (
      <div className="space-y-2 rounded-lg border border-border p-3">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-14 w-full" />
      </div>
    );
  }
  if (!advice) return null;
  const f = advice.facts;

  return (
    <section
      aria-labelledby="renewal-advice-title"
      className="space-y-3 rounded-lg border border-border p-3 text-xs"
    >
      <div className="flex flex-wrap items-center gap-2">
        <Scale className="h-4 w-4 text-primary" aria-hidden="true" />
        <h3 id="renewal-advice-title" className="text-sm font-semibold text-foreground">
          Renew or re-let?
        </h3>
        <span className="text-muted-foreground">Ends {f.lease.ends}</span>
        {isFetching && (
          <span role="status" className="text-muted-foreground">
            Writing…
          </span>
        )}
      </div>

      <p className="text-sm text-foreground">{advice.summary}</p>

      <div className="grid gap-2 sm:grid-cols-2">
        {f.options.map((o) => (
          <div key={o.key} className="space-y-1 rounded-md bg-muted/40 p-2">
            <p className="flex items-center justify-between gap-2 font-medium text-foreground">
              {OPTION_TITLE[o.key]} at {o.rentPerYear} a year
            </p>
            <p className="text-sm font-semibold text-foreground">
              {o.firstYear}{' '}
              <span className="text-xs font-normal text-muted-foreground">first year</span>
            </p>
            <ul className="space-y-0.5 text-muted-foreground">
              {o.basis.map((b) => (
                <li key={b}>{b}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <ul className="space-y-0.5 text-muted-foreground">
        {f.record.map((r) => (
          <li key={r}>{r}</li>
        ))}
        {f.market && <li>{f.market}</li>}
      </ul>

      {f.increaseRule.noticePassed ? (
        <Alert variant="warning">
          The {f.increaseRule.noticeDays}-day notice for a rent increase ran out on{' '}
          {f.increaseRule.sendBy}.
        </Alert>
      ) : (
        <p className="text-muted-foreground">
          Send any rent change by{' '}
          <span className="font-medium text-foreground">{f.increaseRule.sendBy}</span> (
          {f.increaseRule.noticeDays} days&apos; notice).
        </p>
      )}

      {advice.pendingOffer && (
        <Alert variant="info">
          An offer of {advice.pendingOffer.rentAmount} until {advice.pendingOffer.leaseEnd} is
          waiting on the tenant. Sending a new one replaces it.
        </Alert>
      )}

      <div className="space-y-2 rounded-md border border-border p-2">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-medium text-foreground">
            Suggested offer: {f.suggested.rent} {f.lease.period} until {f.suggested.newEnd}
          </p>
          <Badge variant={f.suggested.increasePercent > 0 ? 'info' : 'neutral'}>
            {f.suggested.increasePercent > 0 ? `+${f.suggested.increasePercent}%` : 'Same rent'}
          </Badge>
        </div>
        <p className="text-muted-foreground">{f.suggested.reason}</p>
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => onUse(advice)}>
            Use this offer
          </Button>
          <span className="ml-auto flex items-center gap-2 text-muted-foreground">
            <span aria-hidden="true">Note in</span>
            <Select
              value={language}
              onValueChange={(value) => onLanguageChange(value as ReplyLanguage)}
              options={REPLY_LANGUAGES.map((l) => ({ value: l.value, label: l.label }))}
              ariaLabel="Note language"
              controlSize="sm"
              searchable={false}
              className="w-32"
            />
          </span>
        </div>
      </div>

      <p className="text-[11px] text-muted-foreground">{advice.disclaimer}</p>
    </section>
  );
}
