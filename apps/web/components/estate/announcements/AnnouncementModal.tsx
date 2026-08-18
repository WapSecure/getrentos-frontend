'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { Button, LegacyInput, Select } from '@getrentos/ui';
import type { Announcement } from '@/types/estate';

interface AnnouncementModalProps {
  isOpen: boolean;
  announcement: Announcement | null;
  onClose: () => void;
  onSubmit: (data: { title: string; body: string; priority: 'NORMAL' | 'URGENT' }) => void;
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

  const handleClose = () => {
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
              <button onClick={handleClose} className="p-1 rounded-lg hover:bg-secondary">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-4 overflow-y-auto flex-1">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Title</label>
                <LegacyInput
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Water outage this weekend"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Message</label>
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  rows={5}
                  placeholder="Details for residents…"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Priority</label>
                <Select value={priority} onValueChange={setPriority} options={priorityOptions} />
              </div>
            </div>

            <div className="p-4 border-t border-border flex gap-3 shrink-0">
              <Button variant="ghost" fullWidth onClick={handleClose}>
                Cancel
              </Button>
              <Button
                variant="primary"
                fullWidth
                disabled={!canSubmit || isSubmitting}
                onClick={() =>
                  onSubmit({
                    title: title.trim(),
                    body: body.trim(),
                    priority: priority as 'NORMAL' | 'URGENT',
                  })
                }
              >
                {isSubmitting ? 'Saving…' : announcement ? 'Save Changes' : 'Post Announcement'}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
