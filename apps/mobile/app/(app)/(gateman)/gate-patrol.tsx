import { useState } from 'react';
import { View } from 'react-native';
import { useMutation } from '@tanstack/react-query';
import { AlertTriangle, Check, Clock } from 'lucide-react-native';
import {
  Button,
  Card,
  NumberField,
  Screen,
  SectionHeader,
  Text,
  useTheme,
  useToast,
} from '@sureground/ui-native';
import { useGatemanPost } from '@/lib/gateman/GatemanPostProvider';
import { gatemanApi, type PatrolScanResult } from '@/lib/api/gateman';
import { gateOfflineQueue, useGateQueue } from '@/lib/gateOfflineQueue';
import { haptics } from '@/lib/haptics';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';

// A scan queued offline carries when it happened, not when it was sent, or a walked patrol reads as missed. Prefixed `gate-` to avoid a bare-path route clash.
export default function GatemanPatrol() {
  const { colors, spacing } = useTheme();
  const toast = useToast();
  const { estate, isLoading } = useGatemanPost();

  const [code, setCode] = useState('');
  const [result, setResult] = useState<PatrolScanResult | null>(null);
  const queued = useGateQueue().filter((write) => write.type === 'patrol-scan');

  const scan = useMutation({
    mutationFn: (occurredAt: string) =>
      gatemanApi.scanPatrolCheckpoint(estate!.id, code.trim(), { occurredAt }),
    onSuccess: (response) => {
      setResult(response);
      if (response.accepted) {
        void haptics.success();
        setCode('');
      } else {
        // A tap, not an error buzz: the guard did nothing wrong and needs to
        // read the sentence, not be told off for it.
        void haptics.tap();
      }
    },
    onError: async () => {
      if (!estate) return;
      // Only a lost connection is queued: a 403 or malformed code would just repeat and never drain.
      await gateOfflineQueue.enqueue('patrol-scan', {
        estateId: estate.id,
        code: code.trim(),
        occurredAt: new Date().toISOString(),
        label: `Checkpoint code ${code.trim()}`,
      });
      setResult(null);
      setCode('');
      toast.show('No connection: the scan is saved and will be sent when it returns.', 'info');
    },
  });

  return (
    <Screen>
      <DashboardHeader eyebrow="Gate console" title="Patrol checkpoint" />
      <View style={{ padding: spacing.lg, gap: spacing.lg }}>
        <SectionHeader
          title="Scan the code at the checkpoint"
          description="Type the six digits printed at the checkpoint you are standing at."
        />

        <View style={{ gap: spacing.sm }}>
          <NumberField
            label="Checkpoint code"
            code
            maxLength={6}
            value={code}
            onValueChange={(next) => {
              setCode(next);
              // Any edit clears the last answer: a stale result beside a changed code is worse than nothing.
              if (result) setResult(null);
            }}
            placeholder="The six digits on the label"
            editable={!isLoading && !!estate}
          />
          <Button
            label="Record this checkpoint"
            loadingLabel="Recording…"
            loading={scan.isPending}
            disabled={code.trim().length < 6 || !estate}
            onPress={() => scan.mutate(new Date().toISOString())}
          />
        </View>

        {result?.accepted === true ? (
          <Card>
            <View style={{ gap: 4 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                {result.alreadyScanned ? (
                  <Clock size={16} color={colors.mutedForeground} />
                ) : (
                  <Check size={16} color={colors.primary} />
                )}
                <Text variant="bodyStrong">{result.checkpointName}</Text>
              </View>
              <Text variant="caption" color="mutedForeground">
                {result.routeName}
                {result.position && result.total
                  ? ` · step ${result.position} of ${result.total}`
                  : ''}
              </Text>
              <Text variant="caption" color="mutedForeground">
                {result.message}
              </Text>
              <Text variant="caption" color="mutedForeground">
                {result.instruction}
              </Text>
              {result.late && (
                <Text variant="caption" color="mutedForeground">
                  Recorded as after the round&apos;s window closed.
                </Text>
              )}
            </View>
          </Card>
        ) : result ? (
          // Rendered as the server wrote it: one wording covers every failure, so trying codes can't map the checkpoints.
          <Card>
            <View style={{ gap: spacing.sm }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                <AlertTriangle size={16} color={colors.mutedForeground} />
                <Text variant="bodyStrong">Not recorded</Text>
              </View>
              <Text variant="caption" color="mutedForeground">
                {result.message}
              </Text>
              <Text variant="caption" color="mutedForeground">
                {result.instruction}
              </Text>
            </View>
          </Card>
        ) : null}

        {queued.length > 0 && (
          <Card>
            <View style={{ gap: 4 }}>
              <Text variant="bodyStrong">
                {queued.length} scan{queued.length === 1 ? '' : 's'} waiting to send
              </Text>
              <Text variant="caption" color="mutedForeground">
                Saved with the time you took them, so they still count against the round they belong
                to.
              </Text>
            </View>
          </Card>
        )}

        <Text variant="caption" color="mutedForeground">
          A scan records that you reached this checkpoint. If the code is refused, tell the office
          rather than trying another: the checkpoint may not be on tonight&apos;s round.
        </Text>
      </View>
    </Screen>
  );
}
