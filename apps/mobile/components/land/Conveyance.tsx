import { useState } from 'react';
import { View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { CheckCircle2, Circle, CircleDashed, Clock3, XCircle } from 'lucide-react-native';
import { Badge, Button, FormAlert, Text, TextField, useTheme } from '@getrentos/ui-native';
import { qk } from '@/lib/query/keys';
import {
  CONDITION_STATUS,
  conditionOpen,
  formatBps,
  MILESTONE_STATUS,
  type ChecklistItem,
  type ClosingCondition,
  type Milestone,
  type MilestoneStatus,
} from '@/lib/api/landSales';
import { documentTypeLabel, ownerLandApi } from '@/lib/api/ownerLand';
import { formatDate } from '@/lib/format';
import { ChipSelect } from '@/components/landlord/ChipSelect';

const STEP_ICON: Record<
  MilestoneStatus,
  { Icon: typeof Circle; tone: 'success' | 'destructive' | 'info' | 'mutedForeground' }
> = {
  PENDING: { Icon: Circle, tone: 'mutedForeground' },
  DELIVERED: { Icon: Clock3, tone: 'info' },
  CONFIRMED: { Icon: CheckCircle2, tone: 'success' },
  DISPUTED: { Icon: XCircle, tone: 'destructive' },
  WAIVED: { Icon: CheckCircle2, tone: 'mutedForeground' },
};

/**
 * The conveyance steps of a land sale. The seller marks a step delivered; the
 * buyer confirms it (or disputes it), which is what releases escrow.
 */
export function MilestoneList({
  milestones,
  deliverability,
  onDeliver,
  showRelease = false,
}: {
  milestones: Milestone[];
  deliverability: (m: Milestone) => { allowed: boolean; reason?: string };
  onDeliver: (m: Milestone) => void;
  showRelease?: boolean;
}) {
  const { colors, spacing } = useTheme();
  const ordered = [...milestones].sort((a, b) => a.sequence - b.sequence);
  return (
    <View style={{ gap: spacing.md }}>
      {ordered.map((m) => {
        const { Icon, tone } = STEP_ICON[m.status] ?? STEP_ICON.PENDING;
        const status = MILESTONE_STATUS[m.status] ?? MILESTONE_STATUS.PENDING;
        const actionable = m.status === 'PENDING' || m.status === 'DISPUTED';
        const { allowed, reason } = actionable
          ? deliverability(m)
          : { allowed: false, reason: undefined };
        const facts = [
          showRelease && m.releaseBps > 0
            ? `Releases ${formatBps(m.releaseBps)} of the price`
            : null,
          m.deliveredAt ? `Delivered ${formatDate(m.deliveredAt, 'short')}` : null,
          m.confirmedAt ? `Confirmed ${formatDate(m.confirmedAt, 'short')}` : null,
          m.documentId ? 'Document attached' : null,
        ].filter(Boolean);
        return (
          <View key={m.key} style={{ flexDirection: 'row', gap: spacing.sm }}>
            <Icon size={18} color={colors[tone]} style={{ marginTop: 2 }} />
            <View style={{ flex: 1, gap: 4 }}>
              <Text variant="callout" style={{ fontWeight: '600' }}>
                {m.label}
                {m.required ? '' : ' (optional)'}
              </Text>
              <View
                style={{
                  flexDirection: 'row',
                  flexWrap: 'wrap',
                  gap: spacing.xs,
                  alignItems: 'center',
                }}
              >
                <Badge label={status.label} tone={status.tone} />
                {facts.length ? (
                  <Text variant="caption" color="mutedForeground">
                    {facts.join(' · ')}
                  </Text>
                ) : null}
              </View>
              {m.note ? (
                <Text variant="caption" color="mutedForeground">
                  {m.note}
                </Text>
              ) : null}
              {m.status === 'DISPUTED' && m.disputeReason ? (
                <FormAlert tone="error" title="Buyer disputed" message={m.disputeReason} />
              ) : null}
              {actionable && !allowed && reason ? (
                <Text variant="caption" color="mutedForeground">
                  {reason}
                </Text>
              ) : null}
              {actionable && allowed ? (
                <Button
                  label={m.status === 'DISPUTED' ? 'Deliver again' : 'Mark delivered'}
                  size="sm"
                  variant={m.status === 'DISPUTED' ? 'secondary' : 'primary'}
                  onPress={() => onDeliver(m)}
                  style={{ alignSelf: 'flex-start' }}
                />
              ) : null}
            </View>
          </View>
        );
      })}
    </View>
  );
}

const CHECK_ICON = { DONE: CheckCircle2, OPEN: CircleDashed, BLOCKED: XCircle } as const;

/**
 * Conditions precedent on a land sale, and the closing checklist. The seller
 * marks the conditions they deliver as met, with a note the buyer can check.
 */
export function ConditionsList({
  conditions,
  checklist,
  busyKey,
  onDeliver,
  sellerLabel = 'Developer',
}: {
  conditions: ClosingCondition[];
  checklist?: ChecklistItem[];
  busyKey: string | null;
  onDeliver: (key: string, note: string) => void;
  sellerLabel?: string;
}) {
  const { colors, spacing } = useTheme();
  const [delivering, setDelivering] = useState<string | null>(null);
  const [note, setNote] = useState('');
  if (conditions.length === 0) return null;
  return (
    <View style={{ gap: spacing.md }}>
      {conditions.map((c) => {
        const status =
          c.failed && conditionOpen(c) ? CONDITION_STATUS.FAILED : CONDITION_STATUS[c.status];
        return (
          <View key={c.key} style={{ gap: 4 }}>
            <View style={{ flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' }}>
              <Text variant="callout" style={{ flex: 1, fontWeight: '600' }}>
                {c.label}
              </Text>
              <Badge label={status.label} tone={status.tone} />
            </View>
            {c.basis ? (
              <Text variant="caption" color="mutedForeground">
                {c.basis}
              </Text>
            ) : c.deadline && conditionOpen(c) ? (
              <Text variant="caption" color="mutedForeground">
                Due by {formatDate(c.deadline)}
              </Text>
            ) : null}
            {c.deliveredNote ? (
              <Text variant="caption" color="mutedForeground">
                {sellerLabel}: “{c.deliveredNote}”
              </Text>
            ) : null}
            {c.note ? (
              <Text variant="caption" color="mutedForeground">
                {c.note}
              </Text>
            ) : null}
            {c.deliveredByDeveloper && c.status === 'PENDING' ? (
              delivering === c.key ? (
                <View style={{ gap: spacing.sm }}>
                  <TextField
                    placeholder="What was done, so the buyer can check it"
                    value={note}
                    onChangeText={setNote}
                    multiline
                    maxLength={2000}
                  />
                  <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                    <Button
                      label="Mark met"
                      size="sm"
                      loading={busyKey === c.key}
                      onPress={() => {
                        onDeliver(c.key, note.trim());
                        setDelivering(null);
                        setNote('');
                      }}
                    />
                    <Button
                      label="Cancel"
                      size="sm"
                      variant="ghost"
                      onPress={() => setDelivering(null)}
                    />
                  </View>
                </View>
              ) : (
                <Button
                  label="Mark met"
                  size="sm"
                  variant="secondary"
                  onPress={() => setDelivering(c.key)}
                  style={{ alignSelf: 'flex-start' }}
                />
              )
            ) : null}
          </View>
        );
      })}
      {conditions[0].remedy ? (
        <Text variant="caption" color="mutedForeground">
          {conditions[0].remedy}
        </Text>
      ) : null}
      {checklist?.length ? (
        <View style={{ gap: spacing.sm }}>
          <Text variant="bodyStrong">Closing checklist</Text>
          {checklist.map((item) => {
            const Icon = CHECK_ICON[item.state] ?? CircleDashed;
            const color =
              item.state === 'DONE'
                ? colors.success
                : item.state === 'BLOCKED'
                  ? colors.destructive
                  : colors.mutedForeground;
            return (
              <View key={item.key} style={{ flexDirection: 'row', gap: spacing.sm }}>
                <Icon size={16} color={color} style={{ marginTop: 2 }} />
                <Text variant="callout" style={{ flex: 1 }}>
                  {item.label}
                  {item.detail ? (
                    <Text variant="callout" color="mutedForeground">
                      {' '}
                      · {item.detail}
                    </Text>
                  ) : null}
                </Text>
              </View>
            );
          })}
        </View>
      ) : null}
    </View>
  );
}

/**
 * Marking a step delivered: an optional note to the buyer and, when the land
 * is known, one of its documents as evidence.
 */
export function DeliverForm({
  milestone,
  propertyId,
  saving,
  onDeliver,
}: {
  milestone: Milestone;
  propertyId?: string | null;
  saving: boolean;
  onDeliver: (input: { note?: string; documentId?: string }) => void;
}) {
  const { spacing } = useTheme();
  const [note, setNote] = useState('');
  const [documentId, setDocumentId] = useState(milestone.documentId ?? '');
  const docs = useQuery({
    queryKey: qk.owner.landDocuments(propertyId ?? ''),
    queryFn: () => ownerLandApi.documents(propertyId!),
    enabled: !!propertyId,
  });
  const options = (docs.data ?? []).map((d) => ({
    value: d.id,
    label: `${documentTypeLabel(d.documentType)} · ${d.name}`,
  }));
  return (
    <View style={{ gap: spacing.lg }}>
      <Text variant="callout" color="mutedForeground">
        The buyer is asked to confirm this step. Its share is released to you only once they do, and
        they can dispute it if it was not done.
      </Text>
      <TextField
        label="Note to the buyer (optional)"
        placeholder="What was done, where, and anything the buyer should check"
        value={note}
        onChangeText={setNote}
        multiline
        maxLength={2000}
      />
      {propertyId ? (
        <ChipSelect
          label="Evidence document (optional)"
          options={options}
          value={documentId || undefined}
          onChange={(id) => setDocumentId(id === documentId ? '' : id)}
          emptyText={
            docs.isLoading
              ? 'Loading documents…'
              : 'No documents on this land yet. Add them from the parcel page.'
          }
        />
      ) : null}
      <Button
        label="Mark delivered"
        loading={saving}
        disabled={saving}
        onPress={() =>
          onDeliver({
            ...(note.trim() ? { note: note.trim() } : {}),
            ...(documentId ? { documentId } : {}),
          })
        }
      />
    </View>
  );
}
