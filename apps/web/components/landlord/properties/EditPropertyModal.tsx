'use client';

import { useEffect, useRef, useState } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@sureground/ui';
import { Alert, Button, Field, Input, NumberInput, Select } from '@sureground/ui';
import { Play, Video } from '@sureground/icons';
import { tourSource } from '@sureground/shared';
import {
  mediaDetailsFor,
  photosFromKeys,
  PropertyPhotoEditor,
  type EditablePhoto,
} from '@/components/shared/media/PropertyPhotoEditor';
import { AddressFields, type AddressFieldsValue } from '@/components/shared/location/AddressFields';
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
  { value: 'shared_apartment', label: 'Shared apartment' },
];

export const EditPropertyModal = ({ property, onClose, onSave }: EditPropertyModalProps) => {
  return (
    <Dialog open={!!property} onOpenChange={(open) => !open && onClose()}>
      <DialogContent padded={false}>
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
  const [location, setLocation] = useState<AddressFieldsValue>({
    address: property.address,
    city: property.city,
    state: property.state,
    country: property.country ?? 'Nigeria',
    placeId: property.placeId,
  });
  const { address, city, state, country } = location;
  const [pin, setPin] = useState<MapPoint | null>(
    property.latitude != null && property.longitude != null
      ? { latitude: property.latitude, longitude: property.longitude }
      : null
  );
  // Only a moved pin is sent, so saving other details doesn't re-confirm a location nobody looked at.
  const [pinMoved, setPinMoved] = useState(false);
  const [totalUnits, setTotalUnits] = useState(String(property.totalUnits));
  const [estimatedValue, setEstimatedValue] = useState(
    property.estimatedValue ? String(property.estimatedValue) : ''
  );
  const [purchasePrice, setPurchasePrice] = useState(
    property.purchasePrice ? String(property.purchasePrice) : ''
  );

  const [photos, setPhotos] = useState<EditablePhoto[]>(() =>
    photosFromKeys(
      property.galleryImageKeys ?? [],
      property.galleryImages ?? [],
      property.mediaDetails
    )
  );
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | undefined>(undefined);
  const [videoKey, setVideoKey] = useState<string | undefined>(property.videoTourKey);
  const [videoCleared, setVideoCleared] = useState(false);
  const [tourUrl, setTourUrl] = useState(property.tourUrl ?? '');
  const tourInvalid = tourUrl.trim() !== '' && !tourSource(tourUrl.trim());
  const [saving, setSaving] = useState(false);
  const [mediaError, setMediaError] = useState<string | null>(null);
  const objectUrls = useRef<string[]>([]);

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

  const handleSave = async () => {
    setSaving(true);
    setMediaError(null);
    try {
      const uploaded = await Promise.all(
        photos.map(async (photo) => {
          if (photo.key) return photo.key;
          if (!photo.file) return undefined;
          const { key } = await unwrap(landlordService.uploadPropertyMedia('image', photo.file));
          return key;
        })
      );
      const galleryImageKeys = uploaded.filter((key): key is string => !!key);
      const mediaDetails = mediaDetailsFor(photos, uploaded);

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
        ...(location.placeId ? { placeId: location.placeId } : {}),
        ...(pinMoved && pin ? { latitude: pin.latitude, longitude: pin.longitude } : {}),
        totalUnits: Number(totalUnits) || property.totalUnits,
        estimatedValue: toOptionalAmount(estimatedValue),
        purchasePrice: toOptionalAmount(purchasePrice),
        coverImageKey: galleryImageKeys[0] ?? null,
        galleryImageKeys,
        videoTourKey: nextVideoKey,
        tourUrl: tourUrl.trim() || null,
        mediaDetails,
      });

      // Detached blobs are left to the backend's GC: its DELETE refuses keys still attached, so deleting here would race the PATCH.
      onClose();
    } catch (error) {
      setMediaError(
        error instanceof Error ? error.message : 'We could not upload that media. Please try again.'
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="p-4 pr-12 border-b border-border">
        <DialogTitle className="text-xl font-semibold tracking-[-0.02em] text-foreground">
          Edit property
        </DialogTitle>
        <DialogDescription className="text-xs text-muted-foreground mt-0.5">
          Update your property&apos;s core details
        </DialogDescription>
      </div>

      <div className="p-4 space-y-3">
        <Field label="Property name" required>
          <Input type="text" value={name} onChange={(e) => setName(e.target.value)} />
        </Field>

        <Field label="Property type">
          <Select
            value={type}
            onValueChange={(value) => setType(value as PropertyType)}
            options={propertyTypes.map((t) => ({ value: t.value, label: t.label }))}
          />
        </Field>

        <AddressFields
          required
          value={location}
          onChange={(patch) => setLocation((prev) => ({ ...prev, ...patch }))}
          onPin={(next) => {
            setPin(next);
            setPinMoved(true);
          }}
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

        <Field label="Number of units">
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
              The first photo is the cover renters see. Tagging rooms groups the gallery for
              renters; a short caption says what a photo shows.
            </p>
          </div>

          <PropertyPhotoEditor photos={photos} onChange={setPhotos} />

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

          <Field
            label="360 tour link"
            hint="Matterport, Kuula, CloudPano, Theasys or Momento360. Renters load it only when they tap it."
            error={tourInvalid ? 'Use a link from one of the tour sites listed.' : undefined}
          >
            <Input
              type="url"
              inputMode="url"
              value={tourUrl}
              onChange={(e) => setTourUrl(e.target.value)}
              placeholder="https://kuula.co/share/…"
            />
          </Field>

          {mediaError && <Alert variant="danger">{mediaError}</Alert>}
        </div>

        <Button
          variant="primary"
          fullWidth
          onClick={handleSave}
          disabled={!name.trim() || !address.trim() || tourInvalid}
          isLoading={saving}
          loadingText="Saving…"
        >
          Save changes
        </Button>
      </div>
    </>
  );
};
