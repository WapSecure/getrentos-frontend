'use client';

import { useState } from 'react';
import { Bell, BellOff, Plus, X, ChevronDown, ChevronUp } from 'lucide-react';
import { Button, Card, DatePicker, Field, IconButton, Input, TimePicker } from '@getrentos/ui';

interface Reminder {
  id: string;
  message: string;
  date: string;
  time: string;
  active: boolean;
}

interface ReminderData {
  message: string;
  date: string;
  time: string;
}

interface MessageRemindersProps {
  reminders: Reminder[];
  onAddReminder: (reminder: ReminderData) => void;
  onToggleReminder: (id: string) => void;
  onDeleteReminder: (id: string) => void;
}

export const MessageReminders = ({
  reminders,
  onAddReminder,
  onToggleReminder,
  onDeleteReminder,
}: MessageRemindersProps) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [newReminder, setNewReminder] = useState<ReminderData>({ message: '', date: '', time: '' });

  const handleAddReminder = () => {
    if (!newReminder.message || !newReminder.date || !newReminder.time) return;
    onAddReminder(newReminder);
    setNewReminder({ message: '', date: '', time: '' });
    setIsAdding(false);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <Card>
      <div className="flex items-center justify-between gap-2 p-3">
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          aria-expanded={isExpanded}
          className="flex min-w-0 flex-1 flex-wrap items-center gap-2 rounded-lg text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Bell className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium text-foreground">Reminders</span>
          <span className="text-xs text-muted-foreground">
            {reminders.filter((r) => r.active).length} active
          </span>
        </button>
        <div className="flex items-center gap-1">
          <Button
            size="sm"
            variant="ghost"
            icon={<Plus className="w-3 h-3" />}
            onClick={() => {
              setIsExpanded(true);
              setIsAdding(!isAdding);
            }}
          >
            Add
          </Button>
          <IconButton
            size="sm"
            label={isExpanded ? 'Collapse reminders' : 'Expand reminders'}
            aria-expanded={isExpanded}
            icon={isExpanded ? <ChevronUp /> : <ChevronDown />}
            onClick={() => setIsExpanded(!isExpanded)}
          />
        </div>
      </div>

      {isExpanded && (
        <div className="p-3 pt-0 space-y-2 max-h-64 overflow-y-auto">
          {isAdding && (
            <div className="p-3 rounded-lg bg-secondary/60 border border-border space-y-2">
              <Field label="Message" required>
                <Input
                  type="text"
                  value={newReminder.message}
                  onChange={(e) => setNewReminder({ ...newReminder, message: e.target.value })}
                  placeholder="Reminder message..."
                />
              </Field>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <Field label="Date" required>
                  <DatePicker
                    value={newReminder.date}
                    onChange={(v) => setNewReminder({ ...newReminder, date: v })}
                  />
                </Field>
                <Field label="Time" required>
                  <TimePicker
                    value={newReminder.time}
                    onChange={(v) => setNewReminder({ ...newReminder, time: v })}
                  />
                </Field>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  onClick={handleAddReminder}
                  disabled={!newReminder.message || !newReminder.date || !newReminder.time}
                >
                  Add Reminder
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setIsAdding(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {reminders.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No reminders set</p>
          ) : (
            reminders.map((reminder) => (
              <div
                key={reminder.id}
                className={`flex items-center justify-between gap-2 p-2 rounded-lg ${
                  reminder.active ? 'bg-secondary/60' : 'bg-secondary opacity-60'
                }`}
              >
                <div className="flex-1 min-w-0">
                  <p
                    className={`text-sm ${reminder.active ? 'text-foreground' : 'text-muted-foreground'}`}
                  >
                    {reminder.message}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(reminder.date)} at {reminder.time}
                  </p>
                </div>
                <div className="flex gap-1">
                  <IconButton
                    size="sm"
                    label={reminder.active ? 'Disable reminder' : 'Enable reminder'}
                    title={reminder.active ? 'Disable' : 'Enable'}
                    icon={reminder.active ? <Bell className="text-primary" /> : <BellOff />}
                    onClick={() => onToggleReminder(reminder.id)}
                  />
                  <IconButton
                    size="sm"
                    variant="danger"
                    label="Delete reminder"
                    icon={<X />}
                    onClick={() => onDeleteReminder(reminder.id)}
                  />
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </Card>
  );
};
