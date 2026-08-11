'use client';

import { motion } from 'framer-motion';
import { IdCard, ArrowLeft, IdCard as IdCardIcon } from 'lucide-react';
import { VerificationStep } from '@/app/(auth)/verification/page';

interface IdSelectionStepProps {
  setSelectedIdType: (id: string | null) => void;
  onNextStep: (step: VerificationStep) => void;
  onSkip: () => void;
}

const idTypes = [
  { id: 'nin', name: 'National ID (NIN)', issuer: 'National Identity Management Commission' },
  { id: 'voters', name: "Voter's Card", issuer: 'Independent National Electoral Commission' },
  { id: 'drivers', name: "Driver's License", issuer: 'Federal Road Safety Corps' },
  { id: 'passport', name: 'International Passport', issuer: 'Nigerian Immigration Service' },
];

export const IdSelectionStep = ({
  setSelectedIdType,
  onNextStep,
  onSkip,
}: IdSelectionStepProps) => {
  const handleSelectId = (id: string) => {
    setSelectedIdType(id);
    onNextStep('id-upload');
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-4"
    >
      <div className="text-center mb-4">
        <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-primary/10 flex items-center justify-center">
          <IdCard className="w-8 h-8 text-primary" />
        </div>
        <h3 className="text-lg font-semibold text-foreground">Select ID Type</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Choose your preferred government-issued ID
        </p>
      </div>

      <div className="space-y-3">
        {idTypes.map((type) => (
          <button
            key={type.id}
            onClick={() => handleSelectId(type.id)}
            className="w-full p-4 text-left rounded-xl border border-border hover:border-primary hover:bg-primary/5 transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-white/10 flex items-center justify-center">
                <IdCardIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </div>
              <div className="flex-1">
                <div className="font-semibold text-foreground">{type.name}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">{type.issuer}</div>
              </div>
              <ArrowLeft className="w-4 h-4 text-gray-400 rotate-180" />
            </div>
          </button>
        ))}
      </div>

      {/* Skip Option */}
      <div className="mt-6 text-center">
        <button
          onClick={onSkip}
          className="text-sm text-gray-500 dark:text-gray-400 hover:text-primary transition-colors"
        >
          Skip for now (Limited access)
        </button>
        <p className="text-xs text-gray-400 mt-2">
          You can verify later, but some features will be restricted
        </p>
      </div>
    </motion.div>
  );
};
