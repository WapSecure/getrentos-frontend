import * as Location from 'expo-location';

/** Where and when the phone was as a video tour finished filming; the server judges it. */
export interface VideoOnSiteReport {
  latitude: number;
  longitude: number;
  accuracyMeters?: number;
  recordedAt: string;
}

const FIX_TIMEOUT_MS = 15_000;

/**
 * Reads the phone's position straight after the camera closes, for the
 * "Filmed on site" badge. Null when location is refused, unavailable, slow, or
 * reported as mocked: the video still uploads, just without the badge.
 */
export async function locateRecording(): Promise<VideoOnSiteReport | null> {
  try {
    const permission = await Location.requestForegroundPermissionsAsync();
    if (!permission.granted) return null;
    const fix = await Promise.race([
      Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High }),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), FIX_TIMEOUT_MS)),
    ]);
    if (!fix || fix.mocked) return null;
    return {
      latitude: fix.coords.latitude,
      longitude: fix.coords.longitude,
      accuracyMeters: fix.coords.accuracy ?? undefined,
      recordedAt: new Date(fix.timestamp).toISOString(),
    };
  } catch {
    return null;
  }
}
