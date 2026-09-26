'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, ShieldCheck, Siren } from 'lucide-react';
import { Button, EmptyState } from '@getrentos/ui';
import { estateResidentService } from '@/services/estateResidentService';
import { unwrap, unwrapOptional } from '@/lib/apiHelpers';
import { estateResidentKeys } from '@/lib/queryKeys';
import {
  MUSTER_ANSWER_OPTIONS,
  describeMyHouseholdAnswer,
  householdHasAnswered,
  notePlaceholder,
  residentLines,
} from '@/lib/emergency/answerOptions';
import { MusterTallyStrip } from '@/components/estate/emergency/MusterTallyStrip';
import type { MusterSelfAnswer } from '@/types/estate';

/**
 * The roll call, from a household's point of view.
 *
 * Three design decisions are worth stating, because each is a place this screen
 * could have been built the other way:
 *
 *  - The estate's numbers are shown, its roll is not. "9 of 12 accounted for" is
 *    genuinely reassuring and identifies nobody; a list of names, units and who
 *    was home in the middle of the night is the most sensitive thing this estate
 *    produces. The API will not serve it here, and this screen does not ask.
 *  - There is no "not yet accounted for" button. It is the state a household is
 *    in until somebody answers, so offering it would let a roll sit unanswered
 *    with a tick beside it.
 *  - An answer is one tap. The note is offered underneath and is never required:
 *    a household answering in a stairwell should not be filling in a form.
 */
export default function ResidentEmergencyPage() {
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<MusterSelfAnswer | null>(null);
  const [note, setNote] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: estateResidentKeys.emergency,
    // "Your estate is not calling the roll" arrives as a 200 with an empty body.
    // `unwrap` would hand react-query an undefined result, which it rejects — so
    // the calm, ordinary case would render as a broken page.
    queryFn: () => unwrapOptional(estateResidentService.getMyEmergency(), null),
    refetchInterval: (query) => (query.state.data ? 15_000 : false),
  });

  const answer = useMutation({
    mutationFn: (input: { state: MusterSelfAnswer; stateNote?: string }) =>
      unwrap(estateResidentService.answerMyRollCall(input)),
    onSuccess: () => {
      // The banner on the dashboard reads the same key, so answering here
      // clears it there rather than leaving a stale "you have not answered".
      queryClient.invalidateQueries({ queryKey: estateResidentKeys.emergency });
      setSelected(null);
      setNote('');
    },
  });

  if (isLoading) {
    return <div className="h-32 animate-pulse rounded-2xl bg-secondary" aria-busy="true" />;
  }

  if (!data) {
    return (
      <EmptyState
        icon={ShieldCheck}
        title="Your estate is not calling the roll"
        description="Nothing is happening right now. If the alarm is raised, this page becomes the way you tell the estate office whether your household is safe."
      />
    );
  }

  const { muster, myEntries } = data;
  // The people who live here — the lines this household's answer covers. Visitor
  // lines are shown, but a marshal answers for them.
  const mine = residentLines(myEntries);
  const visitorEntries = myEntries.filter((entry) => entry.basis !== 'RESIDENT');
  const states = mine.map((entry) => entry.state);
  const answered = householdHasAnswered(states);
  const someAnswered = states.some((state) => state !== 'UNACCOUNTED');

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-destructive/40 bg-destructive/5 p-5" role="alert">
        <div className="flex items-start gap-3">
          <Siren className="w-6 h-6 text-destructive shrink-0 mt-0.5" />
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-foreground">
              {muster.kindLabel} — the estate has raised the alarm
            </h1>
            <p className="text-sm text-foreground mt-2">{muster.assemblyInstruction}</p>
            {muster.assemblyPoint && (
              <p className="text-sm text-muted-foreground mt-1">
                Gather at: {muster.assemblyPoint}
              </p>
            )}
            <p className="text-xs text-muted-foreground mt-2">
              Raised {new Date(muster.declaredAt).toLocaleString()} — {muster.statusLabel}
            </p>
          </div>
        </div>
      </div>

      {/* The one action this page exists for. */}
      <div className="bg-card rounded-2xl border border-border p-5">
        <h2 className="font-semibold text-foreground">
          {answered ? 'Is this still right?' : 'Where is your household?'}
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          {answered
            ? `${describeMyHouseholdAnswer(states[0])}. You can change it — an answer given in a hurry is worth correcting.`
            : someAnswered
              ? 'Some of your household has answered. Answering again covers everybody who lives here.'
              : 'One answer covers everybody who lives here. Tell a marshal anything you cannot say here.'}
        </p>

        <div className="space-y-2 mt-4">
          {MUSTER_ANSWER_OPTIONS.map((option) => {
            const isCurrent = answered && states.every((state) => state === option.state);
            const isSelected = selected === option.state;
            return (
              <button
                key={option.state}
                type="button"
                aria-pressed={isSelected}
                onClick={() => {
                  setSelected(option.state);
                  setNote('');
                }}
                className={`w-full text-left rounded-xl border p-4 ${
                  isSelected
                    ? option.urgent
                      ? 'border-destructive bg-destructive/10'
                      : 'border-primary bg-primary/10'
                    : 'border-border'
                }`}
              >
                <span className="flex items-center gap-2">
                  <span
                    className={`font-medium ${
                      option.urgent && isSelected ? 'text-destructive' : 'text-foreground'
                    }`}
                  >
                    {option.label}
                  </span>
                  {isCurrent && (
                    <span className="inline-flex items-center gap-1 text-xs text-emerald-600">
                      <Check className="w-3.5 h-3.5" />
                      Your answer
                    </span>
                  )}
                </span>
                <span className="block text-sm text-muted-foreground mt-1">
                  {option.description}
                </span>
              </button>
            );
          })}
        </div>

        {selected && (
          <div className="mt-4">
            <label className="block text-sm font-medium text-foreground mb-1">
              Anything to add? <span className="text-muted-foreground">(optional)</span>
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              maxLength={300}
              placeholder={notePlaceholder(selected)}
              className="w-full rounded-lg border border-border bg-transparent p-3 text-sm"
            />
            {answer.error && (
              <p className="text-sm text-destructive mt-2">{(answer.error as Error).message}</p>
            )}
            <div className="flex justify-end gap-2 mt-3">
              <Button variant="ghost" onClick={() => setSelected(null)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                disabled={answer.isPending}
                onClick={() =>
                  answer.mutate({ state: selected, stateNote: note.trim() || undefined })
                }
              >
                {answer.isPending ? 'Sending…' : 'Send to the estate office'}
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Your own lines, and the estate's numbers. Never the estate's roll. */}
      <div className="bg-card rounded-2xl border border-border p-5">
        <h2 className="font-semibold text-foreground">Your household</h2>
        {myEntries.length === 0 ? (
          <p className="text-sm text-muted-foreground mt-2">
            Your household is not on this roll call. Tell a marshal where you are.
          </p>
        ) : (
          <div className="mt-3 space-y-2">
            {mine.map((entry) => (
              <div
                key={entry.id}
                className="flex items-center justify-between gap-3 border-b border-border last:border-0 pb-2 last:pb-0"
              >
                <div className="min-w-0">
                  <p className="text-sm text-foreground">{entry.personName}</p>
                  <p className="text-xs text-muted-foreground">{entry.basisLabel}</p>
                  {entry.stateNote && (
                    <p className="text-xs text-muted-foreground mt-0.5">Note: {entry.stateNote}</p>
                  )}
                </div>
                <p className="text-sm text-muted-foreground shrink-0">{entry.stateLabel}</p>
              </div>
            ))}
          </div>
        )}

        {/* Visitors your household was admitted are on this roll and this
            household cannot answer for them, so they are named rather than
            hidden: a resident who does not see them has no way to tell a marshal
            that somebody is still inside. */}
        {visitorEntries.length > 0 && (
          <div className="mt-4 pt-3 border-t border-border">
            <p className="text-sm font-medium text-foreground">
              Visitors the estate admitted to your household
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {visitorEntries.length === 1
                ? 'One visitor is still on site. A marshal answers for them — the person who let them in is not always the person holding this phone.'
                : `${visitorEntries.length} visitors are still on site. A marshal answers for them — the person who let them in is not always the person holding this phone.`}
            </p>
            <div className="mt-2 space-y-2">
              {visitorEntries.map((entry) => (
                <div key={entry.id} className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm text-foreground">{entry.personName}</p>
                    <p className="text-xs text-muted-foreground">{entry.basisLabel}</p>
                  </div>
                  <p className="text-sm text-muted-foreground shrink-0">{entry.stateLabel}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div>
        <h2 className="font-semibold text-foreground mb-3">How the estate is doing</h2>
        <MusterTallyStrip tally={muster.tally} tallyLabel={muster.tallyLabel} />
      </div>
    </div>
  );
}
