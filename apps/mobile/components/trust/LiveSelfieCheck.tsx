import { useMemo } from 'react';
import { Modal } from 'react-native';
import { darkColors, lightColors, radius } from '@getrentos/tokens';
import type { SmileLivenessSession } from '@/lib/api/trust';
import { loadFaceAnalyzer } from '@/lib/smileid/faceAnalyzer';
import { liveSelfieOutcome, loadSmileSdk, type LiveSelfieOutcome } from '@/lib/smileid/liveSelfie';

/**
 * Smile ID's certified live selfie capture (enhanced active liveness), full
 * screen. Smile's own screens run the capture and send it to Smile with the
 * server-issued token; the verdict reaches our server by signed webhook. Only
 * rendered where `liveSelfieSupported()` is true.
 */
export function LiveSelfieCheck({
  session,
  onClose,
}: {
  session: SmileLivenessSession;
  onClose: (outcome: LiveSelfieOutcome | null) => void;
}) {
  const sdk = useMemo(() => loadSmileSdk(), []);
  const analyzer = useMemo(() => loadFaceAnalyzer(), []);
  if (!sdk || !analyzer) return null;
  const { UseSmileIDBuilder, JobType, CaptureType } = sdk;

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
              c.jobType = JobType.smartSelfieEnrollment;
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
            s.processing();
          });
          b.onResult = (result) => onClose(liveSelfieOutcome(result));
        }}
      />
    </Modal>
  );
}
