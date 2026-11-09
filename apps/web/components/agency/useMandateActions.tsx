'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ConfirmDialog } from '@sureground/ui';
import { unwrap } from '@/lib/apiHelpers';
import { mandateKeys } from '@/lib/queryKeys';
import * as mandateService from '@/services/mandateService';
import type { ManagementMandateDto } from '@/services/mandateService';

export type ReasonAction = 'notice' | 'terminate' | 'suspend' | 'request-termination';

export type SimpleAction = 'submit' | 'sign' | 'resume' | 'handover';

export type MandateAction = ReasonAction | SimpleAction;

const REASON_ACTIONS: Record<
  ReasonAction,
  {
    title: string;
    description: string;
    confirmLabel: string;
    promptLabel: string;
    needsReason: boolean;
  }
> = {
  notice: {
    title: 'Serve notice?',
    description:
      'This records the date your notice clock started. The engagement keeps running until the ' +
      'agreed notice period has passed. It does not end the mandate today, and it cannot be ' +
      'back-dated.',
    confirmLabel: 'Serve notice',
    promptLabel: '',
    needsReason: false,
  },
  terminate: {
    title: 'End this engagement?',
    description:
      'This ends the mandate and revokes your access to the property immediately. The owner is ' +
      'notified. Ending it before the notice period has run is allowed, but you have to say why, ' +
      'and that goes on the record.',
    confirmLabel: 'End the mandate',
    promptLabel: 'Why is this ending early, or before notice has run?',
    needsReason: true,
  },
  suspend: {
    title: 'Pause this engagement?',
    description:
      'Your access is revoked but the agreement stays, so resuming does not need it re-signing. ' +
      'Use this when something needs resolving rather than ending.',
    confirmLabel: 'Pause',
    promptLabel: 'What needs resolving?',
    needsReason: true,
  },
  'request-termination': {
    title: 'Ask Sureground to end this engagement?',
    description:
      'This raises a request, not an ending. The mandate keeps running and your access stays ' +
      'while it is open, and a second Sureground staff member has to approve it. No one person ' +
      'ends a client engagement alone.',
    confirmLabel: 'Raise the request',
    promptLabel: 'Why should this engagement end?',
    needsReason: true,
  },
};

export function useMandateActions() {
  const queryClient = useQueryClient();
  const [pending, setPending] = useState<{
    mandate: ManagementMandateDto;
    action: ReasonAction;
  } | null>(null);
  const [reason, setReason] = useState('');

  const act = useMutation({
    mutationFn: async (input: {
      mandate: ManagementMandateDto;
      action: MandateAction;
      reason?: string;
    }) => {
      const { mandate, action } = input;
      const service = mandateService;
      switch (action) {
        case 'submit':
          return unwrap(service.submit(mandate.id));
        case 'sign':
          // The server infers the side from the caller, so the UI can't sign for the other party.
          return unwrap(service.sign(mandate.id));
        case 'notice':
          return unwrap(service.serveNotice(mandate.id));
        case 'terminate':
          return unwrap(service.terminate(mandate.id, input.reason ?? ''));
        case 'suspend':
          return unwrap(service.suspend(mandate.id, input.reason ?? ''));
        case 'resume':
          return unwrap(service.resume(mandate.id));
        case 'handover':
          return unwrap(service.recordHandover(mandate.id));
        case 'request-termination':
          return unwrap(service.requestTermination(mandate.id, input.reason ?? ''));
      }
    },
    onSuccess: (result, input) => {
      invalidateMandate(queryClient, input.mandate.id);
      // An action can move the record, so the detail query is refetched too, not just the list.
      if (isDto(result)) {
        queryClient.setQueryData(mandateKeys.one(input.mandate.id), result);
      }
      setPending(null);
      setReason('');
    },
  });

  return {
    act,
    runSimple: (mandate: ManagementMandateDto, action: SimpleAction) =>
      act.mutate({ mandate, action }),
    askReason: (mandate: ManagementMandateDto, action: ReasonAction) => {
      setReason('');
      setPending({ mandate, action });
    },
    dialog: pending ? (
      <ConfirmDialog
        open
        onOpenChange={(open) => {
          if (!open) setPending(null);
        }}
        title={REASON_ACTIONS[pending.action].title}
        description={REASON_ACTIONS[pending.action].description}
        confirmLabel={REASON_ACTIONS[pending.action].confirmLabel}
        isLoading={act.isPending}
        promptLabel={
          REASON_ACTIONS[pending.action].needsReason
            ? REASON_ACTIONS[pending.action].promptLabel
            : undefined
        }
        promptPlaceholder={
          REASON_ACTIONS[pending.action].needsReason
            ? 'Enter at least 10 characters. The person deciding will read this.'
            : undefined
        }
        promptValue={reason}
        onPromptChange={setReason}
        promptRequired={REASON_ACTIONS[pending.action].needsReason}
        promptMinLength={10}
        onConfirm={() => act.mutate({ mandate: pending.mandate, action: pending.action, reason })}
      />
    ) : null,
  };
}

function invalidateMandate(queryClient: ReturnType<typeof useQueryClient>, id: string) {
  for (const key of [
    mandateKeys.managing,
    mandateKeys.mine,
    mandateKeys.one(id),
    mandateKeys.terminationRequests(id),
  ]) {
    void queryClient.invalidateQueries({ queryKey: key });
  }
}

// `requestTermination` answers with the request, not the mandate; test on mandate-only fields, since a request also has `id` and `status`.
function isDto(result: unknown): result is ManagementMandateDto {
  return Boolean(
    result &&
    typeof result === 'object' &&
    'scope' in result &&
    'propertyId' in result &&
    'noticePeriodDays' in result
  );
}
