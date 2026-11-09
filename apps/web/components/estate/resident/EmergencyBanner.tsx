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

export const EmergencyBanner = () => {
  const { data } = useQuery({
    queryKey: estateResidentKeys.emergency,
    // No emergency is a 200 with an empty body, which react-query rejects as undefined; `unwrapOptional` gives null.
    queryFn: () => unwrapOptional(estateResidentService.getMyEmergency(), null),
    // A marshal may answer for this household from the other end, so keep it fresh.
    refetchInterval: (query) => (query.state.data ? 15_000 : false),
  });

  if (!data) return null;

  const { muster, myEntries } = data;
  // Residents only: visitors on the roll are a marshal's to answer.
  const mine = residentLines(myEntries ?? []);
  const states = mine.map((entry) => entry.state);
  const answered = householdHasAnswered(states);
  const needsHelp = states.includes('NEEDS_HELP');
  const someAnswered = states.some((state) => state !== 'UNACCOUNTED');

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
            {muster.kindLabel}: the estate is calling the roll
          </p>
          <p className="text-sm text-foreground mt-1">{muster.assemblyInstruction}</p>
          <p className="text-sm text-muted-foreground mt-2">
            {standing}
            {needsHelp && ' Somebody in your household needs help: a marshal has been told.'}
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
