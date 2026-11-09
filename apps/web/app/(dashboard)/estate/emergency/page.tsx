'use client';

import { RedirectToEstateSetup } from '@/components/estate/shared/RedirectToEstateSetup';
import { useState } from 'react';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, RefreshCw, Siren, ShieldCheck } from '@sureground/icons';
import {
  Alert,
  Button,
  CardSkeleton,
  EmptyState,
  ListSkeleton,
  Pagination,
  ToggleChip,
  PageHeader,
} from '@sureground/ui';
import { estateService } from '@/services/estateService';
import { unwrap, unwrapOptional } from '@/lib/apiHelpers';
import { estateKeys } from '@/lib/queryKeys';
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

const ACTIVE_MUSTER_POLL_MS = 15_000;

type RollFilter = 'all' | 'outstanding' | 'help';

const rollFilters: { value: RollFilter; label: string }[] = [
  { value: 'all', label: 'Everybody' },
  { value: 'outstanding', label: 'Not answered for' },
  { value: 'help', label: 'Needs help' },
];

export default function EstateEmergencyPage() {
  const queryClient = useQueryClient();
  const [isDeclareOpen, setIsDeclareOpen] = useState(false);
  const [isCloseOpen, setIsCloseOpen] = useState(false);
  const [selectedMusterId, setSelectedMusterId] = useState<string | null>(null);
  const [rollFilter, setRollFilter] = useState<RollFilter>('all');
  const [page, setPage] = useState(1);

  const { estate, isLoading: isEstateLoading } = useSelectedEstate();

  const activeQuery = useQuery({
    queryKey: estateKeys.activeMuster(estate?.id ?? ''),
    // `unwrapOptional`: "no roll call" is a 200 with an empty body, and react-query rejects an undefined result.
    queryFn: () => unwrapOptional(estateService.getActiveMuster(estate!.id), null),
    enabled: !!estate,
    refetchInterval: (query) => (query.state.data ? ACTIVE_MUSTER_POLL_MS : false),
  });
  const active = activeQuery.data ?? null;

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

  if (!estate) return <RedirectToEstateSetup />;

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
      <PageHeader
        title="Emergency roll call"
        description={
          <>
            {active
              ? `${active.kindLabel} at ${estate.name}: ${active.statusLabel.toLowerCase()}`
              : `Nobody is being called at ${estate.name}`}
          </>
        }
        actions={
          !active && (
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
          )
        }
      />

      {!active && !muster && (
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

      {/* Keyed on open so the form starts empty: a stale assembly point would be broadcast to every household. */}
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
          // Keyed for the same reason: a closing note belongs to one incident.
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
