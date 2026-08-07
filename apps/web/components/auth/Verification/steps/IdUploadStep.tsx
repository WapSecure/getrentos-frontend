'use client';

import { ArrowLeft, Upload } from 'lucide-react';
import { VerificationStep } from '@/app/(auth)/verification/page';

interface IdUploadStepProps {
  selectedIdType: string | null;
  idImage: string | null;
  setIdImage: (image: string | null) => void;
  setError: (error: string | null) => void;
  onNextStep: (step: VerificationStep) => void;
  onBack: () => void;
}

const idTypeNames: Record<string, string> = {
  nin: 'National ID (NIN)',
  voters: "Voter's Card",
  drivers: "Driver's License",
  passport: 'International Passport',
};

export const IdUploadStep = ({
  selectedIdType,
  setIdImage,
  setError,
  onNextStep,
  onBack,
}: IdUploadStepProps) => {
  const handleIdUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('File size must be less than 5MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setIdImage(reader.result as string);
        onNextStep('liveness');
        setError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-4">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-4"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      <div className="text-center mb-4">
        <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-[#c4a747]/10 flex items-center justify-center">
          <Upload className="w-8 h-8 text-[#c4a747]" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Upload Your ID</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Upload a clear photo of your {selectedIdType ? idTypeNames[selectedIdType] : 'ID'}
        </p>
      </div>

      <label className="block w-full p-8 text-center rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 cursor-pointer hover:border-[#c4a747] transition-all">
        <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
        <span className="text-sm text-gray-500 dark:text-gray-400">
          Click to upload or drag and drop
        </span>
        <p className="text-xs text-gray-400 mt-1">PNG, JPG up to 5MB</p>
        <input type="file" accept="image/*" className="hidden" onChange={handleIdUpload} />
      </label>

      <div className="text-center">
        <p className="text-xs text-gray-500 dark:text-gray-500">
          Make sure the image is clear and all details are visible
        </p>
      </div>
    </div>
  );
};
