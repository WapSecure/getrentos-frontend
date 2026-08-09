'use client';

import { useState } from 'react';
import { BookOpen, Clock, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react';

interface Guide {
  id: string;
  title: string;
  description: string;
  steps: string[];
  category: string;
  duration: string;
}

const mockGuides: Guide[] = [
  {
    id: '1',
    title: 'Getting started as a renter',
    description: 'Everything you need to set up your account and start your search',
    category: 'getting-started',
    duration: '5 min',
    steps: [
      'Complete your profile with a photo and contact details',
      'Verify your identity to unlock full platform access',
      'Set your search preferences (budget, location, bedrooms)',
      'Save properties you like and add them to comparisons',
      'Schedule a viewing for your top choices',
    ],
  },
  {
    id: '2',
    title: 'Applying for a rental property',
    description: 'A step-by-step walkthrough of the digital application process',
    category: 'renting',
    duration: '8 min',
    steps: [
      'Open the property listing and click "Apply"',
      'Fill in your personal and employment information',
      'Upload required documents (ID, proof of income)',
      'Review your application summary carefully',
      'Submit and track the status from your Applications tab',
    ],
  },
  {
    id: '3',
    title: 'Understanding your escrow payment',
    description: 'How your rent payments are protected from start to finish',
    category: 'payments',
    duration: '4 min',
    steps: [
      'Select your payment method on the Payments tab',
      'Funds are transferred into secure escrow, not directly to the landlord',
      'GetRentos verifies lease conditions are met',
      'Funds are automatically released to your landlord',
      'A receipt and transaction record is generated for your records',
    ],
  },
  {
    id: '4',
    title: 'Reporting and tracking maintenance requests',
    description: 'Get repairs handled quickly with full visibility',
    category: 'maintenance',
    duration: '3 min',
    steps: [
      'Go to Maintenance and click "Report Issue"',
      'Choose a category and describe the problem in detail',
      'Attach photos to help the landlord assess the issue',
      'Track status as it moves from Submitted to Resolved',
      'Confirm completion once the repair is done',
    ],
  },
  {
    id: '5',
    title: 'Setting up a roommate split',
    description: 'Share rent responsibilities transparently with roommates',
    category: 'account',
    duration: '5 min',
    steps: [
      'Open the Roommates tab and click "Invite Roommate"',
      'Enter their email address and send the invite',
      'Once accepted, configure an equal or custom rent split',
      'Each roommate connects their own payment method',
      'Track individual payment status for the full household',
    ],
  },
];

interface HelpGuidesProps {
  selectedCategory?: string;
}

export const HelpGuides = ({ selectedCategory = 'all' }: HelpGuidesProps) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filteredGuides = mockGuides.filter(
    (guide) => selectedCategory === 'all' || guide.category === selectedCategory
  );

  const toggleExpanded = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  if (filteredGuides.length === 0) {
    return (
      <div className="bg-card rounded-xl border border-border p-8 text-center">
        <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-3" />
        <p className="text-muted-foreground">No guides found for this category</p>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      <div className="p-4 border-b border-border">
        <h3 className="font-semibold text-foreground">Step-by-Step Guides</h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          Detailed walkthroughs for common tasks
        </p>
      </div>

      <div className="divide-y divide-border">
        {filteredGuides.map((guide) => {
          const isExpanded = expandedId === guide.id;
          return (
            <div key={guide.id}>
              <button
                onClick={() => toggleExpanded(guide.id)}
                aria-expanded={isExpanded}
                className="w-full flex items-start justify-between gap-4 p-4 text-left hover:bg-secondary transition-colors"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className="p-2 rounded-lg bg-accent shrink-0">
                    <BookOpen className="w-4 h-4 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-sm font-medium text-foreground">{guide.title}</h4>
                    <p className="text-sm text-muted-foreground mt-0.5">{guide.description}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {guide.duration}
                      </span>
                      <span className="flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        {guide.steps.length} steps
                      </span>
                    </div>
                  </div>
                </div>
                {isExpanded ? (
                  <ChevronUp className="w-4 h-4 text-gray-400 shrink-0 mt-2" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-gray-400 shrink-0 mt-2" />
                )}
              </button>

              {isExpanded && (
                <div className="px-4 pb-4 pl-[3.75rem]">
                  <ol className="space-y-2.5">
                    {guide.steps.map((step, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <span className="shrink-0 w-5 h-5 rounded-full bg-accent text-primary text-xs font-semibold flex items-center justify-center mt-0.5">
                          {index + 1}
                        </span>
                        <span className="text-sm text-muted-foreground">{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
