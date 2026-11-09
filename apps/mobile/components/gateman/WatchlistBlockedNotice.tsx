import { useState } from 'react';
import { View } from 'react-native';
import { ShieldAlert } from 'lucide-react-native';
import { Button, Text, TextField, useTheme } from '@sureground/ui-native';
import {
  OVERRIDE_REASON_MIN_LENGTH,
  type WatchlistMatch,
  type WatchlistMatchedOn,
} from '@/lib/gateman/watchlistRefusal';

/** A label only: every sentence here comes from the API, so the two gates can't drift apart in wording. Exported so the pre-write check says it the same way. */
export const describeWatchlistBasis = (matchedOn: WatchlistMatchedOn) =>
  matchedOn === 'NAME'
    ? 'name only'
    : matchedOn === 'PHONE'
      ? 'phone number'
      : 'vehicle registration';

export interface WatchlistBlockedNoticeProps {
  /** What the API said. Rendered verbatim. */
  message: string;
  matches: WatchlistMatch[];
  onOverride: (reason: string) => void;
  isOverriding?: boolean;
  error?: string | null;
}

// The override takes two deliberate steps: refusing is the default, and the reason is what the office is told and the audit records. A plain View, not a sheet, because a sheet on top of a sheet doesn't render usefully in React Native.
export function WatchlistBlockedNotice({
  message,
  matches,
  onOverride,
  isOverriding,
  error,
}: WatchlistBlockedNoticeProps) {
  const { colors, spacing, radius } = useTheme();
  const [isOverridingNow, setIsOverridingNow] = useState(false);
  const [reason, setReason] = useState('');

  const canOverride = reason.trim().length >= OVERRIDE_REASON_MIN_LENGTH;

  return (
    <View
      style={{
        gap: spacing.md,
        borderWidth: 2,
        borderColor: colors.destructive,
        borderRadius: radius.lg,
        padding: spacing.md,
      }}
    >
      <View style={{ flexDirection: 'row', gap: spacing.md }}>
        <ShieldAlert size={20} color={colors.destructive} />
        <View style={{ flex: 1, gap: 2 }}>
          <Text variant="bodyStrong" style={{ color: colors.destructive }}>
            Do not admit
          </Text>
          <Text variant="caption" color="mutedForeground">
            This estate&apos;s watch list
          </Text>
        </View>
      </View>

      {matches.map((match) => (
        <View key={match.entryId} style={{ gap: 2 }}>
          <Text variant="bodyStrong">{match.label}</Text>
          <Text variant="caption" color="mutedForeground">
            {`Matched on ${describeWatchlistBasis(match.matchedOn)}`}
          </Text>
          {/* The estate's own words, quoted rather than paraphrased: it is the only version anybody agreed to. */}
          <Text variant="caption" color="mutedForeground">
            {`Reason: ${match.reason}`}
          </Text>
        </View>
      ))}

      <Text variant="body" color="mutedForeground">
        {message}
      </Text>

      <Text variant="caption" color="mutedForeground">
        This is a standing instruction from the estate, so trying again will give the same answer.
      </Text>

      {isOverridingNow ? (
        <View style={{ gap: spacing.xs }}>
          <TextField
            label="Why are you admitting them?"
            required
            value={reason}
            onChangeText={setReason}
            placeholder="e.g. Plate differs by one letter, driver is a different man"
            autoCorrect={false}
            // Says what the reason is for; otherwise a guard types "ok", the form refuses it, and the control looks broken.
            hint={`Recorded against your name and sent to the estate office. At least ${OVERRIDE_REASON_MIN_LENGTH} characters.`}
          />
          {error ? (
            <Text variant="caption" color="destructive">
              {error}
            </Text>
          ) : null}
          <Button
            label="Admit anyway"
            loadingLabel="Admitting…"
            loading={isOverriding}
            fullWidth
            disabled={!canOverride}
            onPress={() => onOverride(reason.trim())}
          />
          <Button
            label="Never mind"
            variant="ghost"
            fullWidth
            disabled={isOverriding}
            // The reason survives "never mind", so a guard who reconsiders
            // twice does not retype it.
            onPress={() => setIsOverridingNow(false)}
          />
        </View>
      ) : (
        <Button
          label="Admit anyway…"
          variant="outline"
          fullWidth
          onPress={() => setIsOverridingNow(true)}
        />
      )}
    </View>
  );
}
