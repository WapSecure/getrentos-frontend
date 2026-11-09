'use client';

import { FileSignature, Handshake, Pause, Play, Send, ShieldCheck } from '@sureground/icons';
import { Button } from '@sureground/ui';
import type { ManagementMandateDto } from '@/services/mandateService';
import type { ReasonAction, SimpleAction } from './useMandateActions';

// Buttons come from the API's `permissions`, never `status`: who may act depends on the caller. An unavailable action is absent, not disabled.
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
      {permissions.canServeNotice && !mandate.noticeServedAt && (
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
      {/* Staff ask to end an engagement and a second staff member approves; an owner who is also staff sees both. */}
      {permissions.canRequestTermination && (
        <Button
          size="sm"
          variant="outline"
          disabled={busy}
          onClick={() => onReason(mandate, 'request-termination')}
        >
          <ShieldCheck className="mr-1.5 h-3.5 w-3.5" aria-hidden />
          Ask Sureground to end it
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
