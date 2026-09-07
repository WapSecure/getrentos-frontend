import { FileText } from 'lucide-react-native';
import { EmptyState, Screen, Text, useTheme } from '@getrentos/ui-native';

export default function Applications() {
  const { colors, spacing } = useTheme();
  return (
    <Screen>
      <Text variant="title" style={{ marginTop: spacing.md }}>
        Applications
      </Text>
      <EmptyState
        icon={<FileText size={36} color={colors.mutedForeground} />}
        title="Track your applications"
        description="Submitted rental applications, their status, references, and required documents will appear here."
      />
    </Screen>
  );
}
