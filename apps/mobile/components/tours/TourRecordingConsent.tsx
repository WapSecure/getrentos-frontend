import { View } from 'react-native';
import { useMutation } from '@tanstack/react-query';
import { Video, VideoOff } from '@sureground/icons/native';
import { LinkButton, SwitchRow, Text, useTheme, useToast } from '@sureground/ui-native';
import type { SiteTourRecording, SiteTourStatus } from '@sureground/shared';
import { errorMessage } from '@/lib/api/client';

const OPEN: SiteTourStatus[] = ['REQUESTED', 'PROPOSED', 'SCHEDULED'];

function Line({ off = false, children }: { off?: boolean; children: string }) {
  const { colors, spacing } = useTheme();
  const Icon = off ? VideoOff : Video;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs, flexShrink: 1 }}>
      <Icon size={14} color={colors.mutedForeground} />
      <Text variant="caption" color="mutedForeground" style={{ flexShrink: 1 }}>
        {children}
      </Text>
    </View>
  );
}

/**
 * One party's say on recording, kept to a line as on web. Recording needs both, and either may
 * withdraw at any time. The switch shows only when the call can actually be recorded; otherwise a
 * line says recording is off, with a way to withdraw an agreement already given.
 */
export function TourRecordingConsent<T extends { recording?: SiteTourRecording }>({
  tour,
  side,
  setConsent,
  onUpdated,
}: {
  tour: T & { status: SiteTourStatus };
  side: 'buyer' | 'host';
  setConsent: (consent: boolean) => Promise<T>;
  onUpdated: (tour: T, message: string) => void;
}) {
  const toast = useToast();
  const set = useMutation({
    mutationFn: setConsent,
    onSuccess: (updated, consent) =>
      onUpdated(
        updated,
        consent ? 'You agreed to recording.' : 'You withdrew your agreement to recording.'
      ),
    onError: (e) => toast.show(errorMessage(e, 'That did not go through.'), 'error'),
  });
  const recording = tour.recording;
  if (!recording) return null;
  if (!OPEN.includes(tour.status)) {
    return recording.hasRecording ? <Line>Recorded, as you both agreed.</Line> : null;
  }

  const mine = Boolean(
    side === 'buyer' ? recording.requesterConsentedAt : recording.hostConsentedAt
  );
  const theirs = Boolean(
    side === 'buyer' ? recording.hostConsentedAt : recording.requesterConsentedAt
  );
  const other = side === 'buyer' ? 'the host' : 'the buyer';

  if (!recording.recordingAvailable) {
    return (
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', columnGap: 12 }}>
        <Line off>Recording: off for this tour, so nothing will be recorded.</Line>
        {mine ? (
          <LinkButton
            label="Withdraw my agreement"
            tone="muted"
            disabled={set.isPending}
            onPress={() => set.mutate(false)}
          />
        ) : null}
      </View>
    );
  }

  return (
    <SwitchRow
      label="I agree to this tour being recorded"
      description={
        recording.recordingEnabled
          ? 'You have both agreed, so the host can record the call. Either of you can withdraw at any time, which stops any recording.'
          : `${theirs ? 'Agreed' : 'Not agreed yet'} by ${other}. It is recorded only if you both agree, and either of you can withdraw at any time.`
      }
      value={mine}
      disabled={set.isPending}
      onValueChange={(next) => set.mutate(next)}
    />
  );
}
