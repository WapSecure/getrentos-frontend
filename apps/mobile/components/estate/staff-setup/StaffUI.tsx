import { useState } from 'react';
import { View } from 'react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Avatar,
  Button,
  Card,
  FormAlert,
  Text,
  TextField,
  useTheme,
  useToast,
} from '@getrentos/ui-native';
import { Sheet } from '@/components/Sheet';
import { errorText } from '@/components/estate/EstateUI';
import {
  estateStaffSetupApi,
  isEmail,
  normaliseEmail,
  staffSetupKeys,
  type StaffMember,
} from '@/lib/api/estateStaffSetup';
import { formatDate } from '@/lib/format';
import { haptics } from '@/lib/haptics';

/** One gateman: who they are, since when, and a way to take them off the gate. */
export function StaffRow({
  member,
  removing,
  onRemove,
}: {
  member: StaffMember;
  removing: boolean;
  onRemove: () => void;
}) {
  const { spacing } = useTheme();
  const since = formatDate(member.addedAt, 'medium');
  return (
    <Card elevated style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
      <Avatar name={member.name} />
      <View
        style={{ flex: 1, gap: 2 }}
        accessible
        accessibilityLabel={`${member.name}, ${member.email}, gateman since ${since}`}
      >
        <Text variant="bodyStrong" numberOfLines={1}>
          {member.name}
        </Text>
        <Text variant="caption" color="mutedForeground" numberOfLines={1}>
          {member.email}
        </Text>
        <Text variant="caption" color="mutedForeground">
          Gateman since {since}
        </Text>
      </View>
      <Button
        label="Remove"
        size="sm"
        variant="ghost"
        loading={removing}
        accessibilityLabel={`Remove ${member.name} as a gateman`}
        onPress={onRemove}
      />
    </Card>
  );
}

/** Post someone with a GetRentos account to the estate's gates. */
export function AddGatemanSheet({
  open,
  onClose,
  estateId,
  estateName,
}: {
  open: boolean;
  onClose: () => void;
  estateId: string;
  estateName?: string;
}) {
  return (
    <Sheet open={open} onClose={onClose} title="Add a gateman">
      {open ? (
        <AddGatemanForm estateId={estateId} estateName={estateName} onDone={onClose} />
      ) : null}
    </Sheet>
  );
}

function AddGatemanForm({
  estateId,
  estateName,
  onDone,
}: {
  estateId: string;
  estateName?: string;
  onDone: () => void;
}) {
  const { spacing } = useTheme();
  const qc = useQueryClient();
  const toast = useToast();
  const [email, setEmail] = useState('');
  const typed = email.trim().length > 0;
  const valid = isEmail(email);

  const add = useMutation({
    mutationFn: () => estateStaffSetupApi.addGateman(estateId, normaliseEmail(email)),
    onSuccess: (member) => {
      void haptics.success();
      qc.invalidateQueries({ queryKey: staffSetupKeys.staff(estateId) });
      toast.show(`${member.name} can now check visitors in at your gates.`, 'success');
      onDone();
    },
    onError: () => void haptics.error(),
  });

  return (
    <View style={{ gap: spacing.md }}>
      <Text variant="callout" color="mutedForeground">
        Enter the email they use on GetRentos. Once added, they can verify visitor passes and log
        arrivals{estateName ? ` at ${estateName}` : ''} from their own phone.
      </Text>
      <TextField
        label="Their GetRentos email"
        value={email}
        onChangeText={setEmail}
        placeholder="gateman@example.com"
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="off"
        autoFocus
        returnKeyType="done"
        onSubmitEditing={() => {
          if (valid && !add.isPending) add.mutate();
        }}
        error={typed && !valid ? 'That email doesn’t look right.' : undefined}
        hint="They need a GetRentos account first. If they don’t have one, ask them to sign up."
      />
      {add.error ? (
        <FormAlert message={errorText(add.error, 'Could not add this gateman. Try again.')} />
      ) : null}
      <Button
        label="Add gateman"
        disabled={!valid}
        loading={add.isPending}
        onPress={() => add.mutate()}
      />
    </View>
  );
}
