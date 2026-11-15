import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';
import type { SgIcon } from '@sureground/icons/native';
import { ChevronRight } from '@sureground/icons/native';
import { Card, IconTile, Text, useTheme } from '@sureground/ui-native';

export interface SettingsItem {
  key: string;
  label: string;
  description?: string;
  icon: SgIcon;
  onPress: () => void;
  value?: string;
  tone?: 'default' | 'success' | 'warning';
}

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
  const { colors, spacing } = useTheme();
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
      <IconTile Icon={Icon} />
      <View style={{ flex: 1 }}>
        <Text variant="bodyStrong">{item.label}</Text>
        {item.description ? (
          <Text variant="caption" color="mutedForeground">
            {item.description}
          </Text>
        ) : null}
      </View>
      {item.value ? (
        // One line and at most ~40% of the row, so a long value (an estate's name) never squeezes the label.
        <Text
          variant="caption"
          numberOfLines={1}
          style={{ color: toneColor, fontWeight: '700', flexShrink: 1, maxWidth: '40%' }}
        >
          {item.value}
        </Text>
      ) : null}
      <ChevronRight size={18} color={colors.mutedForeground} />
    </Pressable>
  );
}
