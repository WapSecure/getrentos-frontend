'use client';

import { useEffect, useRef, useState } from 'react';
import { Alert, Button } from '@sureground/ui';
import type { SmileLivenessSession } from '@/services/trustService';

type CaptureImage = { image: string; image_type_id: number };

// Smile's image_type_id values (web SDK `IMAGE_TYPE`).
const SELFIE = 2;
const DOCUMENT_FRONT = 3;
const LIVENESS = 6;
const DOCUMENT_BACK = 7;

export type LiveCaptureMode = 'selfie' | 'document';

function jpegFrom(base64: string, name: string): File {
  const [head, data] = base64.includes(',') ? base64.split(',') : ['', base64];
  const bytes = Uint8Array.from(atob(data), (c) => c.charCodeAt(0));
  // Document photos may come back as PNG, which Smile also accepts.
  const type = head.includes('image/png') ? 'image/png' : 'image/jpeg';
  return new File([bytes], name.replace(/\.jpg$/, type === 'image/png' ? '.png' : '.jpg'), {
    type,
  });
}

export function liveCaptureBlocker(): string | null {
  if (typeof window === 'undefined') return null;
  if (!window.isSecureContext) return 'The live selfie needs a secure (https) connection.';
  if (!navigator.mediaDevices?.getUserMedia)
    return 'This browser can’t use a camera. Try Chrome, Safari, Edge or Firefox, or use the Sureground app.';
  if (typeof WebAssembly === 'undefined')
    return 'This browser can’t run the face check. Update it, or use the Sureground app.';
  return null;
}

// Frames go straight to Smile with our short-lived token, and Smile tells our server by signed webhook: `onSubmitted` only means "sent", never "passed".
// `document` mode adds Smile's document capture after the selfie (smart-camera-web `capture-id`) and sends one Document Verification job (POST /v3/document_verification); the country and ID type are bound into the token.
export function LiveSelfieCapture({
  session,
  onSubmitted,
  onCancel,
  mode = 'selfie',
}: {
  session: SmileLivenessSession;
  onSubmitted: (jobId: string) => void;
  onCancel: () => void;
  mode?: LiveCaptureMode;
}) {
  const what = mode === 'document' ? 'passport and selfie' : 'selfie';
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
      const front = images.find((i) => i.image_type_id === DOCUMENT_FRONT);
      const back = images.find((i) => i.image_type_id === DOCUMENT_BACK);
      if (!selfie || liveness.length === 0 || (mode === 'document' && !front)) {
        setError('The capture did not finish. Please try again.');
        return;
      }
      setSending(true);
      const body = new FormData();
      body.append('selfie_image', jpegFrom(selfie.image, 'selfie.jpg'));
      liveness.forEach((frame, i) =>
        body.append('liveness_images', jpegFrom(frame.image, `liveness-${i}.jpg`))
      );
      if (mode === 'document' && front) {
        body.append('document', jpegFrom(front.image, 'document.jpg'));
        if (back) body.append('document_back', jpegFrom(back.image, 'document-back.jpg'));
      }
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
        const endpoint = mode === 'document' ? 'document_verification' : 'registration';
        const response = await fetch(`${session.apiUrl}/${endpoint}`, {
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
              : `Your ${what} could not be sent. Please try again.`
          );
          return;
        }
        onSubmitted(result.job_id);
      } catch {
        setError(`Your ${what} could not be sent. Check your connection and try again.`);
      } finally {
        setSending(false);
      }
    };

    void import('@smileid/web-sdk/smart-camera-web')
      .then(() => {
        if (cancelled) return;
        element = document.createElement('smart-camera-web');
        element.setAttribute('theme-color', '#20232b');
        element.setAttribute('partner-name', 'Sureground');
        element.setAttribute('policy-url', session.consent.noticePrivacyPolicyUrl);
        if (mode === 'document') {
          element.setAttribute('capture-id', '');
          element.setAttribute('document-type', session.idInfo?.idType ?? 'PASSPORT');
          // A passport has one photo page.
          element.setAttribute('hide-back-of-id', '');
        }
        element.addEventListener('smart-camera-web.publish', (event) => {
          const detail = (event as CustomEvent<{ images: CaptureImage[] }>).detail;
          void submit(detail?.images ?? []);
        });
        element.addEventListener('smart-camera-web.cancelled', onCancel);
        element.addEventListener('smart-camera-web.close', onCancel);
        container.appendChild(element);
      })
      .catch(() =>
        setError(
          mode === 'document'
            ? 'The passport check could not load. Check your connection and try again.'
            : 'The live selfie could not load. Check your connection and try again.'
        )
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
        <p className="text-sm text-muted-foreground">Sending your {what} securely…</p>
      ) : null}
      {error ? (
        <Alert
          variant="danger"
          title={mode === 'document' ? 'Passport check not sent' : 'Live selfie not sent'}
        >
          <p>{error}</p>
          <Button variant="outline" size="sm" className="mt-2" onClick={onCancel}>
            Close and try again
          </Button>
        </Alert>
      ) : null}
    </div>
  );
}
