import { useEffect, useSyncExternalStore } from 'react';
import { Pressable, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CheckCircle2, ChevronRight, type SgIcon } from '@sureground/icons/native';
import { Card, IconTile, LinkButton, Progress, Text, useTheme } from '@sureground/ui-native';

export interface GetStartedStep {
  title: string;
  body: string;
  Icon: SgIcon;
  onPress?: () => void;
  /** Set on every step to track progress; the card hides itself once all are done. */
  done?: boolean;
}

const keyFor = (id: string) => `sureground.getStarted.${id}`;
const dismissed = new Map<string, boolean>();
const listeners = new Set<() => void>();

function emit(id: string, value: boolean) {
  dismissed.set(id, value);
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** `null` while reading storage, so a dismissed card never flashes. */
export function useGetStartedDismissed(id: string): boolean | null {
  const value = useSyncExternalStore(subscribe, () => dismissed.get(id) ?? null);
  useEffect(() => {
    if (dismissed.has(id)) return;
    AsyncStorage.getItem(keyFor(id))
      .then((stored) => {
        if (!dismissed.has(id)) emit(id, stored === '1');
      })
      .catch(() => {
        if (!dismissed.has(id)) emit(id, false);
      });
  }, [id]);
  return value;
}

function dismiss(id: string) {
  emit(id, true);
  AsyncStorage.setItem(keyFor(id), '1').catch(() => undefined);
}

function StepRow({ step }: { step: GetStartedStep }) {
  const { colors, spacing } = useTheme();
  const row = {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: spacing.md,
    minHeight: 64,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  };

  if (step.done) {
    return (
      <View accessible accessibilityLabel={`${step.title}, done`} style={row}>
        <IconTile Icon={CheckCircle2} tone="success" />
        <View style={{ flex: 1, gap: 2 }}>
          <Text variant="callout" color="mutedForeground" style={{ fontWeight: '600' }}>
            {step.title}
          </Text>
          <Text variant="caption" color="mutedForeground">
            Done
          </Text>
        </View>
      </View>
    );
  }

  const content = (
    <>
      <IconTile Icon={step.Icon} />
      <View style={{ flex: 1, gap: 2 }}>
        <Text variant="callout" style={{ fontWeight: '600' }}>
          {step.title}
        </Text>
        <Text variant="caption" color="mutedForeground">
          {step.body}
        </Text>
      </View>
    </>
  );
  if (!step.onPress) return <View style={row}>{content}</View>;
  return (
    <Pressable
      onPress={step.onPress}
      accessibilityRole="button"
      accessibilityLabel={`${step.title}. ${step.body}`}
      style={({ pressed }) => [row, { opacity: pressed ? 0.6 : 1 }]}
    >
      {content}
      <ChevronRight size={18} color={colors.mutedForeground} />
    </Pressable>
  );
}

// Shown on a new account's first visits until the person says they have it.
export function GetStartedCard({
  id,
  description,
  steps,
}: {
  /** Names the dismissal in storage, per portal. */
  id: string;
  description: string;
  steps: GetStartedStep[];
}) {
  const { spacing } = useTheme();
  const isDismissed = useGetStartedDismissed(id);
  const tracked = steps.every((step) => step.done !== undefined);
  const doneCount = steps.filter((step) => step.done).length;
  if (isDismissed !== false || (tracked && doneCount === steps.length)) return null;

  const progressLabel = `${doneCount} of ${steps.length} done`;
  return (
    <Card elevated padding="none">
      <View style={{ padding: spacing.lg, paddingBottom: spacing.sm, gap: spacing.sm }}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md }}>
          <View style={{ flex: 1, gap: spacing.xxs }}>
            <Text headingLevel={2} variant="heading">
              Get started
            </Text>
            <Text variant="callout" color="mutedForeground">
              {description}
            </Text>
          </View>
          <LinkButton
            label="Got it"
            accessibilityLabel="Got it, hide get started"
            onPress={() => dismiss(id)}
          />
        </View>
        {tracked ? (
          <View style={{ gap: spacing.xs }}>
            <Text variant="caption" color="mutedForeground">
              {progressLabel}
            </Text>
            <Progress value={doneCount / steps.length} accessibilityLabel={progressLabel} />
          </View>
        ) : null}
      </View>
      {steps.map((step) => (
        <StepRow key={step.title} step={step} />
      ))}
    </Card>
  );
}
