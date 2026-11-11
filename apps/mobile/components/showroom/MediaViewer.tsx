import { useEffect, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  Modal,
  PixelRatio,
  Platform,
  Pressable,
  ScrollView,
  View,
  useWindowDimensions,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { Compass, ImageOff, Play, X } from '@sureground/icons/native';
import { Button, Chip, Text, useReducedMotion } from '@sureground/ui-native';
import {
  MEDIA_ROOM_LABEL,
  MEDIA_ROOM_NAME,
  placeholderOf,
  variantAtLeast,
  type MediaItem,
  type MediaRoom,
} from '@sureground/shared/showroom';
import { EmbedFrame } from '@/components/video/EmbedFrame';
import { VideoTourPlayer } from '@/components/video/VideoTourPlayer';

/** The same events as the web viewer (packages/ui MediaViewer). */
export interface MediaEvent {
  type: 'gallery_open' | 'media_category_select' | 'video_start' | 'video_complete' | 'tour_start';
  mediaIndex?: number;
  room?: MediaRoom;
}

// Fixed on purpose: a photo viewer is dark in both themes, like the video sheet.
const INK = {
  bg: '#000',
  fg: '#fff',
  dim: 'rgba(255,255,255,0.72)',
  tile: 'rgba(255,255,255,0.12)',
};
const MAX_ZOOM = 4;
const THUMB = 56;
const THUMB_GAP = 6;
const THUMB_PAD = 16;

const ThumbGap = () => <View style={{ width: THUMB_GAP }} />;

const kindLabel = (m: MediaItem) =>
  m.kind === 'video' ? 'Video tour' : m.kind === 'tour' ? '360 tour' : 'Photo';

export function MediaViewer({
  items,
  open,
  startIndex = 0,
  title,
  onClose,
  onMediaEvent,
  onVideoExpired,
}: {
  items: MediaItem[];
  open: boolean;
  startIndex?: number;
  title: string;
  onClose: () => void;
  /** For measurement; the viewer itself never sends anything. */
  onMediaEvent?: (event: MediaEvent) => void;
  /** A signed video link has lapsed: the caller fetches the listing again. */
  onVideoExpired?: () => void;
}) {
  return (
    <Modal
      visible={open && items.length > 0}
      onRequestClose={onClose}
      animationType="fade"
      presentationStyle="fullScreen"
      statusBarTranslucent
      supportedOrientations={['portrait', 'landscape']}
    >
      {open && items.length > 0 ? (
        <ViewerBody
          items={items}
          startIndex={Math.min(Math.max(0, startIndex), items.length - 1)}
          title={title}
          onClose={onClose}
          onMediaEvent={onMediaEvent}
          onVideoExpired={onVideoExpired}
        />
      ) : null}
    </Modal>
  );
}

function ViewerBody({
  items,
  startIndex,
  title,
  onClose,
  onMediaEvent,
  onVideoExpired,
}: {
  items: MediaItem[];
  startIndex: number;
  title: string;
  onClose: () => void;
  onMediaEvent?: (event: MediaEvent) => void;
  onVideoExpired?: () => void;
}) {
  const insets = useSafeAreaInsets();
  const screen = useWindowDimensions();
  // The stage is measured, not assumed: a page sized from the window (or left to flex) can
  // collapse to zero height inside a horizontal list on the web, and is wrong in split screen.
  const [stage, setStage] = useState<{ width: number; height: number } | null>(null);
  const width = stage?.width ?? screen.width;
  const reduced = useReducedMotion();
  const [index, setIndex] = useState(startIndex);
  const [zoomed, setZoomed] = useState(false);
  const [active, setActive] = useState<string | null>(null);
  const pager = useRef<FlatList<MediaItem>>(null);
  const thumbs = useRef<FlatList<MediaItem>>(null);
  const item = items[index]!;
  // Big enough for the screen's real pixels; the API's largest copy is 1600px.
  const pixelWidth = PixelRatio.getPixelSizeForLayoutSize(width);

  // Fetch the photos either side of the current one at the size the pager will ask for, so a
  // swipe shows the next photo at once instead of a blank stage while it downloads.
  useEffect(() => {
    const near = [items[index - 1], items[index + 1], items[index + 2]]
      .filter((m): m is MediaItem => !!m && m.kind === 'image')
      .map((m) => variantAtLeast(m.url, m.variants, pixelWidth));
    if (near.length) void Image.prefetch(near, 'memory-disk').catch(() => undefined);
  }, [index, items, pixelWidth]);

  const rooms = useMemo(() => {
    const seen = new Map<MediaRoom, number>();
    items.forEach((m, i) => {
      if (m.room && !seen.has(m.room)) seen.set(m.room, i);
    });
    return [...seen.entries()];
  }, [items]);

  // Photos are counted on their own, as on the hero; a video or tour page is named instead.
  const photoCount = items.filter((m) => m.kind === 'image').length;
  const photoNumber = items.slice(0, index + 1).filter((m) => m.kind === 'image').length;
  const position = item.kind === 'image' ? `${photoNumber} / ${photoCount}` : kindLabel(item);

  // The active thumbnail sits in the middle of the strip, or at its padded start.
  useEffect(() => {
    if (items.length < 2) return;
    const centre = THUMB_PAD + index * (THUMB + THUMB_GAP) + THUMB / 2;
    thumbs.current?.scrollToOffset({
      offset: Math.max(0, centre - width / 2),
      animated: !reduced,
    });
  }, [index, items.length, reduced, width]);

  const go = (next: number) => {
    const to = Math.min(Math.max(0, next), items.length - 1);
    setIndex(to);
    setActive(null);
    setZoomed(false);
    pager.current?.scrollToOffset({ offset: to * width, animated: !reduced });
  };

  // Expo web: the arrow keys page through, as in the web viewer. Re-bound each render, so it sees the current page.
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') go(index + 1);
      else if (e.key === 'ArrowLeft') go(index - 1);
    };
    globalThis.addEventListener?.('keydown', onKey);
    return () => globalThis.removeEventListener?.('keydown', onKey);
  });

  const onPage = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const next = Math.round(e.nativeEvent.contentOffset.x / width);
    if (next !== index && next >= 0 && next < items.length) {
      setIndex(next);
      setActive(null);
    }
  };

  // The room shown is the current photo's, or the last tagged room before it.
  const currentRoom =
    item.room ?? [...items.slice(0, index + 1)].reverse().find((m) => m.room)?.room;

  return (
    <View style={{ flex: 1, backgroundColor: INK.bg }}>
      <View
        style={{
          paddingTop: insets.top + 4,
          paddingHorizontal: 8,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <Pressable
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Close photos"
          hitSlop={8}
          style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}
        >
          <X size={24} color={INK.fg} />
        </Pressable>
        <Text
          variant="callout"
          numberOfLines={1}
          style={{ flex: 1, color: INK.dim }}
          importantForAccessibility="no"
        >
          {title}
        </Text>
        <Text
          variant="callout"
          accessibilityLiveRegion="polite"
          accessibilityLabel={
            item.kind === 'image' ? `Photo ${photoNumber} of ${photoCount}` : kindLabel(item)
          }
          style={{ color: INK.fg, fontVariant: ['tabular-nums'], paddingHorizontal: 8 }}
        >
          {position}
        </Text>
      </View>

      {rooms.length > 1 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          // A ScrollView grows by default; this one is only as tall as its chips.
          style={{ flexGrow: 0, flexShrink: 0 }}
          contentContainerStyle={{ gap: 8, paddingHorizontal: 16, paddingVertical: 8 }}
          accessibilityLabel="Rooms"
        >
          {rooms.map(([room, at]) => (
            <Chip
              key={room}
              size="sm"
              label={MEDIA_ROOM_LABEL[room]}
              selected={currentRoom === room}
              onPress={() => {
                onMediaEvent?.({ type: 'media_category_select', room, mediaIndex: at });
                go(at);
              }}
            />
          ))}
        </ScrollView>
      ) : null}

      <View
        style={{ flex: 1, minHeight: 0 }}
        onLayout={(e) => {
          const { width: w, height: h } = e.nativeEvent.layout;
          const next = { width: Math.round(w), height: Math.round(h) };
          if (
            next.width > 0 &&
            next.height > 0 &&
            (next.width !== stage?.width || next.height !== stage?.height)
          ) {
            setStage(next);
          }
        }}
      >
        {stage ? (
          <FlatList
            ref={pager}
            data={items}
            keyExtractor={(m) => m.id}
            horizontal
            pagingEnabled
            scrollEnabled={!zoomed}
            showsHorizontalScrollIndicator={false}
            initialScrollIndex={index}
            // Keeps the starting page when the stage is resized (rotation, split screen).
            key={`${stage!.width}x${stage!.height}`}
            getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
            onMomentumScrollEnd={onPage}
            // Neighbours only: a 40-photo listing must not decode 40 full-size images at once.
            initialNumToRender={1}
            windowSize={3}
            maxToRenderPerBatch={2}
            style={{ width: stage!.width, height: stage!.height }}
            renderItem={({ item: m, index: i }) => (
              <View
                style={{ width: stage!.width, height: stage!.height, justifyContent: 'center' }}
              >
                {m.kind === 'image' ? (
                  <ZoomableImage
                    uri={variantAtLeast(m.url, m.variants, pixelWidth)}
                    placeholder={placeholderOf(m.placeholder)}
                    alt={m.alt ?? `Photo ${i + 1}`}
                    reduced={reduced}
                    current={i === index}
                    zoomed={i === index && zoomed}
                    onZoomChange={setZoomed}
                  />
                ) : m.kind === 'video' ? (
                  active === m.id ? (
                    <VideoTourPlayer
                      url={m.url}
                      title={title}
                      onExpired={onVideoExpired}
                      onEnded={() => onMediaEvent?.({ type: 'video_complete', mediaIndex: i })}
                    />
                  ) : (
                    <StartCard
                      label="Play the video tour"
                      icon={<Play size={28} color={INK.fg} />}
                      posterUrl={m.posterUrl}
                      onStart={() => {
                        onMediaEvent?.({ type: 'video_start', mediaIndex: i });
                        setActive(m.id);
                      }}
                    />
                  )
                ) : active === m.id ? (
                  <EmbedFrame url={m.url} title={`${title} 360 tour`} fill />
                ) : (
                  <StartCard
                    label="Start the 360 tour"
                    detail={m.tourHost ? `Opens the tour from ${m.tourHost}` : undefined}
                    icon={<Compass size={28} color={INK.fg} />}
                    onStart={() => {
                      onMediaEvent?.({ type: 'tour_start', mediaIndex: i });
                      setActive(m.id);
                    }}
                  />
                )}
              </View>
            )}
          />
        ) : null}
      </View>

      <View style={{ paddingBottom: insets.bottom + 8, gap: 8 }}>
        {item.room || item.caption ? (
          <View style={{ paddingHorizontal: 16, gap: 2 }}>
            {item.room ? (
              <Text variant="bodyStrong" style={{ color: INK.fg }}>
                {MEDIA_ROOM_NAME[item.room]}
              </Text>
            ) : null}
            {item.caption ? (
              <Text variant="callout" style={{ color: INK.dim }} numberOfLines={3}>
                {item.caption}
              </Text>
            ) : null}
          </View>
        ) : null}

        {items.length > 1 ? (
          <FlatList
            ref={thumbs}
            data={items}
            keyExtractor={(m) => `thumb-${m.id}`}
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ flexGrow: 0, flexShrink: 0 }}
            contentContainerStyle={{ paddingHorizontal: THUMB_PAD }}
            ItemSeparatorComponent={ThumbGap}
            renderItem={({ item: m, index: i }) => (
              <Pressable
                onPress={() => go(i)}
                accessibilityRole="button"
                accessibilityLabel={
                  m.kind === 'image'
                    ? `Show photo ${items.slice(0, i + 1).filter((x) => x.kind === 'image').length}`
                    : `Show the ${kindLabel(m).toLowerCase()}`
                }
                accessibilityState={{ selected: i === index }}
                style={{
                  width: THUMB,
                  height: THUMB,
                  borderRadius: 8,
                  overflow: 'hidden',
                  borderWidth: 2,
                  borderColor: i === index ? INK.fg : 'transparent',
                  opacity: i === index ? 1 : 0.6,
                  backgroundColor: INK.tile,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {m.kind === 'image' || m.posterUrl ? (
                  <Image
                    source={{
                      uri:
                        m.kind === 'image' ? variantAtLeast(m.url, m.variants, 320) : m.posterUrl,
                    }}
                    contentFit="cover"
                    cachePolicy="memory-disk"
                    recyclingKey={m.id}
                    placeholder={thumbPlaceholder(m)}
                    placeholderContentFit="cover"
                    accessible={false}
                    style={{ width: '100%', height: '100%' }}
                  />
                ) : null}
                {m.kind !== 'image' ? (
                  <View style={{ position: 'absolute' }}>
                    {m.kind === 'video' ? (
                      <Play size={20} color={INK.fg} />
                    ) : (
                      <Compass size={20} color={INK.fg} />
                    )}
                  </View>
                ) : null}
              </Pressable>
            )}
          />
        ) : null}
      </View>
    </View>
  );
}

function StartCard({
  label,
  detail,
  icon,
  posterUrl,
  onStart,
}: {
  label: string;
  detail?: string;
  icon: React.ReactNode;
  posterUrl?: string;
  onStart: () => void;
}) {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 }}>
      {posterUrl ? (
        <Image
          source={{ uri: posterUrl }}
          contentFit="contain"
          accessible={false}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0.55 }}
        />
      ) : null}
      <View
        style={{
          width: 64,
          height: 64,
          borderRadius: 32,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: INK.tile,
        }}
      >
        {icon}
      </View>
      <Button label={label} fullWidth={false} onPress={onStart} />
      {detail ? (
        <Text variant="caption" style={{ color: INK.dim }}>
          {detail}
        </Text>
      ) : null}
    </View>
  );
}

/** Pinch or double-tap to zoom; drag to look around once zoomed. The pager stops swiping while zoomed. */
const thumbPlaceholder = (m: MediaItem) => {
  const uri = m.kind === 'image' ? placeholderOf(m.placeholder) : undefined;
  return uri ? { uri } : undefined;
};

function ZoomableImage({
  uri,
  placeholder,
  alt,
  reduced,
  current,
  zoomed,
  onZoomChange,
}: {
  uri: string;
  /** A tiny blurred `data:` URI shown until the photo loads. */
  placeholder?: string;
  alt: string;
  reduced: boolean;
  current: boolean;
  /** Owned by the viewer, which also locks the pager while it is true. */
  zoomed: boolean;
  onZoomChange: (zoomed: boolean) => void;
}) {
  const [failed, setFailed] = useState(false);
  const scale = useSharedValue(1);
  const startScale = useSharedValue(1);
  const x = useSharedValue(0);
  const y = useSharedValue(0);
  const startX = useSharedValue(0);
  const startY = useSharedValue(0);

  // A page left behind drops its zoom, so coming back shows the whole photo.
  useEffect(() => {
    if (current) return;
    scale.set(1);
    x.set(0);
    y.set(0);
  }, [current, scale, x, y]);

  const settle = (to: number) => {
    'worklet';
    const animate = (v: number) => (reduced ? v : withTiming(v, { duration: 180 }));
    scale.set(animate(to));
    if (to === 1) {
      x.set(animate(0));
      y.set(animate(0));
    }
    scheduleOnRN(onZoomChange, to > 1);
  };

  const pinch = Gesture.Pinch()
    .onStart(() => {
      startScale.set(scale.get());
    })
    .onUpdate((e) => {
      scale.set(Math.min(MAX_ZOOM, Math.max(1, startScale.get() * e.scale)));
    })
    .onEnd(() => {
      settle(scale.get() < 1.05 ? 1 : scale.get());
    });

  const pan = Gesture.Pan()
    .enabled(zoomed)
    .onStart(() => {
      startX.set(x.get());
      startY.set(y.get());
    })
    .onUpdate((e) => {
      x.set(startX.get() + e.translationX);
      y.set(startY.get() + e.translationY);
    });

  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      settle(scale.get() > 1 ? 1 : 2.5);
    });

  const style = useAnimatedStyle(() => ({
    transform: [{ translateX: x.get() }, { translateY: y.get() }, { scale: scale.get() }],
  }));

  if (failed) {
    return (
      <View style={{ alignItems: 'center', gap: 8 }}>
        <ImageOff size={28} color={INK.dim} />
        <Text variant="callout" style={{ color: INK.dim }}>
          This photo couldn’t load.
        </Text>
      </View>
    );
  }

  return (
    <GestureDetector gesture={Gesture.Simultaneous(pinch, pan, doubleTap)}>
      <Animated.View
        style={[{ flex: 1 }, style]}
        accessible
        accessibilityRole="image"
        accessibilityLabel={alt}
        accessibilityHint="Pinch or double tap to zoom"
      >
        <Image
          source={{ uri }}
          contentFit="contain"
          cachePolicy="memory-disk"
          recyclingKey={uri}
          placeholder={placeholder ? { uri: placeholder } : undefined}
          placeholderContentFit="contain"
          transition={reduced ? 0 : 150}
          onError={() => setFailed(true)}
          alt={alt}
          accessible={false}
          style={{ width: '100%', height: '100%' }}
        />
      </Animated.View>
    </GestureDetector>
  );
}
