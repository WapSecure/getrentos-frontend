import { View } from 'react-native';
import { useTheme } from '@sureground/ui-native';
import { DetailScreenHeader } from '@/components/dashboard/DetailScreenHeader';
import {
  DEVELOPMENTS_INTRO,
  DevelopmentsDirectory,
} from '@/components/market/DevelopmentsDirectory';
import { goBack } from '@/lib/goBack';

/** The public off-plan list, for signed-in people: the market tab is for signed-out visitors only. */
export default function Developments() {
  const { colors } = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <DetailScreenHeader eyebrow="Buying" title="Off-plan" onBack={() => goBack()} />
      <DevelopmentsDirectory intro={DEVELOPMENTS_INTRO} />
    </View>
  );
}
