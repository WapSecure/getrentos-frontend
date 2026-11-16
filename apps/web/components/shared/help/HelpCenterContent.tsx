'use client';

import { useRouter } from 'next/navigation';
import { Mail, Phone, MessageCircle, Clock, ArrowRight } from '@sureground/icons';
import { Button, Card, DisclosureList, PageHeader } from '@sureground/ui';
import { SUPPORT, hasSupportLine, telLink, whatsappLink } from '@/lib/support';

interface FAQItem {
  question: string;
  answer: string;
}

const faqs: FAQItem[] = [
  {
    question: 'How does Sureground verify identities and properties?',
    answer:
      'Signing up is quick: you don\'t need to verify anything to start. Identity, licence and ownership checks are only asked for when something you do needs them, such as listing a property or collecting rent. Listings are reviewed before they go live; look for the green "Verified" badge.',
  },
  {
    question: 'How are payments protected?',
    answer:
      "It depends on the payment. Rent is held by Sureground and released to your landlord when you confirm move-in or on its scheduled release date, whichever comes first. A deposit on a home or land you're buying is held by Sureground and only released to the seller once the handover is done and you confirm it (for a home, the keys and vacant possession; for land, the conveyance steps); it is never released on a timer. If something is wrong, raise a dispute and the money stays held until it is resolved.",
  },
  {
    question: 'How do I contact someone about my account?',
    answer:
      'Use the "Contact support" options below, or message your assigned account contact directly from the Messages tab.',
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

  return (
    <>
      <PageHeader
        title="Help centre"
        description={`Answers and support for your Sureground ${roleLabel} account`}
      />

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-3">
          <h2 className="text-sm font-semibold text-foreground mb-1">Frequently asked questions</h2>
          <Card>
            <DisclosureList
              name="help-centre-faqs"
              defaultOpenIndex={0}
              items={faqs.map((faq) => ({
                id: faq.question,
                summary: faq.question,
                content: faq.answer,
              }))}
            />
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="p-4">
            <h3 className="text-sm font-semibold text-foreground mb-3">Contact support</h3>
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
              Message support
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </Card>
        </div>
      </div>
    </>
  );
};
