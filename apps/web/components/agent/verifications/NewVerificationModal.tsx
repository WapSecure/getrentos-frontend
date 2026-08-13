'use client';

import { LegacyInput } from '@/components/ui/LegacyInput';

import { Textarea } from '@/components/ui/Textarea';

import { LegacySelect } from '@/components/ui/LegacySelect';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, Check } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import type { AgentTask, VerificationVisit } from '@/types/agent';

interface NewVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: AgentTask[];
  defaultTaskId?: string;
  onSubmit: (visit: Omit<VerificationVisit, 'id' | 'syncStatus'>) => void;
}

export const NewVerificationModal = ({
  isOpen,
  onClose,
  tasks,
  defaultTaskId,
  onSubmit,
}: NewVerificationModalProps) => {
  const [taskId, setTaskId] = useState(defaultTaskId || '');
  const [subjectName, setSubjectName] = useState('');
  const [subjectType, setSubjectType] = useState<VerificationVisit['subjectType']>('tenant');
  const [idVerified, setIdVerified] = useState(false);
  const [addressConfirmed, setAddressConfirmed] = useState(false);
  const [notes, setNotes] = useState('');

  const selectedTask = tasks.find((t) => t.id === taskId);

  const handleClose = () => {
    setTaskId(defaultTaskId || '');
    setSubjectName('');
    setSubjectType('tenant');
    setIdVerified(false);
    setAddressConfirmed(false);
    setNotes('');
    onClose();
  };

  const handleSubmit = () => {
    if (!selectedTask) return;
    onSubmit({
      taskId: selectedTask.id,
      subjectName,
      subjectType,
      address: selectedTask.propertyAddress,
      scheduledDate: new Date().toISOString(),
      status: 'completed',
      idVerified,
      addressConfirmed,
      notes,
    });
    handleClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-card rounded-xl max-w-sm w-full overflow-hidden"
          >
            <div className="p-4 border-b border-border flex justify-between items-center">
              <h3 className="font-semibold text-foreground">Log Verification</h3>
              <button onClick={handleClose} className="p-1 rounded-lg hover:bg-secondary">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Task <span className="text-red-500">*</span>
                </label>
                <LegacySelect
                  value={taskId}
                  onChange={(e) => setTaskId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">Select a verification task</option>
                  {tasks.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.title} — {t.propertyAddress}
                    </option>
                  ))}
                </LegacySelect>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Subject Name <span className="text-red-500">*</span>
                </label>
                <LegacyInput
                  type="text"
                  value={subjectName}
                  onChange={(e) => setSubjectName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Subject Type
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['tenant', 'buyer', 'property'] as VerificationVisit['subjectType'][]).map(
                    (type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setSubjectType(type)}
                        className={`px-2 py-2 rounded-lg border text-sm capitalize transition-colors ${
                          subjectType === type
                            ? 'border-primary bg-accent text-primary'
                            : 'border-border text-muted-foreground'
                        }`}
                      >
                        {type}
                      </button>
                    )
                  )}
                </div>
              </div>

              <label className="flex items-center gap-2 text-sm text-foreground">
                <LegacyInput
                  type="checkbox"
                  checked={idVerified}
                  onChange={(e) => setIdVerified(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-primary focus:ring-primary"
                />
                ID document verified on-site
              </label>

              <label className="flex items-center gap-2 text-sm text-foreground">
                <LegacyInput
                  type="checkbox"
                  checked={addressConfirmed}
                  onChange={(e) => setAddressConfirmed(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-primary focus:ring-primary"
                />
                Address confirmed on-site
              </label>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Notes <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            <div className="p-4 border-t border-border">
              <Button
                variant="primary"
                fullWidth
                className="gap-1.5"
                onClick={handleSubmit}
                disabled={!taskId || !subjectName}
              >
                <Check className="w-4 h-4" />
                Save Verification
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
