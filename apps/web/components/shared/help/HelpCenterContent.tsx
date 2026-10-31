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
import { Button, Card } from '@getrentos/ui';
import { SUPPORT, hasSupportLine, telLink, whatsappLink } from '@/lib/support';

interface FAQItem {
  question: string;
  answer: string;
}

const faqs: FAQItem[] = [
  {
    question: 'How does GetRentos verify identities and properties?',
    answer:
      'Signing up is quick: you don\'t need to verify anything to start. Identity, licence and ownership checks are only asked for when something you do needs them, such as listing a property or collecting rent. Listings are reviewed before they go live; look for the green "Verified" badge.',
  },
  {
    question: 'How are payments protected?',
    answer:
      "It depends on the payment. Rent is held by GetRentos and released to your landlord on schedule. A deposit on a home or land you're buying is held by GetRentos and only released to the seller once you confirm you've received it (for land, once the conveyance steps are confirmed); it is never released on a timer. If something is wrong, raise a dispute and the money stays held until it is resolved.",
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
              <Card key={faq.question}>
                <button
                  type="button"
                  aria-expanded={isOpen}
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  className="w-full flex items-center justify-between gap-3 p-4 text-left focus-visible:outline-none focus-visible:bg-secondary/60"
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
              </Card>
            );
          })}
        </div>

        <div className="space-y-4">
          <Card className="p-4">
            <h3 className="text-sm font-semibold text-foreground mb-3">Contact Support</h3>
            <div className="space-y-3">
              <a
                href={`mailto:${SUPPORT.email}`}
                className="flex items-start gap-2.5 text-sm hover:text-primary transition-colors"
              >
                <Mail className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                <span>
                  <span className="block text-foreground font-medium">Email</span>
                  <span className="text-muted-foreground">{SUPPORT.email}</span>
                </span>
              </a>
              {SUPPORT.phone && (
                <a
                  href={telLink(SUPPORT.phone)}
                  className="flex items-start gap-2.5 text-sm hover:text-primary transition-colors"
                >
                  <Phone className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                  <span>
                    <span className="block text-foreground font-medium">Phone</span>
                    <span className="text-muted-foreground">{SUPPORT.phone}</span>
                  </span>
                </a>
              )}
              {SUPPORT.whatsapp && (
                <a
                  href={whatsappLink(SUPPORT.whatsapp)}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-start gap-2.5 text-sm hover:text-primary transition-colors"
                >
                  <MessageCircle className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                  <span>
                    <span className="block text-foreground font-medium">WhatsApp</span>
                    <span className="text-muted-foreground">Chat with support</span>
                  </span>
                </a>
              )}
              {SUPPORT.hours && hasSupportLine() && (
                <div className="flex items-start gap-2.5 text-sm">
                  <Clock className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                  <span>
                    <span className="block text-foreground font-medium">Hours</span>
                    <span className="text-muted-foreground">{SUPPORT.hours}</span>
                  </span>
                </div>
              )}
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
          </Card>
        </div>
      </div>
    </>
  );
};
