'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MapPin, Bell, Repeat } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { DatePicker } from '@/components/ui/DatePicker';
import { TimePicker } from '@/components/ui/TimePicker';
import { Checkbox } from '@/components/ui/Checkbox';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import type {
  CalendarEvent,
  CalendarEventFormData,
  CalendarEventType,
  CalendarRecurrence,
} from '@/types/calendar';

interface CalendarEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (event: CalendarEventFormData) => void;
  event?: CalendarEvent | null;
}

const eventTypes: { value: CalendarEventType; label: string }[] = [
  { value: 'viewing', label: 'Viewing' },
  { value: 'payment', label: 'Payment' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'lease', label: 'Lease' },
  { value: 'personal', label: 'Personal' },
];

const colors = ['var(--info)', 'var(--success)', 'var(--warning)', 'var(--purple)', 'var(--primary)', 'var(--destructive)'];

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

  const handleSubmit = () => {
    if (!formData.title || !formData.date) return;
    onSave(formData);
    onClose();
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
              <button onClick={onClose} className="p-1 rounded-lg hover:bg-secondary">
                <X className="w-4 h-4" />
              </button>
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

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Date <span className="text-red-500">*</span>
                </label>
                <DatePicker
                  value={formData.date}
                  onChange={(v) => setFormData({ ...formData, date: v })}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Start Time
                  </label>
                  <TimePicker
                    value={formData.startTime}
                    onChange={(v) => setFormData({ ...formData, startTime: v })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">End Time</label>
                  <TimePicker
                    value={formData.endTime}
                    onChange={(v) => setFormData({ ...formData, endTime: v })}
                  />
                </div>
              </div>

              <Field label="Event Type">
                <Select
                  value={formData.type}
                  onValueChange={(value) => setFormData({ ...formData, type: value as CalendarEventType })}
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

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Color</label>
                <div className="flex gap-2 flex-wrap">
                  {colors.map((color) => (
                    <button
                      key={color}
                      onClick={() => setFormData({ ...formData, color })}
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

              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-sm text-foreground">
                  <Checkbox
                    checked={Boolean(formData.reminder)}
                    onCheckedChange={(reminder) => setFormData({ ...formData, reminder })}
                  />
                  <Bell className="w-4 h-4" />
                  Set Reminder
                </label>

                <label className="flex items-center gap-2 text-sm text-foreground">
                  <Repeat className="w-4 h-4" />
                  <Select
                    value={formData.recurrence}
                    onValueChange={(value) => setFormData({ ...formData, recurrence: value as CalendarRecurrence })}
                    options={[
                      { value: 'none', label: 'None' },
                      { value: 'daily', label: 'Daily' },
                      { value: 'weekly', label: 'Weekly' },
                      { value: 'monthly', label: 'Monthly' },
                    ]}
                    className="min-h-9 w-32"
                  />
                </label>
              </div>
            </div>

            <div className="p-4 border-t border-border flex gap-3">
              <Button
                variant="primary"
                fullWidth
                onClick={handleSubmit}
                disabled={!formData.title || !formData.date}
              >
                {event ? 'Update Event' : 'Add Event'}
              </Button>
              <Button variant="ghost" fullWidth onClick={onClose}>
                Cancel
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
