'use client';

import { useEffect, useRef, useState } from 'react';
import { AlertCircle, Play } from '@sureground/icons';
import { cn, embeddedVideo } from '@sureground/shared';

type HlsInstance = { destroy: () => void };

interface VideoPlayerProps {
  /** An HLS stream (.m3u8), an uploaded file, or a YouTube/Vimeo link. */
  src: string;
  poster?: string;
  title: string;
  className?: string;
}

const isHls = (src: string) => /\.m3u8(\?|$)/i.test(src);

type Failure = 'network' | 'unsupported';

// Listing video is H.264; some embedded browsers (VS Code's, some in-app ones) ship without it.
const canDecodeH264 = (video: HTMLVideoElement) =>
  (typeof MediaSource !== 'undefined' &&
    MediaSource.isTypeSupported('video/mp4; codecs="avc1.42E01E,mp4a.40.2"')) ||
  video.canPlayType('video/mp4; codecs="avc1.42E01E"') !== '';

/** Nothing downloads until the viewer presses play, so a page with a video costs no extra data. */
export function VideoPlayer({ src, poster, title, className }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<HlsInstance | null>(null);
  const [started, setStarted] = useState(false);
  const [failed, setFailed] = useState<Failure | null>(null);
  const linked = embeddedVideo(src);
  const embed = linked && linked.kind !== 'file' ? linked : null;

  useEffect(
    () => () => {
      hlsRef.current?.destroy();
      hlsRef.current = null;
    },
    [src]
  );

  const start = async () => {
    setFailed(null);
    setStarted(true);
    if (embed) return;
    const video = videoRef.current;
    if (!video) return;
    if (!canDecodeH264(video)) {
      setFailed('unsupported');
      return;
    }
    try {
      const Hls = isHls(src) ? (await import('hls.js')).default : null;
      // hls.js first: Chrome now claims native HLS but stalled at 0:00 in testing. Native is
      // the fallback for browsers without Media Source Extensions (iPhone Safari).
      if (Hls?.isSupported()) {
        hlsRef.current?.destroy();
        // No worker: the page's CSP doesn't allow blob: workers.
        const hls = new Hls({ enableWorker: false, capLevelToPlayerSize: true });
        hls.on(Hls.Events.ERROR, (_event, data) => {
          if (data.fatal)
            setFailed(/codec|incompatible/i.test(String(data.details)) ? 'unsupported' : 'network');
        });
        hls.loadSource(src);
        hls.attachMedia(video);
        hlsRef.current = hls;
      } else if (Hls && !video.canPlayType('application/vnd.apple.mpegurl')) {
        throw new Error('This browser cannot play HLS');
      } else if (video.src !== src) {
        video.src = src;
      }
      await video.play();
    } catch {
      // play() rejects when autoplay is refused; the native controls still let the viewer start it.
      if (!video.src && !hlsRef.current) setFailed('unsupported');
    }
  };

  return (
    <div className={cn('relative aspect-video w-full overflow-hidden bg-black', className)}>
      {embed && started ? (
        <iframe
          src={embed.embedUrl}
          title={title}
          className="h-full w-full"
          allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
          allowFullScreen
        />
      ) : (
        <video
          ref={videoRef}
          poster={poster}
          controls={started}
          playsInline
          preload="none"
          aria-label={title}
          onError={(event) =>
            started &&
            setFailed(
              event.currentTarget.error?.code === MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED
                ? 'unsupported'
                : 'network'
            )
          }
          className="h-full w-full object-contain"
        />
      )}

      {!started && (
        <button
          type="button"
          onClick={start}
          className="group absolute inset-0 flex items-center justify-center focus:outline-none"
          aria-label={`Play ${title}`}
        >
          {poster && (
            // eslint-disable-next-line @next/next/no-img-element -- signed storage URL
            <img src={poster} alt="" className="absolute inset-0 h-full w-full object-cover" />
          )}
          <span className="relative flex h-16 w-16 items-center justify-center rounded-full bg-black/60 text-white ring-1 ring-white/30 transition-transform group-hover:scale-105 group-focus-visible:ring-2 group-focus-visible:ring-white">
            <Play className="ml-1 h-7 w-7" aria-hidden="true" />
          </span>
        </button>
      )}

      {failed && (
        <div
          role="alert"
          className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/80 p-6 text-center text-sm text-white"
        >
          <AlertCircle className="h-6 w-6" aria-hidden="true" />
          {failed === 'unsupported' ? (
            <p>
              This browser can’t play the video tour. Open the listing in Chrome, Safari or Firefox.
            </p>
          ) : (
            <p>This video couldn’t play. Check your connection and try again.</p>
          )}
          {failed === 'network' && (
            <button
              type="button"
              onClick={start}
              className="rounded-md bg-white px-4 py-2 font-semibold text-black focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black"
            >
              Try again
            </button>
          )}
        </div>
      )}
    </div>
  );
}
