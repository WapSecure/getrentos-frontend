'use client';

import { useEffect, useRef, useState } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@sureground/ui';
import { Alert, Button, CurrencyInput, Field, Input, Select } from '@sureground/ui';
import { Trash2, Video } from '@sureground/icons';
import { tourSource } from '@sureground/shared';
import {
  mediaDetailsFor,
  photosFromKeys,
  photosPending,
  PropertyPhotoEditor,
  type EditablePhoto,
} from '@/components/shared/media/PropertyPhotoEditor';
import { FloorPlanDetailsEditor } from '@/components/shared/media/FloorPlanDetailsEditor';
import type { OwnerProperty } from '@/types/owner';
import { AddressFields, type AddressFieldsValue } from '@/components/shared/location/AddressFields';
import { LocationPicker } from '@/components/maps/LocationPicker';
import type { MapPoint } from '@/services/geocodeService';
import { PROPERTY_TYPE_OPTIONS } from '@/lib/propertyTypes';
import { ownerService } from '@/services/ownerService';
import { unwrap } from '@/lib/apiHelpers';
import { videoFileProblem } from '@/lib/videoFile';

type OwnerPropertyUpdates = Pick<
  OwnerProperty,
  | 'name'
  | 'propertyType'
  | 'address'
  | 'city'
  | 'state'
  | 'country'
  | 'placeId'
  | 'estimatedValue'
  | 'coverImageKey'
  | 'galleryImageKeys'
  | 'videoTourKey'
  | 'tourUrl'
  | 'mediaDetails'
  | 'latitude'
  | 'longitude'
>;

interface EditOwnerPropertyModalProps {
  property: OwnerProperty | null;
  onClose: () => void;
  onSave: (id: string, updates: OwnerPropertyUpdates) => Promise<void>;
}

export const EditOwnerPropertyModal = ({
  property,
  onClose,
  onSave,
}: EditOwnerPropertyModalProps) => {
  return (
    <Dialog open={!!property} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="p-0" size="xl">
        {property && (
          <EditOwnerPropertyForm
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

const EditOwnerPropertyForm = ({
  property,
  onSave,
  onClose,
}: {
  property: OwnerProperty;
  onSave: (id: string, updates: OwnerPropertyUpdates) => Promise<void>;
  onClose: () => void;
}) => {
  const [name, setName] = useState(property.name);
  const [propertyType, setPropertyType] = useState(property.propertyType);
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
  const [pinMoved, setPinMoved] = useState(false);
  const [estimatedValue, setEstimatedValue] = useState(String(property.estimatedValue));
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // The API lists the cover first among the gallery keys.
  const [photos, setPhotos] = useState<EditablePhoto[]>(() =>
    property.galleryImageKeys?.length
      ? photosFromKeys(
          property.galleryImageKeys,
          property.galleryImageUrls ?? [],
          property.mediaDetails
        )
      : property.coverImageKey
        ? photosFromKeys(
            [property.coverImageKey],
            [property.coverImageUrl ?? ''],
            property.mediaDetails
          )
        : []
  );
  // Media is only sent once edited, or a stale set would overwrite photos changed elsewhere.
  const [photosTouched, setPhotosTouched] = useState(false);
  const [tourUrl, setTourUrl] = useState(property.tourUrl ?? '');
  const tourInvalid = tourUrl.trim() !== '' && !tourSource(tourUrl.trim());

  const [videoKey, setVideoKey] = useState<string | null>(property.videoTourKey ?? null);
  const [videoPreview, setVideoPreview] = useState(property.videoTourUrl);
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);
  const [videoError, setVideoError] = useState<string | null>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!videoPreview?.startsWith('blob:')) return;
    return () => URL.revokeObjectURL(videoPreview);
  }, [videoPreview]);

  const handleVideoSelected = async (file: File) => {
    const problem = await videoFileProblem(file);
    setVideoError(problem);
    if (problem) return;
    setIsUploadingVideo(true);
    try {
      const { key } = await unwrap(ownerService.uploadPropertyMedia(file, 'video'));
      setVideoKey(key);
      setVideoPreview(URL.createObjectURL(file));
    } catch (reason) {
      setVideoError(reason instanceof Error ? reason.message : 'Unable to upload that video.');
    } finally {
      setIsUploadingVideo(false);
    }
  };

  const uploadsPending = photosPending(photos);

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    let media = {};
    try {
      if (photosTouched) {
        const keys = await Promise.all(
          photos.map(
            async (photo) =>
              photo.key ??
              (photo.file
                ? (await unwrap(ownerService.uploadPropertyMedia(photo.file))).key
                : undefined)
          )
        );
        const galleryImageKeys = keys.filter((key): key is string => !!key);
        media = {
          coverImageKey: galleryImageKeys[0] ?? null,
          galleryImageKeys,
          mediaDetails: mediaDetailsFor(photos, keys),
        };
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to upload those photos.');
      setIsSaving(false);
      return;
    }
    const payload = {
      ...media,
      ...(tourUrl.trim() !== (property.tourUrl ?? '') ? { tourUrl: tourUrl.trim() || null } : {}),
      name,
      propertyType,
      address,
      city,
      state,
      country,
      ...(location.placeId ? { placeId: location.placeId } : {}),
      estimatedValue: Number(estimatedValue) || property.estimatedValue,
      ...(videoKey !== (property.videoTourKey ?? null) ? { videoTourKey: videoKey } : {}),
      // Only a pin the owner moved, so saving other details doesn't re-confirm a location nobody looked at.
      ...(pinMoved && pin ? { latitude: pin.latitude, longitude: pin.longitude } : {}),
    };
    try {
      await onSave(property.id, payload);
      onClose();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to update the property.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <div className="p-4 border-b border-border">
        <DialogTitle className="font-semibold text-foreground">Edit property</DialogTitle>
        <DialogDescription className="text-xs text-muted-foreground mt-0.5">
          Update your property&apos;s core details
        </DialogDescription>
      </div>

      <div className="p-4 space-y-3">
        <Field label="Property name" required>
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </Field>

        <Field label="Property type">
          <Select
            value={propertyType}
            onValueChange={setPropertyType}
            options={PROPERTY_TYPE_OPTIONS.map(({ label }) => ({ value: label, label }))}
            ariaLabel="Property type"
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

        <Field label="Estimated value">
          <CurrencyInput
            prefix="₦"
            min={0}
            value={estimatedValue}
            onValueChange={(v) => setEstimatedValue(v === 0 ? '' : String(v))}
          />
        </Field>

        <div>
          <p className="text-sm font-medium text-foreground">Photos</p>
          <p className="mb-2 mt-0.5 text-xs text-muted-foreground">
            The first photo is the cover on your listings and any estate page featuring this
            property. Tag rooms and add short captions so buyers know what they are looking at.
          </p>
          <PropertyPhotoEditor
            photos={photos}
            onChange={(next) => {
              setPhotos(next);
              setPhotosTouched(true);
            }}
            upload={async (file, options) =>
              (await unwrap(ownerService.uploadPropertyMedia(file, 'image', options))).key
            }
          />
        </div>

        <FloorPlanDetailsEditor propertyId={property.id} photos={photos} />

        <div>
          <p className="mb-1 text-sm font-medium text-foreground">Video tour</p>
          {videoKey && videoPreview ? (
            <video
              src={videoPreview}
              controls
              playsInline
              preload="metadata"
              className="mb-2 aspect-video w-full rounded-lg border border-border bg-black"
            />
          ) : null}
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => videoInputRef.current?.click()}
              isLoading={isUploadingVideo}
              loadingText="Uploading…"
              icon={<Video className="h-4 w-4" />}
            >
              {videoKey ? 'Replace video' : 'Add video tour'}
            </Button>
            {videoKey && !isUploadingVideo ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setVideoKey(null);
                  setVideoPreview(undefined);
                }}
                icon={<Trash2 className="h-4 w-4" />}
              >
                Remove
              </Button>
            ) : null}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            A short walkthrough, up to 5 minutes and 150 MB. Buyers can watch it on your listing.
          </p>
          <input
            ref={videoInputRef}
            type="file"
            accept="video/*"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              event.target.value = '';
              if (file) void handleVideoSelected(file);
            }}
          />
          {videoError && (
            <Alert variant="danger" className="mt-2">
              {videoError}
            </Alert>
          )}
        </div>

        <Field
          label="360 tour link"
          hint="Matterport, Kuula, CloudPano, Theasys or Momento360. Buyers load it only when they tap it."
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

        <Button
          variant="primary"
          fullWidth
          onClick={handleSave}
          disabled={
            !name.trim() || !address.trim() || isUploadingVideo || tourInvalid || uploadsPending
          }
          isLoading={isSaving}
          loadingText="Saving…"
        >
          Save changes
        </Button>
        {uploadsPending && (
          <p className="text-center text-xs text-muted-foreground">
            You can save once every photo has uploaded.
          </p>
        )}

        {error && <Alert variant="danger">{error}</Alert>}
      </div>
    </>
  );
};
