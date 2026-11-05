'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, Copy, Mail, MessageCircle, Send } from 'lucide-react';
import { Badge, Button, Card, Select, Skeleton, useToast, type BadgeVariant } from '@getrentos/ui';
import { unwrap } from '@/lib/apiHelpers';
import { realtorKeys } from '@/lib/queryKeys';
import { REPLY_LANGUAGES, languageLabel, type ReplyLanguage } from '@/lib/replyLanguage';
import { nigerianWhatsappLink } from '@/lib/support';
import { realtorService } from '@/services/realtorService';
import type { FollowUp, FollowUpStep } from '@/types/followUps';

const STEP: Record<FollowUpStep, { label: string; variant: BadgeVariant }> = {
  confirm_viewing: { label: 'Confirm viewing', variant: 'info' },
  first_contact: { label: 'First reply', variant: 'warning' },
  after_viewing: { label: 'After viewing', variant: 'info' },
  listing_gone: { label: 'Home gone', variant: 'warning' },
  offer_viewing: { label: 'Offer a viewing', variant: 'neutral' },
  check_in: { label: 'Check in', variant: 'neutral' },
  last_try: { label: 'Last try', variant: 'neutral' },
};

/** How many show before "Show all". */
const FIRST = 4;

/**
 * "Follow up today": open leads due a nudge, most pressing first, each with
 * the reason and a drafted message the realtor sends on WhatsApp or email,
 * then marks contacted. Hidden when nothing is due or if it fails.
 */
export function FollowUpsPanel() {
  const queryClient = useQueryClient();
  const toast = useToast();
  // The lead's language, for the messages; the panel itself stays in English.
  const [language, setLanguage] = useState<ReplyLanguage>('en');
  const [showAll, setShowAll] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const { data, isLoading, isFetching } = useQuery({
    queryKey: realtorKeys.followUps(language),
    queryFn: () => unwrap(realtorService.getFollowUps(language)),
    placeholderData: (previous) => previous,
    staleTime: 5 * 60_000,
    retry: false,
  });
  const contacted = useMutation({
    mutationFn: (leadId: string) => unwrap(realtorService.markLeadContacted(leadId)),
    onSuccess: () => {
      toast.success('Marked contacted. It will come back here if they go quiet.');
      void queryClient.invalidateQueries({ queryKey: realtorKeys.leads });
    },
    onError: (error: Error) => toast.error(error.message || 'Could not mark that lead contacted.'),
  });

  const copy = async (f: FollowUp) => {
    try {
      await navigator.clipboard.writeText(f.message);
      setCopied(f.leadId);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      toast.error('Could not copy. Select the message and copy it instead.');
    }
  };

  if (isLoading) {
    return (
      <Card static className="mb-6 space-y-2 p-5">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-16 w-full" />
      </Card>
    );
  }
  if (!data?.followUps.length) return null;
  const shown = showAll ? data.followUps : data.followUps.slice(0, FIRST);

  return (
    <Card static className="mb-6 space-y-4 p-5" aria-labelledby="follow-ups-title">
      <div className="flex flex-wrap items-center gap-2">
        <Send className="h-4 w-4 text-primary" aria-hidden="true" />
        <h2 id="follow-ups-title" className="text-sm font-semibold text-foreground">
          Follow up today
        </h2>
        <Badge variant="neutral">{data.followUps.length}</Badge>
        <div className="ml-auto flex items-center gap-2 text-xs text-muted-foreground">
          <span aria-hidden="true">Messages in</span>
          <Select
            value={language}
            onValueChange={(value) => setLanguage(value as ReplyLanguage)}
            options={REPLY_LANGUAGES.map((l) => ({ value: l.value, label: l.label }))}
            ariaLabel="Message language"
            controlSize="sm"
            searchable={false}
            className="w-32"
          />
        </div>
        {isFetching && (
          <span role="status" className="text-xs text-muted-foreground">
            Writing messages…
          </span>
        )}
      </div>
      <p className="text-sm text-foreground">
        {data.overview}
        {data.onTrack > 0 && (
          <span className="text-muted-foreground">
            {' '}
            {data.onTrack} other open lead{data.onTrack === 1 ? ' is' : 's are'} on track.
          </span>
        )}
      </p>

      <ul className="space-y-3">
        {shown.map((f) => {
          const wa = nigerianWhatsappLink(f.phone, f.message);
          return (
            <li key={f.leadId} className="space-y-2 rounded-lg border border-border p-3 text-xs">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-medium text-foreground">{f.name}</p>
                <Badge variant={STEP[f.step].variant}>{STEP[f.step].label}</Badge>
                {f.listing && (
                  <span className="text-muted-foreground">
                    {f.listing.title} · {f.listing.price}
                  </span>
                )}
              </div>
              <p className="text-muted-foreground">{f.why}</p>
              {f.alternatives.length > 0 && (
                <p className="text-muted-foreground">
                  Similar homes of yours:{' '}
                  {f.alternatives.map((a) => `${a.title} (${a.price})`).join(', ')}
                </p>
              )}
              <div className="rounded-md border border-border bg-muted/30 p-3">
                <p className="whitespace-pre-line text-sm text-foreground">{f.message}</p>
                {f.messageInEnglish && (
                  <p className="mt-2 text-muted-foreground">
                    <span className="font-medium">In English: </span>
                    {f.messageInEnglish}
                  </p>
                )}
                {data.language !== 'en' && f.messageLanguage === 'en' && (
                  <p className="mt-2 text-muted-foreground">
                    Written in English: a {languageLabel(data.language)} version is not available
                    for this one right now.
                  </p>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {wa && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5"
                    onClick={() => window.open(wa, '_blank', 'noopener,noreferrer')}
                  >
                    <MessageCircle className="h-3.5 w-3.5" aria-hidden="true" />
                    Open WhatsApp
                  </Button>
                )}
                {f.email && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5"
                    onClick={() => {
                      window.location.href = `mailto:${f.email}?body=${encodeURIComponent(f.message)}`;
                    }}
                  >
                    <Mail className="h-3.5 w-3.5" aria-hidden="true" />
                    Email
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  onClick={() => void copy(f)}
                >
                  {copied === f.leadId ? (
                    <Check className="h-3.5 w-3.5" aria-hidden="true" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                  )}
                  {copied === f.leadId ? 'Copied' : 'Copy'}
                </Button>
                <Button
                  size="sm"
                  className="ml-auto"
                  isLoading={contacted.isPending && contacted.variables === f.leadId}
                  loadingText="Saving…"
                  onClick={() => contacted.mutate(f.leadId)}
                >
                  Mark contacted
                </Button>
              </div>
            </li>
          );
        })}
      </ul>

      {data.followUps.length > FIRST && (
        <Button variant="ghost" size="sm" onClick={() => setShowAll((v) => !v)}>
          {showAll ? 'Show fewer' : `Show all ${data.followUps.length}`}
        </Button>
      )}
      <p className="text-[11px] text-muted-foreground">{data.disclaimer}</p>
    </Card>
  );
}
