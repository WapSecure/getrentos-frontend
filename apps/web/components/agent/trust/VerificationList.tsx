'use client';

import { Shield, CheckCircle, Clock, Phone, Mail, IdCard } from 'lucide-react';
import type { VerificationItem } from '@/types/trust-score';

const iconMap: Record<string, React.ElementType> = {
  Shield,
  Phone,
  Mail,
  IdCard,
};

interface VerificationListProps {
  verifications: VerificationItem[];
}

export const VerificationList = ({ verifications }: VerificationListProps) => {
  const verifiedCount = verifications.filter((v) => v.verified).length;
  const totalCount = verifications.length;

  return (
    <div className="bg-white dark:bg-[#1a2a2f] rounded-xl border border-gray-200 dark:border-white/10 overflow-hidden">
      <div className="p-4 border-b border-gray-200 dark:border-white/10 flex justify-between items-center">
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-white">Verification Status</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            {verifiedCount} of {totalCount} verifications completed
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-2 w-32 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#c4a747] rounded-full transition-all duration-300"
              style={{ width: `${(verifiedCount / totalCount) * 100}%` }}
            />
          </div>
          <span className="text-xs font-medium text-gray-500">
            {Math.round((verifiedCount / totalCount) * 100)}%
          </span>
        </div>
      </div>

      <div className="divide-y divide-gray-200 dark:divide-white/10">
        {verifications.map((item) => {
          const Icon = iconMap[item.icon] || Shield;
          return (
            <div key={item.id} className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`p-2 rounded-lg ${item.verified ? 'bg-green-50 dark:bg-green-900/20' : 'bg-gray-100 dark:bg-white/10'}`}
                >
                  <Icon
                    className={`w-4 h-4 ${item.verified ? 'text-green-600' : 'text-gray-400'}`}
                  />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {item.label}
                    </p>
                    {item.verified ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <Clock className="w-4 h-4 text-yellow-500" />
                    )}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {item.description}
                  </p>
                  {item.date && (
                    <p className="text-xs text-gray-400 mt-0.5">
                      Verified on {new Date(item.date).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
