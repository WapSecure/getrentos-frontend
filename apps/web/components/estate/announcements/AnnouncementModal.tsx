'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { Button, Checkbox, Field, IconButton, Input, Select, Textarea } from '@getrentos/ui';
import type { Announcement } from '@/types/estate';

interface AnnouncementModalProps {
  isOpen: boolean;
  announcement: Announcement | null;
  onClose: () => void;
  onSubmit: (data: {
    title: string;
    body: string;
    priority: 'NORMAL' | 'URGENT';
    deliveryChannels?: ('SMS' | 'WHATSAPP')[];
  }) => void;
  isSubmitting?: boolean;
}

const priorityOptions = [
  { value: 'NORMAL', label: 'Normal' },
  { value: 'URGENT', label: 'Urgent' },
];

export const AnnouncementModal = ({
  isOpen,
  announcement,
  onClose,
  onSubmit,
  isSubmitting,
}: AnnouncementModalProps) => {
  const [title, setTitle] = useState(announcement?.title ?? '');
  const [body, setBody] = useState(announcement?.body ?? '');
  const [priority, setPriority] = useState(
    announcement ? announcement.priority.toUpperCase() : 'NORMAL'
  );
  const [sendSms, setSendSms] = useState(false);
  const [sendWhatsApp, setSendWhatsApp] = useState(false);

  const handleClose = () => {
    setSendSms(false);
    setSendWhatsApp(false);
    onClose();
  };

  const canSubmit = title.trim().length > 0 && body.trim().length > 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-card rounded-xl max-w-md w-full overflow-hidden max-h-[90vh] flex flex-col"
          >
            <div className="p-4 border-b border-border flex justify-between items-center shrink-0">
              <h3 className="font-semibold text-foreground">
                {announcement ? 'Edit Announcement' : 'New Announcement'}
              </h3>
              <IconButton label="Close" icon={<X />} size="sm" onClick={handleClose} />
            </div>

            <div className="p-4 space-y-4 overflow-y-auto flex-1">
              <Field label="Title" required>
                <Input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Water outage this weekend"
                />
              </Field>

              <Field label="Message" required>
                <Textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  rows={5}
                  placeholder="Details for residents…"
                />
              </Field>

              <Field label="Priority">
                <Select value={priority} onValueChange={setPriority} options={priorityOptions} />
              </Field>

              {!announcement && (
                <fieldset>
                  <legend className="block text-sm font-medium text-foreground mb-2">
                    Also deliver via{' '}
                    <span className="text-muted-foreground font-normal">(optional)</span>
                  </legend>
                  <div className="flex flex-wrap gap-4">
                    <Checkbox checked={sendSms} onCheckedChange={setSendSms} label="SMS" />
                    <Checkbox
                      checked={sendWhatsApp}
                      onCheckedChange={setSendWhatsApp}
                      label="WhatsApp"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Residents always get an in-app notification. These add SMS/WhatsApp to
                    households with a phone number on file.
                  </p>
                </fieldset>
              )}
            </div>

            <div className="p-4 border-t border-border flex gap-3 shrink-0">
              <Button variant="ghost" fullWidth onClick={handleClose}>
                Cancel
              </Button>
              <Button
                variant="primary"
                fullWidth
                disabled={!canSubmit}
                isLoading={isSubmitting}
                loadingText="Saving…"
                onClick={() => {
                  const deliveryChannels: ('SMS' | 'WHATSAPP')[] = [];
                  if (sendSms) deliveryChannels.push('SMS');
                  if (sendWhatsApp) deliveryChannels.push('WHATSAPP');
                  onSubmit({
                    title: title.trim(),
                    body: body.trim(),
                    priority: priority as 'NORMAL' | 'URGENT',
                    ...(deliveryChannels.length > 0 ? { deliveryChannels } : {}),
                  });
                }}
              >
                {announcement ? 'Save Changes' : 'Post Announcement'}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
