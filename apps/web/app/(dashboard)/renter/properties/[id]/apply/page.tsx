'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, CheckCircle2, Search } from 'lucide-react';
import { Button } from '@getrentos/ui';
import { EmptyState } from '@getrentos/ui';
import {
  ApplicationWizard,
  type ApplicationFormData,
} from '@/components/renter/property-apply/ApplicationWizard';
import { useRenterUser } from '../../../layout';
import { ROUTES, buildRoute } from '@/lib/constants/auth';
import type { Property } from '@/types/renter';
import { renterService } from '@/services/renterService';
import { unwrap } from '@/lib/apiHelpers';
import { renterKeys } from '@/lib/queryKeys';

const buildInitialData = (
  property: Property | null,
  user: { fullName: string; email: string } | null
): ApplicationFormData => ({
  fullName: user?.fullName || '',
  email: user?.email || '',
  phone: '',
  currentAddress: '',
  employer: '',
  employmentStatus: 'Employed',
  monthlyIncome: '',
  moveInDate: property?.availableFrom || '',
  leaseTerm: '12 months',
  notes: '',
  nextOfKinName: '',
  nextOfKinPhone: '',
  nextOfKinRelationship: '',
  referenceName: '',
  referencePhone: '',
  referenceRelationship: '',
  documents: [
    { name: 'Government ID', uploaded: false, required: true },
    { name: 'Proof of Income', uploaded: false, required: true },
    { name: 'Bank Statement', uploaded: false, required: true },
    { name: 'Reference Letter', uploaded: false, required: false },
  ],
});

export default function PropertyApplyPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const user = useRenterUser();
  const [submitted, setSubmitted] = useState(false);

  const { data: property = null, isLoading } = useQuery({
    queryKey: renterKeys.listing(params.id),
    queryFn: () => unwrap(renterService.getListing(params.id)),
  });

  const submitMutation = useMutation({
    mutationFn: (data: ApplicationFormData) =>
      unwrap(renterService.submitApplication(property?.id ?? '', data)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: renterKeys.applications });
      queryClient.invalidateQueries({ queryKey: renterKeys.dashboardStats });
      setSubmitted(true);
    },
  });

  const handleSubmit = async (data: ApplicationFormData) => {
    await submitMutation.mutateAsync(data);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!property) {
    return (
      <EmptyState
        icon={Search}
        title="Property not found"
        description="This listing may have been removed or the link is incorrect."
        action={
          <Button variant="primary" onClick={() => router.push(ROUTES.RENTER_DISCOVER)}>
            Back to Discover
          </Button>
        }
      />
    );
  }

  if (submitted) {
    return (
      <div className="max-w-lg mx-auto text-center py-12">
        <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
          <CheckCircle2 className="w-7 h-7 text-green-600 dark:text-green-400" />
        </div>
        <h1 className="text-xl font-bold text-foreground">Application submitted</h1>
        <p className="text-muted-foreground mt-2">
          Your application for <span className="text-foreground font-medium">{property.title}</span>{' '}
          has been sent to {property.landlordName || 'the landlord'}. You&apos;ll be notified as
          soon as there&apos;s an update.
        </p>
        <div className="flex items-center justify-center gap-3 mt-6">
          <Button variant="primary" onClick={() => router.push(ROUTES.RENTER_APPLICATIONS)}>
            View My Applications
          </Button>
          <Button variant="outline" onClick={() => router.push(ROUTES.RENTER_DISCOVER)}>
            Keep Browsing
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <button
        onClick={() => router.push(buildRoute.renterPropertyDetail(property.id))}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to property
      </button>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Apply to rent</h1>
        <p className="text-muted-foreground mt-1">
          {property.title} · {property.location}
        </p>
      </div>

      <div className="max-w-2xl">
        <ApplicationWizard
          property={property}
          initialData={buildInitialData(property, user)}
          onSubmit={handleSubmit}
        />
      </div>
    </>
  );
}
