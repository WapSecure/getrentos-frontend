'use client';

import { useMemo, useState } from 'react';
import {
  Shield,
  CheckCircle,
  Clock,
  Phone,
  Mail,
  User,
  FileText,
  CreditCard,
  Users,
} from 'lucide-react';
import { Button } from '@getrentos/ui';
import { VerificationItem } from '@/types/trust-score';

const iconMap: Record<string, React.ElementType> = {
  Shield: Shield,
  Phone: Phone,
  Mail: Mail,
  User: User,
  FileText: FileText,
  CreditCard: CreditCard,
  Users: Users,
};

interface VerificationListProps {
  verifications: VerificationItem[];
}

export const VerificationList = ({ verifications }: VerificationListProps) => {
  const [locallyVerifiedIds, setLocallyVerifiedIds] = useState<Set<string>>(new Set());

  const items = useMemo(
    () =>
      verifications.map((item) =>
        !item.verified && locallyVerifiedIds.has(item.id)
          ? { ...item, verified: true, date: new Date().toISOString() }
          : item
      ),
    [verifications, locallyVerifiedIds]
  );

  const verifiedCount = items.filter((v) => v.verified).length;
  const totalCount = items.length;

  const handleVerify = (id: string) => {
    setLocallyVerifiedIds((prev) => new Set(prev).add(id));
  };

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      <div className="p-4 border-b border-border flex justify-between items-center">
        <div>
          <h3 className="font-semibold text-foreground">Verification Status</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {verifiedCount} of {totalCount} verifications completed
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-2 w-32 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-300"
              style={{ width: `${(verifiedCount / totalCount) * 100}%` }}
            />
          </div>
          <span className="text-xs font-medium text-gray-500">
            {Math.round((verifiedCount / totalCount) * 100)}%
          </span>
        </div>
      </div>

      <div className="divide-y divide-border">
        {items.map((item) => {
          const Icon = iconMap[item.icon] || Shield;
          return (
            <div
              key={item.id}
              className="p-4 flex items-center justify-between hover:bg-secondary transition-colors"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`p-2 rounded-lg ${item.verified ? 'bg-green-50 dark:bg-green-900/20' : 'bg-secondary'}`}
                >
                  <Icon
                    className={`w-4 h-4 ${item.verified ? 'text-green-600' : 'text-gray-400'}`}
                  />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-foreground">{item.label}</p>
                    {item.verified ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <Clock className="w-4 h-4 text-yellow-500" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>
                  {item.date && (
                    <p className="text-xs text-gray-400 mt-0.5">
                      Verified on {new Date(item.date).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
              {!item.verified && (
                <Button size="sm" variant="primary" onClick={() => handleVerify(item.id)}>
                  Verify Now
                </Button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
