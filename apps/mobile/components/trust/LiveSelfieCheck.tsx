import { useMemo } from 'react';
import { Modal } from 'react-native';
import { darkColors, lightColors, radius } from '@sureground/tokens';
import type { SmileLivenessSession } from '@/lib/api/trust';
import { loadFaceAnalyzer } from '@/lib/smileid/faceAnalyzer';
import { liveSelfieOutcome, loadSmileSdk, type LiveSelfieOutcome } from '@/lib/smileid/liveSelfie';

// The verdict reaches our server by signed webhook, not through this screen. Only rendered where `liveSelfieSupported()` is true.
export function LiveSelfieCheck({
  session,
  onClose,
  mode = 'enrol',
}: {
  session: SmileLivenessSession;
  /** `jobId` is set when Smile received the capture, so the caller can ask the server for the result. */
  onClose: (outcome: LiveSelfieOutcome | null, jobId?: string) => void;
  /** `document`: a selfie, then the passport photo page, sent as one document verification job. */
  mode?: 'enrol' | 'match' | 'document';
}) {
  const sdk = useMemo(() => loadSmileSdk(), []);
  const analyzer = useMemo(() => loadFaceAnalyzer(), []);
  if (!sdk || !analyzer) return null;
  const { UseSmileIDBuilder, JobType, CaptureType, DocumentType } = sdk;
  const document = mode === 'document';

  return (
    <Modal
      visible
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={() => onClose(null)}
    >
      <UseSmileIDBuilder
        key={session.userId}
        builder={(b) => {
          b.network((n) =>
            n.config((c) => {
              c.jobType = document
                ? JobType.documentVerification
                : mode === 'match'
                  ? JobType.smartSelfieAuthentication
                  : JobType.smartSelfieEnrollment;
              c.token = session.token;
              c.partnerConfig((p) => {
                p.partnerId = session.partnerId;
                p.useSandbox = session.useSandbox;
              });
            })
          );
          b.ml((m) =>
            m.analyzers((a) => a.forCaptureType(CaptureType.selfie, (face) => face.add(analyzer)))
          );
          // The person already agreed in our own consent step; the same record is bound into the token.
          b.consentInformation = session.consent;
          b.userDetails = session.userDetails;
          if (document) {
            b.documentVerificationParams = {
              country: session.idInfo?.country ?? 'NG',
              idType: session.idInfo?.idType ?? 'PASSPORT',
            };
          }
          // A match names the enrolment it is checked against (server-issued).
          if (mode === 'match') b.userId = session.userId;
          b.theme((t) => {
            t.primaryColor = t.color(lightColors.primary, darkColors.primary);
            t.primaryForeground = t.color(
              lightColors.primaryForeground,
              darkColors.primaryForeground
            );
            t.buttonShape = radius.md;
          });
          b.screens((s) => {
            s.instructions();
            s.capture((cap) => {
              cap.captureType = CaptureType.selfie;
              cap.selfie((selfie) => {
                selfie.enableEnhancedLiveness = true;
              });
            });
            if (document) {
              s.capture((cap) => {
                cap.captureType = CaptureType.document;
                cap.document((d) => {
                  d.documentType = DocumentType.Passport;
                });
              });
            }
            s.processing();
          });
          b.onResult = (result) =>
            onClose(
              liveSelfieOutcome(result),
              result.status === 'success' ? result.value.jobId : undefined
            );
        }}
      />
    </Modal>
  );
}
