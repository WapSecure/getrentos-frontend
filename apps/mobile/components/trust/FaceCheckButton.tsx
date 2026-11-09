import { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { ScanFace } from 'lucide-react-native';
import { Button, Text, useTheme, useToast } from '@sureground/ui-native';
import type { FaceCheckStatus, SmileLivenessSession } from '@/lib/api/trust';
import { errorMessage } from '@/lib/api/client';
import { LiveSelfieCheck } from './LiveSelfieCheck';

const POLL_MS = 3000;
const GIVE_UP_MS = 2 * 60_000;

// The server alone decides; this only polls it until it has. Rendered only where `liveSelfieSupported()` is true.
export function FaceCheckButton({
  label,
  start,
  status,
  onApproved,
  variant = 'secondary',
}: {
  label: string;
  start: () => Promise<{ id: string; session: SmileLivenessSession }>;
  status: (id: string) => Promise<{ status: FaceCheckStatus }>;
  onApproved: (id: string) => void;
  variant?: 'primary' | 'secondary';
}) {
  const { spacing } = useTheme();
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [check, setCheck] = useState<{ id: string; session: SmileLivenessSession } | null>(null);
  const [waiting, setWaiting] = useState<string | null>(null);
  const cancelled = useRef(false);

  useEffect(
    () => () => {
      cancelled.current = true;
    },
    []
  );

  const waitForVerdict = async (id: string) => {
    setWaiting(id);
    const until = Date.now() + GIVE_UP_MS;
    while (!cancelled.current && Date.now() < until) {
      await new Promise((r) => setTimeout(r, POLL_MS));
      try {
        const res = await status(id);
        if (res.status === 'APPROVED') {
          setWaiting(null);
          onApproved(id);
          return;
        }
        if (res.status === 'FAILED') {
          setWaiting(null);
          toast.show('We could not confirm it was you. Try again in good light.', 'error');
          return;
        }
      } catch (e) {
        setWaiting(null);
        toast.show(errorMessage(e, 'The face check expired. Try again.'), 'error');
        return;
      }
    }
    if (!cancelled.current) {
      setWaiting(null);
      toast.show('The face check is taking longer than usual. Try again.', 'error');
    }
  };

  return (
    <View style={{ gap: spacing.xs }}>
      <Button
        label={waiting ? 'Checking your face…' : label}
        variant={variant}
        icon={<ScanFace size={16} />}
        loading={busy || !!waiting}
        disabled={busy || !!waiting}
        onPress={async () => {
          setBusy(true);
          try {
            setCheck(await start());
          } catch (e) {
            toast.show(errorMessage(e, 'Could not start the face check.'), 'error');
          } finally {
            setBusy(false);
          }
        }}
      />
      {waiting ? (
        <Text variant="caption" color="mutedForeground">
          This usually takes a few seconds.
        </Text>
      ) : null}
      {check ? (
        <LiveSelfieCheck
          mode="match"
          session={check.session}
          onClose={(outcome) => {
            const id = check.id;
            setCheck(null);
            if (outcome?.submitted) void waitForVerdict(id);
            else if (outcome) toast.show(outcome.text, outcome.tone);
          }}
        />
      ) : null}
    </View>
  );
}
