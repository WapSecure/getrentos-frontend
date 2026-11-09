'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Check, ChevronDown, Copy, ListChecks } from '@sureground/icons';
import { Badge, Button, Card, Select, Skeleton, type BadgeVariant } from '@sureground/ui';
import { unwrap } from '@/lib/apiHelpers';
import { estateKeys, landlordKeys } from '@/lib/queryKeys';
import { estateService } from '@/services/estateService';
import { landlordService } from '@/services/landlordService';
import type { CollectionDebtor, CollectionStage } from '@/types/collectionPlan';
import { REPLY_LANGUAGES, languageLabel, type ReplyLanguage } from '@/lib/replyLanguage';

const STAGE: Record<CollectionStage, { label: string; variant: BadgeVariant }> = {
  reminder: { label: 'Reminder', variant: 'neutral' },
  instalments: { label: 'Offer instalments', variant: 'info' },
  formal_demand: { label: 'Formal demand', variant: 'danger' },
};

export type CollectionPlanSource = { kind: 'rent' } | { kind: 'dues'; estateId: string };

export function CollectionPlanPanel({
  source,
  noticesHref,
}: {
  source: CollectionPlanSource;
  noticesHref?: string;
}) {
  const [language, setLanguage] = useState<ReplyLanguage>('en');
  const { data, isLoading, isError, isFetching } = useQuery({
    queryKey:
      source.kind === 'rent'
        ? landlordKeys.collectionPlan(language)
        : estateKeys.collectionPlan(source.estateId, language),
    queryFn: () =>
      unwrap(
        source.kind === 'rent'
          ? landlordService.getCollectionPlan(language)
          : estateService.getCollectionPlan(source.estateId, language)
      ),
    placeholderData: (previous) => previous,
    staleTime: 5 * 60_000,
    retry: false,
  });
  const [open, setOpen] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  if (isLoading) {
    return (
      <Card className="mb-6 p-5 space-y-2">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-12 w-full" />
      </Card>
    );
  }
  if (isError || !data || data.debtors.length === 0) return null;

  const copy = async (d: CollectionDebtor) => {
    try {
      await navigator.clipboard.writeText(d.message);
      setCopied(d.ref);
    } catch {
      setCopied(null);
    }
  };

  return (
    <Card className="mb-6 p-5" aria-labelledby="collection-plan-title">
      <div className="flex flex-wrap items-center gap-2">
        <ListChecks className="h-4 w-4 text-primary" aria-hidden="true" />
        <h2 id="collection-plan-title" className="text-sm font-semibold text-foreground">
          Collection plan
        </h2>
        <div className="ml-auto flex items-center gap-2 text-xs text-muted-foreground">
          <span aria-hidden="true">Messages in</span>
          <Select
            value={language}
            onValueChange={(value) => setLanguage(value as ReplyLanguage)}
            options={REPLY_LANGUAGES.map((l) => ({ value: l.value, label: l.label }))}
            ariaLabel="Message language"
            controlSize="sm"
            searchable={false}
            className="w-32"
          />
        </div>
        {isFetching && (
          <span role="status" className="text-xs text-muted-foreground">
            Writing messages…
          </span>
        )}
      </div>
      <p className="mt-1 text-sm text-foreground">{data.overview}</p>
      <p className="mt-1 text-xs text-muted-foreground">
        {data.totals.byStage.formal_demand} formal demand
        {data.totals.byStage.formal_demand === 1 ? '' : 's'} · {data.totals.byStage.instalments}{' '}
        instalment offer{data.totals.byStage.instalments === 1 ? '' : 's'} ·{' '}
        {data.totals.byStage.reminder} reminder{data.totals.byStage.reminder === 1 ? '' : 's'}
      </p>

      <ol className="mt-4 divide-y divide-border rounded-lg border border-border">
        {data.debtors.map((d, i) => {
          const isOpen = open === d.ref;
          return (
            <li key={d.ref}>
              <button
                type="button"
                onClick={() => setOpen(isOpen ? null : d.ref)}
                aria-expanded={isOpen}
                className="flex w-full flex-wrap items-center gap-x-3 gap-y-1 p-3 text-left hover:bg-secondary/50"
              >
                <span className="text-xs font-medium text-muted-foreground">{i + 1}.</span>
                <span className="min-w-0 flex-1 text-sm font-medium text-foreground">
                  {d.label}
                </span>
                <span className="text-sm font-semibold text-foreground">{d.owed}</span>
                <span className="text-xs text-muted-foreground">{d.daysOverdue} days</span>
                <Badge variant={STAGE[d.stage].variant}>{STAGE[d.stage].label}</Badge>
                <ChevronDown
                  className={`h-4 w-4 text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`}
                  aria-hidden="true"
                />
              </button>
              {isOpen && (
                <div className="space-y-3 px-3 pb-4 text-xs">
                  <div className="text-muted-foreground space-y-0.5">
                    <p>
                      {d.charges} unpaid charge{d.charges === 1 ? '' : 's'}, oldest due{' '}
                      {d.oldestDue}. {d.paymentPattern}
                    </p>
                    {d.reasons.map((r) => (
                      <p key={r}>{r}</p>
                    ))}
                  </div>
                  {d.instalments && (
                    <div>
                      <p className="font-medium text-foreground">Suggested instalments</p>
                      <ul className="mt-1 space-y-0.5 text-muted-foreground">
                        {d.instalments.map((p) => (
                          <li key={p.due}>
                            {p.amount} by {p.due}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {d.nextNotice && (
                    <p className="text-foreground">
                      {d.nextNotice}{' '}
                      {noticesHref && (
                        <Link href={noticesHref} className="text-primary hover:underline">
                          Open notices
                        </Link>
                      )}
                    </p>
                  )}
                  <div className="rounded-md border border-border bg-muted/30 p-3">
                    <p className="font-medium text-foreground">Message to send</p>
                    <p className="mt-1 whitespace-pre-line text-foreground">{d.message}</p>
                    {d.messageInEnglish && (
                      <p className="mt-2 text-muted-foreground">
                        <span className="font-medium">In English: </span>
                        {d.messageInEnglish}
                      </p>
                    )}
                    {data.language && data.language !== 'en' && d.messageLanguage === 'en' && (
                      <p className="mt-2 text-muted-foreground">
                        Written in English: a {languageLabel(data.language)} version is not
                        available for this one right now.
                      </p>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-2 gap-1.5"
                      onClick={() => void copy(d)}
                    >
                      {copied === d.ref ? (
                        <Check className="h-3.5 w-3.5" aria-hidden="true" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                      )}
                      {copied === d.ref ? 'Copied' : 'Copy message'}
                    </Button>
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ol>
      <p className="mt-3 text-2xs text-muted-foreground">{data.disclaimer}</p>
    </Card>
  );
}
