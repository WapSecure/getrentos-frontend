'use client';

import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Camera, Upload } from 'lucide-react';
import { VerificationStep } from '@/app/(auth)/verification/page';

interface LivenessStepProps {
  onSelfieCapture: (file: File | null) => void;
  onNextStep: (step: VerificationStep) => void;
  onBack: () => void;
}

export const LivenessStep = ({ onSelfieCapture, onNextStep, onBack }: LivenessStepProps) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user' },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        setCameraReady(true);
      } catch {
        if (!cancelled) {
          setCameraError('Camera unavailable — you can upload a selfie photo instead.');
        }
      }
    };

    startCamera();

    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    };
  }, []);

  const captureSelfie = () => {
    const video = videoRef.current;
    if (!video || video.videoWidth === 0) {
      setCameraError('Camera is not ready. Please try again or upload a photo.');
      return;
    }

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(
      (blob) => {
        if (!blob) {
          setCameraError('Could not capture photo. Please try again.');
          return;
        }
        const file = new File([blob], 'selfie.jpg', { type: 'image/jpeg' });
        onSelfieCapture(file);
        onNextStep('processing');
      },
      'image/jpeg',
      0.92
    );
  };

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    onSelfieCapture(file);
    onNextStep('processing');
  };

  return (
    <div className="text-center space-y-4">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-4"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
        <Camera className="w-10 h-10 text-primary" />
      </div>

      <h3 className="text-lg font-semibold text-foreground">Liveness Check</h3>

      <p className="text-sm text-gray-600 dark:text-gray-400">
        For security purposes, we need a selfie to confirm you are a real person. Capture your photo
        below.
      </p>

      {cameraReady ? (
        <div className="relative mx-auto max-w-xs rounded-2xl overflow-hidden bg-black">
          {}
          <video ref={videoRef} className="w-full aspect-[3/4] object-cover" playsInline muted />
        </div>
      ) : (
        <div className="mx-auto max-w-xs aspect-[3/4] rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-600 flex flex-col items-center justify-center gap-3 p-6">
          <Camera className="w-8 h-8 text-gray-400" />
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {cameraError ?? 'Starting camera…'}
          </p>
        </div>
      )}

      {cameraReady ? (
        <button
          onClick={captureSelfie}
          className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-xl font-semibold hover:bg-primary-hover transition-all"
        >
          <Camera className="w-4 h-4" />
          Capture Selfie
        </button>
      ) : (
        <label className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-xl font-semibold hover:bg-primary-hover transition-all cursor-pointer">
          <Upload className="w-4 h-4" />
          Upload Selfie
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleUpload}
            aria-label="Upload a selfie photo"
          />
        </label>
      )}

      {cameraReady && cameraError && <p className="text-sm text-red-500">{cameraError}</p>}

      {/* Always allow uploading a photo as an alternative to the camera. */}
      <label className="block text-center text-sm text-primary hover:underline cursor-pointer">
        Or upload a selfie photo instead
        <input
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleUpload}
          aria-label="Upload a selfie photo instead"
        />
      </label>

      <p className="text-xs text-gray-500 dark:text-gray-500">
        Your selfie is only used for identity verification
      </p>
    </div>
  );
};
