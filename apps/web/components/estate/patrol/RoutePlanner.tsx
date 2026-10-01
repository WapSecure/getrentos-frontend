'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowDown, ArrowUp, Plus, Route as RouteIcon, X } from 'lucide-react';
import {
  Badge,
  Button,
  Card,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  EmptyState,
  Field,
  Input,
  Select,
  Skeleton,
  TimePicker,
} from '@getrentos/ui';
import { estateService } from '@/services/estateService';
import { unwrap } from '@/lib/apiHelpers';
import { estateKeys } from '@/lib/queryKeys';
import type { PatrolRoute } from '@/types/estate';

/** 0 = Sunday, matching the API and the estate's own week. */
const DAYS = [
  { value: 0, label: 'Sun' },
  { value: 1, label: 'Mon' },
  { value: 2, label: 'Tue' },
  { value: 3, label: 'Wed' },
  { value: 4, label: 'Thu' },
  { value: 5, label: 'Fri' },
  { value: 6, label: 'Sat' },
];

const WINDOW_OPTIONS = [30, 45, 60, 90, 120, 180].map((minutes) => ({
  value: String(minutes),
  label: minutes < 60 ? `${minutes} minutes` : `${minutes / 60} hour${minutes === 60 ? '' : 's'}`,
}));

type Draft = {
  name: string;
  startTime: string;
  windowMinutes: string;
  daysOfWeek: number[];
  /** Ordered: the array order IS the order the round is meant to be walked in. */
  checkpointIds: string[];
};

const emptyDraft = (): Draft => ({
  name: '',
  startTime: '22:00',
  windowMinutes: '90',
  daysOfWeek: [],
  checkpointIds: [],
});

/**
 * The rounds an estate walks, and in what order.
 *
 * Order is shown as an ordered list rather than hidden, because it is the only
 * thing on this screen that a guard's experience depends on and the server
 * deliberately reports it without enforcing it: walking a round out of order is
 * information, not an error. Showing the order is what makes that information
 * readable later.
 */
export const RoutePlanner = ({ estateId }: { estateId: string }) => {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft>(emptyDraft);

  const routesQuery = useQuery({
    queryKey: estateKeys.patrolRoutes(estateId),
    queryFn: () => unwrap(estateService.listPatrolRoutes(estateId)),
  });

  const checkpointsQuery = useQuery({
    queryKey: estateKeys.patrolCheckpoints(estateId),
    queryFn: () => unwrap(estateService.listPatrolCheckpoints(estateId)),
  });

  const close = () => {
    setIsOpen(false);
    setEditingId(null);
    setDraft(emptyDraft());
  };

  const saveMutation = useMutation({
    mutationFn: () => {
      const payload = {
        name: draft.name.trim(),
        startTime: draft.startTime,
        windowMinutes: Number(draft.windowMinutes),
        daysOfWeek: draft.daysOfWeek,
        checkpointIds: draft.checkpointIds,
      };
      return editingId
        ? unwrap(estateService.updatePatrolRoute(estateId, editingId, payload))
        : unwrap(estateService.createPatrolRoute(estateId, payload));
    },
    onSuccess: () => {
      close();
      queryClient.invalidateQueries({ queryKey: estateKeys.patrolRoutes(estateId) });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: (route: PatrolRoute) =>
      unwrap(estateService.updatePatrolRoute(estateId, route.id, { active: !route.active })),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: estateKeys.patrolRoutes(estateId) }),
  });

  const openCreate = () => {
    setEditingId(null);
    setDraft(emptyDraft());
    setIsOpen(true);
  };

  const openEdit = (route: PatrolRoute) => {
    setEditingId(route.id);
    setDraft({
      name: route.name,
      startTime: route.startTime,
      windowMinutes: String(route.windowMinutes),
      daysOfWeek: route.daysOfWeek,
      checkpointIds: route.checkpoints.map((checkpoint) => checkpoint.id),
    });
    setIsOpen(true);
  };

  const active = (checkpointsQuery.data ?? []).filter((checkpoint) => checkpoint.active);
  const nameOf = (id: string) => active.find((checkpoint) => checkpoint.id === id)?.name ?? id;
  const chosen = new Set(draft.checkpointIds);

  const move = (index: number, delta: number) => {
    const next = [...draft.checkpointIds];
    const target = index + delta;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setDraft({ ...draft, checkpointIds: next });
  };

  if (routesQuery.isLoading) {
    return <Skeleton className="h-40 w-full rounded-2xl" />;
  }

  const routes = routesQuery.data ?? [];

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Rounds</h2>
          <p className="text-sm text-muted-foreground">
            What time a patrol starts, how long it may take, and which checkpoints it must reach.
          </p>
        </div>
        <Button onClick={openCreate} className="gap-2" disabled={active.length === 0}>
          <Plus className="h-4 w-4" />
          Add a round
        </Button>
      </div>

      {active.length === 0 && !checkpointsQuery.isLoading && (
        <p className="text-sm text-muted-foreground">
          Add a checkpoint first: a round is a list of places to reach.
        </p>
      )}

      {routes.length === 0 ? (
        active.length > 0 ? (
          <EmptyState
            icon={RouteIcon}
            title="No rounds yet"
            description="A round is when the patrol goes out and how long it should take. Without one there is nothing to be late for."
          />
        ) : null
      ) : (
        <div className="space-y-3">
          {routes.map((route) => (
            <Card key={route.id} className="p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium text-foreground">{route.name}</p>
                  <p className="text-sm text-muted-foreground">{route.scheduleLabel}</p>
                </div>
                <div className="flex items-center gap-2">
                  {!route.active && <Badge variant="neutral">Paused</Badge>}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleMutation.mutate(route)}
                    disabled={toggleMutation.isPending}
                  >
                    {route.active ? 'Pause' : 'Resume'}
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => openEdit(route)}>
                    Edit
                  </Button>
                </div>
              </div>

              {route.checkpoints.length === 0 ? (
                <p className="mt-3 text-sm text-muted-foreground">
                  This round has no checkpoints, so it is not being opened.
                </p>
              ) : (
                <ol className="mt-3 space-y-1">
                  {route.checkpoints.map((checkpoint) => (
                    <li key={checkpoint.id} className="flex items-center gap-2 text-sm">
                      <span className="w-5 shrink-0 text-right text-xs text-muted-foreground">
                        {checkpoint.position}
                      </span>
                      <span
                        className={
                          checkpoint.active
                            ? 'text-foreground'
                            : 'text-muted-foreground line-through'
                        }
                      >
                        {checkpoint.name}
                      </span>
                      {!checkpoint.active && <Badge variant="neutral">Retired</Badge>}
                    </li>
                  ))}
                </ol>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Cleared by `close` on dismiss rather than by remounting, for the reason
          recorded on the checkpoint dialog: `Dialog` unmounts its children when
          `open` goes false, but this component's draft state would survive it. */}
      <Dialog open={isOpen} onOpenChange={(open) => (open ? setIsOpen(true) : close())}>
        <DialogContent className="max-w-2xl p-6">
          <DialogTitle className="pr-8 text-xl font-semibold tracking-[-0.02em] text-foreground">
            {editingId ? 'Edit round' : 'Add a round'}
          </DialogTitle>
          <DialogDescription className="mt-1 text-sm leading-6 text-muted-foreground">
            The time is the estate&apos;s own clock. The window is how long the round may take
            before it counts as late.
          </DialogDescription>

          <form
            className="mt-6 space-y-5"
            onSubmit={(event) => {
              event.preventDefault();
              saveMutation.mutate();
            }}
          >
            <Field label="Name" required htmlFor="route-name">
              <Input
                id="route-name"
                value={draft.name}
                onChange={(event) => setDraft({ ...draft, name: event.target.value })}
                placeholder="Night perimeter round"
              />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Starts at" required hint="On the estate's clock.">
                <TimePicker
                  value={draft.startTime}
                  onChange={(value) => setDraft({ ...draft, startTime: value })}
                  step={15}
                />
              </Field>

              <Field label="Must finish within" required>
                <Select
                  value={draft.windowMinutes}
                  onValueChange={(value) => setDraft({ ...draft, windowMinutes: value })}
                  options={WINDOW_OPTIONS}
                />
              </Field>
            </div>

            <Field label="Which days" hint="Leave all off for every day.">
              <div className="flex flex-wrap gap-2">
                {DAYS.map((day) => {
                  const on = draft.daysOfWeek.includes(day.value);
                  return (
                    <button
                      key={day.value}
                      type="button"
                      aria-pressed={on}
                      onClick={() =>
                        setDraft({
                          ...draft,
                          daysOfWeek: on
                            ? draft.daysOfWeek.filter((value) => value !== day.value)
                            : [...draft.daysOfWeek, day.value].sort((a, b) => a - b),
                        })
                      }
                      className={`rounded-lg border px-3 py-1.5 text-sm ${
                        on
                          ? 'border-primary bg-primary/10 text-foreground'
                          : 'border-border text-muted-foreground'
                      }`}
                    >
                      {day.label}
                    </button>
                  );
                })}
              </div>
            </Field>

            <Field
              label="Checkpoints, in the order they should be walked"
              required
              hint="The order is recorded, not enforced: a round walked out of sequence is shown as such rather than refused."
            >
              {draft.checkpointIds.length === 0 ? (
                <p className="rounded-xl border border-dashed border-border px-3 py-4 text-center text-sm text-muted-foreground">
                  Nothing chosen yet.
                </p>
              ) : (
                <ol className="space-y-2">
                  {draft.checkpointIds.map((id, index) => (
                    <li
                      key={id}
                      className="flex items-center gap-2 rounded-xl border border-border bg-secondary/40 px-3 py-2"
                    >
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-card text-xs font-medium text-muted-foreground">
                        {index + 1}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-sm text-foreground">
                        {nameOf(id)}
                      </span>
                      <button
                        type="button"
                        aria-label={`Move ${nameOf(id)} earlier`}
                        onClick={() => move(index, -1)}
                        disabled={index === 0}
                        className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-secondary disabled:opacity-40 disabled:hover:bg-transparent"
                      >
                        <ArrowUp className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        aria-label={`Move ${nameOf(id)} later`}
                        onClick={() => move(index, 1)}
                        disabled={index === draft.checkpointIds.length - 1}
                        className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-secondary disabled:opacity-40 disabled:hover:bg-transparent"
                      >
                        <ArrowDown className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        aria-label={`Remove ${nameOf(id)}`}
                        onClick={() =>
                          setDraft({
                            ...draft,
                            checkpointIds: draft.checkpointIds.filter((value) => value !== id),
                          })
                        }
                        className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-secondary hover:text-destructive"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </li>
                  ))}
                </ol>
              )}
            </Field>

            {active.some((checkpoint) => !chosen.has(checkpoint.id)) && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground">Add a checkpoint</p>
                <div className="flex flex-wrap gap-2">
                  {active
                    .filter((checkpoint) => !chosen.has(checkpoint.id))
                    .map((checkpoint) => (
                      <button
                        key={checkpoint.id}
                        type="button"
                        onClick={() =>
                          setDraft({
                            ...draft,
                            checkpointIds: [...draft.checkpointIds, checkpoint.id],
                          })
                        }
                        className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:border-foreground/20 hover:text-foreground"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        {checkpoint.name}
                      </button>
                    ))}
                </div>
              </div>
            )}

            {saveMutation.error && (
              <p className="rounded-xl bg-destructive/10 px-3 py-2 text-xs leading-5 text-destructive">
                {(saveMutation.error as Error).message}
              </p>
            )}

            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button type="button" variant="outline" rounded="md" onClick={close}>
                Cancel
              </Button>
              <Button
                type="submit"
                rounded="md"
                isLoading={saveMutation.isPending}
                disabled={!draft.name.trim() || draft.checkpointIds.length === 0}
              >
                {editingId ? 'Save round' : 'Add round'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
