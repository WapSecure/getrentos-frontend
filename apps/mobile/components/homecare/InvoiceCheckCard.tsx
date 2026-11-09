import { useState } from 'react';
import { View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import {
  AlertOctagon,
  AlertTriangle,
  CheckCircle2,
  ClipboardCheck,
} from '@sureground/icons/native';
import { Button, Skeleton, Text, useTheme } from '@sureground/ui-native';
import { homeCareApi } from '@/lib/api/homeCare';
import { qk } from '@/lib/query/keys';

export function InvoiceCheckCard({ invoiceId }: { invoiceId: string }) {
  const { colors, spacing, radius } = useTheme();
  const [asked, setAsked] = useState(false);
  const q = useQuery({
    queryKey: qk.homeCare.invoiceCheck(invoiceId),
    queryFn: () => homeCareApi.checkInvoice(invoiceId),
    enabled: asked,
    staleTime: 5 * 60_000,
    retry: false,
  });
  const LEVEL = {
    concern: { Icon: AlertOctagon, color: colors.destructive, label: 'Concern' },
    watch: { Icon: AlertTriangle, color: colors.warning, label: 'Worth a look' },
    ok: { Icon: CheckCircle2, color: colors.success, label: 'Fine' },
  } as const;

  if (!asked) {
    return (
      <Button
        label="Check this invoice"
        size="sm"
        variant="outline"
        icon={<ClipboardCheck size={14} color={colors.foreground} />}
        onPress={() => setAsked(true)}
      />
    );
  }
  if (q.isLoading) return <Skeleton height={90} radius={radius.md} />;
  const d = q.data;
  if (!d) {
    return (
      <Text variant="caption" color="mutedForeground">
        The check did not load. You can still decide on the invoice.
      </Text>
    );
  }
  return (
    <View
      style={{
        gap: spacing.xs,
        padding: spacing.md,
        borderRadius: radius.md,
        borderWidth: 1,
        borderColor: colors.border,
      }}
    >
      <Text variant="label">Before you decide</Text>
      <Text variant="callout">{d.summary}</Text>
      {d.checks.map((c) => {
        const { Icon, color, label } = LEVEL[c.level];
        return (
          <View
            key={c.text}
            style={{ flexDirection: 'row', gap: spacing.xs }}
            accessibilityLabel={`${label}: ${c.text}`}
          >
            <Icon size={16} color={color} style={{ marginTop: 2 }} />
            <Text variant="caption" style={{ flex: 1 }}>
              {c.text}
            </Text>
          </View>
        );
      })}
      {d.questions.length ? (
        <>
          <Text variant="label">You could ask the vendor</Text>
          {d.questions.map((x) => (
            <Text key={x} variant="caption" color="mutedForeground">
              • {x}
            </Text>
          ))}
        </>
      ) : null}
      <Text variant="caption" color="mutedForeground">
        {d.disclaimer}
      </Text>
    </View>
  );
}
