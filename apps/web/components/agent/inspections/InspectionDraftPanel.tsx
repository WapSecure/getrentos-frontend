'use client';

import { useMutation } from '@tanstack/react-query';
import { Sparkles } from 'lucide-react';
import { Button } from '@getrentos/ui';
import { authFetch, safeCall, unwrap } from '@/lib/apiHelpers';
import type { InspectionRoomEntry, InspectionType, RoomCondition } from '@/types/agent';

export interface InspectionDraft {
  rooms: {
    room: string;
    /** null when the photos are too unclear to judge. */
    condition: RoomCondition | null;
    notes: string;
    photosUsed: number;
    confidence: 'high' | 'low';
  }[];
  overallCondition: string | null;
  roomsWithoutPhotos: string[];
  moveIn: { inspectedOn: string; roomsCompared: number } | null;
  changes: {
    room: string;
    detail: string;
    kind: 'wear_and_tear' | 'possible_damage' | 'unclear';
    basis: 'photos' | 'recorded condition';
  }[];
  photosUsed: number;
  source: 'ai' | 'heuristic';
  disclaimer: string;
}

const API_TYPE: Record<InspectionType, string> = {
  move_in: 'MOVE_IN',
  move_out: 'MOVE_OUT',
  periodic: 'PERIODIC',
  other: 'OTHER',
};

const CHANGE = {
  possible_damage: { label: 'Possible damage', cls: 'bg-destructive/10 text-destructive' },
  wear_and_tear: { label: 'Wear and tear', cls: 'bg-muted text-muted-foreground' },
  unclear: { label: 'Unclear', cls: 'bg-warning/10 text-warning' },
} as const;

export const roomKey = (room: string) => room.trim().replace(/\s+/g, ' ').toLowerCase();

/** Fill matching rooms from a draft, keeping the agent's own notes above the suggestion. */
export function applyDraftToRooms(
  rooms: InspectionRoomEntry[],
  draft: InspectionDraft
): InspectionRoomEntry[] {
  const byKey = new Map(draft.rooms.map((r) => [roomKey(r.room), r]));
  return rooms.map((r) => {
    const s = byKey.get(roomKey(r.room));
    if (!s) return r;
    const mine = r.notes?.trim() ?? '';
    const notes = !mine || mine.includes(s.notes) ? s.notes : `${mine}\n${s.notes}`;
    return { ...r, condition: s.condition ?? r.condition, notes };
  });
}

/**
 * "Draft the report from photos" for the web inspection form. Suggests each
 * room's condition and notes and, on a move-out, what looks different since
 * move-in. Nothing is saved until the agent saves the inspection.
 */
export function InspectionDraftPanel({
  taskId,
  type,
  rooms,
  photoCount,
  onApply,
}: {
  taskId: string;
  type: InspectionType;
  rooms: InspectionRoomEntry[];
  photoCount: number;
  onApply: (draft: InspectionDraft) => void;
}) {
  const draft = useMutation({
    mutationFn: () =>
      unwrap(
        safeCall(() =>
          authFetch<InspectionDraft>(`/agent/inspections/${taskId}/draft-report`, {
            method: 'POST',
            body: JSON.stringify({
              type: API_TYPE[type],
              rooms: rooms
                .filter((r) => r.room.trim())
                .map((r) => ({
                  room: r.room.trim(),
                  condition: r.condition,
                  notes: r.notes || undefined,
                })),
            }),
          })
        )
      ),
  });
  const d = draft.data;

  return (
    <section
      className="rounded-lg border border-border bg-muted/30 p-3 space-y-2"
      aria-labelledby="inspection-draft-title"
    >
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-primary" aria-hidden="true" />
        <h3 id="inspection-draft-title" className="text-sm font-semibold text-foreground">
          Draft the report from photos
        </h3>
      </div>
      <p className="text-xs text-muted-foreground">
        {!taskId
          ? 'Choose a task and add photos to your rooms first.'
          : photoCount === 0
            ? 'Add photos to your rooms first. GetRentos suggests a condition and notes for each room you can edit.'
            : type === 'move_out'
              ? 'Suggests each room’s condition and notes, and compares with the move-in report.'
              : 'Suggests each room’s condition and notes from your photos. You can edit everything.'}
      </p>
      <Button
        variant={d ? 'secondary' : 'primary'}
        size="sm"
        onClick={() => draft.mutate()}
        isLoading={draft.isPending}
        loadingText="Reading photos…"
        disabled={!taskId || photoCount === 0}
      >
        {d ? 'Draft again' : 'Draft the report'}
      </Button>
      {draft.isError && (
        <p role="alert" className="text-xs text-destructive">
          {draft.error instanceof Error ? draft.error.message : 'Could not draft the report.'}
        </p>
      )}

      {d && (
        <div className="space-y-3 pt-1">
          {d.source === 'heuristic' && (
            <p className="text-xs text-muted-foreground">
              Reading photos is unavailable right now. Rate each room yourself
              {d.moveIn ? '; changes below come from the ratings.' : '.'}
            </p>
          )}

          {d.rooms.length > 0 && (
            <ul className="space-y-2">
              {d.rooms.map((r) => (
                <li key={r.room} className="text-sm">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium text-foreground">{r.room}</span>
                    {r.condition ? (
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium capitalize text-primary">
                        {r.condition}
                      </span>
                    ) : (
                      <span className="rounded-full bg-warning/10 px-2 py-0.5 text-xs font-medium text-warning">
                        Photos unclear: rate it yourself
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{r.notes}</p>
                </li>
              ))}
            </ul>
          )}

          {d.roomsWithoutPhotos.length > 0 && (
            <p className="text-xs text-muted-foreground">
              No photos yet: {d.roomsWithoutPhotos.join(', ')}.
            </p>
          )}

          {d.rooms.length > 0 && (
            <Button variant="primary" size="sm" onClick={() => onApply(d)}>
              Use these suggestions
            </Button>
          )}

          {d.moveIn ? (
            <div className="space-y-1.5">
              <h4 className="text-sm font-semibold text-foreground">
                Changes since move-in ({d.moveIn.inspectedOn})
              </h4>
              {d.changes.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  Nothing looks different in the {d.moveIn.roomsCompared} rooms compared.
                </p>
              ) : (
                <ul className="space-y-1.5">
                  {d.changes.map((c, i) => (
                    <li key={`${c.room}-${i}`} className="flex items-start gap-2 text-xs">
                      <span
                        className={`shrink-0 rounded-full px-2 py-0.5 font-medium ${CHANGE[c.kind].cls}`}
                      >
                        {CHANGE[c.kind].label}
                      </span>
                      <span className="text-foreground">
                        {c.room}: {c.detail}
                        {c.basis === 'recorded condition' && (
                          <span className="text-muted-foreground"> (from the ratings)</span>
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ) : (
            type === 'move_out' && (
              <p className="text-xs text-muted-foreground">
                No submitted move-in report for this property, so there is nothing to compare with.
              </p>
            )
          )}

          <p className="text-xs text-muted-foreground">{d.disclaimer}</p>
        </div>
      )}
    </section>
  );
}
