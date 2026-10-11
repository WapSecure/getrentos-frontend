import { useState } from 'react';
import { View } from 'react-native';
import { MapPin } from 'lucide-react-native';
import { Button, Text, useTheme } from '@getrentos/ui-native';
import { PropertyMapView } from '@/components/property/PropertyMapView';
import { geocodeApi, LAGOS_POINT, type MapPoint } from '@/lib/api/geocode';
import { haptics } from '@/lib/haptics';

/**
 * Where the property is, as the owner says: "Find on map" suggests a pin from
 * the typed address, and the owner drags it (or taps the map) onto the right
 * building. Leaving it alone is allowed; the property is then placed from its
 * address, less precisely.
 */
export function LocationPicker({
  address,
  city,
  state,
  value,
  onChange,
}: {
  address: string;
  city: string;
  state: string;
  value: MapPoint | null;
  onChange: (point: MapPoint | null) => void;
}) {
  const { colors, spacing } = useTheme();
  const [recenter, setRecenter] = useState(0);
  const [finding, setFinding] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const canSearch =
    address.trim().length >= 3 && city.trim().length >= 2 && state.trim().length >= 2;

  const find = async () => {
    setFinding(true);
    setNote(null);
    try {
      const result = await geocodeApi.suggest({ address, city, state });
      if (result.found) {
        onChange({ latitude: result.latitude, longitude: result.longitude });
        setNote('Check the pin is on the right building, and drag it if not.');
      } else {
        onChange(value ?? LAGOS_POINT);
        setNote('We couldn’t find that address. Move the pin onto the property.');
      }
      setRecenter((n) => n + 1);
      void haptics.tap();
    } catch {
      setNote('Couldn’t search the map right now. You can still drag the pin.');
      if (!value) {
        onChange(LAGOS_POINT);
        setRecenter((n) => n + 1);
      }
    } finally {
      setFinding(false);
    }
  };

  return (
    <View style={{ gap: spacing.sm }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
        <MapPin size={16} color={colors.primary} />
        <Text variant="bodyStrong" style={{ flex: 1 }}>
          Pin on the map
        </Text>
        {value ? (
          <Button
            label="Remove pin"
            variant="ghost"
            size="sm"
            fullWidth={false}
            onPress={() => {
              onChange(null);
              setNote(null);
            }}
          />
        ) : null}
      </View>
      <Text variant="caption" color="mutedForeground">
        Renters and buyers see this once the property is verified. Placing it yourself is more
        accurate than our guess from the address.
      </Text>
      {value ? (
        <PropertyMapView
          markers={[{ id: 'pin', latitude: value.latitude, longitude: value.longitude }]}
          variant="picker"
          recenter={recenter}
          zoom={17}
          height={240}
          onPinMove={onChange}
        />
      ) : null}
      {note ? (
        <Text variant="caption" color="mutedForeground">
          {note}
        </Text>
      ) : null}
      <Button
        label={value ? 'Find the address again' : 'Find on map'}
        variant="outline"
        size="sm"
        disabled={!canSearch}
        loading={finding}
        accessibilityHint={canSearch ? undefined : 'Enter the address, city and state first'}
        onPress={() => void find()}
      />
    </View>
  );
}
