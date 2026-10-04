import { useState, type ReactNode } from 'react';
import { RefreshControl, ScrollView, View } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { FlashList } from '@shopify/flash-list';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Button,
  Card,
  EmptyState,
  ErrorState,
  SegmentedControl,
  Skeleton,
  Text,
  TextField,
  useTheme,
} from '@getrentos/ui-native';
import { DetailHeader } from '@/components/dashboard/DetailHeader';
import { StatusPill } from '@/components/host/HostUI';
import { Sheet } from '@/components/Sheet';
import { relativeTime } from '@/lib/format';
import type { Tone } from '@/lib/api/estateManager';

export type QueueView = 'open' | 'closed';

/**
 * A work queue for the office: what is still waiting, and what was closed.
 * Incidents, maintenance and violations all read this way.
 */
export function QueueScreen<T extends { id: string }>({
  eyebrow,
  title,
  subtitle,
  accessory,
  query,
  items,
  view,
  onView,
  openCount,
  renderItem,
  emptyOpen,
  emptyClosed,
  icon,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  accessory?: ReactNode;
  query: { isPending: boolean; isError: boolean; isRefetching: boolean; refetch: () => unknown };
  items: T[];
  view: QueueView;
  onView: (v: QueueView) => void;
  openCount: number;
  renderItem: (item: T) => ReactNode;
  emptyOpen: { title: string; description: string };
  emptyClosed: { title: string; description: string };
  icon: ReactNode;
}) {
  const { colors, spacing, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const refresh = (
    <RefreshControl
      refreshing={query.isRefetching}
      onRefresh={() => query.refetch()}
      tintColor={colors.mutedForeground}
    />
  );
  const empty = view === 'open' ? emptyOpen : emptyClosed;
  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View
        style={{
          paddingTop: insets.top + spacing.md,
          paddingHorizontal: spacing.xl,
          paddingBottom: spacing.md,
          gap: spacing.md,
        }}
      >
        <DetailHeader
          eyebrow={eyebrow}
          title={title}
          subtitle={subtitle}
          onBack={() => router.back()}
          accessory={accessory}
        />
        <SegmentedControl
          accessibilityLabel={`Which ${title.toLowerCase()}`}
          value={view}
          onChange={onView}
          options={[
            { value: 'open', label: openCount ? `Open ${openCount}` : 'Open' },
            { value: 'closed', label: 'Closed' },
          ]}
        />
      </View>
      {query.isError && !items.length ? (
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} refreshControl={refresh}>
          <ErrorState onRetry={() => query.refetch()} />
        </ScrollView>
      ) : query.isPending ? (
        <View style={{ paddingHorizontal: spacing.xl, gap: spacing.md }}>
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} height={132} radius={radius.lg} />
          ))}
        </View>
      ) : (
        <FlashList
          data={items}
          keyExtractor={(i) => i.id}
          refreshControl={refresh}
          contentContainerStyle={{
            paddingHorizontal: spacing.xl,
            paddingBottom: insets.bottom + spacing['3xl'],
          }}
          ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
          renderItem={({ item }) => <>{renderItem(item as T)}</>}
          ListEmptyComponent={
            <EmptyState icon={icon} title={empty.title} description={empty.description} />
          }
        />
      )}
    </View>
  );
}

/** One queue item: what, where, how urgent, since when, and what can be done. */
export function QueueCard({
  title,
  where,
  description,
  pills,
  createdAt,
  photoUrl,
  notes,
  actions,
}: {
  title: string;
  where?: string;
  description: string;
  pills: { label: string; tone: Tone }[];
  createdAt: string;
  photoUrl?: string;
  /** How it was closed, shown on closed items. */
  notes?: string;
  actions?: ReactNode;
}) {
  const { colors, spacing, radius } = useTheme();
  return (
    <Card elevated style={{ gap: spacing.sm }}>
      <View
        accessible
        accessibilityLabel={`${title}${where ? `, ${where}` : ''}. ${pills.map((p) => p.label).join(', ')}. ${description}. ${relativeTime(createdAt)}`}
        style={{ gap: spacing.sm }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm }}>
          <View style={{ flex: 1, gap: 2 }}>
            <Text variant="bodyStrong">{title}</Text>
            {where ? (
              <Text variant="caption" color="mutedForeground" numberOfLines={1}>
                {where}
              </Text>
            ) : null}
          </View>
          <Text variant="caption" color="mutedForeground">
            {relativeTime(createdAt)}
          </Text>
        </View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
          {pills.map((p) => (
            <StatusPill key={p.label} label={p.label} tone={p.tone} />
          ))}
        </View>
        <Text variant="callout">{description}</Text>
        {photoUrl ? (
          <Image
            source={{ uri: photoUrl }}
            contentFit="cover"
            accessibilityLabel="Photo attached to this report"
            style={{
              width: '100%',
              height: 160,
              borderRadius: radius.md,
              backgroundColor: colors.secondary,
            }}
          />
        ) : null}
        {notes ? (
          <Text variant="caption" color="mutedForeground">
            Closed with: {notes}
          </Text>
        ) : null}
      </View>
      {actions ? <View style={{ flexDirection: 'row', gap: spacing.sm }}>{actions}</View> : null}
    </Card>
  );
}

/** Resolve or dismiss, with a note that stays on the record. */
export function CloseSheet({
  open,
  how,
  what,
  busy,
  onClose,
  onConfirm,
}: {
  open: boolean;
  how: 'resolve' | 'dismiss';
  /** e.g. "incident", "ticket". */
  what: string;
  busy?: boolean;
  onClose: () => void;
  onConfirm: (notes: string) => void;
}) {
  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={how === 'resolve' ? `Resolve this ${what}` : `Dismiss this ${what}`}
    >
      {open ? <CloseForm how={how} what={what} busy={busy} onConfirm={onConfirm} /> : null}
    </Sheet>
  );
}

function CloseForm({
  how,
  what,
  busy,
  onConfirm,
}: {
  how: 'resolve' | 'dismiss';
  what: string;
  busy?: boolean;
  onConfirm: (notes: string) => void;
}) {
  const { spacing } = useTheme();
  const [notes, setNotes] = useState('');
  const dismissing = how === 'dismiss';
  return (
    <View style={{ gap: spacing.md }}>
      <TextField
        label={dismissing ? 'Why it’s being dismissed' : 'What was done (optional)'}
        value={notes}
        onChangeText={setNotes}
        multiline
        maxLength={2000}
        autoFocus
        hint={
          dismissing
            ? `Kept on the record, so it’s clear later why this ${what} wasn’t acted on.`
            : 'Kept on the record for whoever looks at this later.'
        }
      />
      <Button
        label={dismissing ? 'Dismiss' : 'Mark resolved'}
        variant={dismissing ? 'destructive' : 'primary'}
        // Dismissing without a reason leaves nothing to answer "why was this ignored?".
        disabled={dismissing && notes.trim().length < 3}
        loading={busy}
        onPress={() => onConfirm(notes.trim())}
      />
    </View>
  );
}
