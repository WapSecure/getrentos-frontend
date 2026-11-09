'use client';

import { useEffect, useRef, useState } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@sureground/ui';
import { Alert, Button, CurrencyInput, Field, Input, Select } from '@sureground/ui';
import { Camera, Trash2, Video } from 'lucide-react';
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
  | 'videoTourKey'
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
      <DialogContent className="p-0">
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

  // Staged first and attached on save, as the API binds the upload's key through `coverImageKey`.
  const [coverKey, setCoverKey] = useState(property.coverImageKey);
  const [previewUrl, setPreviewUrl] = useState(property.coverImageUrl);
  const [isUploading, setIsUploading] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  useEffect(() => {
    if (!previewUrl?.startsWith('blob:')) return;
    return () => URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  const handlePhotoSelected = async (file: File) => {
    setPhotoError(null);
    setIsUploading(true);
    try {
      // `unwrap` must be awaited: destructuring the promise itself yields undefined.
      const { key } = await unwrap(ownerService.uploadPropertyMedia(file));
      setCoverKey(key);
      setPreviewUrl(URL.createObjectURL(file));
    } catch (reason) {
      setPhotoError(reason instanceof Error ? reason.message : 'Unable to upload that photo.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    const payload = {
      name,
      propertyType,
      address,
      city,
      state,
      country,
      ...(location.placeId ? { placeId: location.placeId } : {}),
      estimatedValue: Number(estimatedValue) || property.estimatedValue,
      // Only send the cover when it changed, or a stale key overwrites a photo edited elsewhere.
      ...(coverKey !== property.coverImageKey ? { coverImageKey: coverKey } : {}),
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
          <p className="mb-1 text-sm font-medium text-foreground">Property photo</p>
          <div className="flex items-center gap-3">
            <div className="relative h-20 w-28 shrink-0 overflow-hidden rounded-lg border border-border bg-secondary">
              {previewUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={previewUrl} alt="Property photo" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <Camera className="h-6 w-6 text-muted-foreground/50" />
                </div>
              )}
            </div>
            <div className="min-w-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                isLoading={isUploading}
                loadingText="Uploading…"
              >
                {previewUrl ? 'Change photo' : 'Upload photo'}
              </Button>
              <p className="mt-1 text-xs text-muted-foreground">
                Shown on your listings and any estate page featuring this property.
              </p>
            </div>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              // Reset so re-picking the same file still fires a change event.
              event.target.value = '';
              if (file) void handlePhotoSelected(file);
            }}
          />
          {photoError && (
            <Alert variant="danger" className="mt-2">
              {photoError}
            </Alert>
          )}
        </div>

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

        <Button
          variant="primary"
          fullWidth
          onClick={handleSave}
          disabled={!name.trim() || !address.trim() || isUploading || isUploadingVideo}
          isLoading={isSaving}
          loadingText="Saving…"
        >
          Save changes
        </Button>

        {error && <Alert variant="danger">{error}</Alert>}
      </div>
    </>
  );
};
