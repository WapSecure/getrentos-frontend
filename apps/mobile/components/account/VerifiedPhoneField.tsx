import { forwardRef, useState } from 'react';
import { type TextInputInstance, View } from 'react-native';
import { LinkButton, TextField, useTheme, type TextFieldProps } from '@sureground/ui-native';
import { ChangePhoneSheet } from './ChangePhoneSheet';

interface Props extends Omit<TextFieldProps, 'value' | 'onChangeText'> {
  savedPhone?: string | null;
  value: string;
  onChangeText: (value: string) => void;
  onChanged?: (phone: string) => void;
}

// A saved number changes only through ChangePhoneSheet, because it can receive password reset codes.
export const VerifiedPhoneField = forwardRef<TextInputInstance, Props>(function VerifiedPhoneField(
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
