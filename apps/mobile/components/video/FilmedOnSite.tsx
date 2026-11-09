import { View } from 'react-native';
import { MapPin } from 'lucide-react-native';
import { Text, useTheme } from '@sureground/ui-native';

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
