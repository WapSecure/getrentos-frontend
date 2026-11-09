import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';
import { AlertCircle, MapPin, PencilLine, ShieldCheck, X } from 'lucide-react-native';
import {
  highlightParts,
  newPlacesSession,
  type AddressValue,
  type PlaceKind,
  type PlaceSuggestion,
  type VerifiedAddress,
} from '@sureground/shared/address';
import { useTheme } from '../theme';
import { Text } from './Text';
import { TextField } from './TextField';

export interface AddressSearchProps {
  value: AddressValue | null;
  onChange: (value: AddressValue | null) => void;
  /** Suggestions for what has been typed (the app's /geo/places/suggest). */
  search: (query: string, opts: { session: string; kind: PlaceKind }) => Promise<PlaceSuggestion[]>;
  /** The checked address for a picked suggestion (the app's /geo/places/:placeId). */
  resolve: (placeId: string, session: string) => Promise<VerifiedAddress>;
  kind?: PlaceKind;
  /** Let the person keep an address Google cannot find; saved as typed and shown as unchecked. */
  allowManual?: boolean;
  label?: string;
  hint?: string;
  error?: string | null;
  required?: boolean;
  placeholder?: string;
  editable?: boolean;
  /** Called with the checked address after a pick, e.g. to move a map pin. */
  onResolved?: (address: VerifiedAddress) => void;
}

type Status = 'idle' | 'loading' | 'ready' | 'error' | 'resolving';

const MIN_CHARS: Record<PlaceKind, number> = { address: 3, area: 2, any: 2 };
const DEBOUNCE_MS = 300;

/**
 * Address search with Google Places suggestions, the native twin of
 * AddressSearch in @sureground/ui. Suggestions show in a card under the field;
 * a pick becomes a checked address (street, area, LGA, state and map pin).
 * Put it in a ScrollView with keyboardShouldPersistTaps="handled" so a tap on
 * a suggestion is not swallowed by the keyboard closing.
 */
export function AddressSearch({
  value,
  onChange,
  search,
  resolve,
  kind = 'address',
  allowManual = false,
  label,
  hint,
  error,
  required,
  placeholder,
  editable = true,
  onResolved,
}: AddressSearchProps) {
  const { colors, spacing, radius, font } = useTheme();
  const [text, setText] = useState(value?.text ?? '');
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<Status>('idle');
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [problem, setProblem] = useState<string | null>(null);
  const session = useRef<string | null>(null);
  const request = useRef(0);

  const lastValueText = useRef(value?.text ?? '');
  useEffect(() => {
    const next = value?.text ?? '';
    if (next !== lastValueText.current) {
      lastValueText.current = next;
      setText(next);
    }
  }, [value?.text]);

  const checked = !!value?.placeId && value.text === text;
  const min = MIN_CHARS[kind];

  useEffect(() => {
    const q = text.trim();
    if (!open || checked || q.length < min) {
      setSuggestions([]);
      setStatus('idle');
      return;
    }
    const mine = ++request.current;
    setStatus('loading');
    const timer = setTimeout(() => {
      session.current ??= newPlacesSession();
      search(q, { session: session.current, kind })
        .then((found) => {
          if (mine !== request.current) return;
          setSuggestions(found.slice(0, 5));
          setStatus('ready');
        })
        .catch(() => {
          if (mine !== request.current) return;
          setSuggestions([]);
          setStatus('error');
        });
    }, DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [text, open, checked, min, kind, search]);

  const pick = async (s: PlaceSuggestion) => {
    const sid = session.current ?? newPlacesSession();
    request.current++;
    setOpen(false);
    setStatus('resolving');
    setProblem(null);
    setText(s.secondary ? `${s.primary}, ${s.secondary}` : s.primary);
    try {
      const v = await resolve(s.placeId, sid);
      session.current = null;
      lastValueText.current = v.formatted;
      setText(v.formatted);
      setStatus('idle');
      onChange({ placeId: v.placeId, text: v.formatted, verified: v });
      onResolved?.(v);
    } catch {
      setStatus('idle');
      setProblem('We could not check that address. Try again or pick another suggestion.');
      onChange(null);
    }
  };

  const keepTyped = () => {
    const t = text.trim();
    if (!t) return;
    request.current++;
    lastValueText.current = t;
    setOpen(false);
    setStatus('idle');
    onChange({ text: t });
  };

  const onType = (next: string) => {
    setText(next);
    setProblem(null);
    setOpen(true);
    if (value?.placeId) {
      lastValueText.current = allowManual ? next : '';
      onChange(allowManual && next.trim() ? { text: next } : null);
    } else if (allowManual) {
      lastValueText.current = next;
      onChange(next.trim() ? { text: next } : null);
    }
  };

  const clear = () => {
    request.current++;
    session.current = null;
    lastValueText.current = '';
    setText('');
    setSuggestions([]);
    setProblem(null);
    onChange(null);
  };

  const busy = status === 'loading' || status === 'resolving';
  const showList =
    open &&
    !checked &&
    text.trim().length >= min &&
    (status === 'loading' || status === 'ready' || status === 'error');
  const v = checked ? value?.verified : undefined;
  const helper =
    problem ??
    error ??
    (checked
      ? v
        ? [v.lga && `${v.lga} LGA`, v.state, v.postcode].filter(Boolean).join(' · ')
        : 'Address checked on Google Maps'
      : value && !value.placeId && allowManual
        ? 'Typed address, not checked on Google Maps. Pick a suggestion to check it.'
        : hint);

  return (
    <View style={{ gap: spacing.xs }}>
      <TextField
        label={label}
        required={required}
        value={text}
        editable={editable}
        onChangeText={onType}
        onFocus={() => text.trim().length >= min && !checked && setOpen(true)}
        placeholder={
          placeholder ??
          (kind === 'area' ? 'Start typing an area, e.g. Gbagada' : 'Start typing the address')
        }
        autoCorrect={false}
        autoCapitalize="words"
        textContentType="fullStreetAddress"
        error={problem ?? error ?? null}
        hint={problem || error ? undefined : (helper ?? undefined)}
        accessibilityHint="Suggestions appear below as you type"
        leftIcon={<MapPin size={18} color={checked ? colors.primary : colors.mutedForeground} />}
        rightAccessory={
          busy ? (
            <ActivityIndicator size="small" color={colors.mutedForeground} />
          ) : (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
              {checked ? (
                <View
                  accessibilityLabel="Address checked on Google Maps"
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 4,
                    paddingHorizontal: 8,
                    paddingVertical: 2,
                    borderRadius: 999,
                    backgroundColor: colors.primary + '1A',
                  }}
                >
                  <ShieldCheck size={14} color={colors.primary} />
                  <Text variant="caption" color="primary">
                    Checked
                  </Text>
                </View>
              ) : null}
              {text && editable ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Clear address"
                  hitSlop={10}
                  onPress={clear}
                >
                  <X size={16} color={colors.mutedForeground} />
                </Pressable>
              ) : null}
            </View>
          )
        }
      />

      {showList ? (
        <View
          accessibilityRole="list"
          accessibilityLabel="Address suggestions"
          style={{
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: radius.md,
            backgroundColor: colors.card,
            overflow: 'hidden',
          }}
        >
          {status === 'loading' && suggestions.length === 0 ? (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: spacing.sm,
                padding: spacing.md,
              }}
            >
              <ActivityIndicator size="small" color={colors.mutedForeground} />
              <Text variant="callout" color="mutedForeground">
                Searching addresses…
              </Text>
            </View>
          ) : null}
          {suggestions.map((s, i) => (
            <Pressable
              key={s.placeId}
              accessibilityRole="button"
              accessibilityLabel={s.secondary ? `${s.primary}, ${s.secondary}` : s.primary}
              onPress={() => void pick(s)}
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'flex-start',
                gap: spacing.sm,
                paddingHorizontal: spacing.md,
                paddingVertical: spacing.sm + 2,
                backgroundColor: pressed ? colors.secondary : 'transparent',
                borderTopWidth: i === 0 ? 0 : 1,
                borderTopColor: colors.border,
              })}
            >
              <MapPin size={16} color={colors.mutedForeground} style={{ marginTop: 2 }} />
              <View style={{ flex: 1 }}>
                <Text variant="body" numberOfLines={1}>
                  {highlightParts(s.primary, s.matches).map((part, j) => (
                    <Text key={j} variant="body" style={part.match ? font('600') : undefined}>
                      {part.text}
                    </Text>
                  ))}
                </Text>
                {s.secondary ? (
                  <Text variant="caption" color="mutedForeground" numberOfLines={1}>
                    {s.secondary}
                  </Text>
                ) : null}
              </View>
            </Pressable>
          ))}
          {status === 'ready' && suggestions.length === 0 ? (
            <Text variant="callout" color="mutedForeground" style={{ padding: spacing.md }}>
              No matching {kind === 'area' ? 'area' : 'address'}. Check the spelling, or add the
              area.
            </Text>
          ) : null}
          {status === 'error' ? (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: spacing.sm,
                padding: spacing.md,
              }}
            >
              <AlertCircle size={16} color={colors.mutedForeground} />
              <Text variant="callout" color="mutedForeground">
                Address search is not available right now.
              </Text>
            </View>
          ) : null}
          {allowManual && (status === 'ready' || status === 'error') ? (
            <Pressable
              accessibilityRole="button"
              onPress={keepTyped}
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                gap: spacing.sm,
                padding: spacing.md,
                borderTopWidth: 1,
                borderTopColor: colors.border,
                backgroundColor: pressed ? colors.secondary : 'transparent',
              })}
            >
              <PencilLine size={16} color={colors.mutedForeground} />
              <Text variant="callout" numberOfLines={1} style={{ flex: 1 }}>
                Use “{text.trim()}” as typed{' '}
                <Text variant="callout" color="mutedForeground">
                  (not checked)
                </Text>
              </Text>
            </Pressable>
          ) : null}
          <Text
            variant="caption"
            color="mutedForeground"
            style={{ textAlign: 'right', paddingHorizontal: spacing.md, paddingBottom: spacing.xs }}
          >
            Powered by Google
          </Text>
        </View>
      ) : null}
    </View>
  );
}
