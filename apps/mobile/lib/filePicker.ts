import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import type { PickedFile } from './api/documents';

const EXT_MIME: Record<string, string> = {
  pdf: 'application/pdf',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  gif: 'image/gif',
  webp: 'image/webp',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
};

function resolveMimeType(name: string, reported?: string | null): string {
  if (reported && reported !== 'application/octet-stream') return reported;
  const ext = name.split('.').pop()?.toLowerCase();
  return (ext && EXT_MIME[ext]) || reported || 'application/octet-stream';
}

/** Opens the system document picker (PDF or image). Returns `null` if the user cancels. */
export async function pickDocument(): Promise<PickedFile | null> {
  const result = await DocumentPicker.getDocumentAsync({
    type: ['application/pdf', 'image/*'],
    copyToCacheDirectory: true,
    multiple: false,
  });
  if (result.canceled || !result.assets?.length) return null;
  const asset = result.assets[0];
  return {
    uri: asset.uri,
    name: asset.name,
    mimeType: resolveMimeType(asset.name, asset.mimeType),
  };
}

/** Opens the photo library for a single image (e.g. a profile avatar). Returns `null` if cancelled. */
export async function pickImage(): Promise<PickedFile | null> {
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) return null;

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    quality: 0.7,
    allowsEditing: true,
    aspect: [1, 1],
  });
  if (result.canceled || !result.assets?.length) return null;
  const asset = result.assets[0];
  const name = asset.fileName || asset.uri.split('/').pop() || 'photo.jpg';
  return { uri: asset.uri, name, mimeType: resolveMimeType(name, asset.mimeType) };
}

/** Opens the photo library for a single, uncropped photo (e.g. a maintenance issue). Returns `null` if cancelled. */
export async function pickPhoto(): Promise<PickedFile | null> {
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) return null;

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    quality: 0.7,
  });
  if (result.canceled || !result.assets?.length) return null;
  const asset = result.assets[0];
  const name = asset.fileName || asset.uri.split('/').pop() || 'photo.jpg';
  return { uri: asset.uri, name, mimeType: resolveMimeType(name, asset.mimeType) };
}

/** Launches the front camera for a selfie capture. Returns `null` if denied or cancelled. */
export async function captureSelfie(): Promise<PickedFile | null> {
  const perm = await ImagePicker.requestCameraPermissionsAsync();
  if (!perm.granted) return null;

  const result = await ImagePicker.launchCameraAsync({
    cameraType: ImagePicker.CameraType.front,
    quality: 0.6,
    allowsEditing: true,
    aspect: [1, 1],
  });
  if (result.canceled || !result.assets?.length) return null;
  const asset = result.assets[0];
  return { uri: asset.uri, name: 'selfie.jpg', mimeType: asset.mimeType ?? 'image/jpeg' };
}
