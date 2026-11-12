import { HelpCircle } from '@sureground/icons';
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
  DisclosureList,
  EmptyState,
} from '@sureground/ui';

interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
}

const helpFAQs: FAQ[] = [
  {
    id: '1',
    question: 'How do I reset my password?',
    answer:
      'Go to the login page and click "Forgot password?". Enter your email address and follow the instructions sent to your inbox. The reset link expires after 30 minutes for security.',
    category: 'account',
  },
  {
    id: '2',
    question: 'How does payment protection work?',
    answer:
      'Your rent goes to Sureground, not straight to the landlord. It is released to your landlord when you confirm move-in, or automatically on its scheduled release date. If something is wrong, raise a dispute before then and the money stays held until it is resolved.',
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
      'Navigate to the Maintenance tab on your dashboard, click "Report issue", select a category (plumbing, electrical, appliances, etc.), describe the problem, and attach photos if possible. Your landlord will be notified immediately and you can track the status in real time.',
    category: 'maintenance',
  },
  {
    id: '5',
    question: 'Can I cancel my rental application after submitting it?',
    answer:
      'Yes, you can withdraw an application at any time before it is approved by going to the Applications tab and selecting "Withdraw application". Once approved and a lease is signed, cancellation is subject to the lease terms.',
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
      'In the Roommates tab, add your roommates by email invite, then set up a split arrangement: equal or custom percentages. Each roommate pays their share directly through the platform, and each payment is held and tracked separately by Sureground.',
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
  const filteredFAQs = helpFAQs.filter(
    (faq) => selectedCategory === 'all' || faq.category === selectedCategory
  );

  if (filteredFAQs.length === 0) {
    return <EmptyState icon={HelpCircle} title="No FAQs found for this category" size="compact" />;
  }

  return (
    <Card>
      <CardHeader className="border-b border-border pb-4">
        <CardTitle>Frequently asked questions</CardTitle>
        <CardDescription>Quick answers to common questions</CardDescription>
      </CardHeader>
      <DisclosureList
        name="help-faqs"
        items={filteredFAQs.map((faq) => ({
          id: faq.id,
          summary: faq.question,
          content: faq.answer,
        }))}
      />
    </Card>
  );
};
