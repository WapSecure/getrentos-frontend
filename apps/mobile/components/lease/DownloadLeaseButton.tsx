import { useState } from 'react';
import { Alert } from 'react-native';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Download } from '@sureground/icons/native';
import { Button, useTheme, useToast } from '@sureground/ui-native';
import { leaseApi } from '@/lib/api/lease';
import { errorMessage } from '@/lib/api/client';

// The endpoint streams bytes behind the bearer token, so it can't be opened as a plain URL; the share sheet is how a file reaches the user's storage on both platforms.
export function DownloadLeaseButton({
  leaseId,
  label = 'Download lease PDF',
  onOpened,
}: {
  leaseId?: string;
  label?: string;
  onOpened?: () => void;
} = {}) {
  const { colors } = useTheme();
  const toast = useToast();
  const [busy, setBusy] = useState(false);

  const download = async () => {
    setBusy(true);
    try {
      const { bytes } = await leaseApi.downloadPdf(leaseId);
      const file = new File(Paths.cache, 'lease.pdf');
      file.create({ overwrite: true });
      file.write(bytes);

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(file.uri, {
          mimeType: 'application/pdf',
          dialogTitle: 'Your lease',
          UTI: 'com.adobe.pdf',
        });
        onOpened?.();
      } else {
        Alert.alert('Lease saved', 'The PDF was saved to this device.');
        onOpened?.();
      }
    } catch (err) {
      toast.show(errorMessage(err, 'Could not download the lease.'), 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Button
      label={label}
      variant="outline"
      onPress={download}
      loading={busy}
      loadingLabel="Preparing…"
      icon={<Download size={17} color={colors.primary} />}
    />
  );
}
