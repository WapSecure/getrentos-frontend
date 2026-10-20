'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, RefreshCw, Siren, ShieldCheck } from 'lucide-react';
import { Alert, Button, CardSkeleton, EmptyState, ListSkeleton, Pagination, ToggleChip } from '@getrentos/ui';
import { estateService } from '@/services/estateService';
import { unwrap, unwrapOptional } from '@/lib/apiHelpers';
import { estateKeys } from '@/lib/queryKeys';
import { ROUTES } from '@/lib/constants/auth';
import { useSelectedEstate } from '@/app/(dashboard)/estate/layout';
import {
  DeclareMusterModal,
  type DeclareMusterInput,
} from '@/components/estate/emergency/DeclareMusterModal';
import { MusterTallyStrip } from '@/components/estate/emergency/MusterTallyStrip';
import { RollEntryRow } from '@/components/estate/emergency/RollEntryRow';
import { CloseMusterDialog } from '@/components/estate/emergency/CloseMusterDialog';
import type { EmergencyMuster, MusterRollState, MusterSummary } from '@/types/estate';

const PAGE_SIZE = 5;

/**
 * Several marshals work the same roll at once, so the console re-reads it while
 * an emergency is open. Fifteen seconds is short enough that a name answered at
 * the far end of the estate stops looking outstanding here, and long enough not
 * to hammer the API through an incident that may last hours.
 */
const ACTIVE_MUSTER_POLL_MS = 15_000;

type RollFilter = 'all' | 'outstanding' | 'help';

const rollFilters: { value: RollFilter; label: string }[] = [
  { value: 'all', label: 'Everybody' },
  { value: 'outstanding', label: 'Not answered for' },
  { value: 'help', label: 'Needs help' },
];

/**
 * Raising the alarm, and calling the roll.
 *
 * Free on every plan, and the nav says so by not gating it: an estate that has
 * to pay to find out whether the people inside its building are safe is an
 * estate that will not find out. Nothing on this page is sold.
 *
 * The screen has one job: the numbers at the top have to be the estate's own,
 * counted by the server, and every name beneath them has to be answerable in a
 * single tap. A marshal working through a roll in a stairwell has one hand free.
 */
export default function EstateEmergencyPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isDeclareOpen, setIsDeclareOpen] = useState(false);
  const [isCloseOpen, setIsCloseOpen] = useState(false);
  const [selectedMusterId, setSelectedMusterId] = useState<string | null>(null);
  const [rollFilter, setRollFilter] = useState<RollFilter>('all');
  const [page, setPage] = useState(1);

  const { estate, isLoading: isEstateLoading } = useSelectedEstate();

  const activeQuery = useQuery({
    queryKey: estateKeys.activeMuster(estate?.id ?? ''),
    // `unwrapOptional`, not `unwrap`: "no roll call is running" comes back as a
    // 200 with an empty body, which `unwrap` casts to null while the runtime
    // value is undefined: and react-query rejects an undefined result outright,
    // replacing the whole console with an error state.
    queryFn: () => unwrapOptional(estateService.getActiveMuster(estate!.id), null),
    enabled: !!estate,
    // Polls only while there is something to poll. An idle console sitting on a
    // history list has no reason to keep asking, and a page left open overnight
    // is the common case.
    refetchInterval: (query) => (query.state.data ? ACTIVE_MUSTER_POLL_MS : false),
  });
  const active = activeQuery.data ?? null;

  // A roll closed yesterday is a record, not a live screen: fetched only when a
  // manager asks for it, and rendered without any of the answering controls.
  const pastQuery = useQuery({
    queryKey: estateKeys.emergencyMuster(estate?.id ?? '', selectedMusterId ?? ''),
    queryFn: () => unwrap(estateService.getMuster(estate!.id, selectedMusterId!)),
    enabled: !!estate && !!selectedMusterId,
  });

  const historyQuery = useQuery({
    queryKey: [...estateKeys.emergencyMusters(estate?.id ?? ''), { page, pageSize: PAGE_SIZE }],
    queryFn: () => unwrap(estateService.listMusters(estate!.id, { page, pageSize: PAGE_SIZE })),
    enabled: !!estate && !active,
    placeholderData: keepPreviousData,
  });
  const history = historyQuery.data?.items ?? [];
  const historyTotal = historyQuery.data?.total ?? 0;

  const invalidate = () => {
    if (!estate) return;
    queryClient.invalidateQueries({ queryKey: ['estate', estate.id, 'emergency-musters'] });
  };

  const declareMuster = useMutation({
    mutationFn: (input: DeclareMusterInput) =>
      unwrap(estateService.declareMuster(estate!.id, input)),
    onSuccess: () => {
      invalidate();
      setPage(1);
      setIsDeclareOpen(false);
      setSelectedMusterId(null);
    },
  });

  const answerEntry = useMutation({
    mutationFn: (input: { entryId: string; state: MusterRollState; stateNote?: string }) =>
      unwrap(
        estateService.updateRollEntry(
          estate!.id,
          active!.id,
          input.entryId,
          input.stateNote === undefined
            ? { state: input.state }
            : { state: input.state, stateNote: input.stateNote }
        )
      ),
    onSuccess: invalidate,
  });

  const addArrivals = useMutation({
    mutationFn: () => unwrap(estateService.addMusterArrivals(estate!.id, active!.id)),
    onSuccess: invalidate,
  });

  const closeMuster = useMutation({
    mutationFn: (closingNote?: string) =>
      unwrap(estateService.closeMuster(estate!.id, active!.id, closingNote)),
    onSuccess: () => {
      invalidate();
      setIsCloseOpen(false);
    },
  });

  if (isEstateLoading) {
    return <CardSkeleton />;
  }

  if (!estate) {
    router.replace(ROUTES.ESTATE_SETUP);
    return null;
  }

  const muster: EmergencyMuster | null = active ?? pastQuery.data ?? null;
  const isLive = Boolean(active) && muster?.rollOpen === true;
  const roll = muster?.roll ?? [];
  const visibleRoll =
    rollFilter === 'outstanding'
      ? roll.filter((entry) => entry.state === 'UNACCOUNTED')
      : rollFilter === 'help'
        ? roll.filter((entry) => entry.state === 'NEEDS_HELP')
        : roll;

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Emergency roll call</h1>
          <p className="text-muted-foreground mt-1">
            {active
              ? `${active.kindLabel} at ${estate.name}: ${active.statusLabel.toLowerCase()}`
              : `Nobody is being called at ${estate.name}`}
          </p>
        </div>
        {!active && (
          <Button
            variant="primary"
            icon={<Siren className="w-4 h-4" />}
            onClick={() => {
              declareMuster.reset();
              setIsDeclareOpen(true);
            }}
          >
            Raise the alarm
          </Button>
        )}
      </div>

      {!active && !muster && (
        /* The ordinary state, said plainly rather than as an empty table: this
           screen is only ever opened on purpose, so it should confirm that
           nothing is being called before it shows a history. */
        <Alert
          variant="success"
          icon={ShieldCheck}
          title="No roll call is in progress"
          className="mb-6"
        >
          Raising the alarm tells every household immediately and takes the roll as it stands :
          everybody the estate believes is inside, plus every visitor the gate has admitted and not
          logged out. You can refresh that list while the emergency is open, because people keep
          arriving.
        </Alert>
      )}

      {/* The live console, or a closed roll being reviewed. */}
      {muster && (
        <div className="space-y-4 mb-8">
          {!active && selectedMusterId && (
            <Button
              variant="ghost"
              size="sm"
              icon={<ArrowLeft className="w-4 h-4" />}
              onClick={() => setSelectedMusterId(null)}
            >
              Back to the history
            </Button>
          )}

          <div
            className={`rounded-2xl border p-5 ${
              muster.status === 'ACTIVE'
                ? 'border-destructive/40 bg-destructive/5'
                : 'border-border bg-card'
            }`}
          >
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <div className="flex items-center gap-2">
                  <Siren
                    className={`w-5 h-5 ${
                      muster.status === 'ACTIVE' ? 'text-destructive' : 'text-muted-foreground'
                    }`}
                  />
                  <p className="text-lg font-semibold text-foreground">{muster.kindLabel}</p>
                  <span className="text-xs font-medium text-muted-foreground">
                    {muster.statusLabel}
                  </span>
                </div>
                <p className="text-sm text-foreground mt-2">{muster.description}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Raised {new Date(muster.declaredAt).toLocaleString()}
                  {muster.closedAt && ` · stood down ${new Date(muster.closedAt).toLocaleString()}`}
                </p>
              </div>

              {isLive && (
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="secondary"
                    icon={<RefreshCw className="w-4 h-4" />}
                    isLoading={addArrivals.isPending}
                    loadingText="Checking…"
                    onClick={() => addArrivals.mutate()}
                  >
                    Check the gate again
                  </Button>
                  <Button
                    variant="primary"
                    onClick={() => {
                      closeMuster.reset();
                      setIsCloseOpen(true);
                    }}
                  >
                    Stand the roll down
                  </Button>
                </div>
              )}
            </div>

            <p className="text-sm text-muted-foreground mt-3">{muster.assemblyInstruction}</p>

            {isLive && (
              <p className="text-xs text-muted-foreground mt-2">
                Nobody standing this down marks it as timed out and stops asking. &ldquo;Check the
                gate again&rdquo; adds anybody admitted since the roll was taken: nothing else on it
                moves.
              </p>
            )}

            {muster.closingNote && (
              <p className="text-sm text-muted-foreground mt-3">
                Closing note: {muster.closingNote}
              </p>
            )}
          </div>

          <MusterTallyStrip tally={muster.tally} tallyLabel={muster.tallyLabel} />

          <div className="flex gap-2 overflow-x-auto" role="group" aria-label="Filter roll call">
            {rollFilters.map((filter) => (
              <ToggleChip
                key={filter.value}
                pressed={rollFilter === filter.value}
                onPressedChange={() => setRollFilter(filter.value)}
              >
                {filter.label}
              </ToggleChip>
            ))}
          </div>

          {visibleRoll.length === 0 ? (
            <EmptyState
              icon={ShieldCheck}
              size="compact"
              title={
                roll.length === 0
                  ? 'Nobody was on this roll.'
                  : rollFilter === 'outstanding'
                    ? 'Every name has an answer.'
                    : 'Nobody on this roll needs help.'
              }
            />
          ) : (
            <div className="space-y-3">
              {visibleRoll.map((entry) => (
                <RollEntryRow
                  key={entry.id}
                  entry={entry}
                  rollOpen={isLive}
                  isSaving={answerEntry.isPending && answerEntry.variables?.entryId === entry.id}
                  onAnswer={async (entryId, state, stateNote) => {
                    try {
                      await answerEntry.mutateAsync({ entryId, state, stateNote });
                      return true;
                    } catch {
                      return false;
                    }
                  }}
                />
              ))}
            </div>
          )}

          {answerEntry.error && (
            <Alert variant="danger">{(answerEntry.error as Error).message}</Alert>
          )}
        </div>
      )}

      {/* History: hidden while somebody is answering a live roll, so the page has
          one thing on it at a time. */}
      {!active && !selectedMusterId && (
        <>
          <h2 className="text-lg font-semibold text-foreground mb-3">Past roll calls</h2>
          {historyQuery.isLoading ? (
            <ListSkeleton variant="cards" rows={3} />
          ) : history.length === 0 ? (
            <EmptyState
              icon={Siren}
              title="No roll call has ever been raised here"
              description="That is what an estate hopes to be able to say. When the alarm is raised, the roll and what happened to every name on it is kept as a record."
            />
          ) : (
            <div className="space-y-3">
              {history.map((summary) => (
                <HistoryRow
                  key={summary.id}
                  summary={summary}
                  onOpen={() => {
                    setRollFilter('all');
                    setSelectedMusterId(summary.id);
                  }}
                />
              ))}
            </div>
          )}

          {historyTotal > PAGE_SIZE && (
            <div className="mt-6">
              <Pagination
                page={page}
                pageSize={PAGE_SIZE}
                total={historyTotal}
                onPageChange={setPage}
              />
            </div>
          )}
        </>
      )}

      {/* Keyed on open, so the form starts empty every time. Without this the
          modal keeps its state between openings: and a second declaration would
          inherit the first one's assembly point, which is then broadcast to every
          household as where to go. A stale "gather at the car park" is worse than
          no instruction at all. */}
      <DeclareMusterModal
        key={isDeclareOpen ? 'declare-open' : 'declare-closed'}
        isOpen={isDeclareOpen}
        onClose={() => setIsDeclareOpen(false)}
        onSubmit={(input) => declareMuster.mutate(input)}
        isSubmitting={declareMuster.isPending}
        error={declareMuster.error ? (declareMuster.error as Error).message : null}
      />

      {active && (
        <CloseMusterDialog
          // Same reason as above: a closing note describes one incident, and this
          // one is written into the record.
          key={isCloseOpen ? 'close-open' : 'close-closed'}
          isOpen={isCloseOpen}
          tally={active.tally}
          onClose={() => setIsCloseOpen(false)}
          onConfirm={(closingNote) => closeMuster.mutate(closingNote)}
          isSubmitting={closeMuster.isPending}
          error={closeMuster.error ? (closeMuster.error as Error).message : null}
        />
      )}
    </>
  );
}

/**
 * One row of history.
 *
 * The description leads rather than the kind, because "Smoke on the third floor"
 * is what identifies a roll call a year later: the kind is only ever one of six.
 */
const HistoryRow = ({ summary, onOpen }: { summary: MusterSummary; onOpen: () => void }) => (
  <button
    type="button"
    onClick={onOpen}
    className="w-full text-left bg-card rounded-2xl border border-border p-4 hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
  >
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="font-medium text-foreground">{summary.kindLabel}</p>
          <span className="text-xs font-medium text-muted-foreground">{summary.statusLabel}</span>
        </div>
        <p className="text-sm text-muted-foreground mt-0.5 truncate">{summary.description}</p>
        <p className="text-xs text-muted-foreground mt-1">
          {new Date(summary.declaredAt).toLocaleString()}
        </p>
      </div>
      <p className="text-xs text-muted-foreground text-right shrink-0 max-w-[16rem]">
        {summary.tallyLabel}
      </p>
    </div>
  </button>
);
