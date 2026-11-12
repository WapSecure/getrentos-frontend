'use client';

import { useId, useMemo, useRef, useState, type FormEvent } from 'react';
import { MessageCircleQuestion } from '@sureground/icons';
import {
  LISTING_ANSWER_SOURCE_LABEL,
  LISTING_QUESTION_TOPIC_INFO,
  UNMATCHED_ANSWER_TEXT,
  UNMATCHED_QUESTION_TOPIC,
  answerFor,
  answerQuestion,
  suggestedTopics,
  type ListingAnswer,
  type ListingAnswerSource,
  type ListingQuestionTopic,
  type ShowroomListing,
} from '@sureground/shared/showroom';
import { Badge, Button, Input, type BadgeVariant } from '@sureground/ui';
import { AskListerLink } from '@/components/market/ListingCallToAction';
import { track } from '@/lib/analytics';
import { ShowroomSection as Section } from './ShowroomSection';

const SOURCE_BADGE: Record<ListingAnswerSource, BadgeVariant> = {
  stated: 'neutral',
  checked: 'success',
  not_stated: 'warning',
};

const MAX_SHOWN = 5;
const QUESTION_MAX = 200;

interface Asked {
  key: number;
  question: string;
  /** Empty when the question matched nothing the listing could answer. */
  answers: ListingAnswer[];
}

const list = (items: string[]) =>
  items.length < 2 ? items.join('') : `${items.slice(0, -1).join(', ')} and ${items.at(-1)}`;

/**
 * Questions about a listing, answered only from its own data and always attributed. Nothing is
 * sent anywhere except an anonymous event with the topic and the answer's source.
 */
export function ShowroomQuestions({
  listing,
  returnPath,
}: {
  listing: ShowroomListing;
  returnPath: string;
}) {
  const inputId = useId();
  const [question, setQuestion] = useState('');
  const [asked, setAsked] = useState<Asked[]>([]);
  const nextKey = useRef(0);
  const suggestions = useMemo(() => suggestedTopics(listing), [listing]);

  const record = (topic: ListingQuestionTopic | 'unmatched', source: ListingAnswerSource) =>
    track({
      name: 'listing_question',
      listingId: listing.id,
      market: listing.market,
      surface: 'listing_page',
      props: { topic, source },
    });

  const show = (text: string, answers: ListingAnswer[]) => {
    if (answers.length) answers.forEach((a) => record(a.topic, a.source));
    else record(UNMATCHED_QUESTION_TOPIC, 'not_stated');
    setAsked((prev) =>
      [{ key: nextKey.current++, question: text, answers }, ...prev].slice(0, MAX_SHOWN)
    );
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const text = question.trim();
    if (!text) return;
    show(text, answerQuestion(listing, text));
    setQuestion('');
  };

  const askTopic = (topic: ListingQuestionTopic) => {
    const text = LISTING_QUESTION_TOPIC_INFO[topic].question;
    show(text, [answerFor(listing, topic, text)]);
  };

  const place = listing.market === 'land' ? 'parcel' : 'home';

  return (
    <Section id="questions" title={`Questions about this ${place}`}>
      <div className="space-y-4 rounded-xl border border-border bg-card p-5 shadow-xs">
        <p className="text-sm text-muted-foreground">
          Answers come only from what this listing states, and say who stated it. Anything it does
          not cover, ask the lister.
        </p>
        <form onSubmit={onSubmit} className="flex gap-2">
          <label htmlFor={inputId} className="sr-only">
            Your question
          </label>
          <Input
            id={inputId}
            value={question}
            maxLength={QUESTION_MAX}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask about parking, power, fees..."
            leadingIcon={<MessageCircleQuestion className="h-4 w-4" />}
            className="min-w-0 flex-1"
            autoComplete="off"
          />
          <Button type="submit" variant="secondary" disabled={!question.trim()}>
            Ask
          </Button>
        </form>
        {suggestions.length > 0 && (
          <div role="group" aria-label="Suggested questions" className="flex flex-wrap gap-2">
            {suggestions.map((topic) => (
              <Button key={topic} variant="outline" size="sm" onClick={() => askTopic(topic)}>
                {LISTING_QUESTION_TOPIC_INFO[topic].question}
              </Button>
            ))}
          </div>
        )}
        <ul aria-live="polite" className="space-y-3 empty:hidden">
          {asked.map((item) => (
            <li
              key={item.key}
              className="space-y-3 rounded-lg border border-border bg-secondary/40 p-4"
            >
              <p className="font-medium text-foreground">{item.question}</p>
              {item.answers.length ? (
                item.answers.map((answer) => (
                  <AnswerBlock
                    key={answer.topic}
                    answer={answer}
                    listing={listing}
                    returnPath={returnPath}
                    labelled={item.answers.length > 1}
                  />
                ))
              ) : (
                <div className="space-y-2">
                  <Badge variant={SOURCE_BADGE.not_stated}>
                    {LISTING_ANSWER_SOURCE_LABEL.not_stated}
                  </Badge>
                  <p className="text-sm leading-6 text-muted-foreground">{UNMATCHED_ANSWER_TEXT}</p>
                  <AskLister listing={listing} returnPath={returnPath} />
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>
    </Section>
  );
}

function AskLister({ listing, returnPath }: { listing: ShowroomListing; returnPath: string }) {
  return (
    <AskListerLink
      market={listing.market}
      id={listing.id}
      returnPath={returnPath}
      className="inline-flex min-h-9 items-center rounded-md border border-border bg-card px-3 text-sm font-medium text-primary hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    />
  );
}

function AnswerBlock({
  answer,
  listing,
  returnPath,
  labelled,
}: {
  answer: ListingAnswer;
  listing: ShowroomListing;
  returnPath: string;
  /** Two topics answered: name each one. */
  labelled: boolean;
}) {
  const ask = answer.source === 'not_stated' || answer.gaps.length > 0;
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        {labelled && (
          <span className="text-xs font-semibold text-foreground">
            {LISTING_QUESTION_TOPIC_INFO[answer.topic].label}
          </span>
        )}
        <Badge variant={SOURCE_BADGE[answer.source]}>
          {LISTING_ANSWER_SOURCE_LABEL[answer.source]}
        </Badge>
      </div>
      <p className="text-sm leading-6 text-foreground">{answer.text}</p>
      {answer.source !== 'not_stated' && answer.gaps.length > 0 && (
        <p className="text-xs leading-5 text-muted-foreground">
          Not stated: {list(answer.gaps).toLowerCase()}.
        </p>
      )}
      {ask && <AskLister listing={listing} returnPath={returnPath} />}
    </div>
  );
}
