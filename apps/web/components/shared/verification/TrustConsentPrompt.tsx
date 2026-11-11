'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@sureground/ui';
import { unwrap } from '@/lib/apiHelpers';
import { formatDate } from '@/lib/format';
import { trustService } from '@/services/trustService';

export type TrustConsentType =
  | 'ID_CHECK'
  | 'BIOMETRIC'
  | 'BANK_ACCOUNT_CHECK'
  | 'DOCUMENT_PROCESSING';

// What each consent is recorded for (the purpose the API stores with it).
const CONSENT_PURPOSE: Record<TrustConsentType, string> = {
  ID_CHECK: 'Identity verification',
  BIOMETRIC: 'Biometric verification',
  BANK_ACCOUNT_CHECK: 'Financial verification',
  DOCUMENT_PROCESSING: 'Document verification',
};

export const TRUST_CONSENTS_KEY = ['trust-consents'] as const;

/** The person's trust consents, and whether one of a type is active. */
export function useTrustConsents() {
  const { data: consents } = useQuery({
    queryKey: TRUST_CONSENTS_KEY,
    queryFn: () => unwrap(trustService.listConsents()),
  });
  const find = (type: TrustConsentType) => consents?.find((c) => c.consentType === type);
  const isActive = (type: TrustConsentType) => {
    const consent = find(type);
    return Boolean(consent && !consent.revokedAt);
  };
  return { consents, find, isActive };
}

/** Asks for one trust consent before a check, or shows when it was given with a way to withdraw it. */
export function TrustConsentPrompt({
  type,
  text,
  onError,
}: {
  type: TrustConsentType;
  /** What the consent lets us do, in plain words. */
  text: string;
  onError?: (message: string | null) => void;
}) {
  const queryClient = useQueryClient();
  const { find, isActive } = useTrustConsents();
  const consent = find(type);

  const refresh = () => {
    onError?.(null);
    queryClient.invalidateQueries({ queryKey: TRUST_CONSENTS_KEY });
  };

  const grant = useMutation({
    mutationFn: () =>
      unwrap(
        trustService.grantConsent({
          consentType: type,
          purpose: CONSENT_PURPOSE[type],
          expiresInDays: 365,
        })
      ),
    onSuccess: refresh,
    onError: (reason) =>
      onError?.(reason instanceof Error ? reason.message : 'Unable to record consent.'),
  });

  const revoke = useMutation({
    mutationFn: (consentId: string) => unwrap(trustService.revokeConsent(consentId)),
    onSuccess: refresh,
    onError: (reason) =>
      onError?.(reason instanceof Error ? reason.message : 'Unable to revoke consent.'),
  });

  return isActive(type) && consent ? (
    <p className="text-xs text-muted-foreground">
      Consent given {formatDate(consent.grantedAt)} ·{' '}
      <button
        type="button"
        className="underline hover:no-underline"
        onClick={() => revoke.mutate(consent.id)}
        disabled={revoke.isPending}
      >
        withdraw
      </button>
    </p>
  ) : (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-muted/40 p-3">
      <p className="min-w-0 flex-1 text-xs text-muted-foreground">{text}</p>
      <Button
        size="sm"
        isLoading={grant.isPending}
        loadingText="Recording…"
        onClick={() => grant.mutate()}
      >
        Agree and continue
      </Button>
    </div>
  );
}
