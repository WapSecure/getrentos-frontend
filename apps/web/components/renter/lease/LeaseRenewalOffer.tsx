'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Mail, CheckCircle, XCircle, Calendar, TrendingUp } from 'lucide-react';
import { NairaSign } from '@getrentos/ui/NairaSign';
import { Alert, Button, Card } from '@getrentos/ui';
import { ROUTES } from '@/lib/constants/auth';
import type { RenewalOffer } from '@/types/lease';

interface Lease {
  id: string;
  propertyName: string;
  rentAmount: number;
  endDate: string;
}

interface LeaseRenewalOfferProps {
  renewalOffer: RenewalOffer;
  lease: Lease;
  onRespond: (offerId: string, action: 'accept' | 'decline') => Promise<void>;
}

export const LeaseRenewalOffer = ({ renewalOffer, lease, onRespond }: LeaseRenewalOfferProps) => {
  const router = useRouter();
  const [response, setResponse] = useState<'accepted' | 'declined' | null>(
    renewalOffer.status === 'accepted'
      ? 'accepted'
      : renewalOffer.status === 'declined'
        ? 'declined'
        : null
  );
  const [pending, setPending] = useState<'accept' | 'decline' | null>(null);

  const handleContactLandlord = () => {
    router.push(ROUTES.RENTER_MESSAGES);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const handleResponse = async (action: 'accept' | 'decline') => {
    setPending(action);
    try {
      await onRespond(renewalOffer.id, action);
      setResponse(action === 'accept' ? 'accepted' : 'declined');
    } finally {
      setPending(null);
    }
  };

  if (response === 'accepted') {
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="border-success/20">
          <div className="p-4 bg-success-subtle border-b border-success/20">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-success" />
              <h3 className="font-semibold text-success">Renewal Accepted</h3>
            </div>
          </div>
          <div className="p-4">
            <p className="text-sm text-muted-foreground">
              You&apos;ve accepted the renewal offer for {lease.propertyName}. Your new lease will
              begin on {formatDate(renewalOffer.newEndDate)}.
            </p>
            <Button variant="outline" className="mt-3 w-full gap-2" onClick={handleContactLandlord}>
              <Mail className="w-4 h-4" />
              Contact Landlord
            </Button>
          </div>
        </Card>
      </motion.div>
    );
  }

  if (response === 'declined') {
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Card>
          <div className="p-4 border-b border-border">
            <div className="flex items-center gap-2">
              <XCircle className="w-5 h-5 text-muted-foreground" />
              <h3 className="font-semibold text-foreground">Renewal Declined</h3>
            </div>
          </div>
          <div className="p-4">
            <p className="text-sm text-muted-foreground">
              You&apos;ve declined the renewal offer. Your current lease will expire on{' '}
              {formatDate(lease.endDate)}.
            </p>
            <Alert variant="warning" className="mt-3">
              You&apos;ll need to move out by {formatDate(lease.endDate)} or discuss alternative
              arrangements.
            </Alert>
          </div>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="border-primary/30">
        <div className="border-b border-border bg-muted/30 p-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-foreground">Renewal Offer</h3>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Your landlord has sent a renewal offer
          </p>
        </div>

        <div className="p-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="p-2 rounded-lg bg-secondary">
              <div className="flex items-center gap-1">
                <NairaSign className="w-3 h-3 text-primary" />
                <span className="text-xs text-muted-foreground">Current Rent</span>
              </div>
              <p className="text-sm font-semibold text-foreground">
                {formatCurrency(lease.rentAmount)}
              </p>
            </div>
            <div className="p-2 rounded-lg bg-secondary">
              <div className="flex items-center gap-1">
                <TrendingUp className="w-3 h-3 text-primary" />
                <span className="text-xs text-muted-foreground">New Rent</span>
              </div>
              <p className="text-sm font-semibold text-foreground">
                {formatCurrency(renewalOffer.newRentAmount)}
              </p>
            </div>
          </div>

          <div className="p-2 rounded-lg bg-info-subtle border border-info/20">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-info" />
              <span className="text-xs font-medium text-info">
                New Term: {formatDate(renewalOffer.newEndDate)}
              </span>
            </div>
            <p className="text-xs text-info mt-1">{renewalOffer.terms}</p>
          </div>

          <div className="flex gap-2">
            <Button
              variant="primary"
              className="flex-1"
              onClick={() => handleResponse('accept')}
              isLoading={pending === 'accept'}
              disabled={pending !== null}
            >
              Accept
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => handleResponse('decline')}
              isLoading={pending === 'decline'}
              disabled={pending !== null}
            >
              Decline
            </Button>
          </div>
        </div>
      </Card>
    </motion.div>
  );
};
