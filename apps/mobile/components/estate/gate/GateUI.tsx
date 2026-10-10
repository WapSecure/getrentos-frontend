import { Pressable, Share, View } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { BadgeCheck, Camera, KeyRound, Share2, Sparkles } from 'lucide-react-native';
import { PLAN_TIER_LABELS } from '@getrentos/shared';
import { Button, Card, Chip, Text, useTheme } from '@getrentos/ui-native';
import type { PickedFile } from '@/lib/api/documents';
import type { Gate } from '@/lib/api/estateGate';
import type { PlanTier } from '@/lib/api/estateManager';
import { pickPhoto } from '@/lib/filePicker';

/**
 * What an estate below Enterprise sees instead of a feature it hasn't bought.
 * `current` is the estate's plan when known: the API's refusal first, else the
 * estate's own `planTier`. Nothing gated here is a safety feature, and the copy
 * says so, so a manager never reads the lock as "the gate is unsafe".
 */
export function EnterpriseUpsell({
  feature,
  points,
  current,
  estateName,
}: {
  feature: string;
  points: string[];
  current?: PlanTier;
  estateName?: string;
}) {
  const { colors, spacing } = useTheme();
  return (
    <Card elevated style={{ gap: spacing.md }}>
      <Sparkles size={22} color={colors.primary} />
      <Text variant="heading" accessibilityRole="header">
        {feature} is part of Enterprise
      </Text>
      {current ? (
        <Text variant="callout" color="mutedForeground">
          {estateName ?? 'This estate'} is on {PLAN_TIER_LABELS[current]}.
        </Text>
      ) : null}
      {points.map((p) => (
        <View key={p} style={{ flexDirection: 'row', gap: spacing.sm }}>
          <BadgeCheck size={16} color={colors.success} style={{ marginTop: 2 }} />
          <Text variant="callout" style={{ flex: 1 }}>
            {p}
          </Text>
        </View>
      ))}
      <Button label="See plans" onPress={() => router.push('/(app)/billing')} />
    </Card>
  );
}

/** Which gate something happened at. Hidden until the estate has named its gates. */
export function GateChoice({
  gates,
  value,
  onChange,
}: {
  gates: Gate[] | undefined;
  value: string;
  onChange: (gateId: string) => void;
}) {
  const { spacing } = useTheme();
  if (!gates?.length) return null;
  return (
    <View style={{ gap: spacing.xs }}>
      <Text variant="bodyStrong">Gate</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
        <Chip label="Not specified" selected={!value} onPress={() => onChange('')} />
        {gates.map((g) => (
          <Chip
            key={g.id}
            label={g.name}
            selected={value === g.id}
            onPress={() => onChange(g.id)}
          />
        ))}
      </View>
    </View>
  );
}

/** An optional photo, picked from the library or camera. */
export function PhotoField({
  value,
  onChange,
}: {
  value: PickedFile | null;
  onChange: (file: PickedFile | null) => void;
}) {
  const { colors, spacing, radius } = useTheme();
  return (
    <Pressable
      onPress={async () => onChange((await pickPhoto()) ?? value)}
      accessibilityRole="button"
      accessibilityLabel={value ? 'Photo attached. Choose another' : 'Add a photo, optional'}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        padding: spacing.md,
        borderRadius: radius.md,
        borderWidth: 1,
        borderStyle: 'dashed',
        borderColor: colors.border,
      }}
    >
      <Camera size={18} color={colors.mutedForeground} />
      <Text variant="callout" color={value ? 'foreground' : 'mutedForeground'} style={{ flex: 1 }}>
        {value ? 'Photo attached' : 'Add a photo (optional)'}
      </Text>
    </Pressable>
  );
}

/**
 * A code the API shows exactly once: a regular visitor's PIN, a checkpoint's
 * code. Says so plainly, and offers to share it now, because nothing can
 * fetch it back afterwards.
 */
export function OneTimeCode({
  title,
  code,
  qrDataUrl,
  notes,
  shareLabel = 'Share the code',
  shareMessage,
  onDone,
}: {
  title: string;
  code: string;
  qrDataUrl?: string;
  notes: string[];
  shareLabel?: string;
  shareMessage: string;
  onDone: () => void;
}) {
  const { colors, spacing, radius } = useTheme();
  return (
    <View style={{ gap: spacing.md, alignItems: 'center' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
        <KeyRound size={18} color={colors.primary} />
        <Text variant="bodyStrong">{title}</Text>
      </View>
      {qrDataUrl ? (
        <Image
          source={{ uri: qrDataUrl }}
          accessibilityLabel="The code as a QR code"
          contentFit="contain"
          // Always on white: a QR code needs the contrast in dark mode too.
          style={{ width: 180, height: 180, borderRadius: radius.md, backgroundColor: '#fff' }}
        />
      ) : null}
      <View accessible accessibilityLabel={`Code ${code.split('').join(' ')}`}>
        <Text variant="display" style={{ letterSpacing: 6 }} selectable>
          {code}
        </Text>
      </View>
      {notes.map((n) => (
        <Text key={n} variant="caption" color="mutedForeground" center>
          {n}
        </Text>
      ))}
      <Button
        label={shareLabel}
        icon={<Share2 size={16} color={colors.primaryForeground} />}
        onPress={() => Share.share({ message: shareMessage })}
      />
      <Button label="Done" variant="secondary" onPress={onDone} />
    </View>
  );
}

/** A headline number with its label, for a phone-width row of figures. */
export function StatTile({
  value,
  label,
  tone = 'neutral',
}: {
  value: string | number;
  label: string;
  tone?: 'neutral' | 'danger' | 'success' | 'muted';
}) {
  const { colors, spacing, radius } = useTheme();
  const color =
    tone === 'danger'
      ? colors.destructive
      : tone === 'success'
        ? colors.success
        : tone === 'muted'
          ? colors.mutedForeground
          : colors.foreground;
  return (
    <View
      accessible
      accessibilityLabel={`${value} ${label}`}
      style={{
        flex: 1,
        minWidth: 72,
        padding: spacing.md,
        borderRadius: radius.md,
        backgroundColor: colors.secondary,
        gap: 2,
      }}
    >
      <Text variant="heading" style={{ color }}>
        {value}
      </Text>
      <Text variant="caption" color="mutedForeground">
        {label}
      </Text>
    </View>
  );
}
