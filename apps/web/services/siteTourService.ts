import type { VideoCallJoin } from '@sureground/shared';
import { authFetch, safeCall } from '@/lib/apiHelpers';
import type { SiteTour, TourScope } from '@/types/siteTour';

const post = <T>(path: string, body?: unknown) =>
  authFetch<T>(path, {
    method: 'POST',
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });

export type TourSide = 'buyer' | 'owner';

/** `land`: the land routes, behind the land rollout. `all`: the general routes, built homes too. */
const base = (scope: TourScope, side: TourSide) =>
  scope === 'land' ? `/${side}/land/tours` : `/${side}/tours`;

const tourPath = (scope: TourScope, side: TourSide, tourId: string) =>
  `${base(scope, side)}/${encodeURIComponent(tourId)}`;

export type TourJoin = VideoCallJoin & { recordingEnabled: boolean };

export const siteTourKeys = {
  buyer: (scope: TourScope) => ['tours', scope, 'buyer'] as const,
  host: (scope: TourScope) => ['tours', scope, 'host'] as const,
  attending: ['tours', 'land', 'attending'] as const,
};

export const siteTourService = {
  mine: (scope: TourScope) => safeCall(() => authFetch<SiteTour[]>(base(scope, 'buyer'))),

  request: (
    scope: TourScope,
    input: {
      listingId?: string;
      plotId?: string;
      timeZone: string;
      preferredTimes?: string;
      attendeeAppointmentId?: string;
    }
  ) =>
    safeCall(() =>
      post<SiteTour>(base(scope, 'buyer'), {
        ...(input.listingId ? { listingId: input.listingId } : {}),
        ...(input.plotId ? { plotId: input.plotId } : {}),
        timeZone: input.timeZone,
        ...(input.preferredTimes?.trim() ? { preferredTimes: input.preferredTimes.trim() } : {}),
        ...(input.attendeeAppointmentId
          ? { attendeeAppointmentId: input.attendeeAppointmentId }
          : {}),
        acknowledgedNotASearch: true,
      })
    ),

  choose: (scope: TourScope, tourId: string, slot: string) =>
    safeCall(() => post<SiteTour>(`${tourPath(scope, 'buyer', tourId)}/choose`, { slot })),

  otherTimes: (scope: TourScope, tourId: string, reason: string) =>
    safeCall(() =>
      post<SiteTour>(`${tourPath(scope, 'buyer', tourId)}/other-times`, {
        reason: reason.trim(),
      })
    ),

  reportNoShow: (scope: TourScope, tourId: string) =>
    safeCall(() => post<SiteTour>(`${tourPath(scope, 'buyer', tourId)}/host-no-show`)),

  feedback: (scope: TourScope, tourId: string, rating: number, comment?: string) =>
    safeCall(() =>
      post<SiteTour>(`${tourPath(scope, 'buyer', tourId)}/feedback`, {
        rating,
        ...(comment?.trim() ? { comment: comment.trim() } : {}),
      })
    ),

  hosting: (scope: TourScope) => safeCall(() => authFetch<SiteTour[]>(base(scope, 'owner'))),

  /** Either a pasted https link or the built-in call. */
  propose: (
    scope: TourScope,
    tourId: string,
    slots: string[],
    call: { meetingUrl: string } | { useBuiltInVideo: true }
  ) =>
    safeCall(() =>
      post<SiteTour>(`${tourPath(scope, 'owner', tourId)}/propose`, {
        slots,
        ...('meetingUrl' in call
          ? { meetingUrl: call.meetingUrl.trim() }
          : { useBuiltInVideo: true }),
      })
    ),

  complete: (scope: TourScope, tourId: string, notes: string) =>
    safeCall(() =>
      post<SiteTour>(`${tourPath(scope, 'owner', tourId)}/complete`, { notes: notes.trim() })
    ),

  cancel: (scope: TourScope, side: TourSide, tourId: string, reason: string) =>
    safeCall(() =>
      post<SiteTour>(`${tourPath(scope, side, tourId)}/cancel`, { reason: reason.trim() })
    ),

  recordingConsent: (scope: TourScope, side: TourSide, tourId: string, consent: boolean) =>
    safeCall(() =>
      post<SiteTour>(`${tourPath(scope, side, tourId)}/recording-consent`, { consent })
    ),

  join: (scope: TourScope, side: TourSide, tourId: string) =>
    safeCall(() => post<TourJoin>(`${tourPath(scope, side, tourId)}/join`)),

  attending: () => safeCall(() => authFetch<SiteTour[]>('/land/representing/tours')),

  joinAttending: (tourId: string) =>
    safeCall(() => post<TourJoin>(`/land/representing/tours/${encodeURIComponent(tourId)}/join`)),
};

/**
 * A "YYYY-MM-DDTHH:mm" value typed as Lagos wall-clock time, as an ISO
 * instant. Lagos is UTC+1 all year (no daylight saving).
 */
export const lagosLocalToIso = (value: string): string | null => {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return null;
  const at = new Date(`${value}:00+01:00`);
  return Number.isNaN(at.getTime()) ? null : at.toISOString();
};
