import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, Share, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AlertTriangle, CalendarSync, Link2, Plus, RefreshCw, Trash2 } from 'lucide-react-native';
import {
  Button,
  Card,
  Chip,
  Divider,
  ErrorState,
  FormAlert,
  IconButton,
  Skeleton,
  Text,
  TextField,
  useTheme,
  useToast,
} from '@getrentos/ui-native';
import { qk } from '@/lib/query/keys';
import { hostShortletsApi, type CalendarFeed } from '@/lib/api/hostShortlets';
import { ApiError } from '@/lib/api/client';
import { relativeTime } from '@/lib/format';
import { haptics } from '@/lib/haptics';
import { DetailHeader } from '@/components/dashboard/DetailHeader';
import { Sheet } from '@/components/Sheet';

const SOURCES = ['Airbnb', 'Booking.com', 'Vrbo', 'Other'] as const;

/**
 * Two-way calendar sync with other sites, so the same night is never sold
 * twice: give them our link, and paste theirs here.
 */
export default function HostCalendarSync() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors, spacing, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const toast = useToast();
  const [adding, setAdding] = useState(false);
  const sync = useQuery({
    queryKey: qk.host.sync(id),
    queryFn: () => hostShortletsApi.calendarSync(id),
  });
  const refresh = () => {
    qc.invalidateQueries({ queryKey: qk.host.sync(id) });
    qc.invalidateQueries({ queryKey: qk.host.blocked(id) });
  };

  const reset = useMutation({
    mutationFn: () => hostShortletsApi.resetExport(id),
    onSuccess: () => {
      refresh();
      toast.show('New link made. Paste it into the other sites again.', 'success');
    },
    onError: (err) =>
      toast.show(err instanceof ApiError ? err.message : 'Could not reset it.', 'error'),
  });
  const syncNow = useMutation({
    mutationFn: (feedId: string) => hostShortletsApi.syncFeed(feedId),
    onSuccess: (feed) => {
      refresh();
      toast.show(
        feed.lastError
          ? `${feed.name} couldn’t be read: ${feed.lastError}`
          : `${feed.name} is up to date.`,
        feed.lastError ? 'error' : 'success'
      );
    },
    onError: (err) => toast.show(err instanceof ApiError ? err.message : 'Sync failed.', 'error'),
  });
  const removeFeed = useMutation({
    mutationFn: (feedId: string) => hostShortletsApi.removeFeed(feedId),
    onSuccess: () => {
      refresh();
      toast.show('Calendar removed. Its dates are open again.', 'success');
    },
  });

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{
        paddingTop: insets.top + spacing.md,
        paddingHorizontal: spacing.xl,
        paddingBottom: insets.bottom + spacing['3xl'],
        gap: spacing.xl,
      }}
    >
      <DetailHeader
        eyebrow="Calendar sync"
        title="Other sites"
        subtitle="Never sell the same night twice"
        onBack={() => router.back()}
      />
      {sync.isError && !sync.data ? (
        <ErrorState onRetry={() => sync.refetch()} />
      ) : !sync.data ? (
        <Skeleton height={220} radius={radius.lg} />
      ) : (
        <>
          <View style={{ gap: spacing.sm }}>
            <Text variant="heading" accessibilityRole="header">
              1 · Your GetRentos calendar
            </Text>
            <Card elevated style={{ gap: spacing.md }}>
              <Text variant="callout" color="mutedForeground">
                In Airbnb or Booking.com, find “Import calendar” and paste this link. Stays booked
                here then block those nights there.
              </Text>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: spacing.sm,
                  padding: spacing.md,
                  borderRadius: radius.md,
                  backgroundColor: colors.secondary,
                }}
              >
                <Link2 size={16} color={colors.mutedForeground} />
                <Text variant="caption" numberOfLines={1} style={{ flex: 1 }}>
                  {sync.data.exportUrl}
                </Text>
              </View>
              <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                <Button
                  label="Share or copy link"
                  style={{ flex: 1 }}
                  onPress={() =>
                    Share.share({ message: sync.data!.exportUrl, url: sync.data!.exportUrl })
                  }
                />
                <Button
                  label="Reset"
                  variant="ghost"
                  loading={reset.isPending}
                  onPress={() =>
                    Alert.alert(
                      'Make a new link?',
                      'The old link stops working. Use this if it was shared somewhere it shouldn’t be.',
                      [
                        { text: 'Cancel', style: 'cancel' },
                        {
                          text: 'Make new link',
                          style: 'destructive',
                          onPress: () => reset.mutate(),
                        },
                      ]
                    )
                  }
                />
              </View>
            </Card>
          </View>

          <View style={{ gap: spacing.sm }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text variant="heading" accessibilityRole="header" style={{ flex: 1 }}>
                2 · Their calendars
              </Text>
              <IconButton
                accessibilityLabel="Add a calendar"
                icon={<Plus size={20} color={colors.primary} />}
                onPress={() => setAdding(true)}
              />
            </View>
            {sync.data.feeds.length === 0 ? (
              <Card
                elevated
                style={{ alignItems: 'center', gap: spacing.sm, paddingVertical: spacing['2xl'] }}
              >
                <CalendarSync size={28} color={colors.mutedForeground} />
                <Text variant="callout" color="mutedForeground" center>
                  Paste the “Export calendar” link from each site you also list on. Their bookings
                  will block nights here automatically.
                </Text>
                <Button
                  label="Add a calendar"
                  variant="secondary"
                  onPress={() => setAdding(true)}
                />
              </Card>
            ) : (
              <Card elevated padding="none">
                {sync.data.feeds.map((f, i) => (
                  <View key={f.id}>
                    {i ? <Divider /> : null}
                    <FeedRow
                      f={f}
                      syncing={syncNow.isPending && syncNow.variables === f.id}
                      onSync={() => syncNow.mutate(f.id)}
                      onRemove={() =>
                        Alert.alert(`Remove ${f.name}?`, 'Nights it blocked open up again here.', [
                          { text: 'Keep', style: 'cancel' },
                          {
                            text: 'Remove',
                            style: 'destructive',
                            onPress: () => removeFeed.mutate(f.id),
                          },
                        ])
                      }
                    />
                  </View>
                ))}
              </Card>
            )}
          </View>
        </>
      )}
      <Sheet open={adding} onClose={() => setAdding(false)} title="Add a calendar">
        {adding ? <AddFeed listingId={id} onDone={() => setAdding(false)} /> : null}
      </Sheet>
    </ScrollView>
  );
}

function FeedRow({
  f,
  syncing,
  onSync,
  onRemove,
}: {
  f: CalendarFeed;
  syncing: boolean;
  onSync: () => void;
  onRemove: () => void;
}) {
  const { colors, spacing } = useTheme();
  return (
    <View style={{ padding: spacing.lg, gap: spacing.sm }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
        <View style={{ flex: 1 }}>
          <Text variant="bodyStrong">{f.name}</Text>
          <Text variant="caption" color="mutedForeground">
            {f.lastSyncedAt ? `Synced ${relativeTime(f.lastSyncedAt)}` : 'Not synced yet'} ·{' '}
            {f.eventCount} blocked stay{f.eventCount === 1 ? '' : 's'}
          </Text>
        </View>
        <IconButton
          accessibilityLabel={`Sync ${f.name} now`}
          icon={<RefreshCw size={18} color={syncing ? colors.mutedForeground : colors.primary} />}
          onPress={onSync}
          disabled={syncing}
        />
        <IconButton
          accessibilityLabel={`Remove ${f.name}`}
          icon={<Trash2 size={18} color={colors.mutedForeground} />}
          onPress={onRemove}
        />
      </View>
      {f.lastError ? <FormAlert message={`Couldn’t read this calendar: ${f.lastError}`} /> : null}
      {f.conflictCount ? (
        <View style={{ flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' }}>
          <AlertTriangle size={15} color={colors.warning} style={{ marginTop: 1 }} />
          <Text variant="caption" style={{ flex: 1, color: colors.warning }}>
            {f.conflictCount} stay{f.conflictCount === 1 ? '' : 's'} on {f.name} overlap
            {f.conflictCount === 1 ? 's' : ''} a GetRentos booking. Sort it out on {f.name} before
            the guests arrive.
          </Text>
        </View>
      ) : null}
    </View>
  );
}

function AddFeed({ listingId, onDone }: { listingId: string; onDone: () => void }) {
  const { spacing } = useTheme();
  const qc = useQueryClient();
  const toast = useToast();
  const [source, setSource] = useState<(typeof SOURCES)[number]>('Airbnb');
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const label = source === 'Other' ? name.trim() : source;
  const valid = /^(https?|webcal):\/\/\S+$/i.test(url.trim());

  const add = useMutation({
    mutationFn: () => hostShortletsApi.addFeed(listingId, label, url.trim()),
    onSuccess: (feed) => {
      void haptics.success();
      qc.invalidateQueries({ queryKey: qk.host.sync(listingId) });
      qc.invalidateQueries({ queryKey: qk.host.blocked(listingId) });
      toast.show(
        feed.lastError
          ? `Added, but it couldn’t be read yet: ${feed.lastError}`
          : `${feed.name} added: ${feed.eventCount} stay${feed.eventCount === 1 ? '' : 's'} blocked.`,
        feed.lastError ? 'error' : 'success'
      );
      onDone();
    },
  });

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={{ gap: spacing.md }}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
          {SOURCES.map((s) => (
            <Chip key={s} label={s} selected={source === s} onPress={() => setSource(s)} />
          ))}
        </View>
        {source === 'Other' ? (
          <TextField label="Site name" value={name} onChangeText={setName} maxLength={60} />
        ) : null}
        <TextField
          label="Calendar link (.ics)"
          value={url}
          onChangeText={setUrl}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
          hint={`In ${source === 'Other' ? 'the site' : source}, look for “Export calendar”.`}
        />
        {add.error ? (
          <FormAlert
            message={add.error instanceof ApiError ? add.error.message : 'Could not add it.'}
          />
        ) : null}
        <Button
          label="Add calendar"
          disabled={!label || !valid}
          loading={add.isPending}
          onPress={() => add.mutate()}
        />
      </View>
    </KeyboardAvoidingView>
  );
}
