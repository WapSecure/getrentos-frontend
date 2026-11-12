import { ApiError } from '../lib/api/client';
import { uploadVideoDirect, videoContentType } from '../lib/api/videoUpload';

const mockUpload = jest.fn();
jest.mock('expo-file-system', () => ({
  File: jest.fn().mockImplementation((uri: string) => ({
    uri,
    size: 5_242_880,
    upload: (...args: unknown[]) => mockUpload(...args),
  })),
}));

const mockApiFetch = jest.fn();
const mockApiUpload = jest.fn();
jest.mock('../lib/api/client', () => {
  const actual = jest.requireActual('../lib/api/client');
  return {
    ...actual,
    apiFetch: (...args: unknown[]) => mockApiFetch(...args),
    apiUploadWithProgress: (...args: unknown[]) => mockApiUpload(...args),
  };
});

const session = {
  key: 'landlord/u1/property-media/abc-tour.mov',
  uploadUrl: 'https://store.test/landlord/u1/property-media/abc-tour.mov?X-Amz-Signature=x',
  method: 'PUT',
  headers: { 'Content-Type': 'video/quicktime' },
  expiresAt: '2026-11-11T12:15:00.000Z',
};
const file = { uri: 'file:///DCIM/tour.MOV', name: 'tour.MOV', mimeType: null };

beforeEach(() => {
  mockApiFetch.mockReset();
  mockApiUpload.mockReset();
  mockUpload.mockReset();
});

describe('videoContentType', () => {
  it('trusts a known video type, otherwise the extension', () => {
    expect(videoContentType({ uri: 'x', name: 'a.mp4', mimeType: 'video/mp4' })).toBe('video/mp4');
    expect(videoContentType({ uri: 'x', name: 'IMG_0001.MOV', mimeType: null })).toBe(
      'video/quicktime'
    );
    expect(
      videoContentType({ uri: 'x', name: 'clip.webm', mimeType: 'application/octet-stream' })
    ).toBe('video/webm');
  });
});

describe('uploadVideoDirect', () => {
  it('asks for a link, streams the file to storage, then has the API check it', async () => {
    mockApiFetch
      .mockResolvedValueOnce(session)
      .mockResolvedValueOnce({ key: session.key, kind: 'video' });
    mockUpload.mockImplementation(async (_url, opts: { onProgress: (p: object) => void }) => {
      opts.onProgress({ bytesSent: 26_214_400, totalBytes: 52_428_800 });
      return { status: 200, body: '', headers: {} };
    });
    const progress: number[] = [];

    const result = await uploadVideoDirect('/landlord/properties', file, {
      onProgress: (p) => progress.push(p),
    });

    expect(mockApiFetch).toHaveBeenNthCalledWith(1, '/landlord/properties/media/video-upload', {
      method: 'POST',
      body: { filename: 'tour.MOV', contentType: 'video/quicktime', sizeBytes: 5_242_880 },
    });
    expect(mockUpload).toHaveBeenCalledWith(
      session.uploadUrl,
      expect.objectContaining({ httpMethod: 'PUT', headers: session.headers })
    );
    expect(mockApiFetch).toHaveBeenNthCalledWith(
      2,
      '/landlord/properties/media/video-upload/complete',
      {
        method: 'POST',
        body: { key: session.key },
      }
    );
    expect(progress).toEqual([50]);
    expect(result).toEqual({ key: session.key, kind: 'video' });
    expect(mockApiUpload).not.toHaveBeenCalled();
  });

  it('does not ask the API to check a file storage refused', async () => {
    mockApiFetch.mockResolvedValueOnce(session);
    mockUpload.mockResolvedValue({ status: 403, body: 'SignatureDoesNotMatch', headers: {} });

    await expect(uploadVideoDirect('/host/shortlets', file)).rejects.toThrow(
      'Video upload failed (403)'
    );
    expect(mockApiFetch).toHaveBeenCalledTimes(1);
  });

  it('falls back to the multipart route on an API without direct uploads', async () => {
    mockApiFetch.mockRejectedValueOnce(new ApiError('Not found', 404));
    mockApiUpload.mockResolvedValue({ key: 'owner/u1/property-media/abc-tour.MOV', kind: 'video' });

    const onProgress = jest.fn();
    const result = await uploadVideoDirect('/owner/properties', file, { onProgress });

    expect(mockApiUpload).toHaveBeenCalledWith(
      '/owner/properties/media/upload',
      expect.any(FormData),
      expect.objectContaining({ onProgress })
    );
    expect(result).toEqual({ key: 'owner/u1/property-media/abc-tour.MOV', kind: 'video' });
    expect(mockUpload).not.toHaveBeenCalled();
  });

  it('hands the cancel signal to storage and stops before the API check once cancelled', async () => {
    const controller = new AbortController();
    mockApiFetch.mockResolvedValueOnce(session);
    mockUpload.mockImplementation(async (_url, opts: { signal?: AbortSignal }) => {
      expect(opts.signal).toBe(controller.signal);
      controller.abort();
      return { status: 200, body: '', headers: {} };
    });

    await expect(
      uploadVideoDirect('/landlord/properties', file, { signal: controller.signal })
    ).rejects.toMatchObject({ name: 'AbortError' });
    expect(mockApiFetch).toHaveBeenCalledTimes(1);
  });

  it('sends nothing when already cancelled', async () => {
    const controller = new AbortController();
    controller.abort();
    await expect(
      uploadVideoDirect('/owner/properties', file, { signal: controller.signal })
    ).rejects.toMatchObject({ name: 'AbortError' });
    expect(mockApiFetch).not.toHaveBeenCalled();
    expect(mockUpload).not.toHaveBeenCalled();
  });

  it('passes other API errors through, such as a file over the size limit', async () => {
    mockApiFetch.mockRejectedValueOnce(new ApiError('Videos must be 150 MB or smaller', 400));
    await expect(uploadVideoDirect('/landlord/properties', file)).rejects.toThrow('150 MB');
    expect(mockApiUpload).not.toHaveBeenCalled();
  });
});

describe('resumable helpers', () => {
  const { missingParts, retryDelayMs } = jest.requireActual('../lib/api/videoUpload');
  it('lists missing parts and backs off', () => {
    expect(missingParts(4, [2])).toEqual([1, 3, 4]);
    expect([1, 2, 3, 4, 5].map(retryDelayMs)).toEqual([1000, 2000, 4000, 8000, 8000]);
  });
});
