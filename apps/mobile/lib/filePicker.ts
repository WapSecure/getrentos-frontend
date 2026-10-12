import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { MAX_VIDEO_SECONDS } from '@getrentos/shared';
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
  mp4: 'video/mp4',
  m4v: 'video/x-m4v',
  mov: 'video/quicktime',
  webm: 'video/webm',
  '3gp': 'video/3gpp',
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

/** Opens the photo library for several photos at once (e.g. a listing gallery). Empty if cancelled. */
export async function pickPhotos(limit = 10): Promise<PickedFile[]> {
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) return [];

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsMultipleSelection: true,
    selectionLimit: limit,
    orderedSelection: true,
    quality: 0.8,
  });
  if (result.canceled || !result.assets?.length) return [];
  return result.assets.map((asset, i) => {
    const name = asset.fileName || asset.uri.split('/').pop() || `photo-${i + 1}.jpg`;
    return { uri: asset.uri, name, mimeType: resolveMimeType(name, asset.mimeType) };
  });
}

/** A picked or recorded video, with what is known of its size before upload. */
export interface PickedVideo extends PickedFile {
  /** Bytes, when the platform reports it. */
  size?: number;
  durationMs?: number;
}

function toPickedVideo(asset: ImagePicker.ImagePickerAsset, fallbackName: string): PickedVideo {
  const name = asset.fileName || asset.uri.split('/').pop() || fallbackName;
  return {
    uri: asset.uri,
    name,
    mimeType: resolveMimeType(name, asset.mimeType ?? 'video/mp4'),
    size: asset.fileSize ?? undefined,
    durationMs: asset.duration ?? undefined,
  };
}

/** Opens the library for one video (e.g. a property tour). Returns `null` if cancelled. */
export async function pickVideo(): Promise<PickedVideo | null> {
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) return null;

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Videos,
  });
  if (result.canceled || !result.assets?.length) return null;
  return toPickedVideo(result.assets[0], 'tour.mp4');
}

/** Films a walkthrough with the back camera, up to five minutes. Returns `null` if denied or cancelled. */
export async function recordVideo(): Promise<PickedVideo | null> {
  const perm = await ImagePicker.requestCameraPermissionsAsync();
  if (!perm.granted) return null;

  const result = await ImagePicker.launchCameraAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Videos,
    cameraType: ImagePicker.CameraType.back,
    videoMaxDuration: MAX_VIDEO_SECONDS,
  });
  if (result.canceled || !result.assets?.length) return null;
  return toPickedVideo(result.assets[0], 'tour.mp4');
}
