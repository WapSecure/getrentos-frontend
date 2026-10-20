'use client';

import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import {
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  Field,
  IconButton,
  Input,
} from '@getrentos/ui';

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
    <Dialog open={isOpen} onOpenChange={(next) => !next && handleClose()}>
      <DialogContent size="md">
        <DialogTitle className="text-lg font-semibold text-foreground">New Poll</DialogTitle>

        <div className="mt-5 space-y-4">
          <Field label="Question" required>
            <Input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="e.g. Should we repaint the main gate?"
            />
          </Field>

          <div role="group" aria-labelledby="poll-options-label">
            <p id="poll-options-label" className="block text-sm font-medium text-foreground mb-1">
              Options
            </p>
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
                className="mt-2"
                icon={<Plus className="w-3.5 h-3.5" aria-hidden="true" />}
                onClick={() => setOptions((current) => [...current, ''])}
              >
                Add option
              </Button>
            )}
          </div>
        </div>

        <div className="mt-6 flex flex-wrap justify-end gap-2">
          <Button variant="ghost" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            disabled={!canSubmit}
            isLoading={isSubmitting}
            loadingText="Creating…"
            onClick={() => onSubmit({ question: question.trim(), options: trimmedOptions })}
          >
            Create Poll
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
