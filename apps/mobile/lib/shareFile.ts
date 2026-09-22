import { Alert } from 'react-native';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

/**
 * Writes downloaded bytes to the cache and hands them to the OS share sheet,
 * which is how a file reaches the user's own storage on both platforms.
 *
 * These endpoints stream behind the bearer token, so they cannot be opened as
 * a plain URL — the bytes have to come through the API client first.
 */
export async function shareDownloadedFile(
  bytes: Uint8Array,
  fileName: string,
  mimeType: string,
  dialogTitle: string
): Promise<void> {
  const file = new File(Paths.cache, fileName);
  file.create({ overwrite: true });
  file.write(bytes);

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(file.uri, { mimeType, dialogTitle });
  } else {
    Alert.alert('Saved', `${fileName} was saved to this device.`);
  }
}

/** UTI hints the iOS share sheet uses to offer sensible destinations. */
export const PDF_MIME = 'application/pdf';
export const CSV_MIME = 'text/csv';
