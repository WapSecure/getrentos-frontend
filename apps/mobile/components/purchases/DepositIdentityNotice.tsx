import type { ReactNode } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { ShieldAlert } from '@sureground/icons/native';
import { Button, Text, useTheme } from '@sureground/ui-native';
import { kycApi } from '@/lib/api/kyc';
import { depositIdentityNotice } from '@/lib/depositIdentityGate';

function Notice({
  message,
  verifyLink,
  onNavigate,
}: {
  message: string;
  verifyLink: boolean;
  onNavigate?: () => void;
}) {
  const { colors, spacing, radius } = useTheme();
  return (
    <View
      accessible={!verifyLink}
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
      style={{
        gap: spacing.sm,
        padding: spacing.md,
        borderRadius: radius.md,
        backgroundColor: colors.warningSubtle,
      }}
    >
      <View style={{ flexDirection: 'row', gap: spacing.sm }}>
        <ShieldAlert size={18} color={colors.warning} style={{ marginTop: 1 }} />
        <Text variant="callout" style={{ flex: 1, color: colors.foreground }}>
          {message}
        </Text>
      </View>
      {verifyLink ? (
        <Button
          label="Verify identity"
          size="sm"
          variant="secondary"
          onPress={() => {
            onNavigate?.();
            router.push('/(app)/verify-identity');
          }}
        />
      ) : null}
    </View>
  );
}

/** A loading or failed status never blocks; the server still has the final say. */
export function useDepositIdentityNotice(enabled: boolean, onNavigate?: () => void): ReactNode | null {
  const kyc = useQuery({ queryKey: ['kyc-status'], queryFn: kycApi.getStatus, enabled });
  const notice = enabled ? depositIdentityNotice(kyc.data) : null;
  if (!notice) return null;
  return <Notice message={notice.message} verifyLink={notice.verifyLink} onNavigate={onNavigate} />;
}
