import { useState } from 'react';
import { View } from 'react-native';
import { COLLECTOR_NAME_MAX_LENGTH, defaultCollectorName } from '@sureground/shared';
import { Button, Text, TextField, useTheme } from '@sureground/ui-native';
import { Sheet } from '@/components/Sheet';

interface CollectableLog {
  id: string;
  unitLabel: string;
  residentName: string;
  courier?: string;
}

interface CollectDeliverySheetProps {
  /** The parcel being handed over; null keeps the sheet closed. */
  log: CollectableLog | null;
  busy?: boolean;
  onClose: () => void;
  onConfirm: (collectedBy?: string) => void;
}

/** Confirms a hand-over and records who took the parcel. The form remounts per parcel so the name starts at that household's resident. */
export function CollectDeliverySheet({ log, busy, onClose, onConfirm }: CollectDeliverySheetProps) {
  return (
    <Sheet open={!!log} onClose={() => !busy && onClose()} title="Hand over parcel">
      {log ? <CollectForm key={log.id} log={log} busy={busy} onConfirm={onConfirm} /> : null}
    </Sheet>
  );
}

function CollectForm({
  log,
  busy,
  onConfirm,
}: {
  log: CollectableLog;
  busy?: boolean;
  onConfirm: (collectedBy?: string) => void;
}) {
  const { spacing } = useTheme();
  const [name, setName] = useState(() => defaultCollectorName(log));

  return (
    <View style={{ gap: spacing.md }}>
      <Text variant="caption" color="mutedForeground">
        {log.unitLabel}
        {log.courier ? ` · ${log.courier}` : ''}. Only hand it over once the person is in front of
        you. This can’t be undone.
      </Text>
      <TextField
        label="Who is collecting it?"
        value={name}
        onChangeText={setName}
        placeholder="Name of the person taking it"
        hint="Optional. Change it if someone else is picking up for the household."
        maxLength={COLLECTOR_NAME_MAX_LENGTH}
        autoCapitalize="words"
        editable={!busy}
      />
      <Button
        label="Confirm"
        loadingLabel="Saving…"
        loading={busy}
        onPress={() => onConfirm(name.trim() || undefined)}
      />
    </View>
  );
}
