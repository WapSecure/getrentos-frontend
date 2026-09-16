import { useState } from 'react';
import { Switch, View } from 'react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Button,
  Chip,
  DateField,
  Text,
  TextField,
  TimeField,
  useTheme,
  useToast,
} from '@getrentos/ui-native';
import { Sheet } from '@/components/Sheet';
import { qk } from '@/lib/query/keys';
import {
  calendarApi,
  CALENDAR_EVENT_TYPES,
  CALENDAR_EVENT_TYPE_LABEL,
  CALENDAR_RECURRENCES,
  type CalendarEvent,
  type CalendarEventType,
  type CalendarRecurrence,
} from '@/lib/api/calendar';
import { ApiError } from '@/lib/api/client';

const RECURRENCE_LABEL: Record<CalendarRecurrence, string> = {
  none: 'Does not repeat',
  daily: 'Daily',
  weekly: 'Weekly',
  monthly: 'Monthly',
};

interface Props {
  open: boolean;
  onClose: () => void;
  event: CalendarEvent | null;
}

export function CalendarEventSheet({ open, onClose, event }: Props) {
  return (
    <Sheet open={open} onClose={onClose} title={event ? 'Edit event' : 'New event'}>
      {/* Remount on each open so the form matches the event being edited (or starts blank). */}
      <CalendarEventForm
        key={open ? (event?.id ?? 'new') : 'closed'}
        onClose={onClose}
        event={event}
      />
    </Sheet>
  );
}

function CalendarEventForm({ onClose, event }: Omit<Props, 'open'>) {
  const { colors, spacing } = useTheme();
  const qc = useQueryClient();
  const toast = useToast();

  const [title, setTitle] = useState(event?.title ?? '');
  const [date, setDate] = useState(event?.date.slice(0, 10) ?? '');
  const [startTime, setStartTime] = useState(event?.startTime ?? '09:00');
  const [endTime, setEndTime] = useState(event?.endTime ?? '10:00');
  const [type, setType] = useState<CalendarEventType>(event?.type ?? 'personal');
  const [location, setLocation] = useState(event?.location ?? '');
  const [notes, setNotes] = useState(event?.notes ?? '');
  const [reminder, setReminder] = useState(event?.reminder ?? true);
  const [recurrence, setRecurrence] = useState<CalendarRecurrence>(event?.recurrence ?? 'none');

  const invalidate = () => qc.invalidateQueries({ queryKey: qk.renter.calendarEvents });

  const createMutation = useMutation({
    mutationFn: () =>
      calendarApi.create({
        title: title.trim(),
        date,
        startTime,
        endTime,
        type,
        location: location.trim() || undefined,
        notes: notes.trim() || undefined,
        reminder,
        recurrence,
      }),
    onSuccess: () => {
      invalidate();
      toast.show('Event added.', 'success');
      onClose();
    },
    onError: (err) =>
      toast.show(err instanceof ApiError ? err.message : 'Could not save this event.', 'error'),
  });

  const updateMutation = useMutation({
    mutationFn: () =>
      calendarApi.update(event!.id, {
        title: title.trim(),
        date,
        startTime,
        endTime,
        type,
        location: location.trim() || undefined,
        notes: notes.trim() || undefined,
        reminder,
        recurrence,
      }),
    onSuccess: () => {
      invalidate();
      toast.show('Event updated.', 'success');
      onClose();
    },
    onError: (err) =>
      toast.show(err instanceof ApiError ? err.message : 'Could not update this event.', 'error'),
  });

  const removeMutation = useMutation({
    mutationFn: () => calendarApi.remove(event!.id),
    onSuccess: () => {
      invalidate();
      onClose();
    },
    onError: (err) =>
      toast.show(err instanceof ApiError ? err.message : 'Could not delete this event.', 'error'),
  });

  const mutation = event ? updateMutation : createMutation;
  const canSubmit =
    title.trim().length > 0 &&
    /^\d{4}-\d{2}-\d{2}$/.test(date) &&
    startTime.trim().length > 0 &&
    endTime.trim().length > 0;

  return (
    <View style={{ gap: spacing.lg }}>
      <TextField
        label="Title"
        placeholder="e.g. Landlord viewing"
        value={title}
        onChangeText={setTitle}
      />

      <View style={{ gap: spacing.sm }}>
        <Text variant="bodyStrong">Type</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
          {CALENDAR_EVENT_TYPES.map((t) => (
            <Chip
              key={t}
              label={CALENDAR_EVENT_TYPE_LABEL[t]}
              selected={type === t}
              onPress={() => setType(t)}
              size="sm"
            />
          ))}
        </View>
      </View>

      <DateField label="Date" value={date} onChange={setDate} />

      <View style={{ flexDirection: 'row', gap: spacing.sm }}>
        <View style={{ flex: 1 }}>
          <TimeField label="Start" value={startTime} onChange={setStartTime} />
        </View>
        <View style={{ flex: 1 }}>
          <TimeField label="End" value={endTime} onChange={setEndTime} />
        </View>
      </View>

      <TextField label="Location (optional)" value={location} onChangeText={setLocation} />
      <TextField
        label="Notes (optional)"
        multiline
        numberOfLines={3}
        value={notes}
        onChangeText={setNotes}
      />

      <View style={{ gap: spacing.sm }}>
        <Text variant="bodyStrong">Repeats</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
          {CALENDAR_RECURRENCES.map((r) => (
            <Chip
              key={r}
              label={RECURRENCE_LABEL[r]}
              selected={recurrence === r}
              onPress={() => setRecurrence(r)}
              size="sm"
            />
          ))}
        </View>
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text variant="bodyStrong">Remind me</Text>
        <Switch
          value={reminder}
          onValueChange={setReminder}
          trackColor={{ true: colors.primary, false: colors.secondary }}
          thumbColor={colors.card}
        />
      </View>

      <Button
        label={event ? 'Save changes' : 'Add event'}
        loading={mutation.isPending}
        disabled={!canSubmit}
        onPress={() => mutation.mutate()}
      />
      {event ? (
        <Button
          label="Delete event"
          variant="destructive"
          loading={removeMutation.isPending}
          onPress={() => removeMutation.mutate()}
        />
      ) : null}
    </View>
  );
}
