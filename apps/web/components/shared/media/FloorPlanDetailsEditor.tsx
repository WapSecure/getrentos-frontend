'use client';

import { useId, useState, type MouseEvent } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Layers, MapPin, Plus, Trash2 } from '@sureground/icons';
import { Badge, Button, Input, Select } from '@sureground/ui';
import { FLOOR_PLAN_MEASUREMENT_LABEL, MEDIA_ROOM_NAME, unwrap } from '@sureground/shared';
import { floorPlanService, type FloorPlan, type FloorPlanInput } from '@/services/floorPlanService';
import type { EditablePhoto } from './PropertyPhotoEditor';

const NAME_MAX = 60;
const MAX_LEVELS = 10;
const MAX_ROOMS = 40;
const METRES = /^\d{1,3}(\.\d{1,2})?$/;

interface RoomDraft {
  key: string;
  name: string;
  width: string;
  length: string;
  photoKey: string;
  x?: number;
  y?: number;
}

interface LevelDraft {
  levelName: string;
  imageKey: string;
  rooms: RoomDraft[];
}

let draftSeq = 0;
const nextKey = () => `room-${++draftSeq}`;

const toDraft = (plan?: FloorPlan, imageKey = ''): LevelDraft => ({
  levelName: plan?.levelName ?? '',
  imageKey: plan?.imageKey ?? imageKey,
  rooms: (plan?.rooms ?? []).map((r) => ({
    key: nextKey(),
    name: r.name,
    width: r.widthM != null ? String(r.widthM) : '',
    length: r.lengthM != null ? String(r.lengthM) : '',
    photoKey: r.photoKey ?? '',
    ...(r.planX != null && r.planY != null ? { x: r.planX, y: r.planY } : {}),
  })),
});

/** Metres from a typed value: null when blank, undefined when it is not a valid size. */
const parseMetres = (value: string): number | null | undefined => {
  const v = value.trim();
  if (!v) return null;
  if (!METRES.test(v)) return undefined;
  const n = Number(v);
  return n >= 0.3 && n <= 999.99 ? n : undefined;
};

/** A plain-language problem with the draft, or null when it can be saved. */
function draftProblem(draft: LevelDraft): string | null {
  if (!draft.levelName.trim()) return 'Give this level a name, such as "Ground floor".';
  if (!draft.imageKey) return 'Choose the floor plan image for this level.';
  for (const [i, room] of draft.rooms.entries()) {
    const label = room.name.trim() || `Room ${i + 1}`;
    if (!room.name.trim()) return `Name room ${i + 1}, or remove it.`;
    const w = parseMetres(room.width);
    const l = parseMetres(room.length);
    if (w === undefined || l === undefined)
      return `Sizes for ${label} must be in metres, between 0.3 and 999.99, with at most two decimals.`;
    if ((w === null) !== (l === null))
      return `Give both width and length for ${label}, or neither.`;
  }
  return null;
}

const toInput = (draft: LevelDraft): FloorPlanInput => ({
  levelName: draft.levelName.trim(),
  imageKey: draft.imageKey,
  rooms: draft.rooms.map((r) => ({
    name: r.name.trim(),
    widthM: parseMetres(r.width) ?? null,
    lengthM: parseMetres(r.length) ?? null,
    photoKey: r.photoKey || null,
    planX: r.x ?? null,
    planY: r.y ?? null,
  })),
});

// Only what a staff check vouches for: the image and each room's name and size.
const measured = (draft: LevelDraft) =>
  JSON.stringify([
    draft.imageKey,
    ...draft.rooms.map((r) => [
      r.name.trim(),
      parseMetres(r.width) ?? null,
      parseMetres(r.length) ?? null,
    ]),
  ]);

const photoLabel = (photo: EditablePhoto, index: number) => {
  const detail = photo.caption?.trim() || (photo.room ? MEDIA_ROOM_NAME[photo.room] : '');
  return `Photo ${index + 1}${detail ? ` · ${detail}` : ''}`;
};

interface FloorPlanDetailsEditorProps {
  propertyId: string;
  /** The property's photos as the photo editor holds them; only uploaded ones (with a key) are offered. */
  photos: EditablePhoto[];
}

/**
 * Rooms and sizes for each floor plan level (showroom M8b). Saves level by level, apart from the
 * property form. Sizes always show as "Estimated" on the listing until Sureground checks them.
 */
export function FloorPlanDetailsEditor({ propertyId, photos }: FloorPlanDetailsEditorProps) {
  const queryClient = useQueryClient();
  const queryKey = ['floor-plans', propertyId];
  const query = useQuery({
    queryKey,
    queryFn: () => unwrap(floorPlanService.list(propertyId)),
  });
  const [adding, setAdding] = useState(false);
  const refresh = () => queryClient.invalidateQueries({ queryKey });

  const saved = photos.flatMap((p, i) => (p.key ? [{ photo: p, key: p.key, index: i }] : []));
  const planImages = saved.filter(({ photo }) => photo.room === 'floor_plan');
  const plans = query.data ?? [];

  return (
    <section
      className="space-y-3 rounded-lg border border-border p-3"
      aria-labelledby={`${propertyId}-fp`}
    >
      <div className="flex items-start gap-2">
        <Layers className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
        <div className="min-w-0">
          <h3 id={`${propertyId}-fp`} className="text-sm font-medium text-foreground">
            Floor plan details
          </h3>
          <p className="text-xs text-muted-foreground">
            Name the rooms on each floor plan, add sizes if you know them, link a photo and tap the
            plan to place each room. Your sizes show as “Estimated” until Sureground checks them.
          </p>
        </div>
      </div>

      {query.isLoading ? (
        <p className="text-xs text-muted-foreground">Loading floor plans…</p>
      ) : query.isError ? (
        <div className="flex items-center justify-between gap-2 text-xs text-destructive">
          <span>Could not load the floor plan details.</span>
          <Button size="sm" variant="ghost" onClick={() => query.refetch()}>
            Try again
          </Button>
        </div>
      ) : (
        <>
          {plans.map((plan) => (
            <LevelEditor
              key={`${plan.id}-${plan.updatedAt}`}
              propertyId={propertyId}
              plan={plan}
              saved={saved}
              planImages={planImages}
              onSaved={refresh}
            />
          ))}
          {adding && (
            <LevelEditor
              propertyId={propertyId}
              position={plans.length}
              saved={saved}
              planImages={planImages}
              onSaved={() => {
                setAdding(false);
                void refresh();
              }}
              onCancel={() => setAdding(false)}
            />
          )}
          {planImages.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              Tag a photo as “Floor plan” above and save the property, then add its rooms here.
            </p>
          ) : (
            !adding &&
            plans.length < MAX_LEVELS && (
              <Button size="sm" variant="outline" onClick={() => setAdding(true)}>
                <Plus className="mr-1 h-4 w-4" aria-hidden="true" />
                {plans.length ? 'Add another level' : 'Add rooms to a floor plan'}
              </Button>
            )
          )}
        </>
      )}
    </section>
  );
}

type SavedPhoto = { photo: EditablePhoto; key: string; index: number };

function LevelEditor({
  propertyId,
  plan,
  position,
  saved,
  planImages,
  onSaved,
  onCancel,
}: {
  propertyId: string;
  plan?: FloorPlan;
  position?: number;
  saved: SavedPhoto[];
  planImages: SavedPhoto[];
  onSaved: () => void;
  onCancel?: () => void;
}) {
  const uid = useId();
  const [draft, setDraft] = useState<LevelDraft>(() => toDraft(plan, planImages[0]?.key));
  const [initial] = useState(() => measured(toDraft(plan, planImages[0]?.key)));
  const [placing, setPlacing] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const checked = plan?.measurementStatus === 'CHECKED';
  const losesCheck = checked && measured(draft) !== initial;
  const image = saved.find((s) => s.key === draft.imageKey)?.photo;
  // A plan whose photo was removed or untagged keeps its key so the lister sees why.
  const imageOptions = [
    ...(draft.imageKey && !planImages.some((p) => p.key === draft.imageKey)
      ? [{ value: draft.imageKey, label: 'A photo no longer tagged Floor plan' }]
      : []),
    ...planImages.map(({ photo, key, index }) => ({ value: key, label: photoLabel(photo, index) })),
  ];
  const photoOptions = [
    { value: '', label: 'No linked photo' },
    ...saved.map(({ photo, key, index }) => ({ value: key, label: photoLabel(photo, index) })),
  ];

  const patchRoom = (key: string, patch: Partial<RoomDraft>) =>
    setDraft((d) => ({
      ...d,
      rooms: d.rooms.map((r) => (r.key === key ? { ...r, ...patch } : r)),
    }));

  const place = (event: MouseEvent<HTMLButtonElement>) => {
    if (!placing) return;
    // The image, not the button: the button's border is not part of the plan.
    const rect = event.currentTarget.querySelector('img')?.getBoundingClientRect();
    if (!rect || rect.width <= 0 || rect.height <= 0) return;
    const pct = (n: number) => Math.round(Math.min(100, Math.max(0, n)) * 100) / 100;
    patchRoom(placing, {
      x: pct(((event.clientX - rect.left) / rect.width) * 100),
      y: pct(((event.clientY - rect.top) / rect.height) * 100),
    });
    setPlacing(null);
  };

  const save = async () => {
    const problem = draftProblem(draft);
    if (problem) {
      setError(problem);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const input = toInput(draft);
      if (plan) await unwrap(floorPlanService.update(propertyId, plan.id, input));
      else await unwrap(floorPlanService.create(propertyId, { ...input, position }));
      onSaved();
    } catch (e) {
      setError((e as Error).message || 'Could not save this level. Try again.');
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!plan) return onCancel?.();
    setBusy(true);
    setError(null);
    try {
      await unwrap(floorPlanService.remove(propertyId, plan.id));
      onSaved();
    } catch (e) {
      setError((e as Error).message || 'Could not remove this level. Try again.');
      setBusy(false);
    }
  };

  return (
    <div className="space-y-3 rounded-md border border-border bg-muted/30 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-medium text-foreground">
          {plan ? plan.levelName : 'New floor plan level'}
        </p>
        {plan && (
          <Badge variant={checked ? 'success' : 'neutral'}>
            {FLOOR_PLAN_MEASUREMENT_LABEL[checked ? 'checked' : 'estimated']}
          </Badge>
        )}
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <Input
          type="text"
          value={draft.levelName}
          maxLength={NAME_MAX}
          onChange={(e) => setDraft((d) => ({ ...d, levelName: e.target.value }))}
          placeholder="Level name, e.g. Ground floor"
          aria-label="Level name"
        />
        <Select
          value={draft.imageKey}
          onValueChange={(value) => setDraft((d) => ({ ...d, imageKey: value }))}
          options={imageOptions}
          placeholder="Floor plan image"
          ariaLabel="Floor plan image for this level"
        />
      </div>

      {image && (
        <div>
          {/* Sized to the drawing itself, so a click at 30% across is 30% across the plan. */}
          <button
            type="button"
            onClick={place}
            disabled={!placing}
            aria-label={
              placing
                ? 'Click the plan where this room is'
                : `Floor plan for ${draft.levelName.trim() || 'this level'}`
            }
            className={`relative inline-block max-w-full rounded border border-border bg-white align-top focus:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-default ${placing ? 'cursor-crosshair ring-2 ring-primary' : ''}`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- signed storage URL */}
            <img
              src={image.url}
              alt=""
              draggable={false}
              className="block h-auto max-h-80 w-auto max-w-full"
            />
            <PlanMarkers rooms={draft.rooms} />
          </button>
          <p className="mt-1 text-xs text-muted-foreground" aria-live="polite">
            {placing
              ? `Click the plan where ${draft.rooms.find((r) => r.key === placing)?.name.trim() || 'this room'} is.`
              : 'Use “Place on plan” on a room, then click the plan.'}
          </p>
        </div>
      )}

      <ol className="space-y-2">
        {draft.rooms.map((room, i) => (
          <li key={room.key} className="space-y-2 rounded border border-border bg-background p-2">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                {i + 1}
              </span>
              <Input
                type="text"
                value={room.name}
                maxLength={NAME_MAX}
                onChange={(e) => patchRoom(room.key, { name: e.target.value })}
                placeholder="Room name, e.g. Bedroom 1"
                aria-label={`Name of room ${i + 1}`}
              />
              <Button
                size="sm"
                variant="ghost"
                aria-label={`Remove room ${i + 1}`}
                onClick={() =>
                  setDraft((d) => ({ ...d, rooms: d.rooms.filter((r) => r.key !== room.key) }))
                }
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" />
              </Button>
            </div>
            <div className="grid gap-2 sm:grid-cols-[1fr_1fr_2fr]">
              <Input
                type="text"
                inputMode="decimal"
                value={room.width}
                onChange={(e) => patchRoom(room.key, { width: e.target.value })}
                placeholder="Width (m)"
                aria-label={`Width of room ${i + 1} in metres`}
              />
              <Input
                type="text"
                inputMode="decimal"
                value={room.length}
                onChange={(e) => patchRoom(room.key, { length: e.target.value })}
                placeholder="Length (m)"
                aria-label={`Length of room ${i + 1} in metres`}
              />
              <Select
                value={room.photoKey}
                onValueChange={(value) => patchRoom(room.key, { photoKey: value })}
                options={photoOptions}
                ariaLabel={`Photo of room ${i + 1}`}
              />
            </div>
            {image && (
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <Button
                  size="sm"
                  variant={placing === room.key ? 'primary' : 'outline'}
                  aria-pressed={placing === room.key}
                  onClick={() => setPlacing(placing === room.key ? null : room.key)}
                >
                  <MapPin className="mr-1 h-4 w-4" aria-hidden="true" />
                  {room.x !== undefined ? 'Move on plan' : 'Place on plan'}
                </Button>
                {room.x !== undefined && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => patchRoom(room.key, { x: undefined, y: undefined })}
                  >
                    Remove from plan
                  </Button>
                )}
              </div>
            )}
          </li>
        ))}
      </ol>

      {draft.rooms.length < MAX_ROOMS && (
        <Button
          size="sm"
          variant="ghost"
          onClick={() =>
            setDraft((d) => ({
              ...d,
              rooms: [
                ...d.rooms,
                { key: nextKey(), name: '', width: '', length: '', photoKey: '' },
              ],
            }))
          }
        >
          <Plus className="mr-1 h-4 w-4" aria-hidden="true" /> Add room
        </Button>
      )}

      {losesCheck && (
        <p className="text-xs text-warning">
          Changing a room name, a size or the plan image makes these sizes “Estimated” again until
          Sureground checks them.
        </p>
      )}
      {error && (
        <p className="text-xs text-destructive" role="alert" id={`${uid}-error`}>
          {error}
        </p>
      )}

      <div className="flex flex-wrap items-center justify-end gap-2">
        {confirmDelete ? (
          <>
            <span className="text-xs text-muted-foreground">Remove this level and its rooms?</span>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setConfirmDelete(false)}
              disabled={busy}
            >
              Keep
            </Button>
            <Button size="sm" variant="danger" onClick={remove} disabled={busy}>
              Remove level
            </Button>
          </>
        ) : (
          <>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => (plan ? setConfirmDelete(true) : onCancel?.())}
              disabled={busy}
            >
              {plan ? 'Remove level' : 'Cancel'}
            </Button>
            <Button size="sm" variant="primary" onClick={save} disabled={busy}>
              {busy ? 'Saving…' : 'Save level'}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

/** Numbered markers over the editor's plan preview, matching the room list. */
function PlanMarkers({ rooms }: { rooms: RoomDraft[] }) {
  return (
    <>
      {rooms.map((room, i) =>
        room.x !== undefined && room.y !== undefined ? (
          <span
            key={room.key}
            aria-hidden="true"
            className="pointer-events-none absolute flex h-6 w-6 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground shadow ring-2 ring-white"
            style={{ left: `${room.x}%`, top: `${room.y}%` }}
          >
            {i + 1}
          </span>
        ) : null
      )}
    </>
  );
}
