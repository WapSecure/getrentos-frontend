import { ActivityIndicator, View, type StyleProp, type ViewStyle } from 'react-native';
import { useTheme, withAlpha } from '../theme';
import { PressableScale, type PressableScaleProps } from './PressableScale';
import { Text } from './Text';

export interface IconButtonProps extends Omit<PressableScaleProps, 'children' | 'style'> {
  accessibilityLabel: string;
  icon: React.ReactNode;
  badge?: number;
  selected?: boolean;
  variant?: 'outline' | 'ghost';
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function IconButton({
  accessibilityLabel,
  icon,
  badge = 0,
  selected = false,
  variant = 'outline',
  loading = false,
  disabled,
  accessibilityState,
  style,
  ...rest
}: IconButtonProps) {
  const ghost = variant === 'ghost';
  const { colors, radius, scheme } = useTheme();
  const spokenLabel = badge > 0 ? `${accessibilityLabel}, ${badge} unread` : accessibilityLabel;

  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={spokenLabel}
      // A caller's state (e.g. expanded) adds to these instead of replacing them.
      accessibilityState={{
        ...accessibilityState,
        selected,
        disabled: !!disabled || loading,
        busy: loading,
      }}
      disabled={disabled || loading}
      hitSlop={4}
      style={[
        {
          width: 44,
          height: 44,
          borderRadius: radius.full,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: selected
            ? withAlpha(colors.primary, scheme === 'dark' ? 0.2 : 0.1)
            : ghost
              ? 'transparent'
              : colors.card,
          borderWidth: ghost && !selected ? 0 : 1,
          borderColor: selected ? colors.primary : colors.border,
          opacity: disabled ? 0.45 : 1,
        },
        style,
      ]}
      {...rest}
    >
      {loading ? <ActivityIndicator color={colors.mutedForeground} /> : icon}
      {badge > 0 ? (
        <View
          importantForAccessibility="no-hide-descendants"
          style={{
            position: 'absolute',
            top: -2,
            right: -2,
            minWidth: 20,
            height: 20,
            borderRadius: 10,
            paddingHorizontal: 4,
            alignItems: 'center',
            justifyContent: 'center',
            // Unread is a brand moment, not an error: the count sits on Sureground blue.
            backgroundColor: colors.primary,
            borderWidth: 2,
            borderColor: colors.background,
          }}
        >
          <Text
            variant="caption"
            maxFontSizeMultiplier={1.4}
            style={{
              color: colors.primaryForeground,
              fontSize: 12,
              lineHeight: 12,
              fontWeight: '800',
            }}
          >
            {badge > 9 ? '9+' : badge}
          </Text>
        </View>
      ) : null}
    </PressableScale>
  );
}
