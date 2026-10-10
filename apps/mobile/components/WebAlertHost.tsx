import { useEffect, useState } from 'react';
import { Modal, Platform, Pressable, View } from 'react-native';
import { Button, Text, useTheme } from '@getrentos/ui-native';
import {
  answerWebAlert,
  cancelButton,
  subscribeWebAlert,
  type WebAlertEntry,
} from '@/lib/webAlert';

/**
 * Shows `Alert.alert` on web as a dialog in the app's own style. Renders
 * nothing on phones, where the native alert is used.
 */
export function WebAlertHost() {
  const [entry, setEntry] = useState<WebAlertEntry | null>(null);
  useEffect(() => (Platform.OS === 'web' ? subscribeWebAlert(setEntry) : undefined), []);
  if (Platform.OS !== 'web' || !entry) return null;
  return <Dialog key={entry.id} entry={entry} />;
}

function Dialog({ entry }: { entry: WebAlertEntry }) {
  const { colors, spacing, radius } = useTheme();
  const cancel = cancelButton(entry);
  const dismiss = () => {
    if (cancel) answerWebAlert(entry.id, cancel);
  };
  // Two choices sit side by side, cancel first; more stack, cancel last.
  const inline = entry.buttons.length <= 2;
  const ordered = inline
    ? [...entry.buttons].sort((a, b) => Number(b.style === 'cancel') - Number(a.style === 'cancel'))
    : [...entry.buttons].sort(
        (a, b) => Number(a.style === 'cancel') - Number(b.style === 'cancel')
      );

  return (
    <Modal transparent visible animationType="fade" onRequestClose={dismiss}>
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          padding: spacing.xl,
          backgroundColor: 'rgba(0,0,0,0.55)',
        }}
      >
        <Pressable
          accessibilityLabel={cancel ? `Dismiss, ${cancel.text}` : undefined}
          onPress={dismiss}
          style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }}
        />
        <View
          accessibilityRole="alert"
          aria-modal
          style={{
            width: '100%',
            maxWidth: 420,
            padding: spacing.xl,
            gap: spacing.md,
            borderRadius: radius.xl,
            backgroundColor: colors.card,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <Text variant="heading" accessibilityRole="header">
            {entry.title}
          </Text>
          {entry.message ? (
            <Text variant="callout" color="mutedForeground">
              {entry.message}
            </Text>
          ) : null}
          <View
            style={{
              flexDirection: inline ? 'row' : 'column',
              gap: spacing.sm,
              marginTop: spacing.sm,
            }}
          >
            {ordered.map((b, i) => (
              <Button
                key={`${b.text}-${i}`}
                label={b.text}
                size="sm"
                variant={
                  b.style === 'destructive'
                    ? 'destructive'
                    : b.style === 'cancel'
                      ? 'secondary'
                      : 'primary'
                }
                style={inline ? { flex: 1 } : undefined}
                onPress={() => answerWebAlert(entry.id, b)}
              />
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
}
