import {
  CHECKED,
  FAQS,
  JOURNEY,
  LIMITS,
  PROTECTION_DOES,
  PROTECTION_DOES_NOT,
  RISKS,
} from '@/components/diaspora/public/content';

// Guides are assembled only from copy already reviewed for the Diaspora Invest page
// (components/diaspora/public/content.ts), so the hub makes no claim the product does not
// already make. New guides need the same review before they are added here.

export interface GuideSection {
  title: string;
  intro?: string;
  points: string[];
}

export interface Guide {
  slug: string;
  eyebrow: string;
  title: string;
  summary: string;
  sections: GuideSection[];
  faqs: { question: string; answer: string }[];
  /** Shown only while the service it describes is available. */
  requiresDiaspora?: boolean;
}

const faq = (question: string) => {
  const found = FAQS.find((item) => item.question === question);
  if (!found) throw new Error(`Missing FAQ: ${question}`);
  return found;
};

export const GUIDES: Guide[] = [
  {
    slug: 'payment-protection',
    eyebrow: 'Your money',
    title: 'How Sureground Payment Protection works',
    summary:
      'What happens to a deposit or land payment you make through Sureground, when it is released, and what it does not cover.',
    sections: [
      { title: 'What it does', points: PROTECTION_DOES },
      { title: 'What it does not do', points: PROTECTION_DOES_NOT },
    ],
    faqs: [faq('What does it cost?'), faq('Can I pay in pounds, dollars or euros?')],
  },
  {
    slug: 'property-checks',
    eyebrow: 'Checks',
    title: 'What a property check covers, and its limits',
    summary:
      'A check is evidence about a property on a date. Here is what Sureground checks and what a check cannot tell you.',
    sections: [
      { title: 'What we check', points: CHECKED },
      { title: 'What a check cannot do', points: LIMITS },
    ],
    faqs: [faq('Who checks the title?'), faq('Will Sureground tell me what to buy?')],
  },
  {
    slug: 'buying-from-abroad',
    eyebrow: 'Diaspora',
    title: 'Buying property in Nigeria from abroad',
    summary:
      'The four stages of a purchase made from outside Nigeria, and the risks to weigh before you start.',
    sections: [
      ...JOURNEY.map((step, index) => ({
        title: `${index + 1}. ${step.title}`,
        intro: step.body,
        points: step.points,
      })),
      {
        title: 'Risks to weigh before you buy',
        intro: 'Property in Nigeria can be a sound long-term holding, but it carries real risks.',
        points: RISKS,
      },
    ],
    faqs: [
      faq('Do I need to be in Nigeria?'),
      faq('Can a relative or my lawyer help?'),
      faq('Can I invest if I am not Nigerian?'),
    ],
    requiresDiaspora: true,
  },
];

export const findGuide = (slug: string) => GUIDES.find((guide) => guide.slug === slug);
