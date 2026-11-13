'use client';

import { formatLocation } from '@sureground/shared';
import { useState } from 'react';
import Link from 'next/link';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { ArrowRight, MessageCircleQuestion } from '@sureground/icons';
import {
  DEVELOPMENT_ENQUIRY_COPY as COPY,
  DEVELOPMENT_ENQUIRY_STATUS_LABEL,
  type BuyerDevelopmentEnquiry,
} from '@sureground/shared/showroom';
import {
  Alert,
  Badge,
  Button,
  Card,
  ListSkeleton,
  PageHeader,
  Pagination,
  QueryState,
} from '@sureground/ui';
import { formatDate } from '@/lib/format';
import { unwrap } from '@/lib/apiHelpers';
import { DEVELOPMENTS_PATH, developmentPath } from '@/lib/publicDevelopments';
import { ENQUIRY_STATUS_VARIANT } from '@/components/showroom/AskTheDeveloper';
import { developmentEnquiriesService } from '@/services/developmentsService';

const PAGE_SIZE = 10;

export default function BuyerDeveloperQuestionsPage() {
  const [page, setPage] = useState(1);
  const query = useQuery({
    queryKey: ['development-enquiries', 'history', { page, pageSize: PAGE_SIZE }],
    queryFn: () => unwrap(developmentEnquiriesService.history(page, PAGE_SIZE)),
    placeholderData: keepPreviousData,
  });
  const items = query.data?.items ?? [];
  const total = query.data?.total ?? 0;

  return (
    <>
      <PageHeader title={COPY.historyTitle} description={COPY.historyLead} />

      <QueryState
        isLoading={query.isLoading}
        isError={query.isError && !query.data}
        onRetry={() => void query.refetch()}
        isRetrying={query.isFetching}
        isEmpty={items.length === 0}
        empty={{
          icon: MessageCircleQuestion,
          title: COPY.historyEmpty,
          description: COPY.historyEmptyHint,
          action: (
            <Button href={DEVELOPMENTS_PATH} variant="outline" size="sm">
              Browse off-plan developments
            </Button>
          ),
        }}
        scope="page"
        loading={<ListSkeleton variant="cards" rows={4} />}
      >
        <ul className="space-y-4">
          {items.map((e) => (
            <li key={e.id}>
              <QuestionCard enquiry={e} />
            </li>
          ))}
        </ul>
      </QueryState>

      {total > PAGE_SIZE && (
        <Pagination
          page={page}
          pageSize={PAGE_SIZE}
          total={total}
          onPageChange={setPage}
          className="mt-6"
        />
      )}
    </>
  );
}

function QuestionCard({ enquiry: e }: { enquiry: BuyerDevelopmentEnquiry }) {
  const d = e.development;
  return (
    <Card className="p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          {d.live ? (
            <Link
              href={`${developmentPath(d.id)}#your-questions`}
              className="font-medium text-foreground hover:underline"
            >
              {d.name}
            </Link>
          ) : (
            <p className="font-medium text-foreground">{d.name}</p>
          )}
          <p className="mt-0.5 text-xs text-muted-foreground">
            {[d.developerName, formatLocation(d.city, d.state), d.live ? null : COPY.noLongerListed]
              .filter(Boolean)
              .join(' · ')}
          </p>
        </div>
        <Badge variant={ENQUIRY_STATUS_VARIANT[e.status]}>
          {DEVELOPMENT_ENQUIRY_STATUS_LABEL[e.status].buyer}
        </Badge>
      </div>

      <p className="mt-3 text-xs text-muted-foreground">
        You asked on {formatDate(e.createdAt)}
        {e.unitTypeName ? ` · ${e.unitTypeName}` : ''}
      </p>
      <p className="mt-1 whitespace-pre-line text-sm text-foreground">{e.message}</p>

      {e.answer ? (
        <div className="mt-3 rounded-lg bg-secondary/60 p-3 text-sm">
          <p className="text-xs font-medium text-muted-foreground">
            {d.developerName} answered
            {e.answeredAt ? ` on ${formatDate(e.answeredAt)}` : ''}
          </p>
          <p className="mt-1 whitespace-pre-line text-foreground">{e.answer}</p>
        </div>
      ) : e.status === 'CLOSED' ? (
        <p className="mt-3 text-xs text-muted-foreground">
          The developer closed this question{e.closedAt ? ` on ${formatDate(e.closedAt)}` : ''}{' '}
          without an answer.
        </p>
      ) : (
        <Alert variant="info" className="mt-3">
          No answer yet. If the developer does not answer within a few days, Sureground reminds
          them.
        </Alert>
      )}

      {d.live && (
        <div className="mt-3">
          <Link
            href={developmentPath(d.id)}
            className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
          >
            View the development
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
      )}
    </Card>
  );
}
