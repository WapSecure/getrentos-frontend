import { View, type StyleProp, type ViewStyle } from 'react-native';
import { ChevronLeft } from 'lucide-react-native';
import { IconButton, useTheme } from '@getrentos/ui-native';
import { DashboardHeader } from './DashboardHeader';

type DetailHeaderProps = {
  eyebrow: string;
  title: string;
  subtitle?: string;
  onBack: () => void;
  accessory?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
};

/** Consistent navigation and hierarchy for secondary workspace screens. */
export function DetailHeader({
  eyebrow,
  title,
  subtitle,
  onBack,
  accessory,
  style,
}: DetailHeaderProps) {
  const { colors, spacing } = useTheme();

  return (
    <View style={[{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }, style]}>
      <IconButton
        accessibilityLabel="Go back"
        onPress={onBack}
        icon={<ChevronLeft size={22} color={colors.foreground} />}
      />
      <DashboardHeader
        eyebrow={eyebrow}
        title={title}
        subtitle={subtitle}
        accessory={accessory}
        style={{ flex: 1 }}
      />
    </View>
  );
}
