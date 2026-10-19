'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { MessageSquare } from 'lucide-react';
import { Switch } from '@getrentos/ui';

import { unwrap } from '@/lib/apiHelpers';
import { getMessagingConsent, setMessagingConsent } from '@/services/messagingConsentService';

/**
 * Opt in to texts for the few things that should reach you away from the app:
 * rent due or overdue, deposit decisions, emergencies, a payout account
 * change, someone posing as your landlord. Off until you turn it on, and only
 * to a verified number.
 */
export const TextMessageConsentCard = () => {
  const queryClient = useQueryClient();
  const consent = useQuery({
    queryKey: ['me', 'messaging-consent'],
    queryFn: () => unwrap(getMessagingConsent()),
  });
  const save = useMutation({
    mutationFn: (next: { sms: boolean; whatsapp: boolean }) => unwrap(setMessagingConsent(next)),
    onSuccess: (data) => queryClient.setQueryData(['me', 'messaging-consent'], data),
  });

  const c = consent.data;
  if (!c) return null;
  const canOptIn = Boolean(c.phoneEnding && c.phoneVerified);

  const row = (label: string, help: string, key: 'sms' | 'whatsapp') => (
    <div className="flex items-center justify-between gap-4 py-3">
      <div>
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground">{help}</p>
      </div>
      <Switch
        checked={c[key]}
        disabled={save.isPending || (!canOptIn && !c[key])}
        onCheckedChange={(on: boolean) =>
          save.mutate({ sms: c.sms, whatsapp: c.whatsapp, [key]: on })
        }
        aria-label={label}
      />
    </div>
  );

  return (
    <div className="mb-6 rounded-xl border border-border bg-card p-5">
      <h3 className="flex items-center gap-2 font-semibold text-foreground">
        <MessageSquare className="h-4 w-4 text-primary" aria-hidden />
        Text messages
      </h3>
      <p className="mt-1 text-sm text-muted-foreground">
        For the few things you should not miss: rent due or overdue, deposit decisions, emergencies,
        a change to your payout account, or someone posing as your landlord. Off unless you turn it
        on. Quiet from 9pm to 7am except emergencies.
      </p>
      {c.phoneEnding ? (
        <p className="mt-2 text-xs text-muted-foreground">
          To your number ending {c.phoneEnding}
          {!c.phoneVerified && ': verify it in your profile settings first'}.
        </p>
      ) : (
        <p className="mt-2 text-xs text-muted-foreground">
          Add and verify a phone number in your profile first.
        </p>
      )}
      {c.numberChanged && (
        <p className="mt-2 text-xs text-destructive">
          Your number changed since you agreed, so texts have stopped. Turn them on again for this
          number.
        </p>
      )}
      <div className="mt-2 divide-y divide-border">
        {row('SMS', 'Plain text messages.', 'sms')}
        {row('WhatsApp', 'Sent on WhatsApp instead of SMS when both are on.', 'whatsapp')}
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        Our texts never contain links or bank details. If a text asks you to pay somewhere, it is
        not from us.
      </p>
      {save.error && (
        <p className="mt-2 text-sm text-destructive">{(save.error as Error).message}</p>
      )}
    </div>
  );
};
