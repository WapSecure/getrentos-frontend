'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { AlertCircle, ArrowRight, Bell, Clock } from 'lucide-react';
import { Card, Skeleton } from '@getrentos/ui';
import { unwrap } from '@/lib/apiHelpers';
import { attentionKeys } from '@/lib/queryKeys';
import { attentionService } from '@/services/attentionService';
import type { AttentionPersona } from '@/types/attention';

export type { AttentionPersona };

const TONE = {
  urgent: { icon: AlertCircle, cls: 'text-destructive' },
  soon: { icon: Clock, cls: 'text-warning' },
  info: { icon: Bell, cls: 'text-muted-foreground' },
} as const;

/**
 * "Needs your attention": a short ranked list built by rules from the person's
 * own data, each with a link to where they can act. Hidden when nothing is due.
 */
export function AttentionFeed({
  persona,
  estateId,
}: {
  persona: AttentionPersona;
  estateId?: string;
}) {
  const { data, isLoading } = useQuery({
    queryKey: attentionKeys.feed(persona, estateId),
    queryFn: () => unwrap(attentionService.get(persona, estateId)),
    // An estate feed needs the estate it is for.
    enabled: persona !== 'estate' || Boolean(estateId),
    staleTime: 60_000,
  });

  if (isLoading) {
    return (
      <Card className="p-4 space-y-2">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-10 w-full" />
      </Card>
    );
  }
  if (!data?.items.length) return null;

  return (
    <Card className="p-4" aria-labelledby="attention-title">
      <h2 id="attention-title" className="text-sm font-semibold text-foreground mb-2">
        Needs your attention
      </h2>
      <ul className="divide-y divide-border">
        {data.items.map((item) => {
          const tone = TONE[item.severity];
          const Icon = tone.icon;
          return (
            <li key={item.key} className="flex items-start gap-3 py-2.5">
              <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${tone.cls}`} aria-hidden="true" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground">
                  <span className="sr-only">{item.severity}: </span>
                  {item.title}
                </p>
                {item.detail && <p className="text-xs text-muted-foreground">{item.detail}</p>}
              </div>
              <Link
                href={item.link.path}
                className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-primary hover:underline"
              >
                {item.link.label}
                <ArrowRight className="h-3 w-3" aria-hidden="true" />
              </Link>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
