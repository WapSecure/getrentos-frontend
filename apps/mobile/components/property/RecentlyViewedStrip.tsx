import { Pressable, ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { Image } from 'expo-image';
import { useQuery } from '@tanstack/react-query';
import { Text, useTheme } from '@getrentos/ui-native';
import { qk } from '@/lib/query/keys';
import { recentlyViewedApi } from '@/lib/api/recentlyViewed';
import { formatNaira } from '@/lib/format';

export function RecentlyViewedStrip() {
  const { colors, spacing, radius } = useTheme();
  const query = useQuery({ queryKey: qk.renter.recentlyViewed, queryFn: recentlyViewedApi.list });

  if (!query.data?.length) return null;

  return (
    <View style={{ gap: spacing.sm }}>
      <Text variant="bodyStrong">Recently viewed</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: spacing.sm }}
      >
        {query.data.map((p) => (
          <Pressable
            key={p.id}
            onPress={() => router.push(`/(app)/property/${p.id}`)}
            style={{ width: 120 }}
          >
            <View
              style={{
                height: 80,
                borderRadius: radius.md,
                overflow: 'hidden',
                backgroundColor: colors.secondary,
              }}
            >
              {p.image ? (
                <Image source={{ uri: p.image }} contentFit="cover" style={{ flex: 1 }} />
              ) : null}
            </View>
            <Text variant="caption" numberOfLines={1} style={{ marginTop: 4, fontWeight: '600' }}>
              {p.title}
            </Text>
            <Text variant="caption" color="mutedForeground" numberOfLines={1}>
              {formatNaira(p.price, { compact: true })}/mo
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}
