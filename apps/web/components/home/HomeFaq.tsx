import { Disclosure } from '@sureground/ui/Disclosure';
import { Container } from '@/components/marketing/Container';
import { SectionIntro } from '@/components/marketing/SectionIntro';

const QUESTIONS = [
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
    a: 'You pay Sureground, not the other party. Rent is released to the landlord on schedule, a sale deposit only once the buyer confirms, and a short-stay host after check-in. If you raise a dispute, the money stays held while it is resolved.',
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

export const HomeFaq = () => (
  <section aria-labelledby="faq-title" className="py-20 md:py-28">
    <Container className="grid gap-10 md:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)] md:gap-16">
      <SectionIntro
        id="faq-title"
        eyebrow="Questions"
        title="Before you start"
        layout="stacked"
        className="mb-0"
      />
      <div className="border-t border-border">
        {QUESTIONS.map(({ q, a }) => (
          <Disclosure
            key={q}
            name="home-faq"
            summary={<span className="font-display text-xl font-normal">{q}</span>}
            className="border-b border-border"
          >
            <p className="max-w-[62ch] text-[0.9375rem]">{a}</p>
          </Disclosure>
        ))}
      </div>
    </Container>
  </section>
);
