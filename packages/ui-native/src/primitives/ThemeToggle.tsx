import { Platform, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Moon, Sun, SunMedium } from 'lucide-react-native';
import { useTheme, type ThemePreference } from '../theme';
import { Text } from './Text';
import { PressableScale } from './PressableScale';

const ORDER: ThemePreference[] = ['system', 'light', 'dark'];
const META: Record<ThemePreference, { label: string; Icon: typeof Sun }> = {
  system: { label: 'Auto', Icon: SunMedium },
  light: { label: 'Light', Icon: Sun },
  dark: { label: 'Dark', Icon: Moon },
};

export interface ThemeToggleProps {
  /** `pill` = one compact button that cycles; `segmented` = three options. */
  variant?: 'pill' | 'segmented';
  /** Hide the text label on the pill (icon only). */
  compact?: boolean;
}

/**
 * Appearance control backed by the theme context. `pill` suits a screen header
 * (tap to cycle Auto → Light → Dark); `segmented` suits a settings row.
 */
export function ThemeToggle({ variant = 'pill', compact = false }: ThemeToggleProps) {
  const { colors, radius, preference, setPreference } = useTheme();

  const change = (next: ThemePreference) => {
    if (next === preference) return;
    if (Platform.OS !== 'web') Haptics.selectionAsync().catch(() => undefined);
    setPreference(next);
  };

  if (variant === 'segmented') {
    return (
      <View
        style={{
          flexDirection: 'row',
          backgroundColor: colors.secondary,
          borderRadius: radius.md,
          padding: 4,
          gap: 4,
        }}
      >
        {ORDER.map((key) => {
          const active = preference === key;
          const { label, Icon } = META[key];
          return (
            <PressableScale
              key={key}
              haptic={false}
              onPress={() => change(key)}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              accessibilityLabel={`${label} appearance`}
              style={{
                flex: 1,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                paddingVertical: 10,
                borderRadius: radius.sm,
                backgroundColor: active ? colors.card : 'transparent',
              }}
            >
              <Icon size={16} color={active ? colors.primary : colors.mutedForeground} />
              <Text
                variant="callout"
                style={{
                  color: active ? colors.foreground : colors.mutedForeground,
                  fontWeight: active ? '700' : '500',
                }}
              >
                {label}
              </Text>
            </PressableScale>
          );
        })}
      </View>
    );
  }

  const { label, Icon } = META[preference];
  const next = ORDER[(ORDER.indexOf(preference) + 1) % ORDER.length];

  return (
    <PressableScale
      haptic={false}
      onPress={() => change(next)}
      accessibilityRole="button"
      accessibilityLabel={`Appearance: ${label}. Tap to switch.`}
      hitSlop={8}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 7,
        paddingVertical: 8,
        paddingHorizontal: compact ? 8 : 12,
        borderRadius: radius.full,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.card,
      }}
    >
      <Icon size={16} color={colors.foreground} />
      {compact ? null : (
        <Text variant="callout" style={{ fontWeight: '600' }}>
          {label}
        </Text>
      )}
    </PressableScale>
  );
}
