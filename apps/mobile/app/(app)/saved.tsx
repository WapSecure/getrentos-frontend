import { Pressable, RefreshControl, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FlashList } from '@shopify/flash-list';
import { ChevronLeft, Heart } from 'lucide-react-native';
import { EmptyState, PropertyCard, Skeleton, Text, useTheme } from '@getrentos/ui-native';
import { useSavedListings } from '@/hooks/useSavedListings';
import type { SavedProperty } from '@/lib/api/properties';

export default function Saved() {
  const { colors, spacing } = useTheme();
  const insets = useSafeAreaInsets();
  const { items, isLoading, isError, refetch, toggle } = useSavedListings();

  return (
    <View style={{ flex: 1, backgroundColor: colors.background, paddingTop: insets.top }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.sm,
          paddingHorizontal: spacing.xl,
          paddingVertical: spacing.md,
        }}
      >
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Back"
          hitSlop={10}
        >
          <ChevronLeft size={24} color={colors.foreground} />
        </Pressable>
        <Text variant="title">Saved homes</Text>
      </View>

      {isLoading ? (
        <View style={{ paddingHorizontal: spacing.xl, gap: spacing.md }}>
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} height={116} radius={16} />
          ))}
        </View>
      ) : isError ? (
        <EmptyState
          icon={<Heart size={34} color={colors.mutedForeground} />}
          title="Couldn't load your saved homes"
          description="Pull down to try again."
        />
      ) : items.length === 0 ? (
        <EmptyState
          icon={<Heart size={34} color={colors.mutedForeground} />}
          title="Nothing saved yet"
          description="Tap the heart on any listing to keep it here for later."
        />
      ) : (
        <FlashList
          data={items}
          keyExtractor={(item) => item.id}
          renderItem={({ item }: { item: SavedProperty }) => (
            <View style={{ paddingHorizontal: spacing.xl, paddingBottom: spacing.md }}>
              <PropertyCard
                property={item}
                layout="row"
                saved
                onToggleSave={toggle}
                onPress={(id) => router.push(`/(app)/property/${id}`)}
              />
            </View>
          )}
          contentContainerStyle={{
            paddingTop: spacing.sm,
            paddingBottom: insets.bottom + spacing['3xl'],
          }}
          refreshControl={
            <RefreshControl
              refreshing={false}
              onRefresh={refetch}
              tintColor={colors.mutedForeground}
            />
          }
        />
      )}
    </View>
  );
}
