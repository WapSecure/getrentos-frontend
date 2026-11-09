// Must match the API's limit.
export const MAX_VIDEO_BYTES = 150 * 1024 * 1024;

export const MAX_VIDEO_SECONDS = 5 * 60;

// A size or length the platform did not report is not held against the file.
export function videoProblem(video: { size?: number; durationSeconds?: number }): string | null {
  if (video.size != null && video.size > MAX_VIDEO_BYTES) {
    return 'That video is over 150 MB. Trim it or use a shorter tour.';
  }
  if (video.durationSeconds != null && video.durationSeconds > MAX_VIDEO_SECONDS + 1) {
    return 'Video tours can be up to 5 minutes. Trim it or film a shorter walkthrough.';
  }
  return null;
}
