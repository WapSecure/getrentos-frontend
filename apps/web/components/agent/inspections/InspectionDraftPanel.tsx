'use client';

import { useMutation } from '@tanstack/react-query';
import { Sparkles } from 'lucide-react';
import { Badge, Button, Card, type BadgeVariant } from '@sureground/ui';
import { unwrap } from '@/lib/apiHelpers';
import { agentService } from '@/services/agentService';
import type { InspectionRoomEntry, InspectionType } from '@/types/agent';
import type { InspectionDraft, InspectionDraftRequest } from '@/types/inspectionDraft';

export type { InspectionDraft };

const API_TYPE: Record<InspectionType, InspectionDraftRequest['type']> = {
  move_in: 'MOVE_IN',
  move_out: 'MOVE_OUT',
  periodic: 'PERIODIC',
  other: 'OTHER',
};

const CHANGE: Record<
  InspectionDraft['changes'][number]['kind'],
  { label: string; variant: BadgeVariant }
> = {
  possible_damage: { label: 'Possible damage', variant: 'danger' },
  wear_and_tear: { label: 'Wear and tear', variant: 'neutral' },
  unclear: { label: 'Unclear', variant: 'warning' },
};

export const roomKey = (room: string) => room.trim().replace(/\s+/g, ' ').toLowerCase();

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
        agentService.draftInspectionReport(taskId, {
          type: API_TYPE[type],
          rooms: rooms
            .filter((r) => r.room.trim())
            .map((r) => ({
              room: r.room.trim(),
              condition: r.condition,
              notes: r.notes || undefined,
            })),
        })
      ),
  });
  const d = draft.data;

  return (
    <Card static className="space-y-2 p-3" aria-labelledby="inspection-draft-title">
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
            ? 'Add photos to your rooms first. Sureground suggests a condition and notes for each room you can edit.'
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
                      <Badge variant="info" className="capitalize">
                        {r.condition}
                      </Badge>
                    ) : (
                      <Badge variant="warning">Photos unclear: rate it yourself</Badge>
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
                      <Badge variant={CHANGE[c.kind].variant} className="shrink-0">
                        {CHANGE[c.kind].label}
                      </Badge>
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
    </Card>
  );
}
