'use client';

import { useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, CheckCircle2, Search } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import {
  ApplicationWizard,
  type ApplicationFormData,
} from '@/components/renter/property-apply/ApplicationWizard';
import { getPropertyById } from '@/lib/mockProperties';
import { useRenterUser } from '../../../layout';
import type { Application } from '@/types/renter';

const buildInitialData = (
  property: ReturnType<typeof getPropertyById>,
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
  const user = useRenterUser();
  const property = useMemo(() => getPropertyById(params.id), [params.id]);
  const [submitted, setSubmitted] = useState(false);

  if (!property) {
    return (
      <EmptyState
        icon={Search}
        title="Property not found"
        description="This listing may have been removed or the link is incorrect."
        action={
          <Button variant="primary" onClick={() => router.push('/renter/discover')}>
            Back to Discover
          </Button>
        }
      />
    );
  }

  const handleSubmit = (data: ApplicationFormData) => {
    const today = new Date().toISOString().slice(0, 10);
    const application: Application = {
      id: `app_${Date.now()}`,
      propertyId: property.id,
      title: property.title,
      address: property.location,
      status: 'pending',
      date: today,
      price: property.price,
      period: property.period,
      bedrooms: property.bedrooms,
      bathrooms: property.bathrooms,
      size: property.size,
      image: property.image,
      applicationDate: today,
      moveInDate: data.moveInDate || today,
      leaseTerm: data.leaseTerm,
      documents: data.documents,
      landlord: {
        name: property.landlordName || 'GetRentos Landlord',
        email: property.landlordEmail || '',
        phone: property.landlordPhone || '',
        responseRate: property.landlordResponseRate || 90,
        rating: property.landlordRating,
      },
      applicationNotes: data.notes,
      timeline: [
        { stage: 'Application Submitted', date: today, completed: true },
        { stage: 'Under Review', date: 'Pending', completed: false },
        { stage: 'Landlord Decision', date: 'Pending', completed: false },
        { stage: 'Move-in', date: data.moveInDate || 'Pending', completed: false },
      ],
    };

    const existing = localStorage.getItem('renter_submitted_applications');
    const applications: Application[] = existing ? JSON.parse(existing) : [];
    applications.unshift(application);
    localStorage.setItem('renter_submitted_applications', JSON.stringify(applications));

    setSubmitted(true);
  };

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
          <Button variant="primary" onClick={() => router.push('/renter/applications')}>
            View My Applications
          </Button>
          <Button variant="outline" onClick={() => router.push('/renter/discover')}>
            Keep Browsing
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <button
        onClick={() => router.push(`/renter/properties/${property.id}`)}
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
