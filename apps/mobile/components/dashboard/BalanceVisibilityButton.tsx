import { Eye, EyeOff } from 'lucide-react-native';
import { IconButton, useTheme } from '@getrentos/ui-native';

export function BalanceVisibilityButton({
  visible,
  onToggle,
}: {
  visible: boolean;
  onToggle: () => void;
}) {
  const { colors } = useTheme();
  return (
    <IconButton
      haptic={false}
      onPress={onToggle}
      accessibilityLabel={visible ? 'Hide monetary values' : 'Show monetary values'}
      accessibilityState={{ expanded: visible }}
      icon={
        visible ? (
          <EyeOff size={18} color={colors.mutedForeground} />
        ) : (
          <Eye size={18} color={colors.mutedForeground} />
        )
      }
      style={{ borderWidth: 0, backgroundColor: 'transparent' }}
    />
  );
}
