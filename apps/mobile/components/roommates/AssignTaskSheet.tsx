import { useState } from 'react';
import { View } from 'react-native';
import { Button, Chip, Text, TextField, useTheme } from '@getrentos/ui-native';
import { Sheet } from '@/components/Sheet';
import type { Roommate } from '@/lib/api/roommates';

interface Props {
  open: boolean;
  onClose: () => void;
  roommate: Roommate | null;
  onSubmit: (task: string) => Promise<boolean>;
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
  onSubmit: (task: string) => Promise<boolean>;
  onClose: () => void;
  submitting: boolean;
}) {
  const { spacing } = useTheme();
  const [task, setTask] = useState('');

  const submit = async () => {
    const saved = await onSubmit(task.trim());
    if (saved) onClose();
  };

  return (
    <View style={{ gap: spacing.lg }}>
      <Text variant="body" color="mutedForeground">
        What is <Text variant="bodyStrong">{roommate.name}</Text> responsible for? They can tick it
        off once it&apos;s done.
      </Text>

      <TextField
        label="Task"
        required
        placeholder="e.g. Kitchen on weekends"
        value={task}
        onChangeText={setTask}
      />

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
        {SUGGESTIONS.map((s) => (
          <Chip key={s} label={s} size="sm" selected={task === s} onPress={() => setTask(s)} />
        ))}
      </View>

      <Button
        label="Assign task"
        loading={submitting}
        disabled={!task.trim() || submitting}
        onPress={() => void submit()}
      />
    </View>
  );
}
