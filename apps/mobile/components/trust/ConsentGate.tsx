import { useState, type ReactNode } from 'react';
import { View } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button, Text, useTheme, useToast } from '@sureground/ui-native';
import { errorMessage } from '@/lib/api/client';
import { activeConsent, CONSENT_COPY, trustApi, type ConsentType } from '@/lib/api/trust';
import { qk } from '@/lib/query/keys';

/**
 * Asks for each consent a check needs, one at a time, then shows the check. `text` overrides the
 * standard wording for a type, e.g. a passport rather than a professional document.
 */
export function ConsentGate({
  types,
  text,
  children,
}: {
  types: readonly ConsentType[];
  text?: Partial<Record<ConsentType, string>>;
  children: ReactNode;
}) {
  const { spacing } = useTheme();
  const qc = useQueryClient();
  const toast = useToast();
  const [now] = useState(() => Date.now());
  const consents = useQuery({ queryKey: qk.trust.consents, queryFn: trustApi.consents });
  const grant = useMutation({
    mutationFn: (type: ConsentType) => trustApi.grantConsent(type),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.trust.consents }),
    onError: (e) => toast.show(errorMessage(e, 'Could not record your consent.'), 'error'),
  });
  if (consents.isPending) return null;
  const missing = types.find((t) => !activeConsent(consents.data, t, now));
  if (!missing) return <>{children}</>;
  return (
    <View style={{ gap: spacing.sm }}>
      <Text variant="callout" color="mutedForeground">
        {text?.[missing] ?? CONSENT_COPY[missing].body}
      </Text>
      <Button
        label="I agree, continue"
        size="sm"
        loading={grant.isPending}
        onPress={() => grant.mutate(missing)}
        style={{ alignSelf: 'flex-start' }}
      />
    </View>
  );
}
