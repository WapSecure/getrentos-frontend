'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ConfirmDialog } from '@getrentos/ui';
import { unwrap } from '@/lib/apiHelpers';
import { mandateKeys } from '@/lib/queryKeys';
import * as mandateService from '@/services/mandateService';
import type { ManagementMandateDto } from '@/services/mandateService';

/**
 * Every lifecycle move a screen can make on an engagement, in one place.
 *
 * The list and the detail page offer the same actions — a manager who can pause
 * an engagement from the list can pause it from its own page — so the mutation,
 * the reason prompts and the cache invalidation live here rather than twice. The
 * only thing a caller decides is *which* actions to show, and it decides that
 * from the API's `permissions`, never from the status.
 *
 * The reason text is deliberately enforced client-side as well as server-side.
 * The server requires ten characters because a second person may have to decide
 * on the reason; asking for it up front is cheaper than a round trip that fails.
 */

/** Actions that end or pause an engagement, each needing a reason on the record. */
export type ReasonAction = 'notice' | 'terminate' | 'suspend' | 'request-termination';

/** Actions that need nothing said about them beyond the fact of doing them. */
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
      'agreed notice period has passed — it does not end the mandate today, and it cannot be ' +
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
    title: 'Ask GetRentos to end this engagement?',
    description:
      'This raises a request, not an ending. The mandate keeps running and your access stays ' +
      'while it is open, and a second GetRentos staff member has to approve it — no one person ' +
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
          // The side is inferred from who is calling, so the UI cannot sign for
          // the other party even if it tried.
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
      // An action can move the record, so the row the caller is looking at must
      // be refetched too — otherwise a detail page keeps showing the old status
      // while the list behind it has moved on.
      if (isDto(result)) {
        queryClient.setQueryData(mandateKeys.one(input.mandate.id), result);
      }
      setPending(null);
      setReason('');
    },
  });

  return {
    /** The mutation, so a caller can disable buttons while one is in flight. */
    act,
    /** Run an action that needs nothing said about it. */
    runSimple: (mandate: ManagementMandateDto, action: SimpleAction) =>
      act.mutate({ mandate, action }),
    /** Open the reason prompt for an action that needs one. */
    askReason: (mandate: ManagementMandateDto, action: ReasonAction) => {
      setReason('');
      setPending({ mandate, action });
    },
    /** The prompt itself, or null. Render it once inside the caller's tree. */
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
            ? 'At least 10 characters — whoever has to decide will read this'
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

/** Every cache a lifecycle move can invalidate, for one engagement. */
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

/**
 * `requestTermination` answers with the request, not the mandate, while every
 * other action answers with the mandate. Only the latter is safe to write into
 * the mandate cache.
 *
 * The test is on fields only a mandate carries. `id` and `status` would not do
 * it: a termination request has both, so keying on those would write a request
 * into the mandate cache and the page would render it as an engagement.
 */
function isDto(result: unknown): result is ManagementMandateDto {
  return Boolean(
    result &&
    typeof result === 'object' &&
    'scope' in result &&
    'propertyId' in result &&
    'noticePeriodDays' in result
  );
}
