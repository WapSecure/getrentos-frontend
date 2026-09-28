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

interface Props {
  open: boolean;
  onClose: () => void;
  property: LandlordProperty | null;
}

export function EditPropertySheet({ open, onClose, property }: Props) {
  return (
    <Sheet open={open} onClose={onClose} title="Edit property">
      {/* Remount per property so fields never carry across. */}
      {property ? <EditForm key={property.id} property={property} onClose={onClose} /> : null}
    </Sheet>
  );
}

function EditForm({ property, onClose }: { property: LandlordProperty; onClose: () => void }) {
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
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['landlord', 'properties'] });
      toast.show('Property updated.', 'success');
      onClose();
    },
    onError: (e) =>
      toast.show(e instanceof ApiError ? e.message : 'Could not update that property.', 'error'),
  });

  return (
    <View style={{ gap: spacing.lg }}>
      <TextField label="Name" value={name} onChangeText={setName} />

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
                accessibilityRole="button"
                accessibilityState={{ selected }}
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

      <TextField label="Address" value={address} onChangeText={setAddress} />

      <LocationFields
        country={country}
        state={state}
        city={city}
        onCountryChange={setCountry}
        onStateChange={setState}
        onCityChange={setCity}
      />

      <TextField
        label="Description (optional)"
        multiline
        numberOfLines={3}
        value={description}
        onChangeText={setDescription}
      />

      <Button
        label="Save changes"
        loading={save.isPending}
        disabled={!name.trim() || !address.trim()}
        onPress={() => save.mutate()}
      />
    </View>
  );
}
