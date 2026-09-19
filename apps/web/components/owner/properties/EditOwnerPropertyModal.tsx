'use client';

import { useEffect, useRef, useState } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@getrentos/ui';
import { Button, CurrencyInput, Input, Select } from '@getrentos/ui';
import { Camera, Loader2 } from 'lucide-react';
import type { OwnerProperty } from '@/types/owner';
import { LocationFields } from '@/components/shared/location/LocationFields';
import { PROPERTY_TYPE_OPTIONS } from '@/lib/propertyTypes';
import { ownerService } from '@/services/ownerService';
import { unwrap } from '@/lib/apiHelpers';

type OwnerPropertyUpdates = Pick<
  OwnerProperty,
  | 'name'
  | 'propertyType'
  | 'address'
  | 'city'
  | 'state'
  | 'country'
  | 'estimatedValue'
  | 'coverImageKey'
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
      <DialogContent>
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
  const [address, setAddress] = useState(property.address);
  const [city, setCity] = useState(property.city);
  const [state, setState] = useState(property.state);
  const [country, setCountry] = useState(property.country ?? 'Nigeria');
  const [estimatedValue, setEstimatedValue] = useState(String(property.estimatedValue));
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // The photo is staged first and only attached on save, matching the API: the
  // upload returns a storage key, and `coverImageKey` is what binds it.
  const [coverKey, setCoverKey] = useState(property.coverImageKey);
  const [previewUrl, setPreviewUrl] = useState(property.coverImageUrl);
  const [isUploading, setIsUploading] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Release the local preview once it is replaced or the modal closes.
  useEffect(() => {
    if (!previewUrl?.startsWith('blob:')) return;
    return () => URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  const handlePhotoSelected = async (file: File) => {
    setPhotoError(null);
    setIsUploading(true);
    try {
      // `unwrap` takes the pending response and resolves to its payload, so it
      // must be awaited — destructuring the promise itself yields undefined.
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
      estimatedValue: Number(estimatedValue) || property.estimatedValue,
      // Only send the cover when it changed; an unconditional write would
      // push a stale key back over a photo edited elsewhere.
      ...(coverKey !== property.coverImageKey ? { coverImageKey: coverKey } : {}),
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
        <DialogTitle className="font-semibold text-foreground">Edit Property</DialogTitle>
        <DialogDescription className="text-xs text-muted-foreground mt-0.5">
          Update your property&apos;s core details
        </DialogDescription>
      </div>

      <div className="p-4 space-y-3">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Property Name</label>
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Property Type</label>
          <Select
            value={propertyType}
            onValueChange={setPropertyType}
            options={PROPERTY_TYPE_OPTIONS.map(({ label }) => ({ value: label, label }))}
            ariaLabel="Property type"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Address</label>
          <Input value={address} onChange={(e) => setAddress(e.target.value)} />
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
          <label className="block text-sm font-medium text-foreground mb-1">
            Estimated Value (₦)
          </label>
          <CurrencyInput
            prefix="₦"
            min={0}
            value={estimatedValue}
            onValueChange={(v) => setEstimatedValue(v === 0 ? '' : String(v))}
            className="w-full px-3 py-2 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Property Photo</label>
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
                disabled={isUploading}
              >
                {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {isUploading ? 'Uploading…' : previewUrl ? 'Change photo' : 'Upload photo'}
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
          {photoError && <p className="mt-1 text-sm text-destructive">{photoError}</p>}
        </div>

        <Button
          variant="primary"
          fullWidth
          onClick={handleSave}
          disabled={!name.trim() || !address.trim() || isSaving || isUploading}
          isLoading={isSaving}
        >
          {isSaving ? 'Saving…' : 'Save Changes'}
        </Button>

        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>
    </>
  );
};
