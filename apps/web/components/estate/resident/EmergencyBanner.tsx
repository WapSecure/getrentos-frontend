'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Siren } from 'lucide-react';
import { estateResidentService } from '@/services/estateResidentService';
import { unwrapOptional } from '@/lib/apiHelpers';
import { estateResidentKeys } from '@/lib/queryKeys';
import { ROUTES } from '@/lib/constants/auth';
import {
  describeMyHouseholdAnswer,
  householdHasAnswered,
  residentLines,
} from '@/lib/emergency/answerOptions';

/**
 * The estate is calling the roll, and this household owes an answer.
 *
 * Owns its own query on the shared `estateResidentKeys.emergency` key, so it can
 * be dropped onto any resident screen and the dashboard and the answer page
 * always agree — a banner that still says "you have not answered" beside a page
 * that has just been answered is worse than no banner.
 *
 * Renders nothing when the estate is not in the middle of an emergency, which is
 * the ordinary case. An all-clear is not shown here: once the roll is down there
 * is nothing to answer, and the household has already been sent the stand-down.
 */
export const EmergencyBanner = () => {
  const { data } = useQuery({
    queryKey: estateResidentKeys.emergency,
    // `unwrapOptional`: no emergency is a 200 with an empty body, and react-query
    // rejects an undefined query result. Null is the answer this screen expects —
    // it is what "nothing is happening" looks like.
    queryFn: () => unwrapOptional(estateResidentService.getMyEmergency(), null),
    // While an emergency is open this is the most important thing on the screen,
    // and a marshal may be answering for this household from the other end.
    refetchInterval: (query) => (query.state.data ? 15_000 : false),
  });

  if (!data) return null;

  const { muster, myEntries } = data;
  // Only the people who live here: a visitor on the roll is a marshal's to
  // answer, so counting them would leave this household permanently un-answered.
  const mine = residentLines(myEntries ?? []);
  const states = mine.map((entry) => entry.state);
  const answered = householdHasAnswered(states);
  const needsHelp = states.includes('NEEDS_HELP');
  const someAnswered = states.some((state) => state !== 'UNACCOUNTED');

  /**
   * What to say about where this household stands.
   *
   * A household of three can genuinely be half-answered — one flat empty, one
   * inside — so "your household has not answered" would be false, and
   * "your household has answered" would hide the line a marshal still has to
   * chase. Both are avoided by saying which it is.
   */
  const standing =
    states.length === 0
      ? 'Your household is not on this roll call.'
      : answered
        ? `${describeMyHouseholdAnswer(states[0])}.`
        : someAnswered
          ? 'Some of your household has answered; the rest has not.'
          : 'Your household has not answered yet.';

  return (
    <div
      className={`rounded-2xl border p-5 shadow-sm ${
        needsHelp
          ? 'border-destructive bg-destructive/10'
          : 'border-destructive/40 bg-destructive/5'
      }`}
      role="alert"
    >
      <div className="flex items-start gap-3">
        <Siren className="w-6 h-6 text-destructive shrink-0 mt-0.5" />
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-foreground">
            {muster.kindLabel} — the estate is calling the roll
          </p>
          <p className="text-sm text-foreground mt-1">{muster.assemblyInstruction}</p>
          <p className="text-sm text-muted-foreground mt-2">
            {standing}
            {needsHelp && ' Somebody in your household needs help — a marshal has been told.'}
          </p>
          <Link
            href={ROUTES.RESIDENT_EMERGENCY}
            className="inline-flex items-center gap-1.5 mt-3 text-sm font-medium text-primary underline underline-offset-4"
          >
            {answered ? 'Change your answer' : 'Tell the estate you are safe'}
          </Link>
        </div>
      </div>
    </div>
  );
};
