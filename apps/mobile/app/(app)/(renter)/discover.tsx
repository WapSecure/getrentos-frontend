import { Search } from 'lucide-react-native';
import { EmptyState, Screen, Text, useTheme } from '@getrentos/ui-native';

export default function Discover() {
  const { colors, spacing } = useTheme();
  return (
    <Screen>
      <Text variant="title" style={{ marginTop: spacing.md }}>
        Discover
      </Text>
      <EmptyState
        icon={<Search size={36} color={colors.mutedForeground} />}
        title="Property search is next"
        description="Browse verified listings, filter by budget and area, and save favourites — powered by the same API as the web marketplace."
      />
    </Screen>
  );
}
