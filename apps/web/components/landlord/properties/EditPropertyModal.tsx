'use client';

import { useEffect, useRef, useState } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@getrentos/ui';
import { Alert, Button, Field, Input, NumberInput, Select } from '@getrentos/ui';
import { ImagePlus, Play, Star, Video, X } from 'lucide-react';
import { LocationFields } from '@/components/shared/location/LocationFields';
import { LocationPicker } from '@/components/maps/LocationPicker';
import type { MapPoint } from '@/services/geocodeService';
import {
  PropertyValueFields,
  toOptionalAmount,
} from '@/components/landlord/properties/PropertyValueFields';
import { landlordService } from '@/services/landlordService';
import { unwrap } from '@/lib/apiHelpers';
import type { Property, PropertyType, PropertyUpdatePayload } from '@/types/landlord';
import { videoFileProblem } from '@/lib/videoFile';

type Photo = {
  /** Stable key for React; the storage key for saved photos, a synthetic id for new files. */
  id: string;
  /** Present once the image has been uploaded. */
  key?: string;
  /** Signed URL for saved photos, object URL for files picked in this session. */
  url: string;
  file?: File;
};

/** Cover first, then the rest: mirrors how the API orders `galleryImageKeys`. */
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
      <DialogContent className="p-0">
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
  const [pin, setPin] = useState<MapPoint | null>(
    property.latitude != null && property.longitude != null
      ? { latitude: property.latitude, longitude: property.longitude }
      : null
  );
  // Only a pin the landlord moved is sent, so saving other details does not
  // re-confirm a location nobody looked at.
  const [pinMoved, setPinMoved] = useState(false);
  const [totalUnits, setTotalUnits] = useState(String(property.totalUnits));
  const [estimatedValue, setEstimatedValue] = useState(
    property.estimatedValue ? String(property.estimatedValue) : ''
  );
  const [purchasePrice, setPurchasePrice] = useState(
    property.purchasePrice ? String(property.purchasePrice) : ''
  );

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

  const selectVideo = async (file: File | undefined) => {
    if (!file) return;
    const problem = await videoFileProblem(file);
    setMediaError(problem);
    if (problem) return;
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
        ...(pinMoved && pin ? { latitude: pin.latitude, longitude: pin.longitude } : {}),
        totalUnits: Number(totalUnits) || property.totalUnits,
        estimatedValue: toOptionalAmount(estimatedValue),
        purchasePrice: toOptionalAmount(purchasePrice),
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
        <DialogTitle className="text-xl font-semibold tracking-[-0.02em] text-foreground">
          Edit Property
        </DialogTitle>
        <DialogDescription className="text-xs text-muted-foreground mt-0.5">
          Update your property&apos;s core details
        </DialogDescription>
      </div>

      <div className="p-4 space-y-3">
        <Field label="Property Name" required>
          <Input type="text" value={name} onChange={(e) => setName(e.target.value)} />
        </Field>

        <Field label="Property Type">
          <Select
            value={type}
            onValueChange={(value) => setType(value as PropertyType)}
            options={propertyTypes.map((t) => ({ value: t.value, label: t.label }))}
          />
        </Field>

        <Field label="Address" required>
          <Input type="text" value={address} onChange={(e) => setAddress(e.target.value)} />
        </Field>

        <LocationFields
          country={country}
          state={state}
          city={city}
          onCountryChange={setCountry}
          onStateChange={setState}
          onCityChange={setCity}
          required
        />

        <LocationPicker
          address={address}
          city={city}
          state={state}
          country={country}
          value={pin}
          guessed={!pinMoved && !property.locationConfirmedAt}
          onChange={(next) => {
            setPin(next);
            setPinMoved(true);
          }}
        />

        <Field label="Number of Units">
          <NumberInput min={1} value={totalUnits} onValueChange={setTotalUnits} />
        </Field>

        <div className="pt-3 mt-1 border-t border-border space-y-3">
          <div>
            <p className="text-sm font-medium text-foreground">Value &amp; purchase</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Optional. Lets Portfolio work out this property&apos;s cap rate and yield.
            </p>
          </div>
          <PropertyValueFields
            estimatedValue={estimatedValue}
            purchasePrice={purchasePrice}
            onEstimatedValueChange={setEstimatedValue}
            onPurchasePriceChange={setPurchasePrice}
          />
        </div>

        <div className="pt-3 mt-1 border-t border-border space-y-3">
          <div>
            <p className="text-sm font-medium text-foreground">Photos &amp; video</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              The first photo is the cover renters see on your listing.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
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
                    className="rounded bg-black/70 p-1 text-white hover:bg-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              </div>
            ))}

            {photos.length < 12 && (
              <label className="flex aspect-video cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-border text-muted-foreground transition-colors hover:border-primary hover:text-primary focus-within:ring-2 focus-within:ring-ring">
                <input
                  type="file"
                  multiple
                  accept="image/jpeg,image/png,image/webp"
                  className="sr-only"
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
            <p className="text-xs text-warning">
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
              <label className="cursor-pointer rounded text-xs font-medium text-primary focus-within:ring-2 focus-within:ring-ring">
                {videoFile || (videoKey && !videoCleared) ? 'Replace' : 'Add video tour'}
                <input
                  type="file"
                  accept="video/mp4,video/webm,video/quicktime"
                  className="sr-only"
                  onChange={(event) => {
                    void selectVideo(event.target.files?.[0]);
                    event.target.value = '';
                  }}
                />
              </label>
              {(videoFile || (videoKey && !videoCleared)) && (
                <Button
                  variant="ghost"
                  size="xs"
                  className="text-destructive"
                  aria-label="Remove video tour"
                  onClick={clearVideo}
                >
                  Remove
                </Button>
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

          {mediaError && <Alert variant="danger">{mediaError}</Alert>}
        </div>

        <Button
          variant="primary"
          fullWidth
          onClick={handleSave}
          disabled={!name.trim() || !address.trim()}
          isLoading={saving}
          loadingText="Saving…"
        >
          Save Changes
        </Button>
      </div>
    </>
  );
};
