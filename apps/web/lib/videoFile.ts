import { videoProblem } from '@sureground/shared';

function readDuration(file: File): Promise<number | undefined> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement('video');
    const done = (seconds?: number) => {
      clearTimeout(timer);
      URL.revokeObjectURL(url);
      resolve(seconds != null && Number.isFinite(seconds) ? seconds : undefined);
    };
    // A format the browser can't decode (some .mov files) just isn't checked.
    const timer = setTimeout(() => done(), 8000);
    video.preload = 'metadata';
    video.onloadedmetadata = () => done(video.duration);
    video.onerror = () => done();
    video.src = url;
  });
}

export async function videoFileProblem(file: File): Promise<string | null> {
  const bySize = videoProblem({ size: file.size });
  if (bySize) return bySize;
  return videoProblem({ durationSeconds: await readDuration(file) });
}
