/**
 * Showing the listing geo insights honestly, the same way on web and mobile. Tolerates older API responses that
 * have no `source` on travel times and the old 0 to 100 walkability score.
 */

export type TravelTimesSource = 'google' | 'openstreetmap';

export interface WalkabilityInsight {
  /** Present from the counts-based API; older responses carry only score, label and summary. */
  heading?: string;
  radiusMeters?: number;
  placesWithin?: number;
  essentialsWithin?: number;
  summary: string;
  /** Old API only: never shown, it overclaimed. */
  score?: number;
  label?: string;
}

/** Walking faster than this is not walking: a ferry, a wrong destination or a bad route. */
export const MAX_PLAUSIBLE_WALKING_KMH = 7;

export function plausibleWalk(
  walk: { durationSeconds: number; distanceMeters: number } | null | undefined
): boolean {
  if (!walk || walk.durationSeconds <= 0) return false;
  return walk.distanceMeters / 1000 / (walk.durationSeconds / 3600) <= MAX_PLAUSIBLE_WALKING_KMH;
}

/** A mode's result, or null when it should read "Unavailable" (a walk that is too fast to be one). */
export function shownTravelMode<T extends { durationSeconds: number; distanceMeters: number }>(
  mode: 'driving' | 'transit' | 'walking',
  result: T | null | undefined
): T | null {
  if (!result) return null;
  if (mode === 'walking' && !plausibleWalk(result)) return null;
  return result;
}

/** The note under commute times. Unknown source (an older API) reads as a plain estimate. */
export function commuteSourceNote(source: TravelTimesSource | null | undefined): string {
  if (source === 'openstreetmap') {
    return 'Rough estimate from OpenStreetMap routing. Lagos traffic can double these times.';
  }
  if (source === 'google')
    return 'Estimated by Google Maps for now. Traffic can change these times.';
  return 'Estimated travel times. Traffic can change them.';
}

export const NEARBY_PLACES_UNAVAILABLE = 'Nearby places are not available for this home yet.';

/**
 * What to show for walking distance, or null when the data is unknown. Never a score: an older response's score
 * is dropped, and an older "0 nearby places" result is unknown data, not a zero.
 */
export function walkabilityView(
  walkability: WalkabilityInsight | null | undefined
): { heading: string; count: number | null; summary: string } | null {
  if (!walkability) return null;
  if (walkability.placesWithin != null) {
    return {
      heading: walkability.heading ?? 'Within walking distance',
      count: walkability.placesWithin,
      summary: walkability.summary,
    };
  }
  // Older API: "N nearby places within 2 km, including M essential services (...)".
  const total = Number.parseInt(walkability.summary, 10);
  if (!Number.isFinite(total) || total <= 0) return null;
  return { heading: 'Nearby places', count: null, summary: walkability.summary };
}
