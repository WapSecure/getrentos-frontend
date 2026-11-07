'use client';

import { useEffect, useRef, useState } from 'react';
import { Alert, Button } from '@getrentos/ui';
import type { SmileLivenessSession } from '@/services/trustService';

type CaptureImage = { image: string; image_type_id: number };

/** Smile ID image types the capture produces (selfie and liveness frames). */
const SELFIE = 2;
const LIVENESS = 6;

function jpegFrom(base64: string, name: string): File {
  const data = base64.includes(',') ? base64.split(',')[1] : base64;
  const bytes = Uint8Array.from(atob(data), (c) => c.charCodeAt(0));
  return new File([bytes], name, { type: 'image/jpeg' });
}

/** Why the browser can't run the live selfie, or null when it can. */
export function liveCaptureBlocker(): string | null {
  if (typeof window === 'undefined') return null;
  if (!window.isSecureContext) return 'The live selfie needs a secure (https) connection.';
  if (!navigator.mediaDevices?.getUserMedia)
    return 'This browser can’t use a camera. Try Chrome, Safari, Edge or Firefox, or use the GetRentos app.';
  if (typeof WebAssembly === 'undefined')
    return 'This browser can’t run the face check. Update it, or use the GetRentos app.';
  return null;
}

/**
 * Smile ID's official browser capture (`<smart-camera-web>` from
 * @smileid/web-sdk): it guides the person through a selfie and a series of
 * liveness frames from the camera. The frames go straight to Smile's
 * SmartSelfie registration with the short-lived token our server issued;
 * Smile decides, and tells our server by signed webhook. Nothing this
 * component reports can pass the check: `onSubmitted` only means "sent".
 */
export function LiveSelfieCapture({
  session,
  onSubmitted,
  onCancel,
}: {
  session: SmileLivenessSession;
  onSubmitted: (jobId: string) => void;
  onCancel: () => void;
}) {
  const host = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const container = host.current;
    if (!container) return;
    let element: HTMLElement | null = null;
    let cancelled = false;

    const submit = async (images: CaptureImage[]) => {
      const selfie = images.find((i) => i.image_type_id === SELFIE);
      const liveness = images.filter((i) => i.image_type_id === LIVENESS);
      if (!selfie || liveness.length === 0) {
        setError('The capture did not finish. Please try again.');
        return;
      }
      setSending(true);
      const body = new FormData();
      body.append('selfie_image', jpegFrom(selfie.image, 'selfie.jpg'));
      liveness.forEach((frame, i) =>
        body.append('liveness_images', jpegFrom(frame.image, `liveness-${i}.jpg`))
      );
      body.append(
        'consent',
        JSON.stringify({
          granted: true,
          granted_at: session.consent.grantedAt,
          notice_language: session.consent.noticeLanguage,
          notice_privacy_policy_url: session.consent.noticePrivacyPolicyUrl,
        })
      );
      body.append(
        'user_details',
        JSON.stringify({
          given_names: session.userDetails.givenNames,
          last_name: session.userDetails.lastName,
          ...(session.userDetails.email ? { email: session.userDetails.email } : {}),
          ...(session.userDetails.phoneNumber
            ? { phone_number: session.userDetails.phoneNumber }
            : {}),
        })
      );
      if (session.callbackUrl) body.append('callback_url', session.callbackUrl);
      try {
        const response = await fetch(`${session.apiUrl}/registration`, {
          method: 'POST',
          headers: { 'smileid-token': session.token, Accept: 'application/json' },
          body,
        });
        const result = (await response.json().catch(() => null)) as {
          job_id?: string;
          message?: string;
        } | null;
        if (!response.ok || !result?.job_id) {
          setError(
            result?.message
              ? `Smile ID: ${result.message}`
              : 'The selfie could not be sent. Please try again.'
          );
          return;
        }
        onSubmitted(result.job_id);
      } catch {
        setError('The selfie could not be sent. Check your connection and try again.');
      } finally {
        setSending(false);
      }
    };

    void import('@smileid/web-sdk/smart-camera-web')
      .then(() => {
        if (cancelled) return;
        element = document.createElement('smart-camera-web');
        element.setAttribute('theme-color', '#0066cc');
        element.setAttribute('partner-name', 'GetRentos');
        element.setAttribute('policy-url', session.consent.noticePrivacyPolicyUrl);
        element.addEventListener('smart-camera-web.publish', (event) => {
          const detail = (event as CustomEvent<{ images: CaptureImage[] }>).detail;
          void submit(detail?.images ?? []);
        });
        element.addEventListener('smart-camera-web.cancelled', onCancel);
        element.addEventListener('smart-camera-web.close', onCancel);
        container.appendChild(element);
      })
      .catch(() =>
        setError('The live selfie could not load. Check your connection and try again.')
      );

    return () => {
      cancelled = true;
      element?.remove();
    };
    // The session is fixed for this capture; a new session remounts it (key).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-3">
      <div ref={host} aria-busy={sending} />
      {sending ? (
        <p className="text-sm text-muted-foreground">Sending your selfie securely…</p>
      ) : null}
      {error ? (
        <Alert variant="danger" title="Live selfie not sent">
          <p>{error}</p>
          <Button variant="outline" size="sm" className="mt-2" onClick={onCancel}>
            Close and try again
          </Button>
        </Alert>
      ) : null}
    </div>
  );
}
