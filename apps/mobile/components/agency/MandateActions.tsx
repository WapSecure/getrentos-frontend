import { useState } from 'react';
import { Alert, View } from 'react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button, FormAlert, Text, TextField, useTheme, useToast } from '@sureground/ui-native';
import { qk } from '@/lib/query/keys';
import {
  ACTION_COPY,
  ACTION_DONE,
  agencyApi,
  availableActions,
  REASON_MIN,
  type Mandate,
  type MandateAction,
} from '@/lib/api/agency';
import { errorMessage } from '@/lib/api/client';
import { Sheet } from '@/components/Sheet';

// Serving notice asks to confirm, since its clock can't be back-dated.
export function MandateActions({ mandate }: { mandate: Mandate }) {
  const { spacing } = useTheme();
  const qc = useQueryClient();
  const toast = useToast();
  const [asking, setAsking] = useState<MandateAction | null>(null);
  const [error, setError] = useState<string | null>(null);
  const actions = availableActions(mandate);

  const act = useMutation({
    mutationFn: ({ action, reason }: { action: MandateAction; reason?: string }) =>
      agencyApi.act(mandate.id, action, reason),
    onSuccess: (result, { action }) => {
      setError(null);
      setAsking(null);
      if (result && typeof result === 'object' && 'permissions' in result) {
        qc.setQueryData(qk.agency.mandate(mandate.id), result);
      }
      qc.invalidateQueries({ queryKey: qk.agency.managing });
      qc.invalidateQueries({ queryKey: qk.agency.mandate(mandate.id) });
      qc.invalidateQueries({ queryKey: qk.agency.terminationRequests(mandate.id) });
      toast.show(ACTION_DONE[action], 'success');
    },
    onError: (e) => setError(errorMessage(e, 'That did not go through.')),
  });

  if (actions.length === 0) return null;

  const run = (action: MandateAction) => {
    const copy = ACTION_COPY[action];
    if (copy.confirm?.prompt) {
      setAsking(action);
      return;
    }
    if (copy.confirm) {
      Alert.alert(copy.confirm.title, copy.confirm.body, [
        { text: 'Cancel', style: 'cancel' },
        { text: copy.label, onPress: () => act.mutate({ action }) },
      ]);
      return;
    }
    act.mutate({ action });
  };

  return (
    <View style={{ gap: spacing.sm }}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
        {actions.map((a) => (
          <Button
            key={a}
            label={ACTION_COPY[a].label}
            size="sm"
            variant={
              ACTION_COPY[a].destructive
                ? 'destructive'
                : a === actions[0]
                  ? 'primary'
                  : 'secondary'
            }
            loading={act.isPending && act.variables?.action === a}
            disabled={act.isPending}
            onPress={() => run(a)}
          />
        ))}
      </View>
      {error && !asking ? <FormAlert tone="error" message={error} /> : null}
      <Sheet
        open={!!asking}
        onClose={() => setAsking(null)}
        title={asking ? (ACTION_COPY[asking].confirm?.title ?? '') : ''}
      >
        {asking ? (
          <ReasonForm
            key={asking}
            action={asking}
            busy={act.isPending}
            error={error}
            onSubmit={(reason) => act.mutate({ action: asking, reason })}
          />
        ) : null}
      </Sheet>
    </View>
  );
}

function ReasonForm({
  action,
  busy,
  error,
  onSubmit,
}: {
  action: MandateAction;
  busy: boolean;
  error: string | null;
  onSubmit: (reason: string) => void;
}) {
  const { spacing } = useTheme();
  const [reason, setReason] = useState('');
  const copy = ACTION_COPY[action];
  const short = reason.trim().length < REASON_MIN;
  return (
    <View style={{ gap: spacing.lg }}>
      <TextField
        label={copy.confirm?.prompt}
        placeholder="Enter at least 10 characters. The person deciding will read this."
        value={reason}
        onChangeText={setReason}
        multiline
        required
      />
      {reason && short ? (
        <Text variant="caption" color="mutedForeground">
          {reason.trim().length}/{REASON_MIN} characters
        </Text>
      ) : null}
      {error ? <FormAlert tone="error" message={error} /> : null}
      <Button
        label={copy.label}
        variant={copy.destructive ? 'destructive' : 'primary'}
        loading={busy}
        disabled={short || busy}
        onPress={() => onSubmit(reason.trim())}
      />
    </View>
  );
}
