'use client';

import { LegacyInput, NumberInput } from '@getrentos/ui';

import { LegacySelect } from '@getrentos/ui';

import { useEffect, useRef, useState } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@getrentos/ui';
import { Button } from '@getrentos/ui';
import { ImagePlus, Loader2, Play, Star, Video, X } from 'lucide-react';
import { LocationFields } from '@/components/shared/location/LocationFields';
import { landlordService } from '@/services/landlordService';
import { unwrap } from '@/lib/apiHelpers';
import type { Property, PropertyType, PropertyUpdatePayload } from '@/types/landlord';

type Photo = {
  /** Stable key for React; the storage key for saved photos, a synthetic id for new files. */
  id: string;
  /** Present once the image has been uploaded. */
  key?: string;
  /** Signed URL for saved photos, object URL for files picked in this session. */
  url: string;
  file?: File;
};

/** Cover first, then the rest — mirrors how the API orders `galleryImageKeys`. */
const photosFromProperty = (property: Property): Photo[] => {
  const keys = property.galleryImageKeys ?? [];
  const urls = property.galleryImages ?? [];
  return keys.map((key, index) => ({ id: key, key, url: urls[index] ?? '' }));
};

interface EditPropertyModalProps {
  property: Property | null;
  onClose: () => void;
  onSave: (id: string, updates: PropertyUpdatePayload) => void;
}

const propertyTypes: { value: PropertyType; label: string }[] = [
  { value: 'apartment', label: 'Apartment' },
  { value: 'duplex', label: 'Duplex' },
  { value: 'condo', label: 'Condo' },
  { value: 'commercial', label: 'Commercial' },
  { value: 'shared_apartment', label: 'Shared Apartment' },
];

export const EditPropertyModal = ({ property, onClose, onSave }: EditPropertyModalProps) => {
  return (
    <Dialog open={!!property} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        {property && (
          <EditPropertyForm
            key={property.id}
            property={property}
            onSave={onSave}
            onClose={onClose}
          />
        )}
      </DialogContent>
    </Dialog>
  );
};

const EditPropertyForm = ({
  property,
  onSave,
  onClose,
}: {
  property: Property;
  onSave: (id: string, updates: PropertyUpdatePayload) => void;
  onClose: () => void;
}) => {
  const [name, setName] = useState(property.name);
  const [type, setType] = useState<PropertyType>(property.type);
  const [address, setAddress] = useState(property.address);
  const [city, setCity] = useState(property.city);
  const [state, setState] = useState(property.state);
  const [country, setCountry] = useState(property.country ?? 'Nigeria');
  const [totalUnits, setTotalUnits] = useState(String(property.totalUnits));

  const [photos, setPhotos] = useState<Photo[]>(() => photosFromProperty(property));
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | undefined>(undefined);
  const [videoKey, setVideoKey] = useState<string | undefined>(property.videoTourKey);
  const [videoCleared, setVideoCleared] = useState(false);
  const [saving, setSaving] = useState(false);
  const [mediaError, setMediaError] = useState<string | null>(null);
  const objectUrls = useRef<string[]>([]);

  // Revoke any object URLs we created for freshly picked files.
  useEffect(
    () => () => {
      objectUrls.current.forEach((url) => URL.revokeObjectURL(url));
      objectUrls.current = [];
    },
    []
  );

  const selectVideo = (file: File | undefined) => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    objectUrls.current.push(url);
    setVideoFile(file);
    setVideoPreviewUrl(url);
    setVideoCleared(false);
  };

  const clearVideo = () => {
    setVideoFile(null);
    setVideoPreviewUrl(undefined);
    setVideoKey(undefined);
    setVideoCleared(true);
  };

  const addPhotos = (files: FileList | null) => {
    if (!files?.length) return;
    const additions: Photo[] = Array.from(files)
      .slice(0, Math.max(0, 12 - photos.length))
      .map((file) => {
        const url = URL.createObjectURL(file);
        objectUrls.current.push(url);
        return { id: `${file.name}-${file.lastModified}-${url}`, url, file };
      });
    if (additions.length) setPhotos((current) => [...current, ...additions]);
  };

  const removePhoto = (id: string) => setPhotos((current) => current.filter((p) => p.id !== id));

  const makeCover = (id: string) =>
    setPhotos((current) => {
      const target = current.find((p) => p.id === id);
      if (!target) return current;
      return [target, ...current.filter((p) => p.id !== id)];
    });

  const handleSave = async () => {
    setSaving(true);
    setMediaError(null);
    try {
      // Upload anything picked in this session, then send the resulting keys.
      const uploaded = await Promise.all(
        photos.map(async (photo) => {
          if (photo.key) return photo.key;
          if (!photo.file) return undefined;
          const { key } = await unwrap(landlordService.uploadPropertyMedia('image', photo.file));
          return key;
        })
      );
      const galleryImageKeys = uploaded.filter((key): key is string => !!key);

      let nextVideoKey: string | null = videoCleared ? null : (videoKey ?? null);
      if (videoFile) {
        const { key } = await unwrap(landlordService.uploadPropertyMedia('video', videoFile));
        nextVideoKey = key;
      }

      onSave(property.id, {
        name,
        type,
        address,
        city,
        state,
        country,
        totalUnits: Number(totalUnits) || property.totalUnits,
        coverImageKey: galleryImageKeys[0] ?? null,
        galleryImageKeys,
        videoTourKey: nextVideoKey,
      });

      // Detached blobs are left for the backend's own staging/GC policy:
      // DELETE /landlord/properties/media/upload refuses keys still attached
      // to a property, so a best-effort delete here would only race the PATCH.
      onClose();
    } catch (error) {
      setMediaError(
        error instanceof Error ? error.message : 'We could not upload that media. Please try again.'
      );
    } finally {
      setSaving(false);
    }
  };

  const coverId = photos[0]?.id;

  return (
    <>
      <div className="p-4 border-b border-border">
        <DialogTitle className="font-semibold text-foreground">Edit Property</DialogTitle>
        <DialogDescription className="text-xs text-muted-foreground mt-0.5">
          Update your property&apos;s core details
        </DialogDescription>
      </div>

      <div className="p-4 space-y-3">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Property Name</label>
          <LegacyInput
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Property Type</label>
          <LegacySelect
            value={type}
            onChange={(e) => setType(e.target.value as PropertyType)}
            className="w-full px-3 py-2 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          >
            {propertyTypes.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </LegacySelect>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Address</label>
          <LegacyInput
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <LocationFields
          country={country}
          state={state}
          city={city}
          onCountryChange={setCountry}
          onStateChange={setState}
          onCityChange={setCity}
          required
        />

        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Number of Units</label>
          <NumberInput
            min={1}
            value={totalUnits}
            onValueChange={setTotalUnits}
            className="w-full px-3 py-2 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div className="pt-3 mt-1 border-t border-border space-y-3">
          <div>
            <p className="text-sm font-medium text-foreground">Photos &amp; video</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              The first photo is the cover renters see on your listing.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {photos.map((photo) => (
              <div
                key={photo.id}
                className="relative aspect-video overflow-hidden rounded-lg border border-border bg-muted"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={photo.url} alt="" className="h-full w-full object-cover" />
                {photo.id === coverId && (
                  <span className="absolute left-1 top-1 rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-medium text-white">
                    Cover
                  </span>
                )}
                <div className="absolute right-1 top-1 flex gap-1">
                  {photo.id !== coverId && (
                    <button
                      type="button"
                      aria-label="Make cover photo"
                      title="Make cover photo"
                      onClick={() => makeCover(photo.id)}
                      className="rounded bg-black/70 p-1 text-white hover:bg-black/90"
                    >
                      <Star className="h-3 w-3" />
                    </button>
                  )}
                  <button
                    type="button"
                    aria-label="Remove photo"
                    title="Remove photo"
                    onClick={() => removePhoto(photo.id)}
                    className="rounded bg-black/70 p-1 text-white hover:bg-red-600"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              </div>
            ))}

            {photos.length < 12 && (
              <label className="flex aspect-video cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-border text-muted-foreground transition-colors hover:border-primary hover:text-primary">
                <LegacyInput
                  type="file"
                  multiple
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(event) => {
                    addPhotos(event.target.files);
                    event.target.value = '';
                  }}
                />
                <ImagePlus className="h-4 w-4" />
                <span className="text-[10px]">Add photos</span>
              </label>
            )}
          </div>

          {photos.length === 0 && (
            <p className="text-xs text-amber-600 dark:text-amber-400">
              Without a photo your listing card shows a placeholder instead of the property.
            </p>
          )}

          <div className="flex items-center justify-between gap-2 rounded-lg border border-border p-2">
            <div className="flex min-w-0 items-center gap-2">
              {videoFile || (videoKey && !videoCleared) ? (
                <Play className="h-4 w-4 shrink-0 text-primary" />
              ) : (
                <Video className="h-4 w-4 shrink-0 text-muted-foreground" />
              )}
              <span className="truncate text-xs text-muted-foreground">
                {videoFile
                  ? videoFile.name
                  : videoKey && !videoCleared
                    ? 'Video tour attached'
                    : 'No video tour'}
              </span>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <label className="cursor-pointer text-xs font-medium text-primary">
                {videoFile || (videoKey && !videoCleared) ? 'Replace' : 'Add video tour'}
                <LegacyInput
                  type="file"
                  accept="video/mp4,video/webm,video/quicktime"
                  className="hidden"
                  onChange={(event) => {
                    selectVideo(event.target.files?.[0]);
                    event.target.value = '';
                  }}
                />
              </label>
              {(videoFile || (videoKey && !videoCleared)) && (
                <button
                  type="button"
                  aria-label="Remove video tour"
                  onClick={clearVideo}
                  className="text-xs font-medium text-red-600 hover:underline dark:text-red-400"
                >
                  Remove
                </button>
              )}
            </div>
          </div>

          {videoPreviewUrl && (
            <video
              src={videoPreviewUrl}
              controls
              playsInline
              className="w-full rounded-lg bg-black"
            />
          )}

          {mediaError && (
            <p role="alert" className="text-xs text-red-600 dark:text-red-400">
              {mediaError}
            </p>
          )}
        </div>

        <Button
          variant="primary"
          fullWidth
          onClick={handleSave}
          disabled={saving || !name.trim() || !address.trim()}
        >
          {saving ? (
            <span className="inline-flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" /> Saving…
            </span>
          ) : (
            'Save Changes'
          )}
        </Button>
      </div>
    </>
  );
};
