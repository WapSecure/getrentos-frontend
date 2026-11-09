'use client';

import { useState } from 'react';
import { ChevronDown, Mail, Phone, Clock, ScrollText } from '@sureground/icons';
import { Card, PageHeader } from '@sureground/ui';
import { OPS_CONTACT, telLink } from '@/lib/opsContact';

interface FAQItem {
  question: string;
  answer: string;
}

const faqs: FAQItem[] = [
  {
    question: 'How do I escalate a case above my permission level?',
    answer:
      'Open the case and use "Escalate": it routes to the next role up in the staff hierarchy (see Access & Roles for the reporting chain) and logs the handoff in the audit trail.',
  },
  {
    question: 'A verification or dispute needs a second opinion: what do I do?',
    answer:
      'Leave a note on the case for context, then reassign or escalate it. Every action you take is attributed to your staff account in the audit log, so handoffs stay traceable.',
  },
  {
    question: 'How do I request a new staff role or permission change?',
    answer:
      'Staff role changes go through Access & Roles and require approval from a Super Admin or your direct supervisor: self-service role changes are intentionally not permitted.',
  },
  {
    question: 'Where can I see my own recent actions?',
    answer:
      'Audit Logs is filterable by actor, so you can review everything attributed to your account: useful for confirming a change went through as expected.',
  },
];

interface HelpCenterContentProps {
  messagesHref?: string;
}

export const HelpCenterContent = ({ messagesHref = '/admin/messages' }: HelpCenterContentProps) => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <>
      <PageHeader
        title="Staff Help Center"
        description="Operating guidance and escalation paths for Sureground backoffice staff"
      />

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-3">
          <h2 className="text-sm font-semibold text-foreground mb-1">Frequently Asked Questions</h2>
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <Card key={faq.question} static>
                <button
                  type="button"
                  aria-expanded={isOpen}
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  className="w-full flex items-center justify-between gap-3 p-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
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
          <Card static className="p-4">
            <h3 className="text-sm font-semibold text-foreground mb-3">Internal Escalation</h3>
            <div className="space-y-3">
              <a
                href={`mailto:${OPS_CONTACT.email}`}
                className="flex items-start gap-2.5 text-sm hover:text-primary transition-colors"
              >
                <Mail className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                <span>
                  <span className="block text-foreground font-medium">Platform Ops</span>
                  <span className="text-muted-foreground">{OPS_CONTACT.email}</span>
                </span>
              </a>
              {OPS_CONTACT.phone && (
                <a
                  href={telLink(OPS_CONTACT.phone)}
                  className="flex items-start gap-2.5 text-sm hover:text-primary transition-colors"
                >
                  <Phone className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                  <span>
                    <span className="block text-foreground font-medium">On-call escalation</span>
                    <span className="text-muted-foreground">{OPS_CONTACT.phone}</span>
                  </span>
                </a>
              )}
              {OPS_CONTACT.phone && OPS_CONTACT.hours && (
                <div className="flex items-start gap-2.5 text-sm">
                  <Clock className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                  <span>
                    <span className="block text-foreground font-medium">Coverage</span>
                    <span className="text-muted-foreground">{OPS_CONTACT.hours}</span>
                  </span>
                </div>
              )}
              <a
                href={messagesHref}
                className="flex items-start gap-2.5 text-sm hover:text-primary transition-colors"
              >
                <ScrollText className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                <span>
                  <span className="block text-foreground font-medium">Ops channel</span>
                  <span className="text-muted-foreground">Internal messages</span>
                </span>
              </a>
            </div>
          </Card>
        </div>
      </div>
    </>
  );
};
