'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  HelpCircle,
  ChevronDown,
  Mail,
  Phone,
  MessageCircle,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface FAQItem {
  question: string;
  answer: string;
}

const faqs: FAQItem[] = [
  {
    question: 'How does GetRentos verify identities and properties?',
    answer:
      'Every user completes BVN/NIN identity verification, and every listed property is checked against title deeds or certificates of occupancy before it can go live. Look for the green "Verified" badge.',
  },
  {
    question: 'How are payments protected?',
    answer:
      'Funds are held in escrow until both parties confirm the transaction terms are met, so money never changes hands without a paper trail.',
  },
  {
    question: 'How do I contact someone about my account?',
    answer:
      'Use the "Contact Support" options below, or message your assigned account contact directly from the Messages tab.',
  },
  {
    question: 'Where can I see the status of an ongoing request?',
    answer:
      'Any pending applications, disputes, or verifications you have open will show live status updates on your dashboard.',
  },
];

interface HelpCenterContentProps {
  roleLabel: string;
  messagesHref: string;
}

export const HelpCenterContent = ({ roleLabel, messagesHref }: HelpCenterContentProps) => {
  const router = useRouter();
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <>
      <div className="mb-6">
        <div className="flex items-center gap-2">
          <HelpCircle className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">Help Center</h1>
        </div>
        <p className="text-muted-foreground mt-1">
          Answers and support for your GetRentos {roleLabel} account
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-3">
          <h2 className="text-sm font-semibold text-foreground mb-1">Frequently Asked Questions</h2>
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <div
                key={faq.question}
                className="bg-card border border-border rounded-xl overflow-hidden"
              >
                <button
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  className="w-full flex items-center justify-between gap-3 p-4 text-left"
                >
                  <span className="text-sm font-medium text-foreground">{faq.question}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-muted-foreground shrink-0 transition-transform ${
                      isOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {isOpen && (
                  <p className="px-4 pb-4 text-sm text-muted-foreground leading-relaxed">
                    {faq.answer}
                  </p>
                )}
              </div>
            );
          })}
        </div>

        <div className="space-y-4">
          <div className="bg-card border border-border rounded-xl p-4">
            <h3 className="text-sm font-semibold text-foreground mb-3">Contact Support</h3>
            <div className="space-y-3">
              <a
                href="mailto:support@getrentos.test"
                className="flex items-start gap-2.5 text-sm hover:text-primary transition-colors"
              >
                <Mail className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                <span>
                  <span className="block text-foreground font-medium">Email</span>
                  <span className="text-muted-foreground">support@getrentos.test</span>
                </span>
              </a>
              <a
                href="tel:+2348000000000"
                className="flex items-start gap-2.5 text-sm hover:text-primary transition-colors"
              >
                <Phone className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                <span>
                  <span className="block text-foreground font-medium">Phone</span>
                  <span className="text-muted-foreground">+234 800 000 0000</span>
                </span>
              </a>
              <div className="flex items-start gap-2.5 text-sm">
                <Clock className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                <span>
                  <span className="block text-foreground font-medium">Hours</span>
                  <span className="text-muted-foreground">Mon–Sat, 8am–8pm WAT</span>
                </span>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              fullWidth
              className="gap-2 mt-4"
              onClick={() => router.push(messagesHref)}
            >
              <MessageCircle className="w-4 h-4" />
              Message Support
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};
