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
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { ChevronLeft, ChevronRight, Compass, ImageOff, Play, X } from '@sureground/icons/native';
import { Button, Chip, Text, useReducedMotion, useTheme } from '@sureground/ui-native';
import {
  FLOOR_PLAN_MEASUREMENT_LABEL,
  floorPlanFor,
  floorPlanLevels,
  isFloorPlan,
  MEDIA_ROOM_LABEL,
  MEDIA_ROOM_NAME,
  placeholderOf,
  roomSizeLabel,
  variantAtLeast,
  type MediaItem,
  type MediaRoom,
  type ShowroomFloorPlan,
} from '@sureground/shared/showroom';
import { EmbedFrame } from '@/components/video/EmbedFrame';
import { VideoTourPlayer } from '@/components/video/VideoTourPlayer';
import {
  containedRect,
  markerLabel,
  numberedMarkers,
  pointInRect,
  type Size,
} from '@/lib/floorPlanMarkers';

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
  // Floor plans are line drawings: they read on a light page, shown whole.
  paper: '#fff',
};
const MAX_ZOOM = 4;
/** A room marker: a 44pt hit area around a 28pt numbered dot. */
const MARKER_HIT = 44;
const MARKER_DOT = 28;
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
  floorPlans,
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
  /** Structured floor plans from `floorPlansOf`: a plan page then lists its rooms and sizes. */
  floorPlans?: ShowroomFloorPlan[];
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
          floorPlans={floorPlans}
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
  floorPlans,
}: {
  items: MediaItem[];
  startIndex: number;
  title: string;
  onClose: () => void;
  onMediaEvent?: (event: MediaEvent) => void;
  onVideoExpired?: () => void;
  floorPlans?: ShowroomFloorPlan[];
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

  // Floor plans are a tab of their own, one level per plan, named by the lister's caption.
  const levels = useMemo(() => floorPlanLevels(items), [items]);
  const levelAt = levels.findIndex((l) => l.index === index);
  const onPlan = levelAt >= 0;
  // The lister's rooms and sizes for this level, when they added them; every size keeps its label.
  const plan = onPlan ? floorPlanFor(floorPlans, item.id) : undefined;

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

  // The plan's numbered rooms, as in the room list; one with a linked photo opens it, as its row does.
  const planMarkers = (p: ShowroomFloorPlan | undefined): PlanMarker[] | undefined => {
    if (!p) return undefined;
    const marks = numberedMarkers(p.rooms).map(({ room, number }) => {
      const at = room.photoMediaId ? items.findIndex((m) => m.id === room.photoMediaId) : -1;
      return {
        id: room.id,
        number,
        x: room.x,
        y: room.y,
        label: markerLabel(number, room.name, at >= 0),
        onPress: at >= 0 ? () => go(at) : undefined,
      };
    });
    return marks.length ? marks : undefined;
  };

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

      {rooms.length > 1 || levels.length > 0 ? (
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

      {onPlan && levels.length > 1 ? (
        <View
          style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 4 }}
          accessibilityLabel="Floor plan levels"
        >
          <LevelArrow
            label="Previous level"
            disabled={levelAt === 0}
            onPress={() => go(levels[levelAt - 1]!.index)}
          >
            <ChevronLeft size={22} color={INK.fg} />
          </LevelArrow>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ flex: 1, flexGrow: 1 }}
            contentContainerStyle={{ gap: 8, paddingVertical: 4 }}
          >
            {levels.map((level, i) => (
              <Chip
                key={level.index}
                size="sm"
                label={level.label}
                selected={i === levelAt}
                onPress={() => go(level.index)}
              />
            ))}
          </ScrollView>
          <LevelArrow
            label="Next level"
            disabled={levelAt === levels.length - 1}
            onPress={() => go(levels[levelAt + 1]!.index)}
          >
            <ChevronRight size={22} color={INK.fg} />
          </LevelArrow>
        </View>
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
                style={{
                  width: stage!.width,
                  height: stage!.height,
                  justifyContent: 'center',
                  backgroundColor: isFloorPlan(m) ? INK.paper : undefined,
                }}
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
                    natural={m.width && m.height ? { width: m.width, height: m.height } : undefined}
                    markers={planMarkers(
                      isFloorPlan(m) ? floorPlanFor(floorPlans, m.id) : undefined
                    )}
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
            {onPlan ? (
              // The level name is the lister's caption as written: a plan claims no sizes.
              <Text variant="bodyStrong" style={{ color: INK.fg }}>
                {levels[levelAt]!.label}
              </Text>
            ) : item.room ? (
              <Text variant="bodyStrong" style={{ color: INK.fg }}>
                {MEDIA_ROOM_NAME[item.room]}
              </Text>
            ) : null}
            {item.caption && !onPlan ? (
              <Text variant="callout" style={{ color: INK.dim }} numberOfLines={3}>
                {item.caption}
              </Text>
            ) : null}
          </View>
        ) : null}

        {plan && plan.rooms.length > 0 ? (
          <ScrollView
            style={{ maxHeight: 168, flexGrow: 0 }}
            contentContainerStyle={{ paddingHorizontal: 16, gap: 4 }}
            accessibilityLabel={`Rooms on ${plan.levelName}`}
          >
            {plan.rooms.some((r) => r.widthM !== undefined) ? (
              <Text variant="caption" style={{ color: INK.dim }}>
                {FLOOR_PLAN_MEASUREMENT_LABEL[plan.measurement]}
              </Text>
            ) : null}
            {plan.rooms.map((room, roomIndex) => {
              const size = roomSizeLabel(room, plan.measurement);
              const at = room.photoMediaId
                ? items.findIndex((m) => m.id === room.photoMediaId)
                : -1;
              const body = (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 44 }}>
                  <View
                    importantForAccessibility="no"
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: 12,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: INK.tile,
                    }}
                  >
                    <Text variant="label" style={{ color: INK.fg }}>
                      {roomIndex + 1}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text variant="bodyStrong" style={{ color: INK.fg }} numberOfLines={1}>
                      {room.name}
                    </Text>
                    <Text variant="caption" style={{ color: INK.dim }}>
                      {size ?? 'No size given'}
                    </Text>
                  </View>
                  {at >= 0 ? <ChevronRight size={18} color={INK.dim} /> : null}
                </View>
              );
              return at >= 0 ? (
                <Pressable
                  key={room.id}
                  onPress={() => go(at)}
                  accessibilityRole="button"
                  accessibilityLabel={`${roomIndex + 1}. ${room.name}${size ? `, ${size}` : ''}, open its photo`}
                >
                  {body}
                </Pressable>
              ) : (
                <View
                  key={room.id}
                  accessible
                  accessibilityLabel={`${roomIndex + 1}. ${room.name}, ${size ?? 'No size given'}`}
                >
                  {body}
                </View>
              );
            })}
          </ScrollView>
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
                  backgroundColor: isFloorPlan(m) ? INK.paper : INK.tile,
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
                    // A plan is never cropped, even as a thumbnail.
                    contentFit={isFloorPlan(m) ? 'contain' : 'cover'}
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

function LevelArrow({
  label,
  disabled,
  onPress,
  children,
}: {
  label: string;
  disabled: boolean;
  onPress: () => void;
  children: React.ReactNode;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      style={{
        width: 44,
        height: 44,
        alignItems: 'center',
        justifyContent: 'center',
        opacity: disabled ? 0.35 : 1,
      }}
    >
      {children}
    </Pressable>
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
  natural: knownNatural,
  markers,
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
  /** The image's own size, when the API sent it; otherwise read when it loads. */
  natural?: Size;
  /** A floor plan's numbered rooms, drawn on the image and zoomed with it. */
  markers?: PlanMarker[];
}) {
  const [failed, setFailed] = useState(false);
  const [box, setBox] = useState<Size | null>(null);
  const [loaded, setLoaded] = useState<Size | null>(null);
  // The plan is drawn contained, so markers go on the drawn image, not on the (letterboxed) box.
  const rect = markers ? containedRect(box, loaded ?? knownNatural ?? null) : null;
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
        onLayout={
          markers
            ? (e) => {
                // The layout size is before the zoom transform, which the markers share.
                const { width: w, height: h } = e.nativeEvent.layout;
                if (w !== box?.width || h !== box?.height) setBox({ width: w, height: h });
              }
            : undefined
        }
      >
        <View
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
          // The image, not this whole view, is the accessible element, so the markers can be reached.
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
            onLoad={
              markers
                ? (e) => {
                    const { width: w, height: h } = e.source;
                    if (w > 0 && h > 0 && (w !== loaded?.width || h !== loaded?.height)) {
                      setLoaded({ width: w, height: h });
                    }
                  }
                : undefined
            }
            alt={alt}
            accessible={false}
            style={{ width: '100%', height: '100%' }}
          />
        </View>
        {rect && markers
          ? markers.map((m) => {
              const at = pointInRect(rect, m.x, m.y);
              return <PlanMarkerView key={m.id} marker={m} x={at.x} y={at.y} scale={scale} />;
            })
          : null}
      </Animated.View>
    </GestureDetector>
  );
}

interface PlanMarker {
  id: string;
  number: number;
  /** Percent of the plan image, from the top left. */
  x: number;
  y: number;
  label: string;
  /** Opens the room's photo; a room without one is shown but not tappable. */
  onPress?: () => void;
}

/**
 * One numbered room on the plan. It sits inside the zoomed view, so it moves with the plan, and is
 * scaled back by the zoom so the dot and its 44pt hit area stay the same size on screen.
 */
function PlanMarkerView({
  marker,
  x,
  y,
  scale,
}: {
  marker: PlanMarker;
  x: number;
  y: number;
  scale: SharedValue<number>;
}) {
  const { colors, shadows } = useTheme();
  const steady = useAnimatedStyle(() => ({ transform: [{ scale: 1 / scale.get() }] }));
  const frame = {
    position: 'absolute' as const,
    left: x - MARKER_HIT / 2,
    top: y - MARKER_HIT / 2,
    width: MARKER_HIT,
    height: MARKER_HIT,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  };
  const dot = (
    <View
      style={[
        {
          width: MARKER_DOT,
          height: MARKER_DOT,
          borderRadius: MARKER_DOT / 2,
          borderWidth: 2,
          borderColor: INK.fg,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.primary,
        },
        shadows.sm,
      ]}
    >
      <Text variant="label" style={{ color: colors.primaryForeground }} maxFontSizeMultiplier={1}>
        {marker.number}
      </Text>
    </View>
  );
  return (
    <Animated.View style={[frame, steady]} pointerEvents={marker.onPress ? 'box-none' : 'none'}>
      {marker.onPress ? (
        <Pressable
          onPress={marker.onPress}
          accessibilityRole="button"
          accessibilityLabel={marker.label}
          style={{
            width: MARKER_HIT,
            height: MARKER_HIT,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {dot}
        </Pressable>
      ) : (
        <View accessible accessibilityLabel={marker.label}>
          {dot}
        </View>
      )}
    </Animated.View>
  );
}
