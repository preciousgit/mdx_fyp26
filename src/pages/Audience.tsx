import React from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Container, StatusTag } from '../components/brand';
import { CAPABILITIES, type Capability } from '../content';

interface AudiencePage {
  title: string;
  lead: string;
  problems: string[];
  uses: { slug: Capability['slug']; benefit: string }[];
  howItWorks: string[];
  cta: { label: string; to: string };
  note?: string;
}

const PAGES: Record<string, AudiencePage> = {
  manufacturers: {
    title: 'For manufacturers and importers',
    lead: 'Meet NAFDAC’s traceability rules with the codes you already print, and get what the rules don’t ask for: proof your batches stayed safe, recalls that finish, and evidence against the people copying you.',
    problems: [
      'From 1 January 2028, antimalarials, antibiotics and maternal and child health products need GS1 serialisation and event reporting to keep their marketing authorisation.',
      'A genuine pack that sat in a hot warehouse can fail, and your brand takes the blame.',
      'A recall today means public alerts and phone calls, with no way to know how much stock came back.',
    ],
    uses: [
      { slug: 'integrity', benefit: 'Hear about heat and handling problems on your batches before patients or the regulator do.' },
      { slug: 'recall', benefit: 'See every outlet holding a batch in minutes, alert them all, and count what comes back.' },
      { slug: 'cases', benefit: 'Turn reports of copied codes into evidence investigators can act on.' },
      { slug: 'outlets', benefit: 'Sell through outlets whose stock is traceable, and reward them for it.' },
    ],
    howItWorks: [
      'Keep the GS1 DataMatrix codes from your current provider, or we connect you to an accredited one.',
      'Register each batch and your sites’ Global Location Numbers once.',
      'Distributors and outlets record each handoff with their phones; storage readings come from logs or sensors.',
      'Your dashboard shows each batch’s journey and Integrity Score. Reporting to NAFDAC’s traceability system is being built with pilot partners.',
    ],
    cta: { label: 'Apply for the 2027 pilot', to: '/contact?topic=pilot' },
  },
  regulators: {
    title: 'For regulators',
    lead: 'Put inspectors where the risk is, see every recall through to the last shelf, and receive case files on the suppliers behind fakes, not just the stock.',
    problems: [
      'In 2023, 3,486 NAFDAC investigations led to 4 court cases. Raids seize stock, but suppliers are rarely charged.',
      'Recall notices go out as public alerts, and nobody can say how much stock was recovered.',
      'Estimates of how many medicines are bad range from 11% to over 70%, so it is hard to know where to focus.',
    ],
    uses: [
      { slug: 'integrity', benefit: 'A ranked list of batches and areas most likely to fail testing, for risk-based inspection.' },
      { slug: 'recall', benefit: 'Live recall progress: outlets notified, units returned, outlets still holding stock.' },
      { slug: 'cases', benefit: 'Case files linking copied-code clusters to supply routes, with a chain of custody that can’t be quietly changed.' },
      { slug: 'outlets', benefit: 'A register of outlets that receive only traceable stock, and alerts when one slips.' },
    ],
    howItWorks: [
      'Regulator accounts are created by invitation only, after we verify the officer and office.',
      'Read-only oversight of every company’s records, with each view and decision logged.',
      'Recalls above a set size need sign-off from two officers.',
      'Every record is anchored to a public blockchain, so anyone can prove it hasn’t been changed.',
    ],
    cta: { label: 'Request regulator access', to: '/contact?topic=regulator' },
    note: 'TrustChain feeds NAFDAC’s own systems, such as the Traceability Information System and the Greenbook. It doesn’t replace them.',
  },
  outlets: {
    title: 'For pharmacies, medicine stores and agro-dealers',
    lead: 'Show customers that what you sell is genuine and safe. A Verified Outlet badge, which customers check from any phone, proves your stock comes from traceable suppliers.',
    problems: [
      'Customers can’t tell a careful pharmacy from a shop buying from open markets.',
      'When a batch is recalled, you often hear last, and you carry the loss.',
      'Farmers rely on buying from a “trusted dealer”, but have no way to check that trust.',
    ],
    uses: [
      { slug: 'outlets', benefit: 'Earn and display the badge. Customers check your shop by its code, by voice or USSD, in five languages.' },
      { slug: 'recall', benefit: 'Hear about recalls that affect your shelves first, with a simple way to return stock and record it.' },
      { slug: 'integrity', benefit: 'Know if a batch you received was stored badly before you sell it.' },
    ],
    howItWorks: [
      'Register your outlet and licence.',
      'Scan stock in when it arrives from your supplier, using any smartphone.',
      'Pass occasional spot checks and test buys.',
      'Keep your badge as long as your stock stays traceable.',
    ],
    cta: { label: 'Join the Verified Outlet waitlist', to: '/contact?topic=outlet' },
    note: 'Verified Outlets is in development. We’re enrolling about 50 outlets in Enugu for the 2027 pilot.',
  },
};

export default function Audience() {
  const { who = '' } = useParams();
  const page = PAGES[who];
  if (!page) return <Navigate to="/" replace />;
  const caps = page.uses.map(u => ({ ...u, cap: CAPABILITIES.find(c => c.slug === u.slug)! }));

  return (
    <div className="flex min-h-screen flex-col bg-paper text-ink">
      <Navbar />
      <main className="flex-1">
        <section className="border-b border-line">
          <Container className="py-14 lg:py-20">
            <h1 className="display max-w-[18ch] text-[2.6rem] sm:text-[3.4rem]">{page.title}</h1>
            <p className="mt-5 max-w-[60ch] text-[1.15rem] leading-relaxed text-muted">{page.lead}</p>
            <Link to={page.cta.to} className="mt-8 inline-block rounded-lg bg-ledger-700 px-5 py-3 font-semibold text-white hover:bg-ledger-800">
              {page.cta.label}
            </Link>
          </Container>
        </section>

        <section className="py-16 lg:py-20">
          <Container className="grid grid-cols-[minmax(0,1fr)] gap-12 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
            <div>
              <h2 className="display-md text-[1.8rem]">The problem today</h2>
              <ul className="mt-6 space-y-4">
                {page.problems.map(p => (
                  <li key={p} className="flex gap-3 leading-relaxed">
                    <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-caution" aria-hidden="true" />
                    {p}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h2 className="display-md text-[1.8rem]">What TrustChain gives you</h2>
              <ul className="mt-6 divide-y divide-line border-y border-line">
                {caps.map(({ cap, benefit }) => (
                  <li key={cap.slug} className="py-5">
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="font-semibold">{cap.name}</h3>
                      <StatusTag status={cap.status} />
                    </div>
                    <p className="mt-1.5 leading-relaxed text-muted">{benefit}</p>
                  </li>
                ))}
              </ul>
            </div>
          </Container>
        </section>

        <section className="border-t border-line bg-mist py-16 lg:py-20">
          <Container>
            <h2 className="display-md text-[1.8rem]">How it works</h2>
            <ol className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {page.howItWorks.map((s, i) => (
                <li key={s} className="leading-relaxed">
                  <span className="tnum flex h-8 w-8 items-center justify-center rounded-full bg-ledger-700 text-sm font-semibold text-white" aria-hidden="true">{i + 1}</span>
                  <p className="mt-4">{s}</p>
                </li>
              ))}
            </ol>
            {page.note && <p className="mt-10 max-w-[70ch] border-l-2 border-ledger-500 pl-4 text-muted">{page.note}</p>}
          </Container>
        </section>

        <section className="py-16">
          <Container className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[1.05rem] text-muted">See how we’ll prove each of these in public during the 2027 pilot.</p>
            <div className="flex flex-wrap gap-3">
              <a href="/#proof" className="rounded-lg border border-line px-5 py-3 font-semibold hover:border-faint">The proof plan</a>
              <Link to={page.cta.to} className="rounded-lg bg-ledger-700 px-5 py-3 font-semibold text-white hover:bg-ledger-800">{page.cta.label}</Link>
            </div>
          </Container>
        </section>
      </main>
      <Footer />
    </div>
  );
}
