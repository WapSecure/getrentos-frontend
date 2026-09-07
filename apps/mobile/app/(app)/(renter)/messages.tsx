import { MessageCircle } from 'lucide-react-native';
import { EmptyState, Screen, Text, useTheme } from '@getrentos/ui-native';

export default function Messages() {
  const { colors, spacing } = useTheme();
  return (
    <Screen>
      <Text variant="title" style={{ marginTop: spacing.md }}>
        Messages
      </Text>
      <EmptyState
        icon={<MessageCircle size={36} color={colors.mutedForeground} />}
        title="Conversations with landlords"
        description="Real-time chat with landlords and agents, backed by the notifications gateway, is on the way."
      />
    </Screen>
  );
}
