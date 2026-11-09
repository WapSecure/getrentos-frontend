import { useState } from 'react';
import {
  ScrollView,
  View,
  useWindowDimensions,
  type LayoutChangeEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { Image } from 'expo-image';
import { ImageOff } from 'lucide-react-native';
import { Text, useTheme } from '@sureground/ui-native';

export interface PropertyGalleryProps {
  images: string[];
  height?: number;
  emptyLabel?: string;
}

export function PropertyGallery({
  images,
  height = 260,
  emptyLabel = 'No photos for this listing yet',
}: PropertyGalleryProps) {
  const { colors, spacing } = useTheme();
  const window = useWindowDimensions();
  const [page, setPage] = useState(0);
  // Each photo is exactly the gallery's width: the launch window width is wrong on the web, in split screen and after a rotation.
  const [measured, setMeasured] = useState<number | null>(null);
  const width = measured ?? window.width;

  const onLayout = (e: LayoutChangeEvent) => {
    const next = Math.round(e.nativeEvent.layout.width);
    if (next > 0 && next !== measured) setMeasured(next);
  };

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const next = Math.round(e.nativeEvent.contentOffset.x / width);
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
    <View style={{ height }} onLayout={onLayout}>
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onScroll}
        scrollEventThrottle={16}
        accessibilityLabel={`Property photos, image ${page + 1} of ${images.length}`}
      >
        {images.map((uri, i) => (
          <Image
            key={`${i}-${uri}`}
            source={{ uri }}
            contentFit="cover"
            cachePolicy="memory-disk"
            recyclingKey={uri}
            transition={200}
            accessible={false}
            // On the web build expo-image renders an <img>; alt keeps it from being read as an unnamed image.
            alt={`Photo ${i + 1} of ${images.length}`}
            style={{ width, height }}
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
                backgroundColor: colors.primaryForeground,
                opacity: i === page ? 1 : 0.55,
              }}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
}

export function toGallery(image?: string, images?: string[]): string[] {
  return [...new Set([image, ...(images ?? [])].filter((u): u is string => !!u))];
}
