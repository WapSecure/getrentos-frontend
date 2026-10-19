'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CircleAlert, MessageCircleQuestion } from 'lucide-react';
import { Button, Card, EmptyState, Field, Textarea, Toast, type ToastVariant } from '@getrentos/ui';
import { formatDate, unwrap } from '@getrentos/shared';
import { useAdminUser } from '../../layout';
import { hasAdminPermission } from '@/lib/adminAccess';
import { readLandApiError } from '@/lib/landDiligence';
import {
  adminLandInspectionQuestionService,
  landInspectionQuestionKeys,
  type LandInspectionQuestion,
} from '@/services/adminLandInspectionQuestionService';

const QuestionItem = ({
  item,
  onAnswered,
}: {
  item: LandInspectionQuestion;
  onAnswered: (next: LandInspectionQuestion[], message: string, variant: ToastVariant) => void;
}) => {
  const [answer, setAnswer] = useState('');
  const send = useMutation({
    mutationFn: () => unwrap(adminLandInspectionQuestionService.answer(item.id, answer)),
    onSuccess: (next) => onAnswered(next, 'Answered; the buyer was told.', 'success'),
    onError: (e) =>
      onAnswered([], readLandApiError(e, 'Could not send the answer.').message, 'error'),
  });
  return (
    <li>
      <Card className="p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <p className="font-medium text-foreground">
            {item.land} · <span className="font-mono text-sm">{item.reference}</span>
          </p>
          <Link
            href={`/admin/land/watch/inspections/${encodeURIComponent(item.inspectionId)}`}
            className="text-sm text-primary hover:underline"
          >
            Open the inspection
          </Link>
        </div>
        <p className="text-xs text-muted-foreground">
          {item.askedBy} · {formatDate(item.askedAt)}
        </p>
        <p className="mt-3 whitespace-pre-line rounded-xl bg-secondary/50 p-3 text-sm text-foreground">
          {item.question}
        </p>
        <Field
          className="mt-3"
          label="Your answer"
          htmlFor={`answer-${item.id}`}
          hint="Query the inspector from the inspection first if the report does not answer it."
        >
          <Textarea
            id={`answer-${item.id}`}
            rows={3}
            maxLength={2000}
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
          />
        </Field>
        <Button
          className="mt-3"
          size="sm"
          disabled={answer.trim().length < 5 || send.isPending}
          isLoading={send.isPending}
          onClick={() => send.mutate()}
        >
          Send answer
        </Button>
      </Card>
    </li>
  );
};

/** Buyers' questions about their pre-purchase inspection reports (§8.4, US-06). */
export default function AdminLandInspectionQuestionsPage() {
  const user = useAdminUser();
  const queryClient = useQueryClient();
  const canView = hasAdminPermission(user?.roles, 'verifications.review');
  const [toast, setToast] = useState<{ message: string; variant: ToastVariant } | null>(null);
  const query = useQuery({
    queryKey: landInspectionQuestionKeys.open,
    queryFn: () => unwrap(adminLandInspectionQuestionService.open()),
    enabled: canView,
  });

  if (!canView) {
    return (
      <EmptyState
        icon={CircleAlert}
        title="You do not have access to inspection questions"
        description="This needs the verifications review permission."
      />
    );
  }
  const items = query.data ?? [];
  return (
    <>
      <div className="mb-6">
        <h1 className="type-title">Inspection questions</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          Buyers asking about a pre-purchase inspection report. Answer from the report, or query the
          inspector on the inspection and answer once they reply.
        </p>
      </div>
      {query.isLoading ? (
        <div className="h-40 animate-pulse rounded-2xl bg-secondary" aria-busy="true" />
      ) : items.length === 0 ? (
        <EmptyState
          icon={MessageCircleQuestion}
          title="No open questions"
          description="Buyers' questions about inspection reports appear here."
        />
      ) : (
        <ul className="space-y-4">
          {items.map((item) => (
            <QuestionItem
              key={item.id}
              item={item}
              onAnswered={(next, message, variant) => {
                if (variant === 'success')
                  queryClient.setQueryData(landInspectionQuestionKeys.open, next);
                setToast({ message, variant });
              }}
            />
          ))}
        </ul>
      )}
      {toast && (
        <Toast message={toast.message} variant={toast.variant} onClose={() => setToast(null)} />
      )}
    </>
  );
}
