import { AccessibilityInfo, Platform } from 'react-native';

/** Android reads the field's live-region error; VoiceOver needs telling which field failed first. */
export function announceFirstError(
  errors: Partial<Record<string, { message?: unknown } | undefined>>,
  order: readonly string[]
): void {
  if (Platform.OS !== 'ios') return;
  const first = order
    .map((name) => errors[name]?.message)
    .find((m): m is string => typeof m === 'string' && m.length > 0);
  if (first) AccessibilityInfo.announceForAccessibility(first);
}
