import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button, Text, TextField, useTheme, useToast } from '@getrentos/ui-native';
import { Sheet } from '@/components/Sheet';
import {
  landlordApi,
  PROPERTY_TYPES,
  PROPERTY_TYPE_LABEL,
  type LandlordProperty,
  type PropertyType,
} from '@/lib/api/landlord';
import { ApiError } from '@/lib/api/client';
import { LocationFields } from '@/components/forms/LocationFields';
import { LocationPicker } from '@/components/property/LocationPicker';
import type { MapPoint } from '@/lib/api/geocode';

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
  const { colors, spacing, radius } = useTheme();
  const qc = useQueryClient();
  const toast = useToast();

  const [name, setName] = useState(property.name);
  const [type, setType] = useState<PropertyType>(
    (PROPERTY_TYPES as readonly string[]).includes(property.type)
      ? (property.type as PropertyType)
      : 'apartment'
  );
  const [address, setAddress] = useState(property.address);
  const [country, setCountry] = useState(property.country || 'Nigeria');
  const [city, setCity] = useState(property.city);
  const [state, setState] = useState(property.state);
  const [description, setDescription] = useState(property.description ?? '');
  const [pin, setPin] = useState<MapPoint | null>(
    property.latitude != null && property.longitude != null
      ? { latitude: property.latitude, longitude: property.longitude }
      : null
  );
  // Only a pin the landlord actually moved is sent, so saving the name alone
  // does not re-confirm a location nobody looked at.
  const [pinMoved, setPinMoved] = useState(false);

  const save = useMutation({
    mutationFn: () =>
      landlordApi.updateProperty(property.id, {
        name: name.trim(),
        type,
        address: address.trim(),
        country,
        city: city.trim(),
        state: state.trim(),
        description: description.trim() || undefined,
        ...(pinMoved && pin ? { latitude: pin.latitude, longitude: pin.longitude } : {}),
      }),
    onMutate: () => onSubmittingChange(true),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['landlord', 'properties'] });
      toast.show('Property updated.', 'success');
      onClose();
    },
    onError: (e) =>
      toast.show(e instanceof ApiError ? e.message : 'Could not update that property.', 'error'),
    onSettled: () => onSubmittingChange(false),
  });

  return (
    <View style={{ gap: spacing.lg }}>
      <TextField label="Name" value={name} onChangeText={setName} editable={!save.isPending} />

      <View style={{ gap: spacing.sm }}>
        <Text variant="callout" color="mutedForeground" style={{ marginLeft: 4 }}>
          Type
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
          {PROPERTY_TYPES.map((t) => {
            const selected = t === type;
            return (
              <Pressable
                key={t}
                onPress={() => setType(t)}
                disabled={save.isPending}
                accessibilityRole="button"
                accessibilityState={{ selected, disabled: save.isPending }}
                style={{
                  paddingHorizontal: spacing.md,
                  paddingVertical: 8,
                  borderRadius: radius.full,
                  borderWidth: 1.5,
                  borderColor: selected ? colors.primary : colors.border,
                  backgroundColor: selected ? colors.primary + '14' : 'transparent',
                }}
              >
                <Text
                  variant="caption"
                  style={{ color: selected ? colors.primary : colors.mutedForeground }}
                >
                  {PROPERTY_TYPE_LABEL[t]}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <TextField
        label="Address"
        value={address}
        onChangeText={setAddress}
        editable={!save.isPending}
      />

      <LocationFields
        country={country}
        state={state}
        city={city}
        onCountryChange={setCountry}
        onStateChange={setState}
        onCityChange={setCity}
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
        loading={save.isPending}
        disabled={save.isPending || !name.trim() || !address.trim()}
        onPress={() => save.mutate()}
      />
    </View>
  );
}
