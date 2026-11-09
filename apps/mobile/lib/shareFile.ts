import { Alert } from 'react-native';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

// These endpoints stream behind the bearer token, so the bytes go through the API client, not a plain URL.
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

export function shareTextFile(
  text: string,
  fileName: string,
  mimeType: string,
  dialogTitle: string
): Promise<void> {
  return shareDownloadedFile(new TextEncoder().encode(text), fileName, mimeType, dialogTitle);
}

// UTI hints the iOS share sheet uses to offer destinations.
export const PDF_MIME = 'application/pdf';
export const CSV_MIME = 'text/csv';
