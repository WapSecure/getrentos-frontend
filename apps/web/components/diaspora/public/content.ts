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
import { DIASPORA_ROUTES } from '@/lib/constants/diasporaRoutes';
import { LAND_PROTECTION } from '@/lib/paymentCopy';

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
  /** A page that answers it in full, linked under the answer. */
  link?: { label: string; href: string };
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
    question: 'Who is responsible for what?',
    answer:
      'The transparency centre sets out Sureground’s role, who else is involved in a purchase, fees, refunds, complaints, the limits of each check and what is not yet decided.',
    link: { label: 'Read the transparency centre', href: DIASPORA_ROUTES.TRANSPARENCY },
  },
  {
    question: 'Will Sureground tell me what to buy?',
    answer:
      'No. Sureground does not give investment advice or promise returns. It shows you what has been checked, by whom and when, so you can decide with your own advisers.',
  },
];

// Transparency centre (DIA-02). Draft copy for legal review. Each line restates what the product
// does today, with its source in the code or a recorded decision (docs/diaspora/README.md §9);
// anything not yet decided is listed as such rather than filled in.

export interface TransparencySection {
  id: string;
  title: string;
  description?: string;
}

export const ROLE_POINTS: string[] = [
  TRANSPARENCY[0].body,
  'Sureground is a property services platform. It does not recommend what to buy and does not promise returns, rent, resale prices or capital growth.',
  'Sureground is not a bank, and Payment Protection is not insurance.',
];

/** Who else is involved in a purchase, and what each is responsible for. */
export const THIRD_PARTIES: TransparencyItem[] = [
  {
    title: 'The seller',
    body: 'Owns the property and is responsible for what they say about it and for delivering each step of the sale. Their identity is checked, and their ownership proof approved by a Sureground reviewer, before the listing is published.',
  },
  {
    title: 'The seller’s lawyer',
    body: 'Acts for the seller, not for you. For a house or flat, the balance of the price is paid under your sale contract, outside Sureground. We recommend you instruct your own lawyer.',
  },
  {
    title: 'Accredited professionals',
    body: 'Lawyers, surveyors, valuers and inspectors carry out checks within their stated scope and are responsible for their own work. Each check shows who carried it out, what they were asked to check and when.',
  },
  {
    title: 'Payment providers',
    body: 'Paystack and Monnify process card and bank payments. Payment Protection holds your money with them instead of passing it straight to the seller.',
  },
  {
    title: 'Identity checks',
    body: 'Passports are checked with Smile ID, an identity verification provider, using a live selfie. If the automated check cannot confirm you, our team reviews your documents.',
  },
];

export const FEE_POINTS: string[] = [
  'There is no separate charge for Payment Protection. When you pay by card or bank transfer, the card or bank fee is added and shown before you pay, so the seller receives the full amount.',
  'Sureground’s own fee for checking and coordinating a home purchase has not been set yet. Any Sureground fee on a purchase is set out before you pay.',
  'Sureground Managed charges a percentage of the rent it collects, with a commission when it finds a new tenant or renews a lease, from one published fee card. You see the fee card in your account, and the fee is written into the management agreement before you sign.',
  'Fees charged by professionals you instruct, and government charges such as stamp duty and consent fees, are listed separately.',
  'No referral fees between Sureground and sellers or professionals are set up for Diaspora Invest. If that changes, you will be told before you commit.',
];

export const MONEY_POINTS: string[] = [
  'For a house or flat, Sureground never holds the purchase price. Payment Protection covers the deposit only; the rest of the price is paid outside Sureground under your sale contract. Sureground records each step and your approvals.',
  `For land: ${LAND_PROTECTION}`,
  'Raising a dispute keeps the money held until it is decided.',
  'Prices and payments are in naira. The rate you get when sending money from abroad is set by your bank or transfer provider.',
  'Payouts go to Nigerian bank accounts only for now. You can add an account abroad in your verified name, but payouts to it wait until Sureground works with a licensed partner to send money abroad. Until then you can choose to have them paid to your Nigerian account.',
];

export const REFUND_POINTS: string[] = [
  'Before you pay the deposit, you can cancel and nothing is taken.',
  'While the deposit is held and the seller has not started handing over the property, you can cancel and the deposit is refunded.',
  'Once the seller has started handing over the property, the deposit can only be refunded through a dispute, which Sureground decides.',
  'For land bought from a developer, a refund goes back to the card or account each payment came from. Money already paid to the developer for a completed step cannot be returned automatically; our finance team handles that part.',
  'Refunds of ₦5 million or more need a second member of our team to approve them.',
  'The rest of a home’s price is paid outside Sureground, so any refund of it is a matter for your sale contract.',
];

export const CONFLICT_POINTS: string[] = [
  TRANSPARENCY[2].body,
  'A seller cannot verify their own title, and the member of our team who asks for a payment cannot approve its release.',
  'Professionals are named on each check, so you can see who checked your property and ask your own lawyer to review their work.',
];

export const UNDECIDED_POINTS: string[] = [
  'Sureground’s fee card for checking and coordinating home purchases.',
  'The licensed partner for payouts to accounts abroad and payments in other currencies.',
  'An independent holder for home purchase payments beyond the deposit.',
  'Rules for buyers who are not Nigerian citizens. Diaspora Invest is open to Nigerians abroad first.',
  'The wording on this page, which is being reviewed by our lawyers.',
];

export const TRANSPARENCY_SECTIONS = {
  role: { id: 'role', title: 'Sureground’s role' },
  parties: {
    id: 'who-is-responsible',
    title: 'Who is responsible for what',
    description: 'The other people and companies involved in a purchase.',
  },
  fees: { id: 'fees', title: 'Fees and referral arrangements' },
  checks: {
    id: 'checks',
    title: 'What a check covers, and its limits',
    description:
      'A check is evidence about a property on a date. Every summary carries these limits.',
  },
  money: { id: 'money', title: 'Your money' },
  refunds: {
    id: 'refunds',
    title: 'Refunds',
    description: 'How a deposit or payment comes back to you.',
  },
  complaints: { id: 'complaints', title: 'Complaints and disputes' },
  privacy: { id: 'privacy', title: 'Your information' },
  conflicts: { id: 'conflicts', title: 'Conflicts of interest' },
  undecided: {
    id: 'not-yet-decided',
    title: 'Not yet decided',
    description: 'Where something is still open, we say so rather than fill the gap.',
  },
} satisfies Record<string, TransparencySection>;
