import { ActivityIndicator, View, type StyleProp, type ViewStyle } from 'react-native';
import { useTheme } from '../theme';
import { PressableScale, type PressableScaleProps } from './PressableScale';
import { Text } from './Text';

export interface IconButtonProps extends Omit<PressableScaleProps, 'children' | 'style'> {
  accessibilityLabel: string;
  icon: React.ReactNode;
  badge?: number;
  selected?: boolean;
  /** `ghost` drops the circle and border, for inline icons (back chevrons, row actions). */
  variant?: 'outline' | 'ghost';
  /** Shows a spinner in place of the icon and blocks presses. */
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
}

/** A consistent 44-point icon target with an optional, screen-reader-aware badge. */
export function IconButton({
  accessibilityLabel,
  icon,
  badge = 0,
  selected = false,
  variant = 'outline',
  loading = false,
  disabled,
  style,
  ...rest
}: IconButtonProps) {
  const ghost = variant === 'ghost';
  const { colors, radius } = useTheme();
  const spokenLabel = badge > 0 ? `${accessibilityLabel}, ${badge} unread` : accessibilityLabel;

  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={spokenLabel}
      accessibilityState={{ selected, disabled: disabled || loading, busy: loading }}
      disabled={disabled || loading}
      hitSlop={4}
      style={[
        {
          width: 44,
          height: 44,
          borderRadius: radius.full,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: selected ? colors.accent : ghost ? 'transparent' : colors.card,
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
            minWidth: 18,
            height: 18,
            borderRadius: 9,
            paddingHorizontal: 4,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: colors.destructive,
            borderWidth: 2,
            borderColor: colors.background,
          }}
        >
          <Text
            variant="caption"
            maxFontSizeMultiplier={1.4}
            style={{
              color: colors.destructiveForeground,
              fontSize: 10,
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
