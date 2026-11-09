'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, ShieldCheck, Siren } from 'lucide-react';
import {
  Alert,
  Button,
  Card,
  CardSkeleton,
  EmptyState,
  Field,
  RadioGroup,
  type RadioOption,
  Textarea,
  PageHeader,
} from '@sureground/ui';
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

// Never request the estate's roll here: its names and units are the most sensitive data the estate holds.
export default function ResidentEmergencyPage() {
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<MusterSelfAnswer | null>(null);
  const [note, setNote] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: estateResidentKeys.emergency,
    // "Not calling the roll" is a 200 with an empty body; `unwrap` would hand react-query undefined.
    queryFn: () => unwrapOptional(estateResidentService.getMyEmergency(), null),
    refetchInterval: (query) => (query.state.data ? 15_000 : false),
  });

  const answer = useMutation({
    mutationFn: (input: { state: MusterSelfAnswer; stateNote?: string }) =>
      unwrap(estateResidentService.answerMyRollCall(input)),
    onSuccess: () => {
      // Shares the dashboard banner's key, so answering here clears it.
      queryClient.invalidateQueries({ queryKey: estateResidentKeys.emergency });
      setSelected(null);
      setNote('');
    },
  });

  if (isLoading) {
    return <CardSkeleton lines={4} />;
  }

  if (!data) {
    return (
      <>
        <PageHeader
          title="Emergency"
          description="Tell the estate office whether your household is safe when the alarm is raised."
        />
        <EmptyState
          icon={ShieldCheck}
          title="Your estate is not calling the roll"
          description="Nothing is happening right now. If the alarm is raised, this page becomes the way you tell the estate office whether your household is safe."
        />
      </>
    );
  }

  const { muster, myEntries } = data;
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
              {muster.kindLabel}: the estate has raised the alarm
            </h1>
            <p className="text-sm text-foreground mt-2">{muster.assemblyInstruction}</p>
            {muster.assemblyPoint && (
              <p className="text-sm text-muted-foreground mt-1">
                Gather at: {muster.assemblyPoint}
              </p>
            )}
            <p className="text-xs text-muted-foreground mt-2">
              Raised {new Date(muster.declaredAt).toLocaleString()}: {muster.statusLabel}
            </p>
          </div>
        </div>
      </div>

      <Card className="p-5">
        <h2 className="font-semibold text-foreground">
          {answered ? 'Is this still right?' : 'Where is your household?'}
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          {answered
            ? `${describeMyHouseholdAnswer(states[0])}. You can change it: an answer given in a hurry is worth correcting.`
            : someAnswered
              ? 'Some of your household has answered. Answering again covers everybody who lives here.'
              : 'One answer covers everybody who lives here. Tell a marshal anything you cannot say here.'}
        </p>

        <RadioGroup
          variant="card"
          className="mt-4"
          aria-label="Where is your household?"
          value={selected ?? ''}
          onValueChange={(state) => {
            setSelected(state);
            setNote('');
          }}
          options={MUSTER_ANSWER_OPTIONS.map(
            (option): RadioOption<MusterSelfAnswer> => ({
              value: option.state,
              tone: option.urgent ? 'destructive' : 'primary',
              label: (
                <span
                  className={
                    option.urgent && selected === option.state ? 'text-destructive' : undefined
                  }
                >
                  {option.label}
                </span>
              ),
              description: option.description,
              aside:
                answered && states.every((state) => state === option.state) ? (
                  <span className="inline-flex items-center gap-1 text-xs font-normal text-success">
                    <Check className="w-3.5 h-3.5" aria-hidden />
                    Your answer
                  </span>
                ) : undefined,
            })
          )}
        />

        {selected && (
          <div className="mt-4">
            <Field label="Anything to add?" optionalLabel="(optional)">
              <Textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={2}
                maxLength={300}
                showCount
                placeholder={notePlaceholder(selected)}
              />
            </Field>
            {answer.error && (
              <Alert variant="danger" className="mt-2">
                {(answer.error as Error).message}
              </Alert>
            )}
            <div className="flex flex-wrap justify-end gap-2 mt-3">
              <Button variant="ghost" onClick={() => setSelected(null)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                isLoading={answer.isPending}
                loadingText="Sending…"
                onClick={() =>
                  answer.mutate({ state: selected, stateNote: note.trim() || undefined })
                }
              >
                Send to the estate office
              </Button>
            </div>
          </div>
        )}
      </Card>

      <Card className="p-5">
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

        {visitorEntries.length > 0 && (
          <div className="mt-4 pt-3 border-t border-border">
            <p className="text-sm font-medium text-foreground">
              Visitors the estate admitted to your household
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {visitorEntries.length === 1
                ? 'One visitor is still on site. A marshal answers for them: the person who let them in is not always the person holding this phone.'
                : `${visitorEntries.length} visitors are still on site. A marshal answers for them: the person who let them in is not always the person holding this phone.`}
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
      </Card>

      <div>
        <h2 className="font-semibold text-foreground mb-3">How the estate is doing</h2>
        <MusterTallyStrip tally={muster.tally} tallyLabel={muster.tallyLabel} />
      </div>
    </div>
  );
}
