import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { Button, Text, TextField, useTheme } from '@getrentos/ui-native';
import { Sheet } from '@/components/Sheet';
import type { Roommate } from '@/lib/api/roommates';

interface Props {
  open: boolean;
  onClose: () => void;
  roommate: Roommate | null;
  onSubmit: (task: string) => void;
  submitting: boolean;
}

/** Chores people actually split, offered as one-tap fills. */
const SUGGESTIONS = ['Kitchen', 'Bathrooms', 'Bins', 'Living room', 'Utility bills', 'Groceries'];

export function AssignTaskSheet({ open, onClose, roommate, onSubmit, submitting }: Props) {
  return (
    <Sheet open={open} onClose={onClose} title="Assign a task">
      {/* Remount per roommate so the field never carries over. */}
      {roommate ? (
        <AssignTaskForm
          key={roommate.id}
          roommate={roommate}
          onSubmit={onSubmit}
          onClose={onClose}
          submitting={submitting}
        />
      ) : null}
    </Sheet>
  );
}

function AssignTaskForm({
  roommate,
  onSubmit,
  onClose,
  submitting,
}: {
  roommate: Roommate;
  onSubmit: (task: string) => void;
  onClose: () => void;
  submitting: boolean;
}) {
  const { colors, spacing, radius } = useTheme();
  const [task, setTask] = useState('');

  const submit = () => {
    onSubmit(task.trim());
    onClose();
  };

  return (
    <View style={{ gap: spacing.lg }}>
      <Text variant="body" color="mutedForeground">
        What is <Text variant="bodyStrong">{roommate.name}</Text> responsible for? They can tick it
        off once it&apos;s done.
      </Text>

      <TextField
        label="Task"
        placeholder="e.g. Kitchen on weekends"
        value={task}
        onChangeText={setTask}
      />

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
        {SUGGESTIONS.map((s) => (
          <Pressable
            key={s}
            onPress={() => setTask(s)}
            accessibilityRole="button"
            accessibilityLabel={`Use ${s}`}
            style={{
              paddingHorizontal: spacing.md,
              paddingVertical: 7,
              borderRadius: radius.full,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <Text variant="caption" color="mutedForeground">
              {s}
            </Text>
          </Pressable>
        ))}
      </View>

      <Button label="Assign task" loading={submitting} disabled={!task.trim()} onPress={submit} />
    </View>
  );
}
