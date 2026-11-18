import { useState } from 'react';
import { Alert, View } from 'react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button, Text, TextField, useTheme, useToast } from '@sureground/ui-native';
import { Sheet } from '@/components/Sheet';
import { ChipSelect } from '@/components/landlord/ChipSelect';
import {
  landlordApi,
  PROPERTY_TYPES,
  PROPERTY_VERIFIED_FIELDS_LOCKED,
  PROPERTY_TYPE_LABEL,
  type LandlordProperty,
  type PropertyType,
} from '@/lib/api/landlord';
import { ApiError, errorMessage } from '@/lib/api/client';
import { apiErrorCode } from '@/lib/auth/signupErrors';
import { AddressFields, type AddressFieldsValue } from '@/components/forms/AddressFields';
import { LocationPicker } from '@/components/property/LocationPicker';
import type { MapPoint } from '@/lib/api/geocode';

const VERIFIED_FIELD_LABEL: Record<string, string> = {
  title: 'name',
  address: 'address',
  city: 'city',
  state: 'state',
  country: 'country',
  latitude: 'map pin',
  longitude: 'map pin',
};

function lockedFields(e: unknown): string[] | null {
  if (!(e instanceof ApiError) || apiErrorCode(e) !== PROPERTY_VERIFIED_FIELDS_LOCKED) return null;
  const fields = e.details?.fields;
  return Array.isArray(fields) ? fields.filter((f): f is string => typeof f === 'string') : [];
}

interface Props {
  open: boolean;
  onClose: () => void;
  property: LandlordProperty | null;
}

export function EditPropertySheet({ open, onClose, property }: Props) {
  const [submitting, setSubmitting] = useState(false);
  return (
    <Sheet open={open} onClose={submitting ? () => undefined : onClose} title="Edit property">
      {/* Remount per property so fields never carry across. */}
      {property ? (
        <EditForm
          key={property.id}
          property={property}
          onClose={onClose}
          onSubmittingChange={setSubmitting}
        />
      ) : null}
    </Sheet>
  );
}

function EditForm({
  property,
  onClose,
  onSubmittingChange,
}: {
  property: LandlordProperty;
  onClose: () => void;
  onSubmittingChange: (submitting: boolean) => void;
}) {
  const { spacing } = useTheme();
  const qc = useQueryClient();
  const toast = useToast();

  const [name, setName] = useState(property.name);
  const [type, setType] = useState<PropertyType>(
    (PROPERTY_TYPES as readonly string[]).includes(property.type)
      ? (property.type as PropertyType)
      : 'apartment'
  );
  const [location, setLocation] = useState<AddressFieldsValue>({
    address: property.address,
    city: property.city,
    state: property.state,
    country: property.country || 'Nigeria',
    placeId: property.placeId ?? undefined,
  });
  const { address, city, state, country } = location;
  const [description, setDescription] = useState(property.description ?? '');
  const [pin, setPin] = useState<MapPoint | null>(
    property.latitude != null && property.longitude != null
      ? { latitude: property.latitude, longitude: property.longitude }
      : null
  );
  // Only a pin the landlord actually moved is sent, so saving the name alone
  // does not re-confirm a location nobody looked at.
  const [pinMoved, setPinMoved] = useState(false);

  const done = (message: string) => {
    qc.invalidateQueries({ queryKey: ['landlord', 'properties'] });
    toast.show(message, 'success');
    onClose();
  };

  const requestChange = useMutation({
    mutationFn: async () => {
      await landlordApi.requestPropertyChange(property.id, {
        title: name.trim(),
        address: address.trim(),
        city: city.trim(),
        state: state.trim(),
        country,
        ...(location.placeId ? { placeId: location.placeId } : {}),
        ...(pinMoved && pin ? { latitude: pin.latitude, longitude: pin.longitude } : {}),
      });
      return landlordApi.updateProperty(property.id, {
        type,
        description: description.trim() || undefined,
      });
    },
    onMutate: () => onSubmittingChange(true),
    onSuccess: () => done('Change sent. The property is back in review.'),
    onError: (e) => toast.show(errorMessage(e, 'Could not send that change.'), 'error'),
    onSettled: () => onSubmittingChange(false),
  });

  const offerChangeRequest = (fields: string[]) => {
    const what = fields.map((f) => VERIFIED_FIELD_LABEL[f] ?? f);
    const list = [...new Set(what)].join(', ') || 'name, address or map pin';
    Alert.alert(
      'Request a change?',
      `This property is verified, so its ${list} can’t be edited directly. If you request the change, the property loses its verified status until we check it again.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Request change', style: 'destructive', onPress: () => requestChange.mutate() },
      ]
    );
  };

  const save = useMutation({
    mutationFn: () =>
      landlordApi.updateProperty(property.id, {
        name: name.trim(),
        type,
        address: address.trim(),
        country,
        city: city.trim(),
        state: state.trim(),
        // Without a place id a changed address is saved unchecked.
        ...(location.placeId ? { placeId: location.placeId } : {}),
        description: description.trim() || undefined,
        ...(pinMoved && pin ? { latitude: pin.latitude, longitude: pin.longitude } : {}),
      }),
    onMutate: () => onSubmittingChange(true),
    onSuccess: () => done('Property updated.'),
    onError: (e) => {
      const locked = lockedFields(e);
      if (locked) offerChangeRequest(locked);
      else toast.show(errorMessage(e, 'Could not update that property.'), 'error');
    },
    onSettled: () => onSubmittingChange(false),
  });

  return (
    <View style={{ gap: spacing.lg }}>
      <TextField
        label="Name"
        value={name}
        onChangeText={setName}
        editable={!save.isPending}
        required
      />

      <ChipSelect
        label="Type"
        options={PROPERTY_TYPES.map((t) => ({ value: t, label: PROPERTY_TYPE_LABEL[t] }))}
        value={type}
        onChange={setType}
        disabled={save.isPending}
      />

      <AddressFields
        required
        value={location}
        onChange={(patch) => setLocation((prev) => ({ ...prev, ...patch }))}
        onPin={setPin}
      />

      <LocationPicker
        address={address}
        city={city}
        state={state}
        value={pin}
        onChange={(next) => {
          setPin(next);
          setPinMoved(true);
        }}
      />
      {pin && !pinMoved && !property.locationConfirmedAt ? (
        <Text variant="caption" color="mutedForeground">
          This pin is our guess from the address. Drag it onto the building to confirm it.
        </Text>
      ) : null}

      <TextField
        label="Description (optional)"
        multiline
        numberOfLines={3}
        value={description}
        onChangeText={setDescription}
        editable={!save.isPending}
      />

      <Button
        label="Save changes"
        loading={save.isPending || requestChange.isPending}
        disabled={save.isPending || requestChange.isPending || !name.trim() || !address.trim()}
        onPress={() => save.mutate()}
      />
    </View>
  );
}
