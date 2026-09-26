import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';
import { ChevronRight } from 'lucide-react-native';
import { Card, Text, useTheme } from '@getrentos/ui-native';

export interface SettingsItem {
  key: string;
  label: string;
  description?: string;
  icon: LucideIcon;
  onPress: () => void;
  /** Short value shown on the right, e.g. "72 / 100" or "Verified". */
  value?: string;
  tone?: 'default' | 'success' | 'warning';
}

/** A titled group of navigation rows — the building block of every account screen. */
export function SettingsGroup({
  title,
  items,
  footer,
}: {
  title: string;
  items: SettingsItem[];
  footer?: ReactNode;
}) {
  const { spacing } = useTheme();
  return (
    <View style={{ gap: spacing.sm }}>
      <Text
        variant="label"
        color="mutedForeground"
        uppercase
        accessibilityRole="header"
        style={{ marginLeft: spacing.xs }}
      >
        {title}
      </Text>
      <Card elevated padding="none">
        {items.map((item, i) => (
          <SettingsRow key={item.key} item={item} first={i === 0} />
        ))}
        {footer}
      </Card>
    </View>
  );
}

function SettingsRow({ item, first }: { item: SettingsItem; first: boolean }) {
  const { colors, spacing, radius } = useTheme();
  const { icon: Icon, tone = 'default' } = item;
  const toneColor =
    tone === 'success'
      ? colors.success
      : tone === 'warning'
        ? colors.warning
        : colors.mutedForeground;

  return (
    <Pressable
      onPress={item.onPress}
      accessibilityRole="button"
      accessibilityLabel={[item.label, item.value, item.description].filter(Boolean).join(', ')}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        minHeight: 56,
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
        borderTopWidth: first ? 0 : 1,
        borderTopColor: colors.border,
        backgroundColor: pressed ? colors.secondary : 'transparent',
      })}
    >
      <View
        style={{
          width: 34,
          height: 34,
          borderRadius: radius.md,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.accent,
        }}
      >
        <Icon size={17} color={colors.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text variant="bodyStrong">{item.label}</Text>
        {item.description ? (
          <Text variant="caption" color="mutedForeground">
            {item.description}
          </Text>
        ) : null}
      </View>
      {item.value ? (
        <Text variant="caption" style={{ color: toneColor, fontWeight: '700' }}>
          {item.value}
        </Text>
      ) : null}
      <ChevronRight size={18} color={colors.mutedForeground} />
    </Pressable>
  );
}
