import type { MediaItem } from './types';

/**
 * How far a floor plan's sizes can be trusted. `estimated`: the lister's own figures. `checked`: a
 * Sureground staff member checked them. A size is never shown without one of these labels.
 */
export type FloorPlanMeasurement = 'estimated' | 'checked';

export interface ShowroomFloorPlanRoom {
  id: string;
  name: string;
  /** Metres. Both sides or neither. */
  widthM?: number;
  lengthM?: number;
  /** The `id` of a photo in the listing's media. */
  photoMediaId?: string;
  /** The room's tap target on the plan image, as percentages from the top left. Both or neither. */
  x?: number;
  y?: number;
}

export interface ShowroomFloorPlan {
  id: string;
  levelName: string;
  /** The `id` of the plan image in the listing's media. */
  imageMediaId: string;
  measurement: FloorPlanMeasurement;
  /** Checked plans only. */
  checkedAt?: string;
  rooms: ShowroomFloorPlanRoom[];
}

/** As the API sends it; read only through `floorPlansOf`. */
export interface FloorPlanDto {
  id: string;
  levelName: string;
  imageMediaId: string;
  measurementStatus: 'ESTIMATED' | 'CHECKED';
  checkedAt?: string;
  rooms: {
    id: string;
    name: string;
    widthM?: number;
    lengthM?: number;
    photoMediaId?: string;
    planX?: number;
    planY?: number;
  }[];
}

const MAX_LEVELS = 10;
const MAX_ROOMS = 40;
const NAME_MAX = 60;

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);
const text = (v: unknown) =>
  typeof v === 'string' && v.trim() ? v.trim().slice(0, NAME_MAX) : undefined;
const metres = (v: unknown) =>
  typeof v === 'number' && Number.isFinite(v) && v > 0 && v < 1000 ? v : undefined;
const percent = (v: unknown) =>
  typeof v === 'number' && Number.isFinite(v) && v >= 0 && v <= 100 ? v : undefined;

/**
 * The API's structured floor plans, checked against the listing's media. A level shows only when
 * its plan image is in `media`; a room's photo link only when that photo is. Anything malformed is
 * dropped, and a plan is only `checked` when the API says CHECKED with a check time.
 */
export function floorPlansOf(raw: unknown, media: MediaItem[]): ShowroomFloorPlan[] {
  if (!Array.isArray(raw)) return [];
  const images = new Set(media.filter((m) => m.kind === 'image').map((m) => m.id));
  const plans: ShowroomFloorPlan[] = [];
  for (const p of raw.slice(0, MAX_LEVELS)) {
    if (!isRecord(p)) continue;
    const id = text(p.id);
    const levelName = text(p.levelName);
    const imageMediaId = typeof p.imageMediaId === 'string' ? p.imageMediaId : undefined;
    if (!id || !levelName || !imageMediaId || !images.has(imageMediaId)) continue;
    const checkedAt =
      p.measurementStatus === 'CHECKED' &&
      typeof p.checkedAt === 'string' &&
      !Number.isNaN(Date.parse(p.checkedAt))
        ? p.checkedAt
        : undefined;
    const rooms: ShowroomFloorPlanRoom[] = [];
    for (const r of Array.isArray(p.rooms) ? p.rooms.slice(0, MAX_ROOMS) : []) {
      if (!isRecord(r)) continue;
      const roomId = text(r.id);
      const name = text(r.name);
      if (!roomId || !name) continue;
      const widthM = metres(r.widthM);
      const lengthM = metres(r.lengthM);
      const x = percent(r.planX);
      const y = percent(r.planY);
      const photo = typeof r.photoMediaId === 'string' ? r.photoMediaId : undefined;
      rooms.push({
        id: roomId,
        name,
        ...(widthM !== undefined && lengthM !== undefined ? { widthM, lengthM } : {}),
        ...(photo && images.has(photo) ? { photoMediaId: photo } : {}),
        ...(x !== undefined && y !== undefined ? { x, y } : {}),
      });
    }
    plans.push({
      id,
      levelName,
      imageMediaId,
      measurement: checkedAt ? 'checked' : 'estimated',
      ...(checkedAt ? { checkedAt } : {}),
      rooms,
    });
  }
  return plans;
}

/** "4.2", "3.85", "4": at most two decimals, no trailing zeros. */
export const formatMetres = (n: number) => String(Number(n.toFixed(2)));

/** The plan-level label. These are the only two wordings a size may carry. */
export const FLOOR_PLAN_MEASUREMENT_LABEL: Record<FloorPlanMeasurement, string> = {
  estimated: 'Estimated',
  checked: 'Measured, checked by Sureground',
};

/**
 * One room's size with its label, or undefined when the room has no size. Never an area: an area
 * worked out from estimates would look more exact than it is.
 */
export function roomSizeLabel(
  room: Pick<ShowroomFloorPlanRoom, 'widthM' | 'lengthM'>,
  measurement: FloorPlanMeasurement
): string | undefined {
  if (room.widthM === undefined || room.lengthM === undefined) return undefined;
  const size = `${formatMetres(room.widthM)} × ${formatMetres(room.lengthM)} m`;
  return measurement === 'checked'
    ? `${size} (measured, checked by Sureground)`
    : `about ${size} (estimated)`;
}

/** The structured plan drawn on the media item at `mediaId`, if any. */
export const floorPlanFor = (plans: ShowroomFloorPlan[] | undefined, mediaId: string) =>
  plans?.find((p) => p.imageMediaId === mediaId);
