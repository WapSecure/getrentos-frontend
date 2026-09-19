import { useState } from 'react';
import {
  Dimensions,
  ScrollView,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { Image } from 'expo-image';
import { ImageOff } from 'lucide-react-native';
import { Text, useTheme } from '@getrentos/ui-native';

export interface PropertyGalleryProps {
  images: string[];
  height?: number;
  /** Message shown when the listing has no photos. */
  emptyLabel?: string;
}

const SCREEN_WIDTH = Dimensions.get('window').width;

/** Swipeable photo gallery with page dots, falling back to a labelled placeholder. */
export function PropertyGallery({
  images,
  height = 260,
  emptyLabel = 'No photos for this listing yet',
}: PropertyGalleryProps) {
  const { colors, spacing } = useTheme();
  const [page, setPage] = useState(0);

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const next = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    if (next !== page) setPage(next);
  };

  if (images.length === 0) {
    return (
      <View
        style={{
          height,
          backgroundColor: colors.secondary,
          alignItems: 'center',
          justifyContent: 'center',
          gap: spacing.xs,
        }}
      >
        <ImageOff size={26} color={colors.mutedForeground} />
        <Text variant="caption" color="mutedForeground">
          {emptyLabel}
        </Text>
      </View>
    );
  }

  return (
    <View style={{ height }}>
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onScroll}
        scrollEventThrottle={16}
      >
        {images.map((uri, i) => (
          <Image
            key={`${i}-${uri}`}
            source={{ uri }}
            contentFit="cover"
            transition={200}
            style={{ width: SCREEN_WIDTH, height }}
          />
        ))}
      </ScrollView>

      {images.length > 1 ? (
        <View
          style={{
            position: 'absolute',
            bottom: spacing.md,
            left: 0,
            right: 0,
            flexDirection: 'row',
            justifyContent: 'center',
            gap: 6,
          }}
        >
          {images.map((uri, i) => (
            <View
              key={`dot-${i}-${uri}`}
              style={{
                width: i === page ? 18 : 6,
                height: 6,
                borderRadius: 3,
                backgroundColor: i === page ? '#fff' : 'rgba(255,255,255,0.55)',
              }}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
}

/** Cover first, then the gallery, with duplicates collapsed. */
export function toGallery(image?: string, images?: string[]): string[] {
  return [...new Set([image, ...(images ?? [])].filter((u): u is string => !!u))];
}
