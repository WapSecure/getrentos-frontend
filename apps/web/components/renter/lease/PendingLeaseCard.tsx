'use client';

import { useState } from 'react';
import { CheckCircle2, FileSignature } from 'lucide-react';
import { Button, SignaturePad } from '@getrentos/ui';
import { formatCurrency, formatDate } from '@getrentos/shared';
import type { PendingLease } from '@/services/renterService';

interface PendingLeaseCardProps {
  lease: PendingLease;
  onSign: (leaseId: string, signatureData: string) => void;
  isPending?: boolean;
}

export const PendingLeaseCard = ({ lease, onSign, isPending }: PendingLeaseCardProps) => {
  const [signatureData, setSignatureData] = useState<string | null>(null);

  return (
    <div className="bg-card rounded-2xl border border-border overflow-hidden">
      <div className="p-5 border-b border-border flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center shrink-0">
          <FileSignature className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="font-semibold text-foreground">A lease is waiting for your signature</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {lease.propertyName} — {lease.unitName}
          </p>
        </div>
      </div>

      <div className="p-5 grid sm:grid-cols-2 gap-4 border-b border-border">
        <div>
          <p className="text-xs text-muted-foreground">Lease period</p>
          <p className="text-sm font-medium text-foreground mt-0.5">
            {formatDate(lease.startDate)} – {formatDate(lease.endDate)}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Monthly rent</p>
          <p className="text-sm font-medium text-foreground mt-0.5">
            {formatCurrency(lease.rentAmount)}
          </p>
        </div>
        {lease.securityDeposit !== undefined && (
          <div>
            <p className="text-xs text-muted-foreground">Security deposit</p>
            <p className="text-sm font-medium text-foreground mt-0.5">
              {formatCurrency(lease.securityDeposit)}
            </p>
          </div>
        )}
        <div>
          <p className="text-xs text-muted-foreground">Landlord</p>
          <p className="text-sm font-medium text-foreground mt-0.5">{lease.landlord.name}</p>
        </div>
      </div>

      {lease.landlordSigned ? (
        <div className="p-3 mx-5 mt-5 rounded-lg bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 text-xs font-medium flex items-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5" />
          Landlord has already signed — your signature completes the lease.
        </div>
      ) : (
        <div className="p-3 mx-5 mt-5 rounded-lg bg-secondary text-muted-foreground text-xs">
          Waiting on the landlord to countersign after you.
        </div>
      )}

      <div className="p-5">
        <p className="text-sm font-medium text-foreground mb-2">Your signature</p>
        <SignaturePad onChange={setSignatureData} width={432} height={150} />
      </div>

      <div className="p-5 border-t border-border">
        <Button
          className="gap-2"
          isLoading={isPending}
          disabled={!signatureData}
          onClick={() => signatureData && onSign(lease.id, signatureData)}
        >
          <FileSignature className="w-4 h-4" />
          Sign lease
        </Button>
      </div>
    </div>
  );
};
