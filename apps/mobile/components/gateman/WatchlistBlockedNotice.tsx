import { useState } from 'react';
import { View } from 'react-native';
import { ShieldAlert } from 'lucide-react-native';
import { Button, Text, TextField, useTheme } from '@getrentos/ui-native';
import {
  OVERRIDE_REASON_MIN_LENGTH,
  type WatchlistMatch,
  type WatchlistMatchedOn,
} from '@/lib/gateman/watchlistRefusal';

/**
 * How the match was made, in two or three words.
 *
 * A label rather than a sentence: every sentence here comes from the API, so
 * there is exactly one copy of the wording and the two gates cannot drift into
 * telling guards different things. This is only here because "which detail
 * matched" is the one fact a guard needs at a glance before deciding whether the
 * person in front of them is really the person on the list.
 */
const describeBasis = (matchedOn: WatchlistMatchedOn) =>
  matchedOn === 'NAME'
    ? 'name only'
    : matchedOn === 'PHONE'
      ? 'phone number'
      : 'vehicle registration';

export interface WatchlistBlockedNoticeProps {
  /** What the API said. Rendered verbatim. */
  message: string;
  /** The entries that fired. */
  matches: WatchlistMatch[];
  onOverride: (reason: string) => void;
  isOverriding?: boolean;
  /** A failure of the override attempt itself, shown without losing the reason typed. */
  error?: string | null;
}

/**
 * Shown when an estate's watch list refuses an entry at the gate.
 *
 * Takes over the screen rather than toasting. A toast disappears in seconds, and
 * this is not a notification — it is the estate's instruction, carrying a reason
 * the guard has to repeat to somebody standing in front of them, and one
 * decision to make.
 *
 * It also says plainly that trying again gives the same answer. A guard who
 * reads a refusal as a failure retries, and retrying costs the visitor time for
 * nothing.
 *
 * The override is two deliberate steps rather than one button. Refusing is the
 * default — that is what the estate asked for — and admitting somebody anyway is
 * a decision a guard makes on purpose, with a reason, because that reason is
 * what the estate office is told and what the audit records.
 *
 * A plain `View` rather than a sheet, so it can be dropped inside a screen, a
 * console card, or a sheet that is already open — a second sheet on top of a
 * sheet is not a thing React Native renders usefully.
 */
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
            {`Matched on ${describeBasis(match.matchedOn)}`}
          </Text>
          {/* The estate's own words, quoted rather than paraphrased: the guard
              has to say something to a human, and this is the only version
              anybody actually agreed to. */}
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
            value={reason}
            onChangeText={setReason}
            placeholder="e.g. Plate differs by one letter, driver is a different man"
            autoCorrect={false}
            // Says what the reason is for. Without this a guard types "ok", the
            // form refuses it, and a control meant to prevent a wrong refusal
            // ends up looking broken.
            hint={`Recorded against your name and sent to the estate office. At least ${OVERRIDE_REASON_MIN_LENGTH} characters.`}
          />
          {error ? (
            <Text variant="caption" color="destructive">
              {error}
            </Text>
          ) : null}
          <Button
            label={isOverriding ? 'Admitting…' : 'Admit anyway'}
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
