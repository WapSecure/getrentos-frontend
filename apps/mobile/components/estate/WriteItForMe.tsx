import type { ReactNode } from 'react';
import { View } from 'react-native';
import { Sparkles } from 'lucide-react-native';
import { Button, FormAlert, TextField, useTheme } from '@sureground/ui-native';

interface Props {
  hint: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  draftLabel: string;
  onDraft: () => void;
  loading: boolean;
  error: string | null;
  /** Extra controls, such as a language picker. */
  children?: ReactNode;
}

/**
 * "Write it for me" for estate managers' forms: a few words in, a draft into
 * the fields below to edit before posting. Nothing is posted from here.
 */
export function WriteItForMe({
  hint,
  placeholder,
  value,
  onChange,
  draftLabel,
  onDraft,
  loading,
  error,
  children,
}: Props) {
  const { colors, spacing, radius } = useTheme();
  return (
    <View
      style={{
        gap: spacing.sm,
        padding: spacing.md,
        borderRadius: radius.md,
        borderWidth: 1,
        borderColor: colors.border,
      }}
    >
      <TextField
        label="Write it for me"
        hint={hint}
        placeholder={placeholder}
        value={value}
        onChangeText={onChange}
        multiline
        maxLength={1500}
        optional
      />
      {children}
      <Button
        label={draftLabel}
        size="sm"
        variant="secondary"
        icon={<Sparkles size={14} color={colors.foreground} />}
        loading={loading}
        loadingLabel="Drafting…"
        disabled={value.trim().length < 5 || loading}
        onPress={onDraft}
      />
      {error ? <FormAlert message={error} /> : null}
    </View>
  );
}
