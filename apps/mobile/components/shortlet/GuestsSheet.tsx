import { useState } from 'react';
import { View } from 'react-native';
import { Button, Text, useTheme } from '@getrentos/ui-native';
import { Sheet } from '@/components/Sheet';
import { Stepper } from '@/components/host/HostUI';

/** Who's coming: one number, set with a stepper. */
export function GuestsSheet(props: {
  open: boolean;
  onClose: () => void;
  value?: number;
  max?: number;
  onChange: (guests: number | undefined) => void;
}) {
  return <Inner key={props.open ? 'open' : 'closed'} {...props} />;
}

function Inner({
  open,
  onClose,
  value,
  max = 16,
  onChange,
}: {
  open: boolean;
  onClose: () => void;
  value?: number;
  max?: number;
  onChange: (guests: number | undefined) => void;
}) {
  const { spacing } = useTheme();
  const [n, setN] = useState(value ?? 1);
  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Who's coming?"
      footer={
        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          <Button
            label="Any"
            variant="ghost"
            fullWidth={false}
            onPress={() => {
              onChange(undefined);
              onClose();
            }}
          />
          <Button
            label="Done"
            style={{ flex: 1 }}
            onPress={() => {
              onChange(n);
              onClose();
            }}
          />
        </View>
      }
    >
      <View style={{ gap: spacing.sm }}>
        <Stepper
          label="Guests"
          hint="Everyone staying, including children"
          value={n}
          min={1}
          max={max}
          onChange={setN}
        />
        <Text variant="caption" color="mutedForeground">
          We only show stays that sleep everyone.
        </Text>
      </View>
    </Sheet>
  );
}
