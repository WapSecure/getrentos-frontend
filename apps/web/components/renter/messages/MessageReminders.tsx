'use client';

import { LegacyInput } from '@/components/ui/LegacyInput';

import { useState } from 'react';
import { Bell, BellOff, Plus, X, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { DatePicker } from '@/components/ui/DatePicker';
import { TimePicker } from '@/components/ui/TimePicker';

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
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-3 flex items-center justify-between hover:bg-secondary transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium text-foreground">Reminders</span>
          <span className="text-xs text-gray-500">
            {reminders.filter((r) => r.active).length} active
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="ghost"
            className="gap-1"
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(true);
              setIsAdding(!isAdding);
            }}
          >
            <Plus className="w-3 h-3" />
            Add
          </Button>
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-gray-500" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-500" />
          )}
        </div>
      </div>

      {isExpanded && (
        <div className="p-3 pt-0 space-y-2 max-h-64 overflow-y-auto">
          {isAdding && (
            <div className="p-3 rounded-lg bg-gray-50 dark:bg-white/5 border border-border space-y-2">
              <LegacyInput
                type="text"
                value={newReminder.message}
                onChange={(e) => setNewReminder({ ...newReminder, message: e.target.value })}
                placeholder="Reminder message..."
                className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <div className="flex gap-2">
                <DatePicker
                  value={newReminder.date}
                  onChange={(v) => setNewReminder({ ...newReminder, date: v })}
                  className="flex-1"
                />
                <TimePicker
                  value={newReminder.time}
                  onChange={(v) => setNewReminder({ ...newReminder, time: v })}
                  className="flex-1"
                />
              </div>
              <div className="flex gap-2">
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
            <p className="text-sm text-gray-500 text-center py-4">No reminders set</p>
          ) : (
            reminders.map((reminder) => (
              <div
                key={reminder.id}
                className={`flex items-center justify-between p-2 rounded-lg ${
                  reminder.active
                    ? 'bg-gray-50 dark:bg-white/5'
                    : 'bg-gray-100 dark:bg-gray-800 opacity-60'
                }`}
              >
                <div className="flex-1 min-w-0">
                  <p className={`text-sm ${reminder.active ? 'text-foreground' : 'text-gray-500'}`}>
                    {reminder.message}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatDate(reminder.date)} at {reminder.time}
                  </p>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => onToggleReminder(reminder.id)}
                    className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                    title={reminder.active ? 'Disable' : 'Enable'}
                  >
                    {reminder.active ? (
                      <Bell className="w-3 h-3 text-primary" />
                    ) : (
                      <BellOff className="w-3 h-3 text-gray-400" />
                    )}
                  </button>
                  <button
                    onClick={() => onDeleteReminder(reminder.id)}
                    className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/20"
                  >
                    <X className="w-3 h-3 text-red-500" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
