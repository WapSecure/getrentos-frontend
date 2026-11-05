'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Plus, Sparkles, Trash2 } from 'lucide-react';
import {
  Alert,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  Field,
  IconButton,
  Input,
  Textarea,
} from '@getrentos/ui';
import { unwrap } from '@/lib/apiHelpers';
import { estateService } from '@/services/estateService';

const MAX_OPTIONS = 10;

interface CreatePollModalProps {
  /** For "Write it for me": drafts a neutral question and options from a topic. */
  estateId?: string;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { question: string; options: string[] }) => void;
  isSubmitting?: boolean;
}

export const CreatePollModal = ({
  estateId,
  isOpen,
  onClose,
  onSubmit,
  isSubmitting,
}: CreatePollModalProps) => {
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);

  const [topic, setTopic] = useState('');
  const draft = useMutation({
    mutationFn: () => unwrap(estateService.draftPoll(estateId!, topic.trim())),
    onSuccess: (d) => {
      setQuestion(d.question);
      setOptions(d.options);
    },
  });

  const handleClose = () => {
    setQuestion('');
    setOptions(['', '']);
    setTopic('');
    draft.reset();
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
        <DialogTitle className="text-lg font-semibold text-foreground">New poll</DialogTitle>

        <div className="mt-5 space-y-4">
          {estateId && (
            <div className="space-y-2 rounded-lg border border-border p-3">
              <Field
                label="Write it for me"
                hint="Describe the decision. You get a neutral question and fair options to edit."
              >
                <Textarea
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  rows={2}
                  placeholder="e.g. Buy a backup pump for ₦850,000 split across households, or keep repairing the old one"
                />
              </Field>
              <Button
                size="sm"
                variant="outline"
                icon={<Sparkles className="h-4 w-4" aria-hidden />}
                disabled={topic.trim().length < 5}
                isLoading={draft.isPending}
                loadingText="Drafting…"
                onClick={() => draft.mutate()}
              >
                Draft poll
              </Button>
              {draft.isError && (
                <Alert variant="danger">
                  {draft.error.message || 'Could not draft it. Try again.'}
                </Alert>
              )}
            </div>
          )}

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
            Create poll
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
