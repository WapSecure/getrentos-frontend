'use client';

import { useQuery } from '@tanstack/react-query';
import { MessageSquare } from 'lucide-react';
import { Badge, Card, EmptyState, PageErrorState, StatGridSkeleton } from '@getrentos/ui';
import { authFetch, safeCall, unwrap } from '@getrentos/shared';

interface TextSummary {
  providerConfigured: boolean;
  consentingUsers: number;
  last24h: {
    status: 'SENT' | 'FAILED' | 'NOT_CONFIGURED';
    channel: 'SMS' | 'WHATSAPP';
    count: number;
  }[];
  recent: {
    id: string;
    channel: 'SMS' | 'WHATSAPP';
    status: 'SENT' | 'FAILED' | 'NOT_CONFIGURED';
    phoneLast4: string;
    body: string;
    createdAt: string;
  }[];
}

const STATUS: Record<
  TextSummary['recent'][number]['status'],
  { label: string; variant: 'success' | 'danger' | 'neutral' }
> = {
  SENT: { label: 'Sent', variant: 'success' },
  FAILED: { label: 'Failed', variant: 'danger' },
  NOT_CONFIGURED: { label: 'Not sent: no provider', variant: 'neutral' },
};

const lagos = (iso: string) =>
  new Date(iso).toLocaleString('en-NG', {
    timeZone: 'Africa/Lagos',
    dateStyle: 'medium',
    timeStyle: 'short',
  });

export default function TextMessagingPage() {
  const summary = useQuery({
    queryKey: ['admin', 'text-messaging'],
    queryFn: () => unwrap(safeCall(() => authFetch<TextSummary>('/admin/text-messaging'))),
  });
  const s = summary.data;
  const total = (status: string) =>
    (s?.last24h ?? []).filter((g) => g.status === status).reduce((n, g) => n + g.count, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
          <MessageSquare className="h-6 w-6 text-primary" aria-hidden />
          Text messaging
        </h1>
        <p className="mt-1 text-muted-foreground">
          SMS and WhatsApp for urgent notifications, only to people who opted in, through Termii.
          Quiet from 9pm to 7am Lagos except emergencies, at most 8 non-urgent texts a person a day,
          and never a link.
        </p>
      </div>
      {!s ? (
        summary.isError ? (
          <PageErrorState
            title="Could not load text messaging"
            onRetry={() => void summary.refetch()}
            isRetrying={summary.isFetching}
            headingLevel="h2"
          />
        ) : (
          <StatGridSkeleton />
        )
      ) : (
        <>
          {!s.providerConfigured && (
            <Card className="border-warning/40 bg-warning-subtle p-4 text-sm text-foreground">
              Termii is not configured in this environment (TERMII_API_KEY / sender IDs), so texts
              are logged but not sent.
            </Card>
          )}
          <div className="grid gap-3 sm:grid-cols-4">
            {[
              ['People opted in', s.consentingUsers],
              ['Sent, last 24h', total('SENT')],
              ['Failed, last 24h', total('FAILED')],
              ['Logged only, last 24h', total('NOT_CONFIGURED')],
            ].map(([label, value]) => (
              <Card key={label as string} className="p-4">
                <p className="text-sm text-muted-foreground">{label}</p>
                <p className="mt-1 text-2xl font-semibold text-foreground">{value}</p>
              </Card>
            ))}
          </div>
          <Card className="p-5">
            <h2 className="mb-3 font-semibold text-foreground">Recent texts</h2>
            {s.recent.length === 0 ? (
              <EmptyState
                icon={MessageSquare}
                title="No texts yet"
                description="Texts appear here as they go out."
              />
            ) : (
              <ul className="divide-y divide-border">
                {s.recent.map((d) => (
                  <li
                    key={d.id}
                    className="flex flex-col gap-1 py-3 sm:flex-row sm:items-start sm:justify-between"
                  >
                    <div className="min-w-0">
                      <p className="text-sm text-foreground">{d.body}</p>
                      <p className="text-xs text-muted-foreground">
                        {d.channel === 'WHATSAPP' ? 'WhatsApp' : 'SMS'} to …{d.phoneLast4} ·{' '}
                        {lagos(d.createdAt)}
                      </p>
                    </div>
                    <Badge variant={STATUS[d.status].variant}>{STATUS[d.status].label}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </>
      )}
    </div>
  );
}
