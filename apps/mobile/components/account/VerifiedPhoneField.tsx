import { forwardRef, useState } from 'react';
import { View, type TextInput } from 'react-native';
import { LinkButton, TextField, useTheme, type TextFieldProps } from '@sureground/ui-native';
import { ChangePhoneSheet } from './ChangePhoneSheet';

interface Props extends Omit<TextFieldProps, 'value' | 'onChangeText'> {
  /** The number saved on the account; when set, the field is read-only. */
  savedPhone?: string | null;
  value: string;
  onChangeText: (value: string) => void;
  /** Called with the new number once the change is confirmed. */
  onChanged?: (phone: string) => void;
}

/**
 * The phone field for every profile form. An account with no number may type
 * one in; a number already on the account changes only through the verified
 * flow (ChangePhoneSheet), because it can receive password reset codes.
 */
export const VerifiedPhoneField = forwardRef<TextInput, Props>(function VerifiedPhoneField(
  { savedPhone, value, onChangeText, onChanged, hint, ...rest },
  ref
) {
  const { spacing } = useTheme();
  const [open, setOpen] = useState(false);
  const locked = !!savedPhone;

  return (
    <View style={{ gap: spacing.xs }}>
      <TextField
        ref={ref}
        keyboardType="phone-pad"
        autoComplete="tel"
        textContentType="telephoneNumber"
        {...rest}
        value={value}
        onChangeText={onChangeText}
        editable={!locked}
        hint={locked ? 'Changing it sends a code to the new number.' : hint}
      />
      {locked ? <LinkButton label="Change phone number" onPress={() => setOpen(true)} /> : null}
      <ChangePhoneSheet
        open={open}
        onClose={() => setOpen(false)}
        onChanged={(phone) => {
          onChangeText(phone);
          onChanged?.(phone);
        }}
      />
    </View>
  );
});
