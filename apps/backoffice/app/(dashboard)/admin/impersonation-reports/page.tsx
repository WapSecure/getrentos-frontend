'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ShieldAlert } from 'lucide-react';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Tabs,
  TabsList,
  TabsTrigger,
  Textarea,
} from '@getrentos/ui';
import { formatCurrency, unwrap } from '@getrentos/shared';

import {
  adminImpersonationService,
  type ImpersonationReport,
  type ReportStatus,
} from '@/services/adminImpersonationService';

const CHANNEL: Record<string, string> = {
  PHONE: 'Phone or SMS',
  WHATSAPP: 'WhatsApp',
  EMAIL: 'Email',
  BANK_ACCOUNT: 'Asked to pay a bank account',
  IN_PERSON: 'In person',
  OTHER: 'Other',
};

const lagos = (iso: string) =>
  new Date(iso).toLocaleString('en-NG', {
    timeZone: 'Africa/Lagos',
    dateStyle: 'medium',
    timeStyle: 'short',
  });

const ReportCard = ({ report }: { report: ImpersonationReport }) => {
  const queryClient = useQueryClient();
  const [note, setNote] = useState('');
  const review = useMutation({
    mutationFn: (status: 'REVIEWED' | 'CLOSED') =>
      unwrap(adminImpersonationService.review(report.id, status, note.trim())),
    onSuccess: () => {
      setNote('');
      void queryClient.invalidateQueries({ queryKey: ['admin', 'impersonation'] });
    },
  });
  return (
    <Card className="space-y-3 p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold text-foreground">
            “{report.claimedToBe}” · {CHANNEL[report.channel] ?? report.channel}
          </h3>
          <p className="text-sm text-muted-foreground">
            {report.propertyTitle ?? 'No property'} · reported by {report.reporterName}
            {report.reporterContact && <> ({report.reporterContact})</>} · {lagos(report.createdAt)}
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <Badge variant={report.status === 'OPEN' ? 'warning' : 'neutral'}>
            {report.status.toLowerCase()}
          </Badge>
          {report.paid && <Badge variant="danger">Tenant paid</Badge>}
        </div>
      </div>
      <p className="text-sm text-foreground">{report.description}</p>
      <p className="text-sm text-muted-foreground">
        {report.contactValue && (
          <>
            Impostor’s contact:{' '}
            <span className="font-medium text-foreground">{report.contactValue}</span>.{' '}
          </>
        )}
        {report.amountAsked !== null && <>Asked for {formatCurrency(report.amountAsked)}.</>}
      </p>
      {report.reviewNote && (
        <p className="text-sm text-muted-foreground">
          Review: <span className="text-foreground">{report.reviewNote}</span>
        </p>
      )}
      {report.status !== 'CLOSED' && (
        <div className="space-y-2 border-t border-border pt-3">
          <Textarea
            rows={2}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="What was done: number blocked, bank told, tenant called…"
          />
          <div className="flex gap-2">
            {report.status === 'OPEN' && (
              <Button
                variant="outline"
                isLoading={review.isPending}
                disabled={note.trim().length < 5}
                onClick={() => review.mutate('REVIEWED')}
              >
                Mark reviewed
              </Button>
            )}
            <Button
              isLoading={review.isPending}
              disabled={note.trim().length < 5}
              onClick={() => review.mutate('CLOSED')}
            >
              Close
            </Button>
          </div>
          {review.error && (
            <p className="text-sm text-destructive">{(review.error as Error).message}</p>
          )}
        </div>
      )}
    </Card>
  );
};

type Filter = ReportStatus | 'all';

export default function ImpersonationReportsPage() {
  const [filter, setFilter] = useState<Filter>('OPEN');
  const list = useQuery({
    queryKey: ['admin', 'impersonation', filter],
    queryFn: () => unwrap(adminImpersonationService.list(filter === 'all' ? undefined : filter)),
  });
  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
          <ShieldAlert className="h-6 w-6 text-primary" aria-hidden />
          Impersonation reports
        </h1>
        <p className="mt-1 text-muted-foreground">
          Tenants reporting someone posing as their landlord, manager or GetRentos, usually to take
          rent outside the app. The property’s landlord and managers have already been warned.
        </p>
      </div>
      <Tabs value={filter} onValueChange={(v) => setFilter(v as Filter)}>
        <TabsList>
          <TabsTrigger value="OPEN">Open</TabsTrigger>
          <TabsTrigger value="REVIEWED">Reviewed</TabsTrigger>
          <TabsTrigger value="CLOSED">Closed</TabsTrigger>
          <TabsTrigger value="all">All</TabsTrigger>
        </TabsList>
      </Tabs>
      {list.isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : (list.data ?? []).length === 0 ? (
        <EmptyState
          icon={ShieldAlert}
          title="Nothing here"
          description="Reports from tenants appear here."
        />
      ) : (
        <div className="space-y-4">
          {(list.data ?? []).map((r) => (
            <ReportCard key={r.id} report={r} />
          ))}
        </div>
      )}
    </div>
  );
}
