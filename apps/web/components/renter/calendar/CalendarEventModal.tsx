'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MapPin, Bell, Repeat } from 'lucide-react';
import { Alert } from '@getrentos/ui';
import { Button } from '@getrentos/ui';
import { DatePicker } from '@getrentos/ui';
import { TimePicker } from '@getrentos/ui';
import { Checkbox } from '@getrentos/ui';
import { Field } from '@getrentos/ui';
import { IconButton } from '@getrentos/ui';
import { Input } from '@getrentos/ui';
import { Select } from '@getrentos/ui';
import { Textarea } from '@getrentos/ui';
import type {
  CalendarEvent,
  CalendarEventFormData,
  CalendarEventType,
  CalendarRecurrence,
} from '@/types/calendar';

interface CalendarEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (event: CalendarEventFormData) => Promise<void>;
  event?: CalendarEvent | null;
}

const eventTypes: { value: CalendarEventType; label: string }[] = [
  { value: 'viewing', label: 'Viewing' },
  { value: 'payment', label: 'Payment' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'lease', label: 'Lease' },
  { value: 'personal', label: 'Personal' },
];

const colors = [
  'var(--info)',
  'var(--success)',
  'var(--warning)',
  'var(--purple)',
  'var(--primary)',
  'var(--destructive)',
];

const getInitialFormData = (event?: CalendarEvent | null): CalendarEventFormData => ({
  title: event?.title || '',
  description: event?.description || '',
  date: event?.date?.split('T')[0] || '',
  startTime: event?.startTime || '09:00',
  endTime: event?.endTime || '10:00',
  type: event?.type || 'personal',
  location: event?.location || '',
  notes: event?.notes || '',
  reminder: event?.reminder || false,
  recurrence: event?.recurrence || 'none',
  color: event?.color || 'var(--primary)',
});

export const CalendarEventModal = ({ isOpen, onClose, onSave, event }: CalendarEventModalProps) => {
  const [formData, setFormData] = useState<CalendarEventFormData>(() => getInitialFormData(event));
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!formData.title || !formData.date) return;
    setIsSaving(true);
    setErrorMessage(null);
    try {
      await onSave(formData);
      onClose();
    } catch {
      setErrorMessage(`The event could not be ${event ? 'updated' : 'created'}.`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-card rounded-2xl border border-border shadow-2xl max-w-lg w-full mx-4 overflow-hidden"
          >
            <div className="p-4 border-b border-border flex justify-between items-center">
              <div>
                <h3 className="font-semibold text-foreground">
                  {event ? 'Edit Event' : 'Add Event'}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {event ? 'Update event details' : 'Create a new event'}
                </p>
              </div>
              <IconButton
                label="Close event dialog"
                icon={<X />}
                size="sm"
                onClick={onClose}
                disabled={isSaving}
              />
            </div>

            <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
              <Field label="Title" required>
                <Input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Event title"
                />
              </Field>

              <Field label="Description">
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Event description"
                  rows={2}
                />
              </Field>

              <Field label="Date" required>
                <DatePicker
                  value={formData.date}
                  onChange={(v) => setFormData({ ...formData, date: v })}
                />
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Start Time">
                  <TimePicker
                    value={formData.startTime}
                    onChange={(v) => setFormData({ ...formData, startTime: v })}
                  />
                </Field>
                <Field label="End Time">
                  <TimePicker
                    value={formData.endTime}
                    onChange={(v) => setFormData({ ...formData, endTime: v })}
                  />
                </Field>
              </div>

              <Field label="Event Type">
                <Select
                  value={formData.type}
                  onValueChange={(value) =>
                    setFormData({ ...formData, type: value as CalendarEventType })
                  }
                  options={eventTypes}
                />
              </Field>

              <Field label="Location">
                <Input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="Event location"
                  leadingIcon={<MapPin className="h-4 w-4" />}
                />
              </Field>

              <div role="group" aria-labelledby="calendar-event-color-label">
                <p
                  id="calendar-event-color-label"
                  className="block text-sm font-medium text-foreground mb-1"
                >
                  Color
                </p>
                <div className="flex gap-2 flex-wrap">
                  {colors.map((color) => (
                    <button
                      type="button"
                      key={color}
                      onClick={() => setFormData({ ...formData, color })}
                      aria-label={`Colour ${colors.indexOf(color) + 1}`}
                      aria-pressed={formData.color === color}
                      className={`w-8 h-8 rounded-full border-2 transition-all ${
                        formData.color === color
                          ? 'border-foreground scale-110'
                          : 'border-transparent'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-4">
                <Checkbox
                  checked={Boolean(formData.reminder)}
                  onCheckedChange={(reminder) => setFormData({ ...formData, reminder })}
                  label={
                    <span className="inline-flex items-center gap-2">
                      <Bell className="w-4 h-4" />
                      Set Reminder
                    </span>
                  }
                />

                <div className="flex items-center gap-2 text-sm text-foreground">
                  <Repeat className="w-4 h-4" aria-hidden="true" />
                  <Select
                    ariaLabel="Repeat"
                    value={formData.recurrence}
                    onValueChange={(value) =>
                      setFormData({ ...formData, recurrence: value as CalendarRecurrence })
                    }
                    options={[
                      { value: 'none', label: 'None' },
                      { value: 'daily', label: 'Daily' },
                      { value: 'weekly', label: 'Weekly' },
                      { value: 'monthly', label: 'Monthly' },
                    ]}
                    className="min-h-9 w-32"
                  />
                </div>
              </div>
            </div>

            {errorMessage && (
              <Alert variant="danger" className="mx-4 mt-4">
                {errorMessage}
              </Alert>
            )}
            <div className="p-4 border-t border-border flex gap-3">
              <Button
                variant="primary"
                fullWidth
                onClick={() => void handleSubmit()}
                disabled={!formData.title || !formData.date || isSaving}
                isLoading={isSaving}
              >
                {event ? 'Update Event' : 'Add Event'}
              </Button>
              <Button variant="ghost" fullWidth onClick={onClose} disabled={isSaving}>
                Cancel
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
