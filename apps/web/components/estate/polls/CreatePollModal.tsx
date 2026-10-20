'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Plus, Trash2, X } from 'lucide-react';
import { Button, Field, IconButton, Input } from '@getrentos/ui';

const MAX_OPTIONS = 10;

interface CreatePollModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { question: string; options: string[] }) => void;
  isSubmitting?: boolean;
}

export const CreatePollModal = ({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting,
}: CreatePollModalProps) => {
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);

  const handleClose = () => {
    setQuestion('');
    setOptions(['', '']);
    onClose();
  };

  const updateOption = (index: number, value: string) => {
    setOptions((current) => current.map((option, i) => (i === index ? value : option)));
  };

  const removeOption = (index: number) => {
    setOptions((current) => current.filter((_, i) => i !== index));
  };

  const trimmedOptions = options.map((option) => option.trim()).filter(Boolean);
  const canSubmit = question.trim().length > 0 && trimmedOptions.length >= 2;

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
              <h3 className="font-semibold text-foreground">New Poll</h3>
              <IconButton label="Close" icon={<X />} size="sm" onClick={handleClose} />
            </div>

            <div className="p-4 space-y-4 overflow-y-auto flex-1">
              <Field label="Question">
                <Input
                  type="text"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="e.g. Should we repaint the main gate?"
                />
              </Field>

              <div>
                <p className="block text-sm font-medium text-foreground mb-1">Options</p>
                <div className="space-y-2">
                  {options.map((option, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Input
                        type="text"
                        className="min-w-0 flex-1"
                        aria-label={`Option ${index + 1}`}
                        value={option}
                        onChange={(e) => updateOption(index, e.target.value)}
                        placeholder={`Option ${index + 1}`}
                      />
                      {options.length > 2 && (
                        <IconButton
                          label={`Remove option ${index + 1}`}
                          icon={<Trash2 />}
                          variant="danger"
                          size="sm"
                          onClick={() => removeOption(index)}
                        />
                      )}
                    </div>
                  ))}
                </div>
                {options.length < MAX_OPTIONS && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1.5 mt-2"
                    onClick={() => setOptions((current) => [...current, ''])}
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add option
                  </Button>
                )}
              </div>
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
                loadingText="Creating…"
                onClick={() => onSubmit({ question: question.trim(), options: trimmedOptions })}
              >
                Create Poll
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
