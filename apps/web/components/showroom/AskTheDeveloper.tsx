'use client';

import { useState, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { LogIn, MessageCircleQuestion, Send } from '@sureground/icons';
import {
  DEVELOPMENT_ENQUIRY_COPY as COPY,
  DEVELOPMENT_ENQUIRY_LIMITS as LIMITS,
  DEVELOPMENT_ENQUIRY_STATUS_LABEL,
  canAskAgain,
  enquiryMessageProblem,
  type BuyerDevelopmentEnquiry,
  type ShowroomUnitType,
} from '@sureground/shared/showroom';
import { Alert, Badge, Button, Field, Select, Textarea, useToast } from '@sureground/ui';
import { formatDate } from '@/lib/format';
import { track } from '@/lib/analytics';
import { viewerIsSignedIn } from '@/lib/viewer';
import { developmentEnquiriesService } from '@/services/developmentsService';
import { developmentPath } from '@/lib/publicDevelopments';

const subscribeToNothing = () => () => {};
const ANY_UNIT = '__any__';

const STATUS_VARIANT = {
  NEW: 'warning',
  ANSWERED: 'success',
  CLOSED: 'neutral',
} as const;

const keyOf = (developmentId: string) => ['development-enquiries', 'mine', developmentId] as const;

const loginHref = (developmentId: string) =>
  `/login?next=${encodeURIComponent(`${developmentPath(developmentId)}#ask`)}`;

/** The sidebar's link down to the form, or to sign in first. */
export function AskTheDeveloperLink({ developmentId }: { developmentId: string }) {
  const signedIn = useSyncExternalStore(subscribeToNothing, viewerIsSignedIn, () => false);
  return (
    <Button
      href={signedIn ? '#ask' : loginHref(developmentId)}
      fullWidth
      icon={
        signedIn ? (
          <MessageCircleQuestion className="h-4 w-4" aria-hidden />
        ) : (
          <LogIn className="h-4 w-4" aria-hidden />
        )
      }
    >
      {signedIn ? COPY.title : COPY.signedOut}
    </Button>
  );
}

/**
 * "Ask the developer": signed in only (owner decision 2026-11-10). The question and the answer are kept,
 * so one that goes unanswered can be followed up. Sureground takes no payment for a development.
 */
export function AskTheDeveloper({
  developmentId,
  developerName,
  unitTypes,
}: {
  developmentId: string;
  developerName: string;
  unitTypes: ShowroomUnitType[];
}) {
  const signedIn = useSyncExternalStore(subscribeToNothing, viewerIsSignedIn, () => false);
  return (
    <div className="space-y-4">
      <p className="max-w-3xl text-sm leading-6 text-muted-foreground">{COPY.lead}</p>
      <Alert variant="info">{COPY.payment}</Alert>
      {signedIn ? (
        <SignedIn
          developmentId={developmentId}
          developerName={developerName}
          unitTypes={unitTypes}
        />
      ) : (
        <div className="flex flex-wrap items-center gap-3">
          <Button
            href={loginHref(developmentId)}
            icon={<LogIn className="h-4 w-4" aria-hidden />}
            onClick={() =>
              track({
                name: 'inquiry_start',
                listingId: developmentId,
                surface: 'development_page',
                props: { variant: 'signed_out' },
              })
            }
          >
            {COPY.signedOut}
          </Button>
          <Link
            href={`/signup?next=${encodeURIComponent(`${developmentPath(developmentId)}#ask`)}`}
            className="text-sm font-medium text-primary hover:underline"
          >
            New here? Create a free account
          </Link>
        </div>
      )}
    </div>
  );
}

function SignedIn({
  developmentId,
  developerName,
  unitTypes,
}: {
  developmentId: string;
  developerName: string;
  unitTypes: ShowroomUnitType[];
}) {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [message, setMessage] = useState('');
  const [unitTypeId, setUnitTypeId] = useState(ANY_UNIT);
  const [touched, setTouched] = useState(false);
  const [sending, setSending] = useState(false);

  const mine = useQuery({
    queryKey: keyOf(developmentId),
    queryFn: async () => {
      const res = await developmentEnquiriesService.mine(developmentId);
      if (!res.success || !res.data) throw new Error(res.error || 'Could not load your questions.');
      return res.data;
    },
  });
  const enquiries = mine.data ?? [];
  const allowed = canAskAgain(enquiries);
  const problem = enquiryMessageProblem(message);

  const send = async () => {
    setTouched(true);
    if (problem || !allowed) return;
    setSending(true);
    track({
      name: 'inquiry_start',
      listingId: developmentId,
      surface: 'development_page',
      props: { variant: 'signed_in' },
    });
    const res = await developmentEnquiriesService.ask(
      developmentId,
      message.trim(),
      unitTypeId === ANY_UNIT ? undefined : unitTypeId
    );
    setSending(false);
    if (!res.success || !res.data) {
      toast.error(res.error || 'Your question was not sent. Try again.');
      return;
    }
    const sent = res.data;
    queryClient.setQueryData<BuyerDevelopmentEnquiry[]>(keyOf(developmentId), (old) => [
      sent,
      ...(old ?? []),
    ]);
    setMessage('');
    setUnitTypeId(ANY_UNIT);
    setTouched(false);
    toast.success(COPY.sent);
  };

  const unitOptions = [
    { value: ANY_UNIT, label: 'No particular unit type' },
    ...unitTypes.map((u) => ({ value: u.id, label: u.name })),
  ];

  return (
    <div className="space-y-6">
      {allowed ? (
        <form
          className="space-y-4 rounded-xl border border-border bg-card p-4 sm:p-5"
          onSubmit={(e) => {
            e.preventDefault();
            void send();
          }}
        >
          {unitTypes.length > 0 && (
            <Field label="About which unit type">
              <Select
                value={unitTypeId}
                onValueChange={setUnitTypeId}
                options={unitOptions}
                searchable={false}
              />
            </Field>
          )}
          <Field
            label={`Your question for ${developerName}`}
            required
            hint={`${message.trim().length} of ${LIMITS.messageMax} characters`}
            error={touched ? problem : undefined}
          >
            <Textarea
              value={message}
              rows={4}
              maxLength={LIMITS.messageMax}
              placeholder="For example: is the first instalment refundable if handover is late?"
              onChange={(e) => setMessage(e.target.value)}
              onBlur={() => setTouched(true)}
            />
          </Field>
          <Button
            type="submit"
            isLoading={sending}
            loadingText="Sending"
            icon={<Send className="h-4 w-4" aria-hidden />}
          >
            Send to the developer
          </Button>
        </form>
      ) : (
        <Alert variant="warning">
          You have {LIMITS.openPerDevelopment} questions waiting for an answer from this developer.
          You can ask more once they answer.
        </Alert>
      )}

      <div id="your-questions" className="scroll-mt-24 space-y-3">
        {mine.isError && (
          <Alert variant="warning">
            We could not load your earlier questions.{' '}
            <button
              type="button"
              className="font-medium underline"
              onClick={() => void mine.refetch()}
            >
              Try again
            </button>
          </Alert>
        )}
        {enquiries.length > 0 && (
          <>
            <h3 className="text-base font-semibold text-foreground">{COPY.yours}</h3>
            <ul className="space-y-3">
              {enquiries.map((e) => (
                <li key={e.id} className="rounded-xl border border-border bg-card p-4 text-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-muted-foreground">
                      Sent {formatDate(e.createdAt)}
                      {e.unitTypeName ? ` · ${e.unitTypeName}` : ''}
                    </p>
                    <Badge variant={STATUS_VARIANT[e.status]}>
                      {DEVELOPMENT_ENQUIRY_STATUS_LABEL[e.status].buyer}
                    </Badge>
                  </div>
                  <p className="mt-2 whitespace-pre-line text-foreground">{e.message}</p>
                  {e.answer && (
                    <div className="mt-3 rounded-lg bg-secondary/60 p-3">
                      <p className="text-xs font-medium text-muted-foreground">
                        {e.development.developerName} answered
                        {e.answeredAt ? ` on ${formatDate(e.answeredAt)}` : ''}
                      </p>
                      <p className="mt-1 whitespace-pre-line text-foreground">{e.answer}</p>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}
