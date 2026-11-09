'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Send } from 'lucide-react';
import {
  Alert,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  Field,
  Textarea,
  useToast,
} from '@sureground/ui';
import { unwrap } from '@/lib/apiHelpers';
import { landlordKeys } from '@/lib/queryKeys';
import { landlordService } from '@/services/landlordService';
import type { ApplicantSummary } from '@/types/applicantSummary';
import type { RentalApplication } from '@/types/landlord';

/** A starting message: the summary's questions when they have loaded, else a plain ask. */
function draftFor(application: RentalApplication, summary: ApplicantSummary | undefined) {
  const first = application.applicantName.split(' ')[0];
  const questions = summary?.questions ?? [];
  return questions.length
    ? `Hello ${first}, thank you for applying for ${application.unitName}. Before I decide, could you help with the following?\n\n${questions.map((q) => `- ${q}`).join('\n')}\n\nThank you.`
    : `Hello ${first}, thank you for applying for ${application.unitName}. Before I decide, could you share `;
}

/**
 * "Request info": the landlord writes what they need, the applicant gets it as
 * a message they can reply to, and a pending application moves to under
 * review. Only applicants with a Sureground account can be messaged.
 */
export function RequestInfoDialog({
  application,
  onClose,
}: {
  application: RentalApplication | null;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const summary = application
    ? queryClient.getQueryData<ApplicantSummary>(landlordKeys.applicantSummary(application.id))
    : undefined;
  // Keyed by application in the parent, so the draft starts fresh for each one.
  const [message, setMessage] = useState(() => (application ? draftFor(application, summary) : ''));

  const send = useMutation({
    mutationFn: () =>
      unwrap(landlordService.requestApplicationInfo(application!.id, message.trim())),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['landlord', 'applications'] });
      toast.success(`Sent to ${application!.applicantName}. Their reply will appear in Messages.`);
      onClose();
    },
  });

  return (
    <Dialog open={!!application} onOpenChange={(open) => !open && onClose()}>
      {application && (
        <DialogContent size="md">
          <DialogTitle className="text-base font-semibold text-foreground">
            Ask {application.applicantName} for more information
          </DialogTitle>
          <DialogDescription className="mt-1 text-sm text-muted-foreground">
            They get this as a message on Sureground and can reply there. A pending application
            moves to under review.
          </DialogDescription>
          <div className="mt-4 space-y-3">
            <Field label="Your message" required>
              <Textarea
                rows={8}
                maxLength={2000}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
            </Field>
            {send.isError && (
              <Alert variant="danger">
                {send.error instanceof Error ? send.error.message : 'The message was not sent.'}
              </Alert>
            )}
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={onClose} disabled={send.isPending}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                className="gap-1.5"
                onClick={() => send.mutate()}
                isLoading={send.isPending}
                loadingText="Sending…"
                disabled={message.trim().length < 5}
              >
                <Send className="h-3.5 w-3.5" aria-hidden="true" />
                Send request
              </Button>
            </div>
          </div>
        </DialogContent>
      )}
    </Dialog>
  );
}
