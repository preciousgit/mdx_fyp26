import type { BuildStatus } from './components/brand';

/* Shared copy for the homepage and audience pages, so claims stay consistent.
   Every status here must stay true: update it when a capability ships. */

export interface Capability {
  slug: 'integrity' | 'recall' | 'cases' | 'outlets';
  question: string;
  name: string;
  what: string;
  evidence: string;
  source: { label: string; href: string };
  status: BuildStatus;
}

export const CAPABILITIES: Capability[] = [
  {
    slug: 'integrity',
    question: 'Is it still safe?',
    name: 'Integrity Score',
    what: 'A score for every batch from how it was stored and moved, how long it has sat, local heat, and lab results. Risky batches are flagged for testing before they reach patients.',
    evidence: 'In Enugu, 8.1% of antimalarials were badly made or heat-damaged. Only 1.2% were fakes.',
    source: { label: 'Kaur et al., PLOS ONE 2015', href: 'https://lshtm.ac.uk/node/51661' },
    status: 'Working prototype',
  },
  {
    slug: 'recall',
    question: 'Where is the bad stock?',
    name: 'Recall Command',
    what: 'One action lists every outlet that received a batch, alerts each one and every shopper who checked a pack from it, and counts returns against what was shipped.',
    evidence: 'Recalls still go out as public alerts. Open-market stock is "difficult" to recall, and recovery is rarely reported.',
    source: { label: 'Guardian, 2022', href: 'https://guardian.ng/features/health/acpn-seeks-compensation-on-recalled-substandard-drugs/' },
    status: 'Working prototype',
  },
  {
    slug: 'cases',
    question: 'Who supplied it?',
    name: 'Case Builder',
    what: 'Links copied-code checks back to the route the fakes came through, and keeps a tamper-proof chain of custody for seized goods, so investigators get a case file prosecutors can use.',
    evidence: 'In 2023, 3,486 NAFDAC investigations led to 4 court cases.',
    source: { label: 'BusinessDay, Aug 2026', href: 'https://businessday.ng/analysis/article/nigerias-fake-drug-markets-thrive-despite-n1-1trn-seizures/' },
    status: 'In development',
  },
  {
    slug: 'outlets',
    question: 'Which shop can I trust?',
    name: 'Verified Outlets',
    what: 'Pharmacies, medicine stores and agro-dealers earn a badge by buying only from traceable suppliers and passing spot checks. Shoppers check the shop by voice or USSD in Hausa, Yoruba, Igbo, Pidgin or English.',
    evidence: 'About 25,000 registered pharmacies and medicine stores, against an estimated 2 million unlicensed outlets.',
    source: { label: 'Moniepoint, citing PSN', href: 'https://casestudies.moniepoint.com/documents/Inside-Nigerias-community-Pharmacies_by-Moniepoint.pdf' },
    status: 'In development',
  },
];

export interface ProofMetric {
  capability: string;
  measure: string;
  baseline: string;
  target: string;
  checker: string;
}

export const PROOF: ProofMetric[] = [
  { capability: 'Integrity Score', measure: 'Lab-failed samples we flagged in advance', baseline: 'No such score exists today', target: 'At least 70%', checker: 'An independent lab, testing samples blind' },
  { capability: 'Recall Command', measure: 'Time to list every outlet holding a batch', baseline: '7 to 10 days for a manual trace (US FDA estimate)', target: 'Under 1 hour', checker: 'The manufacturer, in a mock recall' },
  { capability: 'Recall Command', measure: 'Recalled units back within 14 days', baseline: 'Rarely measured or published', target: 'At least 80%', checker: 'Counted in the manufacturer’s warehouse' },
  { capability: 'Case Builder', measure: 'Case files accepted by investigators', baseline: '4 court cases from 3,486 investigations (2023)', target: 'At least 5 in the pilot', checker: 'Written acknowledgement from the agency' },
  { capability: 'Verified Outlets', measure: 'Test-buy failure rate, verified vs other outlets', baseline: '9.3% of antimalarials failed in Enugu (2015)', target: 'Clearly lower at verified outlets', checker: 'Mystery shoppers and an independent lab' },
];
