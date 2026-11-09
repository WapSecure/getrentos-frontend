import { useState } from 'react';
import { Linking, RefreshControl, ScrollView, View } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ClipboardCheck } from 'lucide-react-native';
import {
  LAND_BOUNDARY_LABELS,
  LAND_INSPECTION_STATUS_LABELS,
  boundaryTone,
} from '@sureground/shared';
import {
  Badge,
  Button,
  Card,
  ListSkeleton,
  PressableScale,
  QueryState,
  Text,
  TextField,
  useTheme,
  useToast,
  type BadgeTone,
} from '@sureground/ui-native';
import { qk } from '@/lib/query/keys';
import {
  inspectionTextOk,
  landBuyerExtrasApi,
  type PrePurchaseInspection,
} from '@/lib/api/landBuyerExtras';
import { errorMessage } from '@/lib/api/client';
import { formatDate } from '@/lib/format';
import { DetailScreenHeader } from '@/components/dashboard/DetailScreenHeader';
import { goBack } from '@/lib/goBack';
import { Image as ExpoImage } from 'expo-image';

/** Independent inspections the buyer commissioned before buying. */
export default function BuyerLandInspections() {
  const { colors, spacing } = useTheme();
  const insets = useSafeAreaInsets();
  const q = useQuery({
    queryKey: qk.buyerLand.inspections,
    queryFn: landBuyerExtrasApi.inspections,
  });
  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <DetailScreenHeader
        eyebrow="My land"
        title="Inspections"
        subtitle="What the land looked like, on the day"
        onBack={() => goBack()}
      />
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: spacing.xl,
          paddingBottom: insets.bottom + spacing['3xl'],
          gap: spacing.md,
        }}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={q.isRefetching}
            onRefresh={() => q.refetch()}
            tintColor={colors.mutedForeground}
          />
        }
      >
        <QueryState
          query={q}
          skeleton={<ListSkeleton rows={2} variant="card" height={140} />}
          isEmpty={!q.data?.length}
          empty={{
            icon: <ClipboardCheck size={32} color={colors.mutedForeground} />,
            title: 'No inspections yet',
            description: 'Commission one from a land listing or an estate plot.',
          }}
        >
          {(q.data ?? []).map((i) => (
            <InspectionCard key={i.id} inspection={i} />
          ))}
        </QueryState>
      </ScrollView>
    </View>
  );
}

function InspectionCard({ inspection: i }: { inspection: PrePurchaseInspection }) {
  const { colors, spacing, radius } = useTheme();
  const qc = useQueryClient();
  const toast = useToast();
  const [mode, setMode] = useState<'question' | 'reinspect' | null>(null);
  const [text, setText] = useState('');
  const send = useMutation({
    mutationFn: () =>
      mode === 'question'
        ? landBuyerExtrasApi.askAboutReport(i.id, text)
        : landBuyerExtrasApi.requestReinspection(i.id, text),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.buyerLand.inspections });
      toast.show(
        mode === 'question'
          ? 'Question sent. Sureground will answer here.'
          : 'Reinspection requested.',
        'success'
      );
      setMode(null);
      setText('');
    },
    onError: (e) => toast.show(errorMessage(e, 'That did not go through.'), 'error'),
  });
  const statusLabel =
    LAND_INSPECTION_STATUS_LABELS[i.status as keyof typeof LAND_INSPECTION_STATUS_LABELS] ??
    i.status;
  const r = i.report;
  return (
    <Card style={{ gap: spacing.sm }}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm }}>
        <View style={{ flex: 1, gap: 2 }}>
          <Text variant="bodyStrong">{i.land}</Text>
          <Text variant="caption" color="mutedForeground">
            {i.reference} · {i.city}, {i.state}
            {i.reinspectionOfId ? ' · reinspection' : ''}
            {i.inspector?.name ? ` · ${i.inspector.name}` : ''}
            {i.dueBy && i.status !== 'ACCEPTED' ? ` · due ${formatDate(i.dueBy, 'short')}` : ''}
          </Text>
        </View>
        <Badge
          label={statusLabel}
          tone={i.status === 'ACCEPTED' ? 'success' : i.status === 'CANCELLED' ? 'neutral' : 'info'}
        />
      </View>
      {r && i.status === 'ACCEPTED' ? (
        <View style={{ gap: spacing.sm }}>
          {r.boundaryCondition ? (
            <Badge
              label={LAND_BOUNDARY_LABELS[r.boundaryCondition]}
              tone={boundaryTone(r.boundaryCondition) as BadgeTone}
            />
          ) : null}
          {r.beaconsExpected !== null && r.beaconsExpected !== undefined ? (
            <Text variant="caption" color="mutedForeground">
              Beacons: {r.beaconsFound ?? 0} of {r.beaconsExpected} found
            </Text>
          ) : null}
          {r.summary ? <Text variant="callout">{r.summary}</Text> : null}
          {r.staffNote ? (
            <Text variant="caption" color="mutedForeground">
              Sureground: {r.staffNote}
            </Text>
          ) : null}
          {(r.evidence ?? []).filter((e) => e.mimeType.startsWith('image/')).length ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: spacing.sm }}
            >
              {r
                .evidence!.filter((e) => e.mimeType.startsWith('image/'))
                .map((e) => (
                  <PressableScale
                    key={e.id}
                    onPress={() => Linking.openURL(e.url)}
                    accessibilityRole="imagebutton"
                    accessibilityLabel={e.fileName}
                  >
                    <ExpoImage
                      source={{ uri: e.url }}
                      style={{
                        width: 96,
                        height: 96,
                        borderRadius: radius.md,
                        backgroundColor: colors.secondary,
                      }}
                      contentFit="cover"
                      cachePolicy="memory-disk"
                    />
                  </PressableScale>
                ))}
            </ScrollView>
          ) : null}
        </View>
      ) : null}
      {(i.questions ?? []).map((qn) => (
        <View key={qn.id} style={{ gap: 2 }}>
          <Text variant="callout">You asked: {qn.question}</Text>
          <Text variant="caption" color="mutedForeground">
            {qn.answer
              ? `Sureground${qn.answeredAt ? ` (${formatDate(qn.answeredAt, 'short')})` : ''}: ${qn.answer}`
              : 'Waiting for an answer.'}
          </Text>
        </View>
      ))}
      {i.status === 'ACCEPTED' ? (
        mode ? (
          <View style={{ gap: spacing.sm }}>
            <TextField
              label={
                mode === 'question'
                  ? 'Your question about the report'
                  : 'Why it should be inspected again'
              }
              value={text}
              onChangeText={setText}
              maxLength={2000}
              multiline
              hint="At least 10 characters."
            />
            <View style={{ flexDirection: 'row', gap: spacing.sm }}>
              <Button
                label="Send"
                size="sm"
                loading={send.isPending}
                disabled={!inspectionTextOk(text) || send.isPending}
                onPress={() => send.mutate()}
              />
              <Button label="Back" size="sm" variant="ghost" onPress={() => setMode(null)} />
            </View>
          </View>
        ) : (
          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            <Button
              label="Ask about the report"
              size="sm"
              variant="secondary"
              onPress={() => setMode('question')}
            />
            <Button
              label="Ask for a reinspection"
              size="sm"
              variant="ghost"
              onPress={() => setMode('reinspect')}
            />
          </View>
        )
      ) : null}
      {i.disclaimer ? (
        <Text variant="caption" color="mutedForeground">
          {i.disclaimer}
        </Text>
      ) : null}
    </Card>
  );
}
