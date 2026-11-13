import { useState } from 'react';
import { View } from 'react-native';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { Car, Footprints, MapPinned, TrainFront } from '@sureground/icons/native';
import {
  commuteSourceNote,
  NEARBY_PLACES_UNAVAILABLE,
  shownTravelMode,
  walkabilityView,
  type AddressValue,
} from '@sureground/shared';
import { Button, Card, Chip, Skeleton, Text, useTheme } from '@sureground/ui-native';
import { AddressInput } from '@/components/forms/AddressInput';
import { qk } from '@/lib/query/keys';
import {
  geoInsightsApi,
  NEIGHBORHOOD_CATEGORY_LABEL,
  type NeighborhoodCategory,
} from '@/lib/api/geoInsights';

interface Props {
  listingId: string;
}

export function GeoInsightsPanel({ listingId }: Props) {
  const { colors, spacing } = useTheme();
  const [destinationPlace, setDestinationPlace] = useState<AddressValue | null>(null);
  const destinationInput = destinationPlace?.text ?? '';
  const [destination, setDestination] = useState<string | undefined>(undefined);
  const [activeCategory, setActiveCategory] = useState<NeighborhoodCategory | null>(null);

  const query = useQuery({
    queryKey: qk.listings.geoInsights(listingId, destination),
    queryFn: () => geoInsightsApi.get(listingId, destination),
    // Keep the panel while a new destination's commute loads.
    placeholderData: keepPreviousData,
  });

  if (query.isLoading) {
    return (
      <View style={{ gap: spacing.sm }}>
        <Text variant="bodyStrong">Neighbourhood</Text>
        <Skeleton height={140} radius={16} />
      </View>
    );
  }

  const data = query.data;
  if (!data) return null;
  const walking = walkabilityView(data.walkability);
  const driving = shownTravelMode('driving', data.travelTimes?.modes.driving);
  const transit = shownTravelMode('transit', data.travelTimes?.modes.transit);
  const walk = shownTravelMode('walking', data.travelTimes?.modes.walking);

  const categories = (Object.keys(data.neighborhood ?? {}) as NeighborhoodCategory[]).filter(
    (c) => (data.neighborhood?.[c]?.length ?? 0) > 0
  );
  const selectedCategory =
    activeCategory && categories.includes(activeCategory) ? activeCategory : categories[0];
  const places = selectedCategory ? (data.neighborhood?.[selectedCategory]?.slice(0, 4) ?? []) : [];

  return (
    <View style={{ gap: spacing.sm }}>
      <Text variant="bodyStrong">Neighbourhood</Text>

      <Card elevated>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
          <View
            style={{
              width: 48,
              height: 48,
              borderRadius: 24,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: colors.secondary,
            }}
          >
            {walking?.count != null ? (
              <Text variant="bodyStrong">{walking.count}</Text>
            ) : (
              <Footprints size={18} color={colors.mutedForeground} />
            )}
          </View>
          <View style={{ flex: 1, gap: 2 }}>
            <Text variant="callout" style={{ fontWeight: '700' }}>
              {walking?.heading ?? 'Within walking distance'}
            </Text>
            <Text variant="caption" color="mutedForeground">
              {walking?.summary ?? NEARBY_PLACES_UNAVAILABLE}
            </Text>
          </View>
        </View>
      </Card>

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
              {places.map((place, index) => (
                <View
                  key={`${place.name}-${index}`}
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
                      ? `${Math.round(place.distanceMeters)} m`
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
        <View style={{ gap: spacing.sm }}>
          <AddressInput
            kind="any"
            allowManual
            placeholder="e.g. Victoria Island, Lagos"
            hint="Where you travel to, such as work or school."
            value={destinationPlace}
            onChange={(next) => {
              setDestinationPlace(next);
              if (next?.verified) setDestination(next.text.trim() || undefined);
            }}
          />
          <Button
            label="Go"
            size="md"
            fullWidth={false}
            loading={query.isFetching && !!destination}
            disabled={!destinationInput.trim()}
            onPress={() => setDestination(destinationInput.trim() || undefined)}
          />
        </View>

        {data.travelTimes && (driving || transit || walk) ? (
          <View style={{ gap: spacing.xs, marginTop: spacing.md }}>
            <View style={{ flexDirection: 'row', gap: spacing.lg }}>
              {driving ? (
                <CommuteMode
                  icon={<Car size={15} color={colors.foreground} />}
                  text={driving.durationText}
                />
              ) : null}
              {transit ? (
                <CommuteMode
                  icon={<TrainFront size={15} color={colors.foreground} />}
                  text={transit.durationText}
                />
              ) : null}
              {walk ? (
                <CommuteMode
                  icon={<Footprints size={15} color={colors.foreground} />}
                  text={walk.durationText}
                />
              ) : null}
            </View>
            <Text variant="caption" color="mutedForeground">
              {commuteSourceNote(data.travelTimes.source)}
            </Text>
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
