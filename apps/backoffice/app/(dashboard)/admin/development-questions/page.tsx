'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { BellRing, MessageCircleQuestion } from '@sureground/icons';
import {
  Badge,
  Button,
  Card,
  ConfirmDialog,
  EmptyState,
  ListSkeleton,
  PageErrorState,
  PageHeader,
  useToast,
} from '@sureground/ui';
import { formatDate, formatRelativeTime, unwrap } from '@sureground/shared';
import { useAdminUser } from '../layout';
import { hasAdminPermission } from '@/lib/adminAccess';
import {
  STATUS_BADGE,
  adminDevelopmentQuestionsService,
  type UnansweredDevelopmentGroup,
} from '@/services/adminDevelopmentsService';

const KEY = ['admin', 'development-questions', 'unanswered'];

const days = (n: number) => `${n} day${n === 1 ? '' : 's'}`;

export default function UnansweredDeveloperQuestionsPage() {
  const user = useAdminUser();
  const canRemind = hasAdminPermission(user?.roles, 'verifications.approve');
  const queryClient = useQueryClient();
  const toast = useToast();
  const [target, setTarget] = useState<UnansweredDevelopmentGroup | null>(null);
  const [sending, setSending] = useState(false);
  const query = useQuery({
    queryKey: KEY,
    queryFn: () => unwrap(adminDevelopmentQuestionsService.unanswered()),
  });
  const groups = query.data?.developments ?? [];

  const remind = async () => {
    if (!target) return;
    setSending(true);
    try {
      const r = await unwrap(adminDevelopmentQuestionsService.remind(target.developmentId));
      toast.success(
        `Reminder sent to ${r.recipients} ${r.recipients === 1 ? 'person' : 'people'} at ${target.firm.name}.`
      );
      setTarget(null);
    } catch (e) {
      toast.error((e as Error).message || 'The reminder was not sent.');
    } finally {
      setSending(false);
      void queryClient.invalidateQueries({ queryKey: KEY });
    }
  };

  return (
    <>
      <PageHeader
        title="Unanswered developer questions"
        description="Buyers' questions to developers that have waited more than 3 days. The firm's owner, staff and portfolio managers are reminded each day, at most once every 3 days per question. Reminders go to the firm only; the buyer is never contacted."
      />

      {query.isLoading ? (
        <ListSkeleton variant="cards" />
      ) : query.isError && !query.data ? (
        <PageErrorState
          title="Could not load unanswered questions"
          description={(query.error as Error).message}
          onRetry={() => query.refetch()}
        />
      ) : groups.length === 0 ? (
        <EmptyState
          icon={MessageCircleQuestion}
          title="No question has waited more than 3 days"
          description="Developers have answered or closed every question older than 3 days."
        />
      ) : (
        <>
          {query.data && query.data.shown < query.data.total && (
            <p className="mb-3 text-sm text-muted-foreground">
              Showing the oldest {query.data.shown} of {query.data.total} questions.
            </p>
          )}
          <ul className="space-y-3">
            {groups.map((g) => (
              <li key={g.developmentId}>
                <Card className="p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <Link
                        href={`/admin/developments/${g.developmentId}`}
                        className="font-medium text-foreground hover:underline"
                      >
                        {g.name}
                      </Link>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {[
                          g.firm.name,
                          `${g.city}, ${g.state}`,
                          `${g.waiting} waiting`,
                          `oldest asked ${formatDate(g.oldestAskedAt)}`,
                          g.lastRemindedAt
                            ? `last reminder ${formatRelativeTime(g.lastRemindedAt)}`
                            : 'not reminded yet',
                        ].join(' · ')}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant={STATUS_BADGE[g.status].variant}>
                        {STATUS_BADGE[g.status].label}
                      </Badge>
                      {canRemind && (
                        <Button
                          size="sm"
                          variant="outline"
                          icon={<BellRing className="h-4 w-4" aria-hidden />}
                          onClick={() => setTarget(g)}
                        >
                          Send a reminder now
                        </Button>
                      )}
                    </div>
                  </div>

                  <ul className="mt-4 divide-y divide-border rounded-lg border border-border">
                    {g.questions.map((q) => (
                      <li key={q.id} className="p-3 text-sm">
                        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                          <span>
                            Asked {formatDate(q.askedAt)} · waiting {days(q.ageDays)}
                            {q.unitTypeName ? ` · ${q.unitTypeName}` : ''}
                          </span>
                          <span>
                            {q.reminderCount === 0
                              ? 'Not reminded yet'
                              : `${q.reminderCount} reminder${q.reminderCount === 1 ? '' : 's'}${
                                  q.lastRemindedAt
                                    ? `, last ${formatRelativeTime(q.lastRemindedAt)}`
                                    : ''
                                }`}
                          </span>
                        </div>
                        <p className="mt-1 text-foreground">{q.excerpt}</p>
                      </li>
                    ))}
                  </ul>
                </Card>
              </li>
            ))}
          </ul>
        </>
      )}

      <ConfirmDialog
        open={target !== null}
        onOpenChange={(open) => {
          if (!open && !sending) setTarget(null);
        }}
        title="Send a reminder now?"
        description={
          target
            ? `${target.firm.name}'s owner, staff and portfolio managers are told in the app and by email that ${target.waiting === 1 ? 'a question' : `${target.waiting} questions`} about ${target.name} ${target.waiting === 1 ? 'is' : 'are'} waiting for an answer. The buyer is not contacted. This is recorded in the audit log.`
            : ''
        }
        confirmLabel="Send reminder"
        tone="primary"
        isLoading={sending}
        onConfirm={remind}
      />
    </>
  );
}
