import { useState } from 'react';
import { View } from 'react-native';
import { useMutation } from '@tanstack/react-query';
import { AlertTriangle, Check, Clock } from 'lucide-react-native';
import {
  Button,
  Card,
  Screen,
  SectionHeader,
  Text,
  TextField,
  useTheme,
  useToast,
} from '@getrentos/ui-native';
import { useGatemanPost } from '@/lib/gateman/GatemanPostProvider';
import { gatemanApi, type PatrolScanResult } from '@/lib/api/gateman';
import { gateOfflineQueue, useGateQueue } from '@/lib/gateOfflineQueue';
import { haptics } from '@/lib/haptics';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';

/**
 * Recording a patrol checkpoint.
 *
 * Prefixed `gate-` for the same reason `gate-deliveries` is: route groups don't
 * contribute a URL segment, so a group screen also answers on its bare path, and
 * Expo Router's generated route union would collapse a clash silently. There is
 * no top-level `patrol.tsx` today: the prefix is what keeps it that way.
 *
 * One field and one button, because it is used at two in the morning by somebody
 * holding a phone in one hand. The code is printed at the checkpoint, so the
 * guard types it standing in front of it, which is the whole mechanism: the code
 * is the proof they went there.
 *
 * Two things this screen is careful about:
 *
 * 1. A refusal is rendered as the server wrote it and is NOT styled as an error.
 *    Every failure shares one sentence on purpose, so that trying codes cannot
 *    map the estate's patrol points; making it red and alarming would invite a
 *    guard to try another code and learn exactly what the wording exists to
 *    withhold. It is still a thing they need to read, so it is not silent either.
 * 2. A scan queued offline carries the moment it HAPPENED, not the moment it was
 *    sent. A scan taken inside the window and typed up after the connection came
 *    back must still count as inside the window, or the estate is told nobody
 *    walked a patrol somebody did walk: which is the one error this feature
 *    exists to prevent.
 */
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
      // The one case worth queueing is the connection being gone. A 403 or a
      // malformed code would only be repeated, so those are reported now rather
      // than parked in a queue that will never drain.
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
          <TextField
            label="Checkpoint code"
            value={code}
            onChangeText={(next) => {
              setCode(next);
              // Any edit clears the last answer: a stale "Main gate · step 1 of
              // 3" beside a code the guard has since changed is worse than
              // nothing.
              if (result) setResult(null);
            }}
            placeholder="The six digits on the label"
            keyboardType="number-pad"
            editable={!isLoading && !!estate}
          />
          <Button
            label={scan.isPending ? 'Recording…' : 'Record this checkpoint'}
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
          // Rendered as the server wrote it, never interpreted. One wording
          // covers an unknown code, a retired checkpoint, and a checkpoint that
          // is not on a round tonight: so this screen cannot be used to work out
          // which checkpoints exist here.
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
