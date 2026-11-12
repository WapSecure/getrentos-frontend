export interface PlainFaq {
  q: string;
  a: string;
}

/** FAQPage structured data. Only for answers shown on the page, word for word. */
export const faqJsonLd = (items: PlainFaq[]) => ({
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: items.map(({ q, a }) => ({
    '@type': 'Question',
    name: q,
    acceptedAnswer: { '@type': 'Answer', text: a },
  })),
});
