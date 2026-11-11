import { useState } from 'react';
import {
  Pressable,
  ScrollView,
  View,
  useWindowDimensions,
  type LayoutChangeEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { Image } from 'expo-image';
import { Compass, Play } from '@sureground/icons/native';
import { ListingPlaceholder, Text, useReducedMotion, useTheme } from '@sureground/ui-native';
import {
  MEDIA_ROOM_NAME,
  placeholderOf,
  variantAtLeast,
  type MediaItem,
} from '@sureground/shared/showroom';

// Over a photo the pills keep a fixed dark backing, so they read on any image in either theme.
const PILL = { bg: 'rgba(0,0,0,0.6)', fg: '#fff' };
// A phone-width hero; the 1600px copy is for the full-screen viewer.
const HERO_PX = 960;

/** The API's tiny blurred stand-in, shown until the photo loads; none for photos not yet backfilled. */
const blurSource = (m: MediaItem) => {
  const uri = m.kind === 'image' ? placeholderOf(m.placeholder) : undefined;
  return uri ? { uri } : undefined;
};

/**
 * The phone hero: swipe through the photos with a "3 / 8" counter; a tap opens the viewer there.
 * Video and 360 tour entries appear only when the listing has them.
 */
export function ShowroomHero({
  items,
  height = 300,
  emptyLabel = 'Photos coming soon',
  area,
  onOpen,
}: {
  items: MediaItem[];
  height?: number;
  emptyLabel?: string;
  /** Neighbourhood named on the no-photo placeholder. */
  area?: string | null;
  /** Index into `items`. */
  onOpen: (index: number) => void;
}) {
  const { spacing } = useTheme();
  const reduced = useReducedMotion();
  const window = useWindowDimensions();
  const [page, setPage] = useState(0);
  // Each photo is exactly the hero's width: the launch window width is wrong on the web, in split screen and after a rotation.
  const [measured, setMeasured] = useState<number | null>(null);
  const width = measured ?? window.width;

  const photos = items.map((m, index) => ({ m, index })).filter(({ m }) => m.kind === 'image');
  const videoAt = items.findIndex((m) => m.kind === 'video');
  const tourAt = items.findIndex((m) => m.kind === 'tour');
  const current = photos[Math.min(page, photos.length - 1)]?.m;

  const onLayout = (e: LayoutChangeEvent) => {
    const next = Math.round(e.nativeEvent.layout.width);
    if (next > 0 && next !== measured) setMeasured(next);
  };
  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const next = Math.round(e.nativeEvent.contentOffset.x / width);
    if (next !== page) setPage(next);
  };

  const mediaPills = (
    <>
      {videoAt >= 0 ? (
        <Pill
          label="Video"
          icon={<Play size={13} color={PILL.fg} />}
          onPress={() => onOpen(videoAt)}
          a11y="Play the video tour"
        />
      ) : null}
      {tourAt >= 0 ? (
        <Pill
          label="360 tour"
          icon={<Compass size={13} color={PILL.fg} />}
          onPress={() => onOpen(tourAt)}
          a11y="Open the 360 tour"
        />
      ) : null}
    </>
  );

  if (photos.length === 0) {
    // Shorter than a real hero: an empty state should not take half the screen.
    return (
      <View style={{ height: Math.min(height, 220) }}>
        <ListingPlaceholder size="hero" area={area} caption={emptyLabel} topInset={spacing.lg} />
        {videoAt >= 0 || tourAt >= 0 ? (
          <View
            style={{
              position: 'absolute',
              right: spacing.md,
              bottom: spacing.md,
              flexDirection: 'row',
              gap: 6,
            }}
          >
            {mediaPills}
          </View>
        ) : null}
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
        accessibilityLabel={`Property photos, photo ${page + 1} of ${photos.length}`}
      >
        {photos.map(({ m, index }, i) => (
          <Pressable
            key={m.id}
            onPress={() => onOpen(index)}
            accessibilityRole="imagebutton"
            accessibilityLabel={`${m.alt ?? `Photo ${i + 1}`}. Open all photos`}
          >
            <Image
              source={{ uri: variantAtLeast(m.url, m.variants, HERO_PX) }}
              contentFit="cover"
              cachePolicy="memory-disk"
              recyclingKey={m.id}
              placeholder={blurSource(m)}
              placeholderContentFit="cover"
              transition={reduced ? 0 : 200}
              accessible={false}
              alt={m.alt ?? `Photo ${i + 1} of ${photos.length}`}
              // Only the first photo loads at once; the rest wait until they are near.
              priority={i === 0 ? 'high' : 'normal'}
              style={{ width, height }}
            />
          </Pressable>
        ))}
      </ScrollView>

      <View
        pointerEvents="box-none"
        style={{
          position: 'absolute',
          left: spacing.md,
          right: spacing.md,
          bottom: spacing.md,
          flexDirection: 'row',
          alignItems: 'flex-end',
          gap: 6,
        }}
      >
        <View style={{ flex: 1, alignItems: 'flex-start' }} pointerEvents="none">
          {current?.room ? <Pill label={MEDIA_ROOM_NAME[current.room]} /> : null}
        </View>
        {mediaPills}
        <Pill
          label={`${Math.min(page, photos.length - 1) + 1} / ${photos.length}`}
          onPress={() => onOpen(photos[Math.min(page, photos.length - 1)]!.index)}
          a11y={`Show all ${photos.length} photos`}
          tabular
        />
      </View>
    </View>
  );
}

function Pill({
  label,
  icon,
  onPress,
  a11y,
  tabular,
}: {
  label: string;
  icon?: React.ReactNode;
  onPress?: () => void;
  a11y?: string;
  tabular?: boolean;
}) {
  const { radius } = useTheme();
  const body = (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: radius.full,
        backgroundColor: PILL.bg,
      }}
    >
      {icon}
      <Text
        variant="label"
        style={{ color: PILL.fg, fontVariant: tabular ? ['tabular-nums'] : undefined }}
      >
        {label}
      </Text>
    </View>
  );
  if (!onPress) return body;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={a11y ?? label}
      // The pill is small to keep the photo clear; the touch target is not.
      hitSlop={12}
    >
      {body}
    </Pressable>
  );
}
