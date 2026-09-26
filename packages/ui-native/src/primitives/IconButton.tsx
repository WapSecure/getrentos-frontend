import { View, type StyleProp, type ViewStyle } from 'react-native';
import { useTheme } from '../theme';
import { PressableScale, type PressableScaleProps } from './PressableScale';
import { Text } from './Text';

export interface IconButtonProps extends Omit<PressableScaleProps, 'children' | 'style'> {
  accessibilityLabel: string;
  icon: React.ReactNode;
  badge?: number;
  selected?: boolean;
  style?: StyleProp<ViewStyle>;
}

/** A consistent 44-point icon target with an optional, screen-reader-aware badge. */
export function IconButton({
  accessibilityLabel,
  icon,
  badge = 0,
  selected = false,
  style,
  ...rest
}: IconButtonProps) {
  const { colors, radius } = useTheme();
  const spokenLabel = badge > 0 ? `${accessibilityLabel}, ${badge} unread` : accessibilityLabel;

  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={spokenLabel}
      accessibilityState={{ selected }}
      hitSlop={4}
      style={[
        {
          width: 44,
          height: 44,
          borderRadius: radius.full,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: selected ? colors.accent : colors.card,
          borderWidth: 1,
          borderColor: selected ? colors.primary : colors.border,
        },
        style,
      ]}
      {...rest}
    >
      {icon}
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
