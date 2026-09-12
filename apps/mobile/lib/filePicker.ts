import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import type { PickedFile } from './api/documents';

/** Opens the system document picker (PDF or image). Returns `null` if the user cancels. */
export async function pickDocument(): Promise<PickedFile | null> {
  const result = await DocumentPicker.getDocumentAsync({
    type: ['application/pdf', 'image/*'],
    copyToCacheDirectory: true,
    multiple: false,
  });
  if (result.canceled || !result.assets?.length) return null;
  const asset = result.assets[0];
  return { uri: asset.uri, name: asset.name, mimeType: asset.mimeType };
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

/** Opens the photo library to pick an existing image (e.g. a maintenance issue photo). Returns `null` if denied or cancelled. */
export async function pickPhoto(): Promise<PickedFile | null> {
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) return null;

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    quality: 0.6,
  });
  if (result.canceled || !result.assets?.length) return null;
  const asset = result.assets[0];
  return { uri: asset.uri, name: 'photo.jpg', mimeType: asset.mimeType ?? 'image/jpeg' };
}

/** Launches the back camera to take a new photo (e.g. a maintenance issue photo). Returns `null` if denied or cancelled. */
export async function capturePhoto(): Promise<PickedFile | null> {
  const perm = await ImagePicker.requestCameraPermissionsAsync();
  if (!perm.granted) return null;

  const result = await ImagePicker.launchCameraAsync({
    cameraType: ImagePicker.CameraType.back,
    quality: 0.6,
  });
  if (result.canceled || !result.assets?.length) return null;
  const asset = result.assets[0];
  return { uri: asset.uri, name: 'photo.jpg', mimeType: asset.mimeType ?? 'image/jpeg' };
}
