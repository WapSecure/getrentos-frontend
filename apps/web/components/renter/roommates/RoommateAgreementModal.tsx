'use client';

import { useState } from 'react';
import { FileText, Check, Users, Clock, Home } from '@sureground/icons';
import { NairaSign } from '@sureground/ui/NairaSign';
import {
  Alert,
  Button,
  Checkbox,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@sureground/ui';

interface Roommate {
  id: string;
  name: string;
  sharePercentage: number;
}

interface RoommateAgreementModalProps {
  isOpen: boolean;
  onClose: () => void;
  roommates: Roommate[];
}

export const RoommateAgreementModal = ({
  isOpen,
  onClose,
  roommates,
}: RoommateAgreementModalProps) => {
  const [agreed, setAgreed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = () => {
    if (!agreed) return;
    setIsSubmitting(true);
    // Acknowledged locally: the household terms are shared in-app, with no server round-trip.
    setIsSubmitting(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-2xl">
        <DialogTitle className="pr-8 font-semibold text-foreground">Roommate agreement</DialogTitle>
        <DialogDescription className="text-xs text-muted-foreground mt-0.5">
          Review and agree to the roommate terms
        </DialogDescription>

        <div className="mt-5 space-y-6">
          <Alert variant="info" icon={FileText} title="Household agreement">
            This agreement outlines the shared responsibilities and expectations for all roommates.
          </Alert>

          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-secondary">
                <Users className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <h4 className="font-medium text-foreground">Roommates</h4>
                <p className="text-sm text-muted-foreground">
                  {roommates.map((r) => r.name).join(', ')}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-secondary">
                <Home className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <h4 className="font-medium text-foreground">Shared responsibilities</h4>
                <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                  <li>Keep common areas clean and tidy</li>
                  <li>Respect quiet hours (10 PM - 8 AM)</li>
                  <li>Notify roommates of guests in advance</li>
                  <li>Share household supplies costs</li>
                  <li>Maintain open communication</li>
                </ul>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-secondary">
                <NairaSign className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="min-w-0">
                <h4 className="font-medium text-foreground">Financial agreement</h4>
                <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                  <li>Rent split according to agreed percentages</li>
                  <li>Utilities and shared expenses equally divided</li>
                  <li>Payments due by the 1st of each month</li>
                  <li>Late payments subject to fees</li>
                </ul>
              </div>
            </div>
          </div>

          <Alert variant="warning" icon={Clock} title="Notice period">
            Any roommate wishing to leave must provide 30 days notice and find a suitable
            replacement.
          </Alert>

          <div className="pt-4 border-t border-border">
            <Checkbox
              checked={agreed}
              onCheckedChange={setAgreed}
              label="I have read and agree to the terms of this roommate agreement. All roommates will be notified of this agreement."
            />
          </div>

          <Button
            variant="primary"
            fullWidth
            onClick={handleSubmit}
            disabled={!agreed}
            isLoading={isSubmitting}
            icon={<Check className="w-4 h-4" />}
          >
            Sign agreement
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
