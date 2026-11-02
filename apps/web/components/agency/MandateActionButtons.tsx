'use client';

import { FileSignature, Handshake, Pause, Play, Send, ShieldCheck } from 'lucide-react';
import { Button } from '@getrentos/ui';
import type { ManagementMandateDto } from '@/services/mandateService';
import type { ReasonAction, SimpleAction } from './useMandateActions';

/**
 * The lifecycle buttons for one engagement, on whatever screen is showing it.
 *
 * Which buttons appear comes entirely from the API's `permissions`, never from
 * `status`. Status is not enough to answer the question: whether a caller may
 * pause an engagement depends on who they are — the owner or the platform may,
 * the manager may not — and a screen cannot work that out from a status field.
 * Restating the rules here is how this component previously came to offer
 * "Pause" to managers the API then refused with a 403.
 *
 * An action that is unavailable is *absent*, not disabled. A greyed-out button
 * implies "not yet, or not in this state", which is wrong: for most callers
 * these actions are never available, on any state.
 */
export function MandateActionButtons({
  mandate,
  busy,
  onSimple,
  onReason,
}: {
  mandate: ManagementMandateDto;
  busy: boolean;
  onSimple: (mandate: ManagementMandateDto, action: SimpleAction) => void;
  onReason: (mandate: ManagementMandateDto, action: ReasonAction) => void;
}) {
  const { permissions } = mandate;

  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {permissions.canSubmit && (
        <Button size="sm" disabled={busy} onClick={() => onSimple(mandate, 'submit')}>
          <Send className="mr-1.5 h-3.5 w-3.5" aria-hidden />
          Send to the owner
        </Button>
      )}
      {permissions.canSign && (
        <Button size="sm" disabled={busy} onClick={() => onSimple(mandate, 'sign')}>
          <FileSignature className="mr-1.5 h-3.5 w-3.5" aria-hidden />
          Sign
        </Button>
      )}
      {permissions.canServeNotice && (
        <Button
          size="sm"
          variant="outline"
          disabled={busy}
          onClick={() => onReason(mandate, 'notice')}
        >
          Serve notice
        </Button>
      )}
      {permissions.canSuspend && (
        <Button
          size="sm"
          variant="outline"
          disabled={busy}
          onClick={() => onReason(mandate, 'suspend')}
        >
          <Pause className="mr-1.5 h-3.5 w-3.5" aria-hidden />
          Pause
        </Button>
      )}
      {permissions.canResume && (
        <Button size="sm" disabled={busy} onClick={() => onSimple(mandate, 'resume')}>
          <Play className="mr-1.5 h-3.5 w-3.5" aria-hidden />
          Resume
        </Button>
      )}
      {permissions.canConfirmHandover && (
        <Button
          size="sm"
          variant="outline"
          disabled={busy}
          onClick={() => onSimple(mandate, 'handover')}
        >
          <Handshake className="mr-1.5 h-3.5 w-3.5" aria-hidden />
          Record handover
        </Button>
      )}
      {/*
        Two different ways an engagement ends, and the API decides which are open
        to this caller. Staff cannot end one directly — they ask, and a second
        staff member approves — so for them only the asking button appears. An
        owner who is also staff sees both, because withdrawing their own consent
        is a separate right from the pair rule.
      */}
      {permissions.canRequestTermination && (
        <Button
          size="sm"
          variant="outline"
          disabled={busy}
          onClick={() => onReason(mandate, 'request-termination')}
        >
          <ShieldCheck className="mr-1.5 h-3.5 w-3.5" aria-hidden />
          Ask GetRentos to end it
        </Button>
      )}
      {permissions.canTerminate && (
        <Button
          size="sm"
          variant="danger"
          disabled={busy}
          onClick={() => onReason(mandate, 'terminate')}
        >
          End engagement
        </Button>
      )}
    </div>
  );
}
