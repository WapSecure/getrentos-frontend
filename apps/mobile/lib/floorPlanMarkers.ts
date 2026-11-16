/** Plans are drawn `contain`, so markers are placed against the drawn image, never the letterboxed box. */

export interface Size {
  width: number;
  height: number;
}

export interface Rect extends Size {
  left: number;
  top: number;
}

/** The rect a `contain`-fitted image fills inside `box`, centred. Null until both sizes are known. */
export function containedRect(box: Size | null, natural: Size | null): Rect | null {
  if (!box || !natural) return null;
  if (!(box.width > 0 && box.height > 0 && natural.width > 0 && natural.height > 0)) return null;
  const fit = Math.min(box.width / natural.width, box.height / natural.height);
  const width = natural.width * fit;
  const height = natural.height * fit;
  return { left: (box.width - width) / 2, top: (box.height - height) / 2, width, height };
}

const clampPercent = (n: number) => Math.min(100, Math.max(0, n));

export function pointInRect(rect: Rect, xPercent: number, yPercent: number) {
  return {
    x: rect.left + (rect.width * clampPercent(xPercent)) / 100,
    y: rect.top + (rect.height * clampPercent(yPercent)) / 100,
  };
}

/** Numbered by list order, so a room without a place still uses up its number. */
export function numberedMarkers<R extends { x?: number; y?: number }>(rooms: readonly R[]) {
  return rooms
    .map((room, i) => ({ room, number: i + 1 }))
    .filter(
      (m): m is { room: R & { x: number; y: number }; number: number } =>
        typeof m.room.x === 'number' && typeof m.room.y === 'number'
    );
}

/** The marker's screen-reader label, matching the room list's wording. */
export const markerLabel = (number: number, name: string, hasPhoto: boolean) =>
  `${number}. ${name}${hasPhoto ? ', open its photo' : ''}`;
