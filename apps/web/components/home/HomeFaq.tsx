import { FaqList, type Faq } from '@/components/marketing/FaqList';
import { RENT_RELEASE_RULE } from '@sureground/shared';

const QUESTIONS: Faq[] = [
  {
    q: 'Do I need an account to search?',
    a: 'No. Anyone can search and open listings. You need an account to book a viewing, make an offer, apply or pay.',
  },
  {
    q: 'What does a verified listing mean?',
    a: "Our team has reviewed the ownership or title documents the lister provided. When you buy, it does not replace your own lawyer's search at the land registry.",
  },
  {
    q: 'How does Sureground Payment Protection work?',
    a: `You pay Sureground, not the other party. ${RENT_RELEASE_RULE}. A sale deposit is released only after the handover is done and the buyer confirms, and a short-stay host is paid after check-in. If you raise a dispute, the money stays held while it is resolved.`,
  },
  {
    q: 'What is a C of O?',
    a: "A Certificate of Occupancy is a state government's grant of the right to occupy a piece of land, usually for 99 years. It is one of several title documents you may see; others include a Governor's Consent and a registered deed of assignment.",
  },
  {
    q: 'What are caution fees and service charges?',
    a: 'A caution fee is a refundable deposit held against damage. A service charge pays for shared costs such as security, power and cleaning in an estate or building. Agree every charge in writing before you pay.',
  },
];

export const HomeFaq = () => <FaqList items={QUESTIONS} name="home-faq" />;
