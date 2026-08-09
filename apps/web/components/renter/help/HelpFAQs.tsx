'use client';

import { useState } from 'react';
import { HelpCircle, ChevronDown, ChevronUp } from 'lucide-react';

interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
}

const mockFAQs: FAQ[] = [
  {
    id: '1',
    question: 'How do I reset my password?',
    answer:
      'Go to the login page and click "Forgot Password". Enter your email address and follow the instructions sent to your inbox. The reset link expires after 30 minutes for security.',
    category: 'account',
  },
  {
    id: '2',
    question: 'How does escrow protection work?',
    answer:
      'Escrow protection ensures your funds are held securely by GetRentos until all transaction conditions are met — such as lease signing or move-in confirmation. Funds are only released once both parties confirm satisfaction, protecting you from fraud and disputes.',
    category: 'payments',
  },
  {
    id: '3',
    question: 'What documents do I need to rent a property?',
    answer:
      "You typically need a valid government-issued ID, proof of income (payslip or bank statement), employment verification, and references from previous landlords. Some listings may request additional documents depending on the landlord's requirements.",
    category: 'renting',
  },
  {
    id: '4',
    question: 'How do I report a maintenance issue?',
    answer:
      'Navigate to the Maintenance tab on your dashboard, click "Report Issue", select a category (plumbing, electrical, appliances, etc.), describe the problem, and attach photos if possible. Your landlord will be notified immediately and you can track the status in real time.',
    category: 'maintenance',
  },
  {
    id: '5',
    question: 'Can I cancel my rental application after submitting it?',
    answer:
      'Yes, you can withdraw an application at any time before it is approved by going to the Applications tab and selecting "Withdraw Application". Once approved and a lease is signed, cancellation is subject to the lease terms.',
    category: 'renting',
  },
  {
    id: '6',
    question: 'How is my trust score calculated?',
    answer:
      'Your trust score is based on identity verification status, transaction history, on-time payments, reviews from landlords, and dispute history. A higher score unlocks faster application approvals and better visibility to landlords.',
    category: 'security',
  },
  {
    id: '7',
    question: 'How do I split rent with roommates?',
    answer:
      'In the Roommates tab, add your roommates by email invite, then set up a split arrangement — equal or custom percentages. Each roommate pays their share directly through the platform, and payments are tracked individually in escrow.',
    category: 'account',
  },
  {
    id: '8',
    question: 'What happens if a payment fails?',
    answer:
      "If a payment fails, you'll receive an immediate notification with the reason (insufficient funds, expired card, etc.). You can retry with the same or a different payment method from the Payments tab. Repeated failures may affect your trust score.",
    category: 'payments',
  },
];

interface HelpFAQsProps {
  selectedCategory: string;
}

export const HelpFAQs = ({ selectedCategory }: HelpFAQsProps) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filteredFAQs = mockFAQs.filter(
    (faq) => selectedCategory === 'all' || faq.category === selectedCategory
  );

  const toggleExpanded = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  if (filteredFAQs.length === 0) {
    return (
      <div className="bg-card rounded-xl border border-border p-8 text-center">
        <HelpCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
        <p className="text-muted-foreground">No FAQs found for this category</p>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      <div className="p-4 border-b border-border">
        <h3 className="font-semibold text-foreground">Frequently Asked Questions</h3>
        <p className="text-xs text-muted-foreground mt-0.5">Quick answers to common questions</p>
      </div>

      <div className="divide-y divide-border">
        {filteredFAQs.map((faq) => {
          const isExpanded = expandedId === faq.id;
          return (
            <div key={faq.id}>
              <button
                onClick={() => toggleExpanded(faq.id)}
                aria-expanded={isExpanded}
                className="w-full flex items-center justify-between gap-4 p-4 text-left hover:bg-secondary transition-colors"
              >
                <span className="text-sm font-medium text-foreground">{faq.question}</span>
                {isExpanded ? (
                  <ChevronUp className="w-4 h-4 text-gray-400 shrink-0" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
                )}
              </button>

              {isExpanded && (
                <div className="px-4 pb-4">
                  <p className="text-sm text-muted-foreground leading-relaxed">{faq.answer}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
