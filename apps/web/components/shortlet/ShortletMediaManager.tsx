'use client';

import { useMemo, useRef, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Badge, Button, Field, Input, Toast, type ToastVariant } from '@getrentos/ui';
import { ImagePlus, Link2, Map as MapIcon, Star, Trash2, Video } from 'lucide-react';
import { unwrap } from '@/lib/apiHelpers';
import { shortletService } from '@/services/shortletService';

export interface ShortletMediaState {
  imageKeys: string[];
  videoKey: string;
  videoUrl: string;
  tourUrl: string;
}

/**
 * Lets a host manage a shortlet listing's media: an ordered photo gallery
 * (first photo = cover), an uploaded or external video, and a 360/tour URL.
 * Newly uploaded files preview immediately via object URLs; stored keys are
 * attached to the listing when the parent dialog saves.
 */
export function ShortletMediaManager({
  value,
  onChange,
  initialImages = [],
  initialVideoPreview,
  suggestions = [],
}: {
  value: ShortletMediaState;
  onChange: (next: ShortletMediaState) => void;
  /** Signed URLs matching the initial imageKeys (edit mode) so existing photos render. */
  initialImages?: string[];
  /** Signed URL of the already-uploaded video (edit mode). */
  initialVideoPreview?: string;
  /** Property gallery the host can import as a starting point: {key, url}. */
  suggestions?: { key: string; url: string }[];
}) {
  const [toast, setToast] = useState<{ message: string; variant: ToastVariant } | null>(null);
  const [previews, setPreviews] = useState<Record<string, string>>(() => {
    const seed: Record<string, string> = {};
    value.imageKeys.forEach((key, i) => {
      if (initialImages[i]) seed[key] = initialImages[i];
    });
    return seed;
  });
  const [videoPreview, setVideoPreview] = useState<string>(initialVideoPreview ?? '');

  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const importSuggestion = (s: { key: string; url: string }) => {
    if (value.imageKeys.includes(s.key)) return; // already added
    setPreviews((prev) => ({ ...prev, [s.key]: s.url }));
    onChange({ ...value, imageKeys: [...value.imageKeys, s.key] });
  };

  const uploadImage = useMutation({
    mutationFn: async (file: File) => {
      const res = await unwrap(shortletService.uploadMedia('image', file));
      const objectUrl = URL.createObjectURL(file);
      setPreviews((prev) => ({ ...prev, [res.key]: objectUrl }));
      onChange({ ...value, imageKeys: [...value.imageKeys, res.key] });
    },
    onError: (reason: Error) => setToast({ message: reason.message, variant: 'error' }),
  });

  const uploadVideo = useMutation({
    mutationFn: async (file: File) => {
      const res = await unwrap(shortletService.uploadMedia('video', file));
      setVideoPreview(URL.createObjectURL(file));
      onChange({ ...value, videoKey: res.key, videoUrl: '' });
    },
    onError: (reason: Error) => setToast({ message: reason.message, variant: 'error' }),
  });

  const removeImage = (key: string) => {
    const url = previews[key];
    if (url) URL.revokeObjectURL(url);
    setPreviews((prev) => {
      const rest = { ...prev };
      delete rest[key];
      return rest;
    });
    onChange({ ...value, imageKeys: value.imageKeys.filter((k) => k !== key) });
  };

  const setCover = (key: string) => {
    onChange({ ...value, imageKeys: [key, ...value.imageKeys.filter((k) => k !== key)] });
  };

  const clearVideo = () => {
    if (videoPreview) URL.revokeObjectURL(videoPreview);
    setVideoPreview('');
    onChange({ ...value, videoKey: '', videoUrl: '' });
  };

  const hasVideo = Boolean(value.videoKey || value.videoUrl || videoPreview);
  const cover = value.imageKeys[0];
  const videoDisplay = useMemo(() => {
    if (videoPreview) return videoPreview;
    return value.videoUrl;
  }, [videoPreview, value.videoUrl]);

  return (
    <div className="space-y-4">
      <div>
        <div className="mb-2 flex items-center justify-between">
          <p className="text-sm font-medium">Photos</p>
          <p className="text-xs text-muted-foreground">
            {value.imageKeys.length} photo{value.imageKeys.length === 1 ? '' : 's'} · first is the
            cover
          </p>
        </div>
        <input
          ref={imageInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          className="hidden"
          onChange={(e) => {
            const files = Array.from(e.target.files ?? []);
            e.target.value = '';
            files.forEach((f) => uploadImage.mutate(f));
          }}
        />
        {value.imageKeys.length === 0 ? (
          <button
            type="button"
            onClick={() => imageInputRef.current?.click()}
            disabled={uploadImage.isPending}
            className="flex h-28 w-full flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-border text-sm text-muted-foreground transition hover:border-primary hover:text-primary disabled:opacity-60"
          >
            <ImagePlus className="h-6 w-6" />
            {uploadImage.isPending ? 'Uploading…' : 'Add photos'}
          </button>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {value.imageKeys.map((key) => (
              <div
                key={key}
                className="group relative aspect-[4/3] overflow-hidden rounded-lg border border-border"
              >
                {previews[key] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={previews[key]} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-secondary/50 text-xs text-muted-foreground">
                    Image
                  </div>
                )}
                {key === cover && (
                  <Badge className="absolute left-1 top-1 bg-primary text-primary-foreground">
                    Cover
                  </Badge>
                )}
                <div className="absolute inset-0 flex items-end justify-between gap-1 bg-gradient-to-t from-black/60 to-transparent p-1.5 opacity-0 transition group-hover:opacity-100">
                  {key !== cover && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 bg-white/80 p-0 text-foreground hover:bg-white"
                      onClick={() => setCover(key)}
                      aria-label="Set as cover"
                    >
                      <Star className="h-3.5 w-3.5" />
                    </Button>
                  )}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="ml-auto h-7 w-7 bg-white/80 p-0 text-destructive hover:bg-white"
                    onClick={() => removeImage(key)}
                    aria-label="Remove photo"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={() => imageInputRef.current?.click()}
              disabled={uploadImage.isPending}
              className="flex aspect-[4/3] flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-border text-xs text-muted-foreground transition hover:border-primary hover:text-primary disabled:opacity-60"
            >
              <ImagePlus className="h-5 w-5" />
              {uploadImage.isPending ? 'Uploading…' : 'Add'}
            </button>
          </div>
        )}

        {suggestions.length > 0 && (
          <div className="mt-3">
            <p className="mb-2 text-xs font-medium text-muted-foreground">
              Use photos already on this property — click to add
            </p>
            <div className="flex flex-wrap gap-2">
              {suggestions.map((s) => {
                const added = value.imageKeys.includes(s.key);
                return (
                  <button
                    key={s.key}
                    type="button"
                    onClick={() => importSuggestion(s)}
                    disabled={added}
                    className={`relative h-16 w-20 overflow-hidden rounded-lg border-2 transition ${
                      added
                        ? 'cursor-default border-primary opacity-60'
                        : 'border-dashed border-border opacity-80 hover:border-primary hover:opacity-100'
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={s.url} alt="" className="h-full w-full object-cover" />
                    {added && (
                      <span className="absolute inset-0 flex items-center justify-center bg-black/50 text-[10px] font-semibold text-white">
                        Added
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className="mb-2 text-sm font-medium">Video</p>
          <input
            ref={videoInputRef}
            type="file"
            accept="video/mp4,video/webm"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = '';
              if (file) uploadVideo.mutate(file);
            }}
          />
          {hasVideo ? (
            <div className="space-y-2">
              <video
                src={videoDisplay}
                controls
                className="h-28 w-full rounded-lg border border-border bg-black object-contain"
              />
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => videoInputRef.current?.click()}
                  disabled={uploadVideo.isPending}
                >
                  <Video className="mr-1 h-3.5 w-3.5" /> Replace
                </Button>
                <Button type="button" variant="ghost" size="sm" onClick={clearVideo}>
                  Remove
                </Button>
              </div>
            </div>
          ) : (
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => videoInputRef.current?.click()}
              disabled={uploadVideo.isPending}
            >
              <Video className="mr-1.5 h-4 w-4" />
              {uploadVideo.isPending ? 'Uploading…' : 'Upload video'}
            </Button>
          )}
          <Field label="Or paste a video link" hint="YouTube, Vimeo…" className="mt-2">
            <Input
              type="text"
              placeholder="https://…"
              value={value.videoUrl}
              onChange={(e) => onChange({ ...value, videoUrl: e.target.value, videoKey: '' })}
            />
          </Field>
        </div>

        <div>
          <p className="mb-2 flex items-center gap-1 text-sm font-medium">
            <MapIcon className="h-3.5 w-3.5" /> 360 / virtual tour
          </p>
          <Field label="Tour link" hint="Matterport, Kuula…">
            <Input
              type="text"
              placeholder="https://my.matterport.com/…"
              value={value.tourUrl}
              onChange={(e) => onChange({ ...value, tourUrl: e.target.value })}
            />
          </Field>
          {value.tourUrl && (
            <Badge variant="info" className="mt-2">
              <Link2 className="mr-1 h-3 w-3" /> Tour embed enabled
            </Badge>
          )}
        </div>
      </div>

      {toast && (
        <Toast message={toast.message} variant={toast.variant} onClose={() => setToast(null)} />
      )}
    </div>
  );
}
