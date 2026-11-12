import { useState } from 'react';
import { View } from 'react-native';
import { useMutation } from '@tanstack/react-query';
import { Button, FormAlert, Text, useTheme, useToast } from '@sureground/ui-native';
import {
  commercialDetailsOf,
  commercialError,
  commercialFromDetails,
  commercialToUpdatePayload,
  type CommercialDeal,
  type CommercialUpdatePayload,
  type CommercialValues,
} from '@sureground/shared/showroom';
import { Sheet } from '@/components/Sheet';
import { errorMessage } from '@/lib/api/client';
import { CommercialDetailsFields } from './CommercialDetailsFields';

export interface CommercialDetailsTarget {
  id: string;
  title: string;
  /** As the API sent it; read through `commercialDetailsOf`. */
  commercial?: unknown;
}

/** Edits a commercial listing's stated details; landlord, owner and realtor listings share it. */
export function CommercialDetailsSheet({
  target,
  onClose,
  save,
  onSaved,
  deal = 'rent',
}: {
  target: CommercialDetailsTarget | null;
  onClose: () => void;
  save: (id: string, details: CommercialUpdatePayload) => Promise<unknown>;
  onSaved?: () => void;
  deal?: CommercialDeal;
}) {
  const [saving, setSaving] = useState(false);
  return (
    <Sheet
      open={!!target}
      onClose={saving ? () => undefined : onClose}
      title="Commercial details"
      snapPoints={['92%']}
    >
      {/* Remount per listing so another listing's edits never carry over. */}
      {target ? (
        <CommercialForm
          key={target.id}
          target={target}
          onClose={onClose}
          save={save}
          onSaved={onSaved}
          deal={deal}
          onSavingChange={setSaving}
        />
      ) : null}
    </Sheet>
  );
}

function CommercialForm({
  target,
  onClose,
  save,
  onSaved,
  deal,
  onSavingChange,
}: {
  target: CommercialDetailsTarget;
  onClose: () => void;
  save: (id: string, details: CommercialUpdatePayload) => Promise<unknown>;
  onSaved?: () => void;
  deal: CommercialDeal;
  onSavingChange: (saving: boolean) => void;
}) {
  const { spacing } = useTheme();
  const toast = useToast();
  const [values, setValues] = useState<CommercialValues>(() =>
    commercialFromDetails(commercialDetailsOf(target.commercial))
  );
  const problem = commercialError(values);
  const mutation = useMutation({
    mutationFn: () => save(target.id, commercialToUpdatePayload(values)),
    onMutate: () => onSavingChange(true),
    onSettled: () => onSavingChange(false),
    onSuccess: () => {
      toast.show('Commercial details saved', 'success');
      onSaved?.();
      onClose();
    },
  });

  return (
    <View style={{ gap: spacing.lg }}>
      <Text variant="callout" color="mutedForeground" numberOfLines={2}>
        {target.title}
      </Text>
      <CommercialDetailsFields value={values} onChange={setValues} deal={deal} error={problem} />
      {mutation.error ? (
        <FormAlert
          message={errorMessage(mutation.error, 'Could not save the commercial details.')}
        />
      ) : null}
      <Button
        label="Save commercial details"
        loading={mutation.isPending}
        disabled={!!problem || mutation.isPending}
        onPress={() => mutation.mutate()}
      />
    </View>
  );
}
