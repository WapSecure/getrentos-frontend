import {
  BadgeCheck,
  FileSearch,
  KeyRound,
  LayoutDashboard,
  Lock,
  ShieldCheck,
  UserCheck,
  Users,
  Video,
  type SgIcon,
} from '@sureground/icons';

// Public copy for Sureground Diaspora Invest. Every claim here describes something the product does
// today (docs/diaspora/README.md §2); anything still being built is said to be so. No figures, no
// promises of returns, title or price, and "Payment Protection", never "escrow".

export interface IconCopy {
  icon: SgIcon;
  title: string;
  body: string;
}

export const OFFERINGS: IconCopy[] = [
  {
    icon: FileSearch,
    title: 'Verified Acquisition',
    body: 'Find a property, have it checked and buy it with your payments protected. Land purchases already run this way, with accredited lawyers and surveyors, staged payments and representatives you appoint. For houses and flats the ownership proof is reviewed and the deposit is protected; independent legal checks for homes are being added.',
  },
  {
    icon: KeyRound,
    title: 'Sureground Managed',
    body: 'Hand over a property you own: tenants, rent collection, maintenance within limits you set, inspections and a monthly statement of what came in and what went out.',
  },
  {
    icon: LayoutDashboard,
    title: 'Your investor workspace',
    body: 'One place for your offers, protected payments, land purchases, managed properties, approvals and statements, with your own time shown next to Lagos time.',
  },
];

export const QUESTIONS: IconCopy[] = [
  {
    icon: BadgeCheck,
    title: 'Is this property genuine?',
    body: 'Before a listing is published, the owner’s identity is checked and a Sureground reviewer must approve their ownership proof. Land goes further: accredited surveyors and lawyers check title, boundaries and encumbrances, and the review shows who checked what, when, and what is still open.',
  },
  {
    icon: Lock,
    title: 'Is my money protected?',
    body: 'Sureground Payment Protection holds the deposit on a house or flat until you confirm, and holds land payments against named conveyance stages, releasing each share only when that stage is evidenced. Raising a dispute keeps the money held.',
  },
  {
    icon: Users,
    title: 'Who is accountable?',
    body: 'Each land check names the accredited professional who carried it out and what they were asked to check. You can appoint representatives, such as a relative or your own lawyer, and require a second person’s approval before land payments are released.',
  },
  {
    icon: KeyRound,
    title: 'What happens after purchase?',
    body: 'Sureground Managed looks after tenants, rent, maintenance and inspections. Spending above the limit you set waits for your approval, and you receive a monthly statement of rent, fees and expenses.',
  },
  {
    icon: Video,
    title: 'Can I see what is happening?',
    body: 'Book a video viewing of a home, or a site tour of land arranged in your time zone. Your workspace brings purchases and managed property together, with times shown in your time zone next to Lagos time.',
  },
];

export interface JourneyStep extends IconCopy {
  points: string[];
}

/** Four stages, from sign-up to looking after the property. */
export const JOURNEY: JourneyStep[] = [
  {
    icon: UserCheck,
    title: 'Verify',
    body: 'Create your account, verify your identity and tell us your plans.',
    points: [
      'Nigerian identity numbers are checked online; passports are reviewed by our team',
      'Set your time zone and accept the risk statement',
    ],
  },
  {
    icon: Video,
    title: 'Tour and inspect',
    body: 'See the property without travelling, and have it checked.',
    points: [
      'Video tours at a time shown in your own time zone',
      'Independent inspections with geotagged, timestamped photos',
    ],
  },
  {
    icon: ShieldCheck,
    title: 'Buy with protection',
    body: 'Agree terms and pay through Sureground Payment Protection.',
    points: [
      'A home’s deposit is released when you confirm',
      'Land payments are released stage by stage, on evidence',
    ],
  },
  {
    icon: KeyRound,
    title: 'Manage',
    body: 'Hand the property to Sureground Managed, if you wish.',
    points: [
      'Spending above your limit waits for your approval',
      'A monthly statement of rent, fees and expenses',
    ],
  },
];

export const CHECKED: string[] = [
  'Identity of sellers and owners, before they can list or be paid.',
  'Ownership proof for every listed property, approved by a Sureground reviewer before publication.',
  'For land: title, survey and boundary, encumbrances and the seller’s authority to sell, by accredited professionals, with the date and scope of each check.',
  'For land and managed property: inspections recorded with the place and time they were captured.',
];

export const LIMITS: string[] = [
  'A document upload never proves title. A check records what was reviewed on a date; it is not a guarantee of title, value or condition.',
  'Houses and flats do not yet have the independent legal review that land has. We recommend instructing your own lawyer for a home purchase.',
  'Checks rely on government and registry records, which can be slow or incomplete.',
  'Checks go out of date. Look at the date on each one, and ask for a fresh check before you pay if it is old.',
];

export const PROTECTION_DOES: string[] = [
  'Holds your money with our payment providers, Paystack and Monnify, instead of passing it straight to the seller.',
  'Releases a house or flat deposit when you confirm, and each land stage when it is evidenced.',
  'Keeps money held while a dispute is reviewed.',
  'Records every payment and release so you can see where your money is.',
];

export const PROTECTION_DOES_NOT: string[] = [
  'It is not insurance and not a bank deposit.',
  'It does not guarantee title, value, rent or that a purchase completes.',
  'For houses and flats only the deposit is protected today; the balance is paid under your sale contract.',
  'Payments are in naira. The rate you get when sending money from abroad is set by your bank or transfer provider.',
];

export const RISKS: string[] = [
  'Property values can fall as well as rise, and rent can be lower than expected or stop while a property is empty.',
  'Exchange rates move. What a naira amount costs you in your own currency will change over time.',
  'Consent and registration with the state can take months and can be refused.',
  'Property can be slow to sell, so plan for money to be tied up for years.',
  'Laws, taxes and charges in Nigeria and where you live can change. Take your own legal and tax advice.',
  'If you are not a Nigerian citizen, extra legal rules on owning land may apply. Take legal advice before you start.',
];

export interface TransparencyItem {
  title: string;
  body: string;
}

export const TRANSPARENCY: TransparencyItem[] = [
  {
    title: 'Sureground’s role',
    body: 'Sureground runs the platform, checks people and documents, coordinates the professionals on a purchase and holds protected payments through its payment providers. It is not your lawyer, estate agent or financial adviser, and it does not give investment advice.',
  },
  {
    title: 'Third parties',
    body: 'Accredited lawyers, surveyors, valuers and inspectors carry out checks within their stated scope and are responsible for their own work. Payments are processed by Paystack and Monnify.',
  },
  {
    title: 'Conflicts of interest',
    body: 'If Sureground, or a professional on your case, receives a referral fee or has any other interest in a transaction, you will be told before you commit.',
  },
  {
    title: 'Complaints',
    body: 'Raise a complaint from your account or by email to support@getsureground.io. A dispute on a protected payment keeps the money held while it is reviewed.',
  },
  {
    title: 'Your information',
    body: 'Your investor profile is used to tailor your workspace and the checks you need, and is handled as described in our Privacy policy.',
  },
];

export interface Faq {
  question: string;
  answer: string;
}

export const FAQS: Faq[] = [
  {
    question: 'Do I need to be in Nigeria?',
    answer:
      'No. You can view homes by video, have land toured for you, appoint representatives for land and keep every document in your workspace. Some steps, such as signing a deed, may need you or someone holding your power of attorney to attend in person.',
  },
  {
    question: 'Can I pay in pounds, dollars or euros?',
    answer:
      'Prices and payments are in naira. You can pay with a card or account that pays in naira; the rate you get when converting is set by your bank or transfer provider. Showing an approximate amount in your own currency is planned.',
  },
  {
    question: 'Who checks the title?',
    answer:
      'For land, accredited lawyers and surveyors check title, boundaries and encumbrances, and their names and scope are on the review. For houses and flats, a Sureground reviewer approves the owner’s ownership proof; we recommend you also instruct your own lawyer.',
  },
  {
    question: 'Can a relative or my lawyer help?',
    answer:
      'Yes, for land purchases. You can appoint up to five representatives who can view the purchase, attend inspections or co-approve payments. The same controls for houses and flats are being built.',
  },
  {
    question: 'What does it cost?',
    answer:
      'Every fee is shown in full before you commit, including what Sureground Managed charges, which is set out in the management agreement before you sign. Fees charged by a professional or the government are listed separately.',
  },
  {
    question: 'Which time zone are times shown in?',
    answer:
      'Your workspace shows your own time next to Lagos time. Payment and contract deadlines are Lagos dates, because that is where they are enforced.',
  },
  {
    question: 'Can I invest if I am not Nigerian?',
    answer:
      'Not easily yet. Most foreign identity documents need a manual review, and extra legal rules can apply to non-citizens owning land. Please contact us and take legal advice before you start.',
  },
  {
    question: 'Will Sureground tell me what to buy?',
    answer:
      'No. Sureground does not give investment advice or promise returns. It shows you what has been checked, by whom and when, so you can decide with your own advisers.',
  },
];
