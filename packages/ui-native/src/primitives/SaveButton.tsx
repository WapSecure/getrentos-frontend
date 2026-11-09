import { useEffect, useRef, useState } from 'react';
import { Check } from 'lucide-react-native';
import { useTheme } from '../theme';
import { Button, type ButtonProps } from './Button';

export interface SaveButtonProps extends Omit<ButtonProps, 'label' | 'onPress' | 'loading'> {
  label?: string;
  /** Return the save's promise; "Saved" shows only once it resolves to something other than `false`. */
  onPress: () => unknown;
  loading?: boolean;
}

const isPromise = (value: unknown): value is Promise<unknown> =>
  !!value && typeof (value as Promise<unknown>).then === 'function';

/** Confirms a save on the button itself, where the user is looking, instead of a toast. */
export function SaveButton({ label = 'Save changes', onPress, loading, ...rest }: SaveButtonProps) {
  const { colors } = useTheme();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);

  const handlePress = async () => {
    setSaved(false);
    const result = onPress();
    if (!isPromise(result)) return;
    setSaving(true);
    try {
      const outcome = await result;
      if (outcome === false) return;
      setSaved(true);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setSaved(false), 2000);
    } catch {
      // The caller shows the error; the button just doesn't claim it saved.
    } finally {
      setSaving(false);
    }
  };

  return (
    <Button
      {...rest}
      label={saved ? 'Saved' : label}
      accessibilityLiveRegion="polite"
      icon={saved ? <Check size={18} color={colors.primaryForeground} /> : rest.icon}
      loading={saving || loading}
      onPress={() => void handlePress()}
    />
  );
}
