import { useEffect, useState } from 'react';
import { Platform, View } from 'react-native';
import { Button, Text, useTheme } from '@getrentos/ui-native';
import { Sheet } from '@/components/Sheet';
import {
  answerWebAlert,
  cancelButton,
  subscribeWebAlert,
  type WebAlertEntry,
} from '@/lib/webAlert';

/**
 * Shows `Alert.alert` on web in the same sheet the app confirms with
 * elsewhere. Renders nothing on phones, where the native alert is used.
 */
export function WebAlertHost() {
  const [entry, setEntry] = useState<WebAlertEntry | null>(null);
  useEffect(() => (Platform.OS === 'web' ? subscribeWebAlert(setEntry) : undefined), []);
  if (Platform.OS !== 'web') return null;
  return <AlertSheet entry={entry} />;
}

function AlertSheet({ entry }: { entry: WebAlertEntry | null }) {
  const { spacing } = useTheme();
  const cancel = entry ? cancelButton(entry) : undefined;
  const dismiss = () => {
    if (entry && cancel) answerWebAlert(entry.id, cancel);
  };
  // The action first, cancel last, as in the app's other sheets.
  const ordered = entry
    ? [...entry.buttons].sort((a, b) => Number(a.style === 'cancel') - Number(b.style === 'cancel'))
    : [];

  return (
    <Sheet open={!!entry} onClose={dismiss} title={entry?.title}>
      {entry ? (
        <View key={entry.id} style={{ gap: spacing.md }}>
          {entry.message ? (
            <Text variant="callout" color="mutedForeground">
              {entry.message}
            </Text>
          ) : null}
          {ordered.map((b, i) => (
            <Button
              key={`${b.text}-${i}`}
              label={b.text}
              variant={
                b.style === 'destructive'
                  ? 'destructive'
                  : b.style === 'cancel'
                    ? 'outline'
                    : 'primary'
              }
              onPress={() => answerWebAlert(entry.id, b)}
            />
          ))}
        </View>
      ) : null}
    </Sheet>
  );
}
