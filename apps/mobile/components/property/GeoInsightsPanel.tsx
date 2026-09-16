import { useState } from 'react';
import { View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Car, Footprints, MapPinned, TrainFront } from 'lucide-react-native';
import { Button, Card, Chip, Skeleton, Text, TextField, useTheme } from '@getrentos/ui-native';
import { qk } from '@/lib/query/keys';
import {
  geoInsightsApi,
  NEIGHBORHOOD_CATEGORY_LABEL,
  type NeighborhoodCategory,
} from '@/lib/api/geoInsights';

const WALKABILITY_TEXT_COLOR: Record<string, 'success' | 'warning' | 'destructive'> = {
  'Very walkable': 'success',
  Walkable: 'success',
  'Somewhat walkable': 'warning',
  'Car-dependent': 'destructive',
};

interface Props {
  listingId: string;
}

export function GeoInsightsPanel({ listingId }: Props) {
  const { colors, spacing } = useTheme();
  const [destinationInput, setDestinationInput] = useState('');
  const [destination, setDestination] = useState<string | undefined>(undefined);
  const [activeCategory, setActiveCategory] = useState<NeighborhoodCategory | null>(null);

  const query = useQuery({
    queryKey: qk.listings.geoInsights(listingId, destination),
    queryFn: () => geoInsightsApi.get(listingId, destination),
  });

  if (query.isLoading) {
    return (
      <View style={{ gap: spacing.sm }}>
        <Text variant="bodyStrong">Neighborhood</Text>
        <Skeleton height={140} radius={16} />
      </View>
    );
  }

  const data = query.data;
  if (!data || (!data.walkability && !data.neighborhood)) return null;

  const categories = (Object.keys(data.neighborhood ?? {}) as NeighborhoodCategory[]).filter(
    (c) => (data.neighborhood?.[c]?.length ?? 0) > 0
  );
  const selectedCategory =
    activeCategory && categories.includes(activeCategory) ? activeCategory : categories[0];
  const places = selectedCategory ? (data.neighborhood?.[selectedCategory]?.slice(0, 4) ?? []) : [];

  return (
    <View style={{ gap: spacing.sm }}>
      <Text variant="bodyStrong">Neighborhood</Text>

      {data.walkability ? (
        <Card elevated>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
            <View
              style={{
                width: 48,
                height: 48,
                borderRadius: 24,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor:
                  data.walkability.label === 'Car-dependent'
                    ? colors.secondary
                    : colors[
                        `${WALKABILITY_TEXT_COLOR[data.walkability.label]}Subtle` as
                          | 'successSubtle'
                          | 'warningSubtle'
                      ],
              }}
            >
              <Text variant="bodyStrong" color={WALKABILITY_TEXT_COLOR[data.walkability.label]}>
                {data.walkability.score}
              </Text>
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <Text variant="callout" style={{ fontWeight: '700' }}>
                {data.walkability.label}
              </Text>
              <Text variant="caption" color="mutedForeground">
                {data.walkability.summary}
              </Text>
            </View>
          </View>
        </Card>
      ) : null}

      {categories.length > 0 ? (
        <Card elevated padding="none">
          <View style={{ padding: spacing.md, gap: spacing.sm }}>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs }}>
              {categories.map((c) => (
                <Chip
                  key={c}
                  label={NEIGHBORHOOD_CATEGORY_LABEL[c]}
                  size="sm"
                  selected={c === selectedCategory}
                  onPress={() => setActiveCategory(c)}
                />
              ))}
            </View>
            <View style={{ gap: spacing.sm }}>
              {places.map((place) => (
                <View
                  key={place.name}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    gap: spacing.sm,
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <Text variant="callout" numberOfLines={1}>
                      {place.name}
                    </Text>
                    {place.rating ? (
                      <Text variant="caption" color="mutedForeground">
                        {place.rating.toFixed(1)} ★
                        {place.userRatingsTotal ? ` (${place.userRatingsTotal})` : ''}
                      </Text>
                    ) : null}
                  </View>
                  <Text variant="caption" color="mutedForeground">
                    {place.distanceMeters < 1000
                      ? `${place.distanceMeters} m`
                      : `${(place.distanceMeters / 1000).toFixed(1)} km`}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </Card>
      ) : null}

      <Card elevated>
        <Text variant="bodyStrong" style={{ marginBottom: spacing.sm }}>
          Commute time
        </Text>
        <View style={{ flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-end' }}>
          <View style={{ flex: 1 }}>
            <TextField
              placeholder="e.g. Victoria Island, Lagos"
              value={destinationInput}
              onChangeText={setDestinationInput}
              returnKeyType="done"
              onSubmitEditing={() => setDestination(destinationInput.trim() || undefined)}
            />
          </View>
          <Button
            label="Go"
            size="md"
            loading={query.isFetching && !!destination}
            disabled={!destinationInput.trim()}
            onPress={() => setDestination(destinationInput.trim() || undefined)}
          />
        </View>

        {data.travelTimes ? (
          <View style={{ flexDirection: 'row', gap: spacing.lg, marginTop: spacing.md }}>
            {data.travelTimes.modes.driving ? (
              <CommuteMode
                icon={<Car size={15} color={colors.foreground} />}
                text={data.travelTimes.modes.driving.durationText}
              />
            ) : null}
            {data.travelTimes.modes.transit ? (
              <CommuteMode
                icon={<TrainFront size={15} color={colors.foreground} />}
                text={data.travelTimes.modes.transit.durationText}
              />
            ) : null}
            {data.travelTimes.modes.walking ? (
              <CommuteMode
                icon={<Footprints size={15} color={colors.foreground} />}
                text={data.travelTimes.modes.walking.durationText}
              />
            ) : null}
          </View>
        ) : destination ? (
          <View
            style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: spacing.md }}
          >
            <MapPinned size={13} color={colors.mutedForeground} />
            <Text variant="caption" color="mutedForeground">
              Couldn&apos;t find travel times for that destination.
            </Text>
          </View>
        ) : null}
      </Card>
    </View>
  );
}

function CommuteMode({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
      {icon}
      <Text variant="callout">{text}</Text>
    </View>
  );
}
