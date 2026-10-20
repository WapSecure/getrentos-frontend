'use client';

import { useState } from 'react';
import { Check } from 'lucide-react';
import {
  Alert,
  Button,
  Checkbox,
  Dialog,
  DialogContent,
  DialogTitle,
  Field,
  Input,
  RadioGroup,
  Select,
  Textarea,
} from '@getrentos/ui';
import type { AgentTask, VerificationVisit } from '@/types/agent';

interface NewVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: AgentTask[];
  defaultTaskId?: string;
  onSubmit: (visit: Omit<VerificationVisit, 'id' | 'syncStatus'>) => Promise<boolean>;
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const selectedTask = tasks.find((t) => t.id === taskId);
  const subjectTypeOptions = (['tenant', 'buyer', 'property'] as const).map((type) => ({
    value: type,
    label: type.charAt(0).toUpperCase() + type.slice(1),
  }));

  const handleClose = () => {
    setTaskId(defaultTaskId || '');
    setSubjectName('');
    setSubjectType('tenant');
    setIdVerified(false);
    setAddressConfirmed(false);
    setNotes('');
    setErrorMessage(null);
    onClose();
  };

  const handleSubmit = async () => {
    if (!selectedTask || isSubmitting) return;
    setIsSubmitting(true);
    setErrorMessage(null);
    const stored = await onSubmit({
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
    setIsSubmitting(false);
    if (!stored) {
      setErrorMessage('The verification could not be saved or queued. Your entry is unchanged.');
      return;
    }
    handleClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="p-0 sm:max-w-sm sm:p-0">
        <div className="p-4 pr-12 border-b border-border">
          <DialogTitle className="font-semibold text-foreground">Log Verification</DialogTitle>
        </div>

        <div className="p-4 space-y-4">
          <Field label="Task" required>
            <Select
              value={taskId}
              onValueChange={setTaskId}
              placeholder="Select a verification task"
              options={tasks.map((t) => ({
                value: t.id,
                label: `${t.title}: ${t.propertyAddress}`,
              }))}
            />
          </Field>

          <Field label="Subject Name" required>
            <Input
              type="text"
              value={subjectName}
              onChange={(e) => setSubjectName(e.target.value)}
            />
          </Field>

          <Field label="Subject Type">
            <RadioGroup
              value={subjectType}
              onValueChange={setSubjectType}
              options={subjectTypeOptions}
              orientation="horizontal"
            />
          </Field>

          <Checkbox
            checked={idVerified}
            onCheckedChange={setIdVerified}
            label="ID document verified on-site"
          />

          <Checkbox
            checked={addressConfirmed}
            onCheckedChange={setAddressConfirmed}
            label="Address confirmed on-site"
          />

          <Field label="Notes" optionalLabel="(optional)">
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
          </Field>
        </div>

        <div className="p-4 border-t border-border">
          <Button
            variant="primary"
            fullWidth
            icon={<Check className="w-4 h-4" />}
            onClick={() => void handleSubmit()}
            isLoading={isSubmitting}
            loadingText="Saving…"
            disabled={!taskId || !subjectName}
          >
            Save Verification
          </Button>
          {errorMessage && (
            <Alert variant="danger" className="mt-2">
              {errorMessage}
            </Alert>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
