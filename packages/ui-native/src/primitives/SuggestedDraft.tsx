import { View } from 'react-native';
import { Sparkles } from 'lucide-react-native';
import { useTheme } from '../theme';
import { Button } from './Button';
import { FormAlert } from './FormControls';
import { Text } from './Text';

export interface SuggestedDraftProps {
  /** The drafted text. */
  text: string;
  title?: string;
  /** Points to confirm before sending. */
  toCheck?: string[];
  disclaimer?: string;
  useLabel?: string;
  onUse: (text: string) => void;
  onDismiss?: () => void;
}

/**
 * A drafted piece of text to read, use and edit before sending, with what to
 * check first. Nothing is sent from here. The web twin is SuggestedDraft in
 * @sureground/ui.
 */
export function SuggestedDraft({
  text,
  title = 'Suggested reply',
  toCheck = [],
  disclaimer,
  useLabel = 'Use this draft',
  onUse,
  onDismiss,
}: SuggestedDraftProps) {
  const { colors, spacing, radius } = useTheme();
  return (
    <View
      style={{
        gap: spacing.sm,
        padding: spacing.md,
        borderRadius: radius.md,
        borderWidth: 1,
        borderColor: colors.border,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
        <Sparkles size={16} color={colors.primary} />
        <Text variant="label">{title}</Text>
      </View>
      <Text variant="callout">{text}</Text>
      {toCheck.length > 0 ? (
        <FormAlert
          tone="warning"
          title="Check before sending"
          message={toCheck.map((c) => `• ${c}`).join('\n')}
        />
      ) : null}
      <Button label={useLabel} size="sm" onPress={() => onUse(text)} />
      {onDismiss ? <Button label="Dismiss" size="sm" variant="ghost" onPress={onDismiss} /> : null}
      {disclaimer ? (
        <Text variant="caption" color="mutedForeground">
          {disclaimer}
        </Text>
      ) : null}
    </View>
  );
}
