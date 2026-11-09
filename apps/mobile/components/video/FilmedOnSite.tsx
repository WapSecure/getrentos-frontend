import { View } from 'react-native';
import { MapPin } from 'lucide-react-native';
import { Text, useTheme } from '@sureground/ui-native';

/**
 * The "Filmed on site" mark on a video tour: filmed with the Sureground camera
 * while the phone was at the property's pin. A clip from someone's library
 * never gets it.
 */
export function FilmedOnSite() {
  const { colors } = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
      <MapPin size={12} color={colors.success} />
      <Text variant="caption" style={{ color: colors.success }}>
        Filmed on site in the Sureground app
      </Text>
    </View>
  );
}
