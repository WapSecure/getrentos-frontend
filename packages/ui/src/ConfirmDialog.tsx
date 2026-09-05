'use client';

import { useId } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from './Dialog';
import { Button } from './Button';
import { Textarea } from './Textarea';

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  onConfirm: () => void;
  promptLabel?: string;
  promptPlaceholder?: string;
  promptValue?: string;
  onPromptChange?: (value: string) => void;
  promptRequired?: boolean;
  promptMinLength?: number;
}

export const ConfirmDialog = ({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Delete',
  onConfirm,
  promptLabel,
  promptPlaceholder,
  promptValue = '',
  onPromptChange,
  promptRequired = false,
  promptMinLength = 1,
}: ConfirmDialogProps) => {
  const promptId = useId();
  const promptInvalid = promptRequired && promptValue.trim().length < promptMinLength;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showClose={false}>
        <div className="p-5">
          <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center mb-3">
            <AlertTriangle className="w-5 h-5 text-destructive" aria-hidden="true" />
          </div>
          <DialogTitle className="font-semibold text-foreground">{title}</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground mt-1">
            {description}
          </DialogDescription>

          {promptLabel && onPromptChange && (
            <div className="mt-4 space-y-1.5">
              <label htmlFor={promptId} className="text-sm font-medium text-foreground">
                {promptLabel}
                {promptRequired && <span className="ml-1 text-destructive">*</span>}
              </label>
              <Textarea
                id={promptId}
                value={promptValue}
                onChange={(event) => onPromptChange(event.target.value)}
                placeholder={promptPlaceholder}
                required={promptRequired}
                minLength={promptMinLength}
                rows={3}
              />
              {promptRequired && (
                <p className="text-xs text-muted-foreground">
                  Required for the administrative audit trail
                  {promptMinLength > 1 ? ` · At least ${promptMinLength} characters.` : '.'}
                </p>
              )}
            </div>
          )}

          <div className="flex gap-2 mt-5">
            <Button variant="ghost" className="flex-1" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              className="flex-1"
              disabled={promptInvalid}
              onClick={() => {
                onConfirm();
                onOpenChange(false);
              }}
            >
              {confirmLabel}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
