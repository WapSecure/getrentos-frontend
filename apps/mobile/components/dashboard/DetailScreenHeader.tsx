import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@getrentos/ui-native';
import { DetailHeader } from './DetailHeader';

type DetailScreenHeaderProps = React.ComponentProps<typeof DetailHeader>;

/** Safe-area-aware page chrome for full-screen secondary workflows. */
export function DetailScreenHeader(props: DetailScreenHeaderProps) {
  const insets = useSafeAreaInsets();
  const { spacing } = useTheme();

  return (
    <View
      style={{
        paddingTop: insets.top + spacing.md,
        paddingHorizontal: spacing.xl,
        paddingBottom: spacing.sm,
      }}
    >
      <DetailHeader {...props} />
    </View>
  );
}
