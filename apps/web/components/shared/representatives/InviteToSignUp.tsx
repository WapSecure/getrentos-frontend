'use client';

import { useState } from 'react';
import { Alert, Button } from '@sureground/ui';
import { Check, Copy, MessageCircle, Share2 } from '@sureground/icons';
import { ROUTES, signupInviteMessage, whatsappShareUrl } from '@sureground/shared';

/**
 * Shown when nobody on Sureground has the phone number or email typed. The link is the plain
 * signup page: no tracking parameters and nothing about either person.
 */
export function InviteToSignUp({
  message,
  reason,
  footnote = 'Once they have signed up, appoint them here with the same phone number or email.',
}: {
  message: string;
  /** Finishes "Join me on Sureground so I can …" in the shared message. */
  reason?: string;
  footnote?: string;
}) {
  const [copied, setCopied] = useState(false);
  const signupUrl =
    typeof window !== 'undefined' ? `${window.location.origin}${ROUTES.SIGNUP}` : ROUTES.SIGNUP;
  const text = signupInviteMessage(signupUrl, reason);
  const canShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(signupUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  const share = async () => {
    try {
      await navigator.share({ title: 'Join me on Sureground', text, url: signupUrl });
    } catch {
      // Closing the share sheet is not an error worth showing.
    }
  };

  return (
    <Alert variant="info" title="They are not on Sureground yet">
      <p>{message}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {canShare ? (
          <Button size="sm" onClick={share} icon={<Share2 className="h-4 w-4" aria-hidden />}>
            Share an invite link
          </Button>
        ) : (
          <Button
            size="sm"
            onClick={copy}
            icon={
              copied ? (
                <Check className="h-4 w-4" aria-hidden />
              ) : (
                <Copy className="h-4 w-4" aria-hidden />
              )
            }
          >
            {copied ? 'Link copied' : 'Share an invite link'}
          </Button>
        )}
        <Button
          size="sm"
          variant="outline"
          href={whatsappShareUrl(text)}
          target="_blank"
          icon={<MessageCircle className="h-4 w-4" aria-hidden />}
        >
          Send on WhatsApp
        </Button>
        {canShare && (
          <Button
            size="sm"
            variant="ghost"
            onClick={copy}
            icon={
              copied ? (
                <Check className="h-4 w-4" aria-hidden />
              ) : (
                <Copy className="h-4 w-4" aria-hidden />
              )
            }
          >
            {copied ? 'Copied' : 'Copy link'}
          </Button>
        )}
      </div>
      <p className="mt-2 text-xs text-muted-foreground">{footnote}</p>
    </Alert>
  );
}
