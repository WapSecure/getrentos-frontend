'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { Button, LegacyInput, Select } from '@getrentos/ui';

const categoryOptions = [
  { value: 'SECURITY', label: 'Security' },
  { value: 'MAINTENANCE', label: 'Maintenance' },
  { value: 'SAFETY', label: 'Safety' },
  { value: 'OTHER', label: 'Other' },
];

const priorityOptions = [
  { value: 'LOW', label: 'Low' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'HIGH', label: 'High' },
  { value: 'CRITICAL', label: 'Critical' },
];

interface ReportIncidentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    description: string;
    category?: 'SECURITY' | 'MAINTENANCE' | 'SAFETY' | 'OTHER';
    priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    photo?: File;
  }) => void;
  isSubmitting?: boolean;
}

export const ReportIncidentModal = ({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting,
}: ReportIncidentModalProps) => {
  const [category, setCategory] = useState('OTHER');
  const [priority, setPriority] = useState('MEDIUM');
  const [description, setDescription] = useState('');
  const [photo, setPhoto] = useState<File | null>(null);

  const handleClose = () => {
    setCategory('OTHER');
    setPriority('MEDIUM');
    setDescription('');
    setPhoto(null);
    onClose();
  };

  const canSubmit = description.trim().length > 0;

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
              <h3 className="font-semibold text-foreground">Report Incident</h3>
              <button onClick={handleClose} className="p-1 rounded-lg hover:bg-secondary">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-4 overflow-y-auto flex-1">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Category</label>
                  <Select value={category} onValueChange={setCategory} options={categoryOptions} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Priority</label>
                  <Select value={priority} onValueChange={setPriority} options={priorityOptions} />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  placeholder="What happened, where, and who's involved…"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Photo <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <LegacyInput
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={(e) => setPhoto(e.target.files?.[0] ?? null)}
                />
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
                    description: description.trim(),
                    category: category as 'SECURITY' | 'MAINTENANCE' | 'SAFETY' | 'OTHER',
                    priority: priority as 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL',
                    photo: photo ?? undefined,
                  })
                }
              >
                {isSubmitting ? 'Reporting…' : 'Report Incident'}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
