import { useState } from 'react';
import { Alert, Linking, RefreshControl, ScrollView, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  AlertTriangle,
  CheckCircle2,
  Circle,
  Clock3,
  FileText,
  Send,
  ShieldCheck,
  XCircle,
} from '@sureground/icons/native';
import {
  Badge,
  Button,
  Card,
  DetailSkeleton,
  ErrorState,
  FormAlert,
  PressableScale,
  QueryState,
  Text,
  useTheme,
  useToast,
} from '@sureground/ui-native';
import { qk } from '@/lib/query/keys';
import {
  ASSURANCE_TIER_LABEL,
  checkProgress,
  DILIGENCE,
  documentTypeLabel,
  LAND_AREA_UNITS,
  LAND_DOCUMENT_TYPES,
  ownerLandApi,
  readyToList,
  REVIEW_PROMPT,
  RISK_BAND,
  type LandCheckStatus,
  type OwnerLandRecord,
} from '@/lib/api/ownerLand';
import { errorMessage } from '@/lib/api/client';
import { pickDocument } from '@/lib/filePicker';
import { formatDate } from '@/lib/format';
import { Sheet } from '@/components/Sheet';
import { ChipSelect } from '@/components/landlord/ChipSelect';
import { ParcelForm } from '@/components/land/ParcelForm';
import { DetailScreenHeader } from '@/components/dashboard/DetailScreenHeader';
import { goBack } from '@/lib/goBack';

export default function OwnerLandParcel() {
  const { propertyId } = useLocalSearchParams<{ propertyId: string }>();
  const { colors, spacing } = useTheme();
  const insets = useSafeAreaInsets();
  const [editing, setEditing] = useState(false);
  // The list endpoint is the only read, so the parcel comes from it.
  const list = useQuery({ queryKey: qk.owner.land, queryFn: () => ownerLandApi.list() });
  const r = list.data?.items.find((x) => x.propertyId === propertyId);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <DetailScreenHeader
        eyebrow="Land"
        title={r?.title ?? 'Parcel'}
        subtitle={r ? `${r.address}, ${r.city}` : undefined}
        onBack={() => goBack()}
      />
      <QueryState
        query={list}
        skeleton={
          <View style={{ paddingHorizontal: spacing.xl }}>
            <DetailSkeleton />
          </View>
        }
        errorTitle="This parcel did not load"
        errorDescription="It may have been removed."
      >
        {!r ? (
          <ErrorState
            title="This parcel did not load"
            description="It may have been removed."
            onRetry={() => list.refetch()}
          />
        ) : (
          <ScrollView
            contentContainerStyle={{
              paddingHorizontal: spacing.xl,
              paddingBottom: insets.bottom + spacing['3xl'],
              gap: spacing.lg,
            }}
            refreshControl={
              <RefreshControl
                refreshing={list.isRefetching}
                onRefresh={() => void list.refetch()}
                tintColor={colors.mutedForeground}
              />
            }
          >
            <ParcelSummary r={r} onEdit={() => setEditing(true)} />
            <ReviewPanel r={r} />
            {readyToList(r) ? (
              <Card style={{ gap: spacing.sm }}>
                <View style={{ flexDirection: 'row', gap: spacing.sm, alignItems: 'center' }}>
                  <ShieldCheck size={18} color={colors.success} />
                  <Text variant="bodyStrong">Ready to list</Text>
                </View>
                <Text variant="callout" color="mutedForeground">
                  This parcel has passed both gates. Create a sale listing the usual way; offers and
                  payment protection work the same.
                </Text>
                <Button
                  label="Open the property to list it"
                  variant="secondary"
                  onPress={() => router.push(`/(app)/owner-property/${r.propertyId}`)}
                />
              </Card>
            ) : null}
            <Documents propertyId={r.propertyId} />
            {r.parcel ? <Risk propertyId={r.propertyId} /> : null}
            {!r.ownershipProofCount ? (
              <FormAlert
                tone="info"
                message="No ownership proof yet. Upload it from the property page; diligence matches it against the title."
              />
            ) : null}
            <Button
              label="Authority to sell"
              variant="secondary"
              onPress={() => router.push(`/(app)/owner-land-authority/${r.propertyId}`)}
            />
            <Button
              label="Estate layout and plots"
              variant="secondary"
              onPress={() => router.push(`/(app)/owner-land-layout/${r.propertyId}`)}
            />
            <Button
              label="Seller analytics"
              variant="secondary"
              onPress={() => router.push(`/(app)/owner-land-analytics/${r.propertyId}`)}
            />
            <Button
              label="Plot sales on this land"
              variant="secondary"
              onPress={() => router.push(`/(app)/owner-land-sales?property=${r.propertyId}`)}
            />
            <Button
              label="Open property"
              variant="ghost"
              onPress={() => router.push(`/(app)/owner-property/${r.propertyId}`)}
            />
          </ScrollView>
        )}
      </QueryState>

      <Sheet open={editing && !!r} onClose={() => setEditing(false)} title="Parcel details">
        {r ? <ParcelForm key={r.propertyId} r={r} onDone={() => setEditing(false)} /> : null}
      </Sheet>
    </View>
  );
}

function ParcelSummary({ r, onEdit }: { r: OwnerLandRecord; onEdit: () => void }) {
  const { spacing } = useTheme();
  const p = r.parcel;
  const unit = LAND_AREA_UNITS.find((u) => u.value === p?.areaUnit)?.label ?? '';
  const facts = p
    ? [
        `${p.areaValue} ${unit}`,
        [p.estateName, p.block && `Block ${p.block}`, p.plotNumber && `Plot ${p.plotNumber}`]
          .filter(Boolean)
          .join(', '),
        p.titleNumber ? `Title ${p.titleNumber}` : null,
      ].filter(Boolean)
    : [];
  return (
    <Card style={{ gap: spacing.sm }}>
      <Text variant="bodyStrong">Parcel</Text>
      {p ? (
        <Text variant="callout" color="mutedForeground">
          {facts.join(' · ')}
        </Text>
      ) : (
        <Text variant="callout" color="mutedForeground">
          Add the parcel’s area and title so review can start.
        </Text>
      )}
      <Button
        label={p ? 'Edit parcel details' : 'Add parcel details'}
        size="sm"
        variant="secondary"
        onPress={onEdit}
      />
    </Card>
  );
}

const CHECK_ICON: Record<LandCheckStatus, { Icon: typeof CheckCircle2; tone: string }> = {
  PASSED: { Icon: CheckCircle2, tone: 'success' },
  FLAGGED: { Icon: XCircle, tone: 'destructive' },
  NOT_APPLICABLE: { Icon: Circle, tone: 'mutedForeground' },
  PENDING: { Icon: Clock3, tone: 'mutedForeground' },
};

function ReviewPanel({ r }: { r: OwnerLandRecord }) {
  const { colors, spacing } = useTheme();
  const qc = useQueryClient();
  const toast = useToast();
  const d = r.parcel?.diligence;
  const status = d?.status ?? 'NOT_STARTED';
  const prompt = REVIEW_PROMPT[status];
  const checks = d?.checks ?? [];
  const progress = checkProgress(checks);
  const blockers = r.submissionBlockers ?? [];
  const canSubmit = r.canSubmitForReview ?? false;

  const submit = useMutation({
    mutationFn: () => ownerLandApi.submitForReview(r.propertyId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.owner.land });
      toast.show('Submitted. Compliance reviews it next.', 'success');
    },
    onError: (e) => toast.show(errorMessage(e, 'Could not submit for review.'), 'error'),
  });

  const title =
    prompt?.title ??
    (status === 'IN_REVIEW'
      ? 'With compliance for review'
      : d?.assuranceTier
        ? ASSURANCE_TIER_LABEL[d.assuranceTier]
        : DILIGENCE[status].label);

  return (
    <Card style={{ gap: spacing.md }}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm }}>
        <View style={{ flex: 1, gap: 2 }}>
          <Text variant="caption" color="mutedForeground">
            DILIGENCE REVIEW
          </Text>
          <Text variant="bodyStrong">{title}</Text>
        </View>
        <Badge label={DILIGENCE[status].label} tone={DILIGENCE[status].tone} />
      </View>
      {prompt ? (
        <Text variant="callout" color="mutedForeground">
          {prompt.body}
        </Text>
      ) : null}
      {status === 'IN_REVIEW' ? (
        <Text variant="callout" color="mutedForeground">
          {d?.submittedAt ? `Submitted ${formatDate(d.submittedAt)}. ` : ''}
          {d?.slaDueAt ? `Review expected by ${formatDate(d.slaDueAt)}.` : ''}
        </Text>
      ) : null}
      {status === 'VERIFIED' && d?.expiresAt ? (
        <Text variant="callout" color="mutedForeground">
          Valid until {formatDate(d.expiresAt)}. We will remind you before it lapses.
        </Text>
      ) : null}
      {d?.findings && (status === 'ACTION_REQUIRED' || status === 'REJECTED') ? (
        <FormAlert tone="warning" title="Findings from compliance" message={d.findings} />
      ) : null}

      {checks.length ? (
        <View style={{ gap: spacing.sm }}>
          <Text variant="caption" color="mutedForeground">
            {progress.done} of {progress.required} required checks complete
          </Text>
          {checks.map((c) => {
            const { Icon, tone } = CHECK_ICON[c.status] ?? CHECK_ICON.PENDING;
            return (
              <View key={c.key} style={{ flexDirection: 'row', gap: spacing.sm }}>
                <Icon
                  size={16}
                  color={colors[tone as 'success' | 'destructive' | 'mutedForeground']}
                  style={{ marginTop: 2 }}
                />
                <View style={{ flex: 1 }}>
                  <Text variant="callout">
                    {c.label}
                    {c.required ? '' : ' (optional)'}
                  </Text>
                  {c.status === 'FLAGGED' && c.note ? (
                    <Text variant="caption" style={{ color: colors.destructive }}>
                      {c.note}
                    </Text>
                  ) : null}
                </View>
              </View>
            );
          })}
        </View>
      ) : null}

      {prompt ? (
        <View style={{ gap: spacing.sm }}>
          {!canSubmit
            ? blockers.map((b) => (
                <View key={b} style={{ flexDirection: 'row', gap: spacing.sm }}>
                  <AlertTriangle size={16} color={colors.warning} style={{ marginTop: 2 }} />
                  <Text variant="callout" color="mutedForeground" style={{ flex: 1 }}>
                    {b}
                  </Text>
                </View>
              ))
            : null}
          <Button
            label={prompt.action}
            icon={<Send size={16} color={colors.primaryForeground} />}
            loading={submit.isPending}
            disabled={!canSubmit || submit.isPending}
            onPress={() => submit.mutate()}
          />
        </View>
      ) : null}
    </Card>
  );
}

function Documents({ propertyId }: { propertyId: string }) {
  const { colors, spacing } = useTheme();
  const qc = useQueryClient();
  const toast = useToast();
  const [type, setType] = useState('CERTIFICATE_OF_OCCUPANCY');
  const [adding, setAdding] = useState(false);
  const docs = useQuery({
    queryKey: qk.owner.landDocuments(propertyId),
    queryFn: () => ownerLandApi.documents(propertyId),
  });
  const refresh = () => {
    qc.invalidateQueries({ queryKey: qk.owner.landDocuments(propertyId) });
    // A new title document can clear a submission blocker.
    qc.invalidateQueries({ queryKey: qk.owner.land });
  };

  const upload = useMutation({
    mutationFn: async () => {
      const file = await pickDocument();
      if (!file) return null;
      return ownerLandApi.uploadDocument(propertyId, type, file);
    },
    onSuccess: (doc) => {
      if (!doc) return;
      setAdding(false);
      refresh();
      toast.show('Document uploaded.', 'success');
    },
    onError: (e) =>
      toast.show(e instanceof Error ? e.message : 'Could not upload the document.', 'error'),
  });
  const remove = useMutation({
    mutationFn: (id: string) => ownerLandApi.deleteDocument(propertyId, id),
    onSuccess: () => {
      refresh();
      toast.show('Document removed.', 'success');
    },
    onError: (e) => toast.show(errorMessage(e, 'Could not remove the document.'), 'error'),
  });

  const list = docs.data ?? [];
  return (
    <Card style={{ gap: spacing.md }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
        <Text variant="bodyStrong" style={{ flex: 1 }}>
          Documents
        </Text>
        <Button label="Add" size="sm" variant="secondary" onPress={() => setAdding(true)} />
      </View>
      <Text variant="caption" color="mutedForeground">
        The title, survey plan and reports diligence relies on. PDF or images, up to 20 MB.
      </Text>
      {docs.isLoading ? (
        <Text variant="caption" color="mutedForeground">
          Loading…
        </Text>
      ) : list.length === 0 ? (
        <Text variant="callout" color="mutedForeground">
          No documents yet.
        </Text>
      ) : (
        list.map((doc) => (
          <View
            key={doc.id}
            style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}
          >
            <FileText size={16} color={colors.mutedForeground} />
            <PressableScale
              style={{ flex: 1 }}
              onPress={() => Linking.openURL(doc.url)}
              accessibilityRole="link"
              accessibilityLabel={`Open ${doc.name}`}
            >
              <Text variant="callout" numberOfLines={1}>
                {documentTypeLabel(doc.documentType)}
              </Text>
              <Text variant="caption" color="mutedForeground" numberOfLines={1}>
                {doc.name} · {formatDate(doc.uploadedAt, 'short')}
              </Text>
            </PressableScale>
            {doc.canDelete ? (
              <Button
                label="Remove"
                size="sm"
                variant="ghost"
                loading={remove.isPending && remove.variables === doc.id}
                onPress={() =>
                  Alert.alert('Remove this document?', doc.name, [
                    { text: 'Keep it', style: 'cancel' },
                    { text: 'Remove', style: 'destructive', onPress: () => remove.mutate(doc.id) },
                  ])
                }
              />
            ) : null}
          </View>
        ))
      )}

      <Sheet open={adding} onClose={() => setAdding(false)} title="Add a document">
        <View style={{ gap: spacing.lg }}>
          <ChipSelect
            label="What it is"
            options={LAND_DOCUMENT_TYPES}
            value={type}
            onChange={setType}
          />
          <Button
            label="Choose the file"
            loading={upload.isPending}
            disabled={upload.isPending}
            onPress={() => upload.mutate()}
          />
        </View>
      </Sheet>
    </Card>
  );
}

function Risk({ propertyId }: { propertyId: string }) {
  const { spacing } = useTheme();
  const q = useQuery({
    queryKey: qk.owner.landRisk(propertyId),
    queryFn: () => ownerLandApi.risk(propertyId),
    retry: false,
  });
  if (!q.data) return null;
  const r = q.data;
  return (
    <Card style={{ gap: spacing.sm }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
        <Text variant="bodyStrong" style={{ flex: 1 }}>
          Risk assessment · {r.score}/100
        </Text>
        <Badge label={RISK_BAND[r.band].label} tone={RISK_BAND[r.band].tone} />
      </View>
      <Text variant="caption" color="mutedForeground">
        {r.assuranceTier
          ? `Assurance: ${ASSURANCE_TIER_LABEL[r.assuranceTier]}`
          : 'No assurance tier until diligence is verified and in date.'}
      </Text>
      {r.factors.length ? (
        r.factors.map((f) => (
          <View key={f.factor} style={{ flexDirection: 'row', gap: spacing.sm }}>
            <Text variant="callout" style={{ flex: 1 }}>
              {f.factor}
            </Text>
            <Text variant="callout" color="mutedForeground">
              +{f.points}
            </Text>
          </View>
        ))
      ) : (
        <Text variant="callout" color="mutedForeground">
          No risk factors found.
        </Text>
      )}
      <Text variant="caption" color="mutedForeground">
        Checks: {r.inputs.checks.passed} passed, {r.inputs.checks.flagged} flagged,{' '}
        {r.inputs.checks.pending} pending of {r.inputs.checks.total}.
      </Text>
    </Card>
  );
}
