import { useRef, useState } from 'react';
import {
  Pressable,
  ScrollView,
  Share,
  View,
  useWindowDimensions,
  type ScrollViewInstance,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { Image } from 'expo-image';
import {
  BadgeCheck,
  Bath,
  BedDouble,
  Building2,
  CalendarDays,
  ChevronLeft,
  Info,
  LogIn,
  MapPin,
  MessageCircleQuestion,
  Ruler,
  Share2,
} from '@sureground/icons/native';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  IconButton,
  Price,
  QueryState,
  SectionHeader,
  Skeleton,
  Text,
  useTheme,
} from '@sureground/ui-native';
import {
  DEVELOPMENT_ENQUIRY_COPY,
  DEVELOPMENT_STAGE_LABEL,
  completionLabel,
  instalmentAmountLabel,
  placeholderOf,
  variantAtLeast,
  type ShowroomDevelopment,
} from '@sureground/shared/showroom';
import { qk } from '@/lib/query/keys';
import { developmentsApi } from '@/lib/api/developments';
import {
  approvalCheckedLine,
  developerLine,
  instalmentContext,
  isDevelopmentId,
  lowestUnitPrice,
  shortDay,
} from '@/lib/developments';
import { useAuth } from '@/lib/auth/AuthProvider';
import { env } from '@/lib/env';
import { formatNaira } from '@/lib/format';
import { ShowroomPreview } from '@/components/showroom/ShowroomMedia';
import { MediaViewer } from '@/components/showroom/MediaViewer';
import {
  DevelopmentChecks,
  DevelopmentPaymentNotice,
} from '@/components/showroom/DevelopmentAssurance';
import { AskTheDeveloper, SalesContact, signInToAsk } from '@/components/showroom/AskTheDeveloper';

/**
 * A public off-plan development, as on the web's /developments/[id]: listed only. The developer
 * takes the money, and the page says so near the price and again in the payment plan.
 */
export default function PublicDevelopment() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors, spacing } = useTheme();
  const insets = useSafeAreaInsets();
  const valid = isDevelopmentId(id);
  const scrollRef = useRef<ScrollViewInstance>(null);
  const bodyY = useRef(0);
  const askY = useRef(0);
  const scrollToAsk = () =>
    scrollRef.current?.scrollTo({ y: Math.max(0, bodyY.current + askY.current - 80) });

  const query = useQuery({
    queryKey: qk.market.development(String(id)),
    queryFn: () => developmentsApi.detail(id),
    enabled: valid,
  });
  const d = query.data;

  const back = () =>
    router.canGoBack()
      ? router.back()
      : router.replace({ pathname: '/(market)', params: { kind: 'developments' } });
  const share = async () => {
    if (!d) return;
    await Share.share({
      message: `${d.name} · ${d.city}, ${d.state}\n${env.webUrl}/developments/${encodeURIComponent(d.id)}`,
    }).catch(() => undefined);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + spacing['3xl'] }}
      >
        {d ? (
          <ShowroomPreview
            items={d.media}
            title={d.name}
            height={320}
            area={d.city}
            emptyLabel="The developer has not added photos yet"
          />
        ) : (
          <View style={{ height: 320, backgroundColor: colors.muted }} />
        )}

        <View
          onLayout={(e) => (bodyY.current = e.nativeEvent.layout.y)}
          style={{ padding: spacing.xl, gap: spacing['2xl'] }}
        >
          {!valid || query.data === null ? (
            <EmptyState
              icon={<Building2 size={34} color={colors.mutedForeground} />}
              title="Development not found"
              description="It may have been taken down, or the link is not right."
            />
          ) : (
            <QueryState
              query={query}
              errorTitle="We couldn’t load this development"
              errorDescription="Your connection may have dropped. Try again."
              skeleton={
                <View style={{ gap: spacing.md }} accessibilityLabel="Loading development">
                  <Skeleton height={30} width="60%" />
                  <Skeleton height={20} width="80%" />
                  <Skeleton height={16} width="50%" />
                  <Skeleton height={120} />
                </View>
              }
            >
              {d ? (
                <Body development={d} onAsk={scrollToAsk} onAskLayout={(y) => (askY.current = y)} />
              ) : null}
            </QueryState>
          )}
        </View>
      </ScrollView>

      <View
        pointerEvents="box-none"
        style={{
          position: 'absolute',
          top: insets.top + spacing.sm,
          left: spacing.lg,
          right: spacing.lg,
          flexDirection: 'row',
          justifyContent: 'space-between',
        }}
      >
        <IconButton
          onPress={back}
          haptic={false}
          accessibilityLabel="Go back"
          icon={<ChevronLeft size={22} color={colors.foreground} />}
        />
        {d ? (
          <IconButton
            onPress={share}
            accessibilityLabel="Share development"
            icon={<Share2 size={19} color={colors.foreground} />}
          />
        ) : null}
      </View>
    </View>
  );
}

function Body({
  development: d,
  onAsk,
  onAskLayout,
}: {
  development: ShowroomDevelopment;
  onAsk: () => void;
  onAskLayout: (y: number) => void;
}) {
  const { colors, spacing } = useTheme();
  const signedIn = useAuth().status === 'authenticated';
  const lowest = lowestUnitPrice(d);
  const completion = completionLabel(d.expectedCompletion);
  const location = [d.addressLine, d.lga, d.city, d.state].filter(Boolean).join(', ');
  const titleApprovals = d.approvals.filter((a) => a.kind !== 'OTHER_APPROVAL');
  const otherApprovals = d.approvals.filter((a) => a.kind === 'OTHER_APPROVAL');

  return (
    <>
      <View style={{ gap: spacing.md }}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
          <Badge label="Four staff checks passed" tone="success" />
          <Badge label="Off-plan" tone="neutral" />
        </View>
        <Text variant="title" accessibilityRole="header">
          {d.name}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 6 }}>
          <MapPin size={15} color={colors.mutedForeground} style={{ marginTop: 2 }} />
          <Text variant="callout" color="mutedForeground" style={{ flex: 1 }}>
            {location}
          </Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 6 }}>
          <Building2 size={15} color={colors.mutedForeground} style={{ marginTop: 2 }} />
          <Text variant="callout" color="mutedForeground" style={{ flex: 1 }}>
            {developerLine(d)}
          </Text>
        </View>
        <View
          accessible
          accessibilityLabel={[
            DEVELOPMENT_STAGE_LABEL[d.stage],
            completion ? `Expected ${completion}` : null,
            'The stage and expected completion are as the developer states them.',
          ]
            .filter(Boolean)
            .join('. ')}
          style={{ gap: spacing.xs }}
        >
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.lg }}>
            <Text variant="callout" style={{ fontWeight: '600' }}>
              {DEVELOPMENT_STAGE_LABEL[d.stage]}
            </Text>
            {completion ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <CalendarDays size={15} color={colors.mutedForeground} />
                <Text variant="callout" style={{ fontWeight: '600' }}>
                  Expected {completion}
                </Text>
              </View>
            ) : null}
          </View>
          <Text variant="caption" color="mutedForeground">
            The stage and expected completion are as the developer states them.
          </Text>
        </View>
      </View>

      <Card style={{ gap: spacing.lg }}>
        {lowest !== undefined ? (
          <View style={{ gap: 2 }}>
            <Text variant="caption" color="mutedForeground">
              Units from
            </Text>
            <Price amount={lowest} variant="title" />
            <Text variant="caption" color="mutedForeground">
              As the developer states it
            </Text>
          </View>
        ) : null}
        {signedIn ? (
          <Button
            label={DEVELOPMENT_ENQUIRY_COPY.title}
            icon={<MessageCircleQuestion size={16} color={colors.primaryForeground} />}
            onPress={onAsk}
          />
        ) : (
          <Button
            label={DEVELOPMENT_ENQUIRY_COPY.signedOut}
            icon={<LogIn size={16} color={colors.primaryForeground} />}
            onPress={() => signInToAsk(d.id)}
          />
        )}
        <SalesContact development={d} />
        <DevelopmentPaymentNotice compact />
      </Card>

      {d.summary ? (
        <View style={{ gap: spacing.sm }}>
          <SectionHeader title="About this development" />
          <Text variant="body" color="mutedForeground">
            {d.summary}
          </Text>
        </View>
      ) : null}

      {d.unitTypes.length > 0 ? <UnitTypes development={d} /> : null}

      <View style={{ gap: spacing.sm }}>
        <SectionHeader title="Payment plan" />
        <DevelopmentPaymentNotice />
        {d.instalments.length > 0 ? (
          <Card padding="none">
            {d.instalments.map((i, index) => {
              const context = instalmentContext(i, d.unitTypes);
              const amount = instalmentAmountLabel(i, formatNaira);
              return (
                <View
                  key={i.id}
                  accessible
                  accessibilityLabel={[i.label, context, amount].filter(Boolean).join(', ')}
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    gap: spacing.md,
                    padding: spacing.lg,
                    borderTopWidth: index ? 1 : 0,
                    borderTopColor: colors.border,
                  }}
                >
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text variant="callout" style={{ fontWeight: '600' }}>
                      {i.label}
                    </Text>
                    {context ? (
                      <Text variant="caption" color="mutedForeground">
                        {context}
                      </Text>
                    ) : null}
                  </View>
                  <Text
                    variant="callout"
                    style={{ fontWeight: '600', flexShrink: 1, textAlign: 'right' }}
                  >
                    {amount}
                  </Text>
                </View>
              );
            })}
          </Card>
        ) : null}
        {d.paymentNote ? (
          <Text variant="callout" color="mutedForeground">
            <Text variant="callout" style={{ fontWeight: '600' }}>
              In the developer’s words:{' '}
            </Text>
            {d.paymentNote}
          </Text>
        ) : null}
      </View>

      {d.progress.length > 0 ? <ProgressGallery development={d} /> : null}

      <View style={{ gap: spacing.sm }}>
        <SectionHeader title="Approvals" />
        {titleApprovals.map((a) => (
          <Card
            key={a.kind}
            style={{ flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md }}
          >
            <BadgeCheck size={20} color={colors.success} />
            <View style={{ flex: 1, gap: 2 }}>
              <Text variant="bodyStrong">
                {a.label}
                {a.authority ? ` (${a.authority})` : ''}
              </Text>
              <Text variant="callout" color="mutedForeground">
                {approvalCheckedLine(a.checkedAt)}
              </Text>
            </View>
          </Card>
        ))}
        {otherApprovals.map((a) => (
          <Card
            key={a.label}
            style={{ flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md }}
          >
            <Info size={20} color={colors.mutedForeground} />
            <View style={{ flex: 1, gap: 2 }}>
              <Text variant="bodyStrong">{a.label}</Text>
              <Text variant="callout" color="mutedForeground">
                Stated by the developer. Sureground has not checked it.
              </Text>
            </View>
          </Card>
        ))}
      </View>

      <DevelopmentChecks development={d} />

      <View onLayout={(e) => onAskLayout(e.nativeEvent.layout.y)}>
        <AskTheDeveloper development={d} />
      </View>
    </>
  );
}

function UnitTypes({ development: d }: { development: ShowroomDevelopment }) {
  const { colors, spacing } = useTheme();
  return (
    <View style={{ gap: spacing.sm }}>
      <SectionHeader title="Unit types" />
      {d.unitTypes.map((u) => (
        <Card key={u.id} style={{ gap: spacing.sm }}>
          <Text variant="bodyStrong">{u.name}</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.lg }}>
            {u.bedrooms !== undefined ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <BedDouble size={15} color={colors.mutedForeground} />
                <Text variant="callout" color="mutedForeground">
                  {u.bedrooms} bed
                </Text>
              </View>
            ) : null}
            {u.bathrooms !== undefined ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Bath size={15} color={colors.mutedForeground} />
                <Text variant="callout" color="mutedForeground">
                  {u.bathrooms} bath
                </Text>
              </View>
            ) : null}
            {u.sizeSqm !== undefined ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Ruler size={15} color={colors.mutedForeground} />
                <Text variant="callout" color="mutedForeground">
                  about {u.sizeSqm} m²
                </Text>
              </View>
            ) : null}
          </View>
          {u.priceFromNaira !== undefined ? (
            <Text variant="bodyStrong">From {formatNaira(u.priceFromNaira)}</Text>
          ) : null}
          {u.unitsAvailable !== undefined && u.unitsTotal !== undefined ? (
            <Text variant="callout" color="mutedForeground">
              {u.unitsAvailable} of {u.unitsTotal} available
            </Text>
          ) : null}
        </Card>
      ))}
      <Text variant="caption" color="mutedForeground">
        Prices, sizes and availability are as the developer states them. Sureground has not checked
        them.
      </Text>
    </View>
  );
}

/** Site photos, newest first, each with the date it was taken; a tap opens the viewer there. */
function ProgressGallery({ development: d }: { development: ShowroomDevelopment }) {
  const { colors, spacing, radius } = useTheme();
  const { width } = useWindowDimensions();
  const [openAt, setOpenAt] = useState<number | null>(null);
  const tile = Math.floor((width - spacing.xl * 2 - spacing.sm) / 2);
  return (
    <View style={{ gap: spacing.sm }}>
      <SectionHeader title="Progress on site" />
      <Text variant="callout" color="mutedForeground">
        Photos from the developer, newest first, with the date each was taken.
      </Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
        {d.progress.map((m, index) => {
          const blur = placeholderOf(m.placeholder);
          const day = shortDay(m.capturedAt!);
          return (
            <Pressable
              key={m.id}
              onPress={() => setOpenAt(index)}
              accessibilityRole="button"
              accessibilityLabel={`Site photo taken ${day}. Open full screen`}
              style={{ width: tile, gap: 4 }}
            >
              <View
                style={{
                  width: tile,
                  height: Math.round((tile * 3) / 4),
                  borderRadius: radius.md,
                  overflow: 'hidden',
                  backgroundColor: colors.muted,
                }}
              >
                <Image
                  source={{ uri: variantAtLeast(m.url, m.variants, 320) }}
                  placeholder={blur ? { uri: blur } : undefined}
                  style={{ width: '100%', height: '100%' }}
                  contentFit="cover"
                  cachePolicy="memory-disk"
                  recyclingKey={m.id}
                  accessible={false}
                />
              </View>
              <Text variant="caption" color="mutedForeground">
                {day}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <MediaViewer
        items={d.progress}
        open={openAt !== null}
        startIndex={openAt ?? 0}
        title={d.name}
        onClose={() => setOpenAt(null)}
      />
    </View>
  );
}
