import { Linking, Share, View } from 'react-native';
import { Button, Text, useTheme } from '@sureground/ui-native';
import { MessageCircle, Share2 } from '@sureground/icons/native';
import { ROUTES, signupInviteMessage, whatsappShareUrl } from '@sureground/shared';
import { env } from '@/lib/env';

/**
 * Nobody on Sureground has that phone number or email: share the plain signup link (no tracking,
 * nothing about either person). We cannot text people, so the person inviting sends it themselves.
 */
export function InviteToSignUp({
  message,
  reason,
  footnote,
}: {
  message: string;
  /** Finishes "Join me on Sureground so I can …" in the shared message. */
  reason?: string;
  footnote?: string;
}) {
  const { colors, spacing, radius } = useTheme();
  const signupUrl = `${env.webUrl}${ROUTES.SIGNUP}`;
  const text = signupInviteMessage(signupUrl, reason);
  return (
    <View
      accessibilityRole="alert"
      style={{
        gap: spacing.sm,
        padding: spacing.md,
        borderRadius: radius.lg,
        backgroundColor: colors.accent,
      }}
    >
      <Text variant="bodyStrong">They are not on Sureground yet</Text>
      <Text variant="callout" color="mutedForeground">
        {message}
      </Text>
      <Button
        label="Share an invite link"
        icon={<Share2 size={16} color={colors.primaryForeground} />}
        onPress={() => Share.share({ message: text }).catch(() => undefined)}
      />
      <Button
        label="Send on WhatsApp"
        variant="outline"
        icon={<MessageCircle size={16} color={colors.foreground} />}
        onPress={() => Linking.openURL(whatsappShareUrl(text)).catch(() => undefined)}
      />
      {footnote ? (
        <Text variant="caption" color="mutedForeground">
          {footnote}
        </Text>
      ) : null}
    </View>
  );
}
