import { useState } from 'react';
import { Alert, View } from 'react-native';
import { CheckCircle2, Circle, CircleDashed, Clock3, XCircle } from 'lucide-react-native';
import { Badge, Button, FormAlert, Text, TextField, useTheme } from '@sureground/ui-native';
import {
  CONDITION_STATUS,
  conditionOpen,
  formatBps,
  type ChecklistItem,
  type ClosingCondition,
  type Milestone,
} from '@/lib/api/landSales';
import {
  BUYER_MILESTONE_STATUS,
  DISPUTE_MAX,
  DISPUTE_MIN,
  milestoneAction,
} from '@/lib/api/landBuyer';
import { formatDate } from '@/lib/format';
import { Sheet } from '@/components/Sheet';

const ICON = {
  PENDING: { Icon: Circle, tone: 'mutedForeground' as const },
  DELIVERED: { Icon: Clock3, tone: 'warning' as const },
  CONFIRMED: { Icon: CheckCircle2, tone: 'success' as const },
  DISPUTED: { Icon: XCircle, tone: 'destructive' as const },
  WAIVED: { Icon: CheckCircle2, tone: 'mutedForeground' as const },
};

/**
 * Conveyance steps from the buyer's side: confirm a step once it is in hand
 * (which may release money to the seller) or dispute it. Steps are confirmed
 * in order.
 */
export function BuyerMilestones({
  milestones,
  contractOpen,
  requiredOnly = false,
  showRelease = false,
  seller = 'developer',
  busyKey,
  onConfirm,
  onDispute,
}: {
  milestones: Milestone[];
  contractOpen: boolean;
  requiredOnly?: boolean;
  showRelease?: boolean;
  seller?: string;
  busyKey: string | null;
  onConfirm: (m: Milestone) => void;
  onDispute: (m: Milestone, reason: string) => void;
}) {
  const { colors, spacing } = useTheme();
  const [disputing, setDisputing] = useState<Milestone | null>(null);
  const ordered = [...milestones].sort((a, b) => a.sequence - b.sequence);
  if (ordered.length === 0) {
    return (
      <Text variant="callout" color="mutedForeground">
        No conveyance steps have been set up yet.
      </Text>
    );
  }

  const confirm = (m: Milestone) => {
    const release = showRelease && m.releaseBps > 0;
    Alert.alert(
      `Confirm “${m.label}”?`,
      release
        ? `Only confirm once you have it in hand. Confirming releases ${formatBps(m.releaseBps)} of the price held by Sureground to the ${seller}, and cannot be undone.`
        : 'Only confirm once you have it in hand. Confirming tells us the step is done and cannot be undone.',
      [
        { text: 'Not yet', style: 'cancel' },
        { text: 'Confirm step', onPress: () => onConfirm(m) },
      ]
    );
  };

  return (
    <View style={{ gap: spacing.md }}>
      {ordered.map((m) => {
        const { Icon, tone } = ICON[m.status] ?? ICON.PENDING;
        const status = BUYER_MILESTONE_STATUS[m.status] ?? BUYER_MILESTONE_STATUS.PENDING;
        const a = milestoneAction(milestones, m, { requiredOnly, contractOpen });
        const facts = [
          showRelease && m.releaseBps > 0
            ? `Releases ${formatBps(m.releaseBps)} of the price to the ${seller}`
            : null,
          m.deliveredAt ? `Delivered ${formatDate(m.deliveredAt, 'short')}` : null,
          m.confirmedAt ? `Confirmed ${formatDate(m.confirmedAt, 'short')}` : null,
        ].filter(Boolean);
        return (
          <View key={m.key} style={{ flexDirection: 'row', gap: spacing.sm }}>
            <Icon size={18} color={colors[tone]} style={{ marginTop: 2 }} />
            <View style={{ flex: 1, gap: 4 }}>
              <Text variant="callout" style={{ fontWeight: '600' }}>
                {m.label}
                {m.required ? '' : ' (optional)'}
              </Text>
              <Badge label={status.label} tone={status.tone} />
              {facts.length ? (
                <Text variant="caption" color="mutedForeground">
                  {facts.join(' · ')}
                </Text>
              ) : null}
              {m.note ? (
                <Text variant="caption" color="mutedForeground">
                  Seller’s note: {m.note}
                </Text>
              ) : null}
              {m.status === 'DISPUTED' && m.disputeReason ? (
                <Text variant="caption" style={{ color: colors.destructive }}>
                  You disputed this: {m.disputeReason}
                </Text>
              ) : null}
              {a.blockedBy.length ? (
                <Text variant="caption" color="mutedForeground">
                  Confirm earlier steps first: {a.blockedBy.join('; ')}.
                </Text>
              ) : null}
              {a.canDispute ? (
                <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                  <Button
                    label="Confirm"
                    size="sm"
                    loading={busyKey === m.key}
                    disabled={!a.canConfirm || !!busyKey}
                    onPress={() => confirm(m)}
                  />
                  <Button
                    label="Dispute"
                    size="sm"
                    variant="secondary"
                    disabled={!!busyKey}
                    onPress={() => setDisputing(m)}
                  />
                </View>
              ) : null}
            </View>
          </View>
        );
      })}
      <Sheet
        open={!!disputing}
        onClose={() => setDisputing(null)}
        title={disputing ? `Dispute “${disputing.label}”` : ''}
      >
        {disputing ? (
          <DisputeForm
            key={disputing.key}
            seller={seller}
            busy={busyKey === disputing.key}
            onSubmit={(reason) => {
              onDispute(disputing, reason);
              setDisputing(null);
            }}
          />
        ) : null}
      </Sheet>
    </View>
  );
}

function DisputeForm({
  seller,
  busy,
  onSubmit,
}: {
  seller: string;
  busy: boolean;
  onSubmit: (reason: string) => void;
}) {
  const { spacing } = useTheme();
  const [reason, setReason] = useState('');
  const len = reason.trim().length;
  return (
    <View style={{ gap: spacing.lg }}>
      <Text variant="callout" color="mutedForeground">
        Tell the {seller} what is wrong with this step. No money is released for it while it is
        disputed; they will deliver it again.
      </Text>
      <TextField
        label="What is wrong?"
        placeholder="e.g. The deed names the wrong plot number."
        value={reason}
        onChangeText={setReason}
        multiline
        maxLength={DISPUTE_MAX}
        hint={`${len}/${DISPUTE_MAX}`}
        required
      />
      <Button
        label="Dispute step"
        variant="destructive"
        loading={busy}
        disabled={len < DISPUTE_MIN || busy}
        onPress={() => onSubmit(reason.trim())}
      />
    </View>
  );
}

const CHECK_ICON = { DONE: CheckCircle2, OPEN: CircleDashed, BLOCKED: XCircle } as const;

/** Conditions precedent from the buyer's side: confirm a delivered one, or waive it. */
export function BuyerConditions({
  conditions,
  checklist,
  seller = 'Developer',
  busyKey,
  onSettle,
}: {
  conditions: ClosingCondition[];
  checklist?: ChecklistItem[];
  seller?: string;
  busyKey: string | null;
  onSettle: (key: string, how: 'confirm' | 'waive') => void;
}) {
  const { colors, spacing } = useTheme();
  return (
    <View style={{ gap: spacing.md }}>
      {conditions.map((c) => {
        const open = conditionOpen(c);
        const status = c.failed && open ? CONDITION_STATUS.FAILED : CONDITION_STATUS[c.status];
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
            ) : c.deadline && open ? (
              <Text variant="caption" color="mutedForeground">
                Due by {formatDate(c.deadline)}
              </Text>
            ) : null}
            {c.deliveredNote ? (
              <Text variant="caption" color="mutedForeground">
                {seller}: “{c.deliveredNote}”
              </Text>
            ) : null}
            {c.note ? (
              <Text variant="caption" color="mutedForeground">
                {c.note}
              </Text>
            ) : null}
            {open && !c.failed ? (
              <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                {c.status === 'DELIVERED' ? (
                  <Button
                    label="Confirm it is met"
                    size="sm"
                    loading={busyKey === c.key}
                    disabled={!!busyKey}
                    onPress={() => onSettle(c.key, 'confirm')}
                  />
                ) : null}
                <Button
                  label="Waive this condition"
                  size="sm"
                  variant="ghost"
                  disabled={!!busyKey}
                  onPress={() =>
                    Alert.alert('Waive this condition?', c.label, [
                      { text: 'Keep it', style: 'cancel' },
                      { text: 'Waive', onPress: () => onSettle(c.key, 'waive') },
                    ])
                  }
                />
              </View>
            ) : null}
          </View>
        );
      })}
      {conditions[0]?.remedy ? (
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
                  {item.detail ? ` · ${item.detail}` : ''}
                </Text>
              </View>
            );
          })}
        </View>
      ) : null}
    </View>
  );
}

/** A small "the money is held" note shown above the steps. */
export function HeldNote({ text }: { text: string }) {
  return <FormAlert tone="info" message={text} />;
}
