'use client';

import { LegacyInput } from '@getrentos/ui';

import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Camera, Upload, CheckCircle, AlertCircle, Shield } from 'lucide-react';

interface FacialVerificationProps {
  onComplete: () => void;
  onSkip?: () => void;
}

export const FacialVerification = ({ onComplete, onSkip }: FacialVerificationProps) => {
  const [step, setStep] = useState<
    'id-select' | 'id-upload' | 'liveness' | 'processing' | 'complete'
  >('id-select');
  const [selectedIdType, setSelectedIdType] = useState<string | null>(null);
  const [idImage, setIdImage] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const idTypes = [
    { id: 'nin', name: 'National ID (NIN)', description: 'National Identification Number card' },
    { id: 'voters', name: "Voter's Card", description: "Permanent Voter's Card (PVC)" },
    { id: 'drivers', name: "Driver's License", description: "Nigerian Driver's License" },
    { id: 'passport', name: 'International Passport', description: 'Nigerian Passport' },
  ];

  const handleIdUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setIdImage(reader.result as string);
        setStep('liveness');
      };
      reader.readAsDataURL(file);
    }
  };

  const startLivenessCheck = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err) {
      console.error('Camera access denied:', err);
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      canvasRef.current.width = videoRef.current.videoWidth;
      canvasRef.current.height = videoRef.current.videoHeight;
      context?.drawImage(videoRef.current, 0, 0);

      // Stop camera stream
      const stream = videoRef.current.srcObject as MediaStream;
      stream?.getTracks().forEach((track) => track.stop());

      setStep('processing');
      // Simulate processing
      setTimeout(() => {
        setStep('complete');
        setTimeout(() => onComplete(), 1500);
      }, 3000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-card rounded-2xl max-w-md w-full mx-4 overflow-hidden"
      >
        <div className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Shield className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">Identity Verification</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Required for platform access
              </p>
            </div>
          </div>

          {step === 'id-select' && (
            <div className="space-y-4">
              <p className="text-gray-600 dark:text-gray-300">
                Select the ID type you&apos;ll use for verification:
              </p>
              <div className="space-y-2">
                {idTypes.map((type) => (
                  <button
                    key={type.id}
                    onClick={() => {
                      setSelectedIdType(type.id);
                      setStep('id-upload');
                    }}
                    className="w-full p-4 text-left rounded-xl border border-border hover:border-primary hover:bg-primary/5 transition-all"
                  >
                    <div className="font-semibold text-foreground">{type.name}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {type.description}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 'id-upload' && (
            <div className="space-y-4">
              <p className="text-gray-600 dark:text-gray-300">
                Upload a clear photo of your {idTypes.find((t) => t.id === selectedIdType)?.name}
              </p>
              <label className="block w-full p-8 text-center rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 cursor-pointer hover:border-primary transition-all">
                <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  Click to upload or drag and drop
                </span>
                <LegacyInput
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleIdUpload}
                />
              </label>
            </div>
          )}

          {step === 'liveness' && (
            <div className="space-y-4">
              <p className="text-gray-600 dark:text-gray-300">
                Position your face in the frame for liveness check
              </p>
              <div className="relative rounded-xl overflow-hidden bg-gray-900 aspect-video">
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  autoPlay
                  playsInline
                  muted
                />
                <canvas ref={canvasRef} className="hidden" />
              </div>
              <button
                onClick={capturePhoto}
                className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground py-3 rounded-xl font-semibold"
              >
                <Camera className="w-4 h-4" />
                Capture Photo
              </button>
              <button
                onClick={startLivenessCheck}
                className="w-full text-sm text-gray-500 dark:text-gray-400 hover:text-primary"
              >
                Retry Camera Access
              </button>
            </div>
          )}

          {step === 'processing' && (
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Verifying Identity</h3>
              <p className="text-gray-500 dark:text-gray-400">
                Please wait while we verify your documents...
              </p>
            </div>
          )}

          {step === 'complete' && (
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Verification Complete!</h3>
              <p className="text-gray-500 dark:text-gray-400">
                Your identity has been verified successfully.
              </p>
            </div>
          )}
        </div>

        {onSkip && step === 'id-select' && (
          <div className="p-4 border-t border-border">
            <button
              onClick={onSkip}
              className="w-full text-sm text-gray-500 dark:text-gray-400 hover:text-primary text-center"
            >
              Skip for now (Limited access)
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
};
