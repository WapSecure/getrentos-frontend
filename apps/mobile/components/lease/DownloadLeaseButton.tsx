import { useState } from 'react';
import { Alert, Pressable, View } from 'react-native';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Download } from 'lucide-react-native';
import { Text, useTheme, useToast } from '@getrentos/ui-native';
import { leaseApi } from '@/lib/api/lease';
import { ApiError } from '@/lib/api/client';

/**
 * Downloads the signed lease PDF and hands it to the OS share sheet, which is
 * how a file reaches the user's own storage on both platforms. The endpoint
 * streams bytes behind the bearer token, so it cannot be opened as a plain URL.
 */
export function DownloadLeaseButton() {
  const { colors, spacing, radius } = useTheme();
  const toast = useToast();
  const [busy, setBusy] = useState(false);

  const download = async () => {
    setBusy(true);
    try {
      const { bytes } = await leaseApi.downloadPdf();
      const file = new File(Paths.cache, 'lease.pdf');
      file.create({ overwrite: true });
      file.write(bytes);

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(file.uri, {
          mimeType: 'application/pdf',
          dialogTitle: 'Your lease',
          UTI: 'com.adobe.pdf',
        });
      } else {
        Alert.alert('Lease saved', 'The PDF was saved to this device.');
      }
    } catch (err) {
      toast.show(err instanceof ApiError ? err.message : 'Could not download the lease.', 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Pressable
      onPress={download}
      disabled={busy}
      accessibilityRole="button"
      accessibilityLabel="Download lease PDF"
      accessibilityState={{ busy }}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: spacing.sm,
          paddingVertical: spacing.lg,
          borderRadius: radius.lg,
          borderWidth: 1,
          borderColor: colors.border,
          opacity: busy ? 0.6 : 1,
        }}
      >
        <Download size={17} color={colors.primary} />
        <Text variant="callout" color="primary" style={{ fontWeight: '600' }}>
          {busy ? 'Preparing…' : 'Download lease PDF'}
        </Text>
      </View>
    </Pressable>
  );
}
