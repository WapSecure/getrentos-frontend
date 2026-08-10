import type { UssdScreen } from '@/types/ussd';

export const USSD_CODE = '*737*57#';

export const ussdScreens: Record<string, UssdScreen> = {
  root: {
    text: 'Welcome to GetRentos\n1. Check Rent Balance\n2. Pay Rent\n3. Trust Score\n4. Report Maintenance\n5. Talk to Support',
    options: { '1': 'balance', '2': 'pay', '3': 'trust', '4': 'maintenance', '5': 'support' },
  },
  balance: {
    text: 'Next Payment: N228,000 (Flex Installment)\nDue: Sep 9, 2026\nProperty: Modern Downtown Loft',
  },
  pay: {
    text: 'Pay Rent\n1. Pay Flex Installment (N228,000)\n2. Pay Full Rent (N2,400,000)',
    options: { '1': 'pay_flex', '2': 'pay_full' },
  },
  pay_flex: {
    text: 'Payment of N228,000 initiated.\nEnter your card PIN when prompted to confirm.\n\nRef: PAY-88213',
  },
  pay_full: {
    text: 'Payment of N2,400,000 initiated.\nEnter your card PIN when prompted to confirm.\n\nRef: PAY-88214',
  },
  trust: {
    text: 'Trust Score: 78/100 (Excellent)\nVerified: Identity, Phone, Email\nUnverified: Credit Report, References\n\nText VERIFY to 20737 to add more',
  },
  maintenance: {
    text: 'Report Maintenance Issue\n1. Plumbing\n2. Electrical\n3. Other',
    options: { '1': 'maintenance_done', '2': 'maintenance_done', '3': 'maintenance_done' },
  },
  maintenance_done: {
    text: 'Issue logged.\nRef: MNT-2026-0847\nA vendor will contact you within 24hrs.',
  },
  support: {
    text: 'Talk to Support\nCall 0700-736867 (0700-RENTOS)\nor dial *737*57*5# for a callback',
  },
};
