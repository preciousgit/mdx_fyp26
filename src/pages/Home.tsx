import React from 'react';
import { Link } from 'react-router-dom';
import { Globe2, Camera, MessageCircle, Phone, ExternalLink, ArrowUpRight } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import VerifyDemo from '../components/VerifyDemo';
import { Container, StatusTag, type BuildStatus } from '../components/brand';
import { CAPABILITIES, PROOF } from '../content';

/* Enugu antimalarial study, Kaur et al. PLOS ONE 2015: n = 3,024 samples. */
const ENUGU = [
  { key: 'substandard', label: 'Badly made', share: 6.8, codeCatches: false },
  { key: 'degraded', label: 'Damaged by heat or humidity', share: 1.3, codeCatches: false },
  { key: 'falsified', label: 'Fake', share: 1.2, codeCatches: true },
];

const journey = [
  { who: 'Manufacturer', what: 'Registers each batch. Any GS1 code already on the pack works.' },
  { who: 'Distributor', what: 'Records each handoff, with temperature and condition, before the batch can move on.' },
  { who: 'Pharmacy or shop', what: 'Scans stock in from known suppliers, which keeps its Verified Outlet status.' },
  { who: 'You', what: 'Check the pack, and the shop, before you buy.' },
];

const audiences = [
  { to: '/for/manufacturers', who: 'Manufacturers and importers', what: 'Meet NAFDAC traceability rules, prove your batches are safe, and run recalls that finish.' },
  { to: '/for/regulators', who: 'Regulators', what: 'Inspect where the risk is, see recalls through to the last shelf, and get case files that hold up.' },
  { to: '/for/outlets', who: 'Pharmacies, stores and agro-dealers', what: 'Earn a Verified Outlet badge that customers can check before they buy.' },
  { to: '/verify', who: 'Shoppers and farmers', what: 'Check a product for free. No app or account needed.' },
];

const channels: { icon: typeof Globe2; name: string; text: string; status: BuildStatus }[] = [
  { icon: Globe2, name: 'Website', text: 'Type the code on this website, from any browser.', status: 'Available now' },
  { icon: Camera, name: 'Phone camera', text: 'Point the camera at the code on the pack.', status: 'In development' },
  { icon: MessageCircle, name: 'WhatsApp', text: 'Send the code in a chat and get the answer back.', status: 'In development' },
  { icon: Phone, name: 'Voice and USSD', text: 'Any phone, no data, in Hausa, Yoruba, Igbo, Pidgin or English.', status: 'Planned' },
];

const facts = [
  {
    figure: '₦22.7bn',
    text: 'of unsafe, falsified or unregistered products destroyed by NAFDAC between January and August 2026.',
    source: 'Tribune, Oct 2026',
    href: 'https://tribuneonlineng.com/nafdac-destroys-n22-73bn-in-unsafe-products-records-5542-enforcement-operations/',
  },
  {
    figure: '12,300',
    text: 'deaths a year in Nigeria could be avoided if poor-quality antimalarials were replaced with good ones.',
    source: 'Beargie et al., PLOS ONE, 2019',
    href: 'https://journals.plos.org/plosone/article?id=10.1371%2Fjournal.pone.0217910',
  },
  {
    figure: '4 of 3,486',
    text: 'NAFDAC investigations in 2023 that reached court. Raids seize stock; the suppliers behind it are rarely charged.',
    source: 'BusinessDay, Aug 2026',
    href: 'https://businessday.ng/analysis/article/nigerias-fake-drug-markets-thrive-despite-n1-1trn-seizures/',
  },
];

export default function Home() {
  const failed = ENUGU.reduce((s, r) => s + r.share, 0);

  return (
    <div className="min-h-screen bg-paper text-ink">
      <Navbar />

      <main>
        {/* Hero */}
        <section className="border-b border-line">
          <Container className="grid grid-cols-[minmax(0,1fr)] items-center gap-12 py-14 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:gap-16 lg:py-24">
            <div className="min-w-0">
              <h1 className="display text-[2.7rem] sm:text-[3.6rem] lg:text-[4.4rem] text-ink">
                Genuine isn’t the same as safe.
              </h1>
              <p className="mt-6 max-w-[34rem] text-[1.15rem] leading-relaxed text-muted">
                Most bad medicine in Nigeria carries a real label. TrustChain shows whether a product is still safe to use, gets bad batches
                off every shelf, and builds the evidence against the people who supply fakes. It works with the codes brands already print.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link to="/verify" className="rounded-lg bg-ledger-700 px-5 py-3 font-semibold text-white hover:bg-ledger-800">
                  Check a product
                </Link>
                <a href="#proof" className="rounded-lg border border-line px-5 py-3 font-semibold text-ink hover:border-faint">
                  See how we’ll prove it
                </a>
              </div>
              <p className="mt-6 text-sm text-muted">Free for shoppers. No app or account needed.</p>
            </div>

            <div className="min-w-0">
              <VerifyDemo />
              <p className="mt-3 text-center text-xs text-faint">Sample packs and results for demonstration. The manufacturer shown is fictional.</p>
            </div>
          </Container>
        </section>

        {/* The evidence behind the positioning */}
        <section className="py-20 lg:py-28">
          <Container className="grid grid-cols-[minmax(0,1fr)] gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:items-center">
            <div>
              <h2 className="display-md text-[2rem] sm:text-[2.6rem]">Most bad medicine has a real label</h2>
              <p className="mt-4 max-w-[52ch] text-[1.05rem] leading-relaxed text-muted">
                When 3,024 antimalarials were tested in Enugu, <span className="tnum">{failed.toFixed(1)}%</span> failed. Only{' '}
                <span className="tnum">1.2%</span> were fakes. The rest had genuine labels: they were badly made, or broke down in heat and humidity on the way
                to the shelf. A label check would have passed them. TrustChain is built to catch them.
              </p>
            </div>
            <figure className="rounded-xl border border-line p-6">
              <figcaption className="text-sm font-semibold">Antimalarials that failed testing, Enugu (share of all samples)</figcaption>
              <ul className="mt-6 space-y-5">
                {ENUGU.map(r => (
                  <li key={r.key}>
                    <div className="flex items-baseline justify-between gap-4 text-[0.95rem]">
                      <span>{r.label}</span>
                      <span className="tnum font-semibold">{r.share.toFixed(1)}%</span>
                    </div>
                    <div className="mt-2 h-3 w-full rounded-full bg-mist" aria-hidden="true">
                      <div
                        className={`h-3 rounded-full ${r.codeCatches ? 'bg-faint' : 'bg-caution'}`}
                        style={{ width: `${(r.share / 7) * 100}%` }}
                      />
                    </div>
                    <p className="mt-1.5 text-sm text-muted">{r.codeCatches ? 'A label or code check catches these' : 'Genuine label: a code check passes these'}</p>
                  </li>
                ))}
              </ul>
              <p className="mt-6 border-t border-line pt-4 text-sm text-muted">
                Source:{' '}
                <a href="https://lshtm.ac.uk/node/51661" target="_blank" rel="noreferrer" className="underline underline-offset-2 hover:text-ink">
                  Kaur et al., PLOS ONE, 2015
                </a>
                . 3,024 samples from 421 outlets.
              </p>
            </figure>
          </Container>
        </section>

        {/* Four capabilities */}
        <section id="how-it-works" className="scroll-mt-20 border-y border-line bg-mist py-20 lg:py-28">
          <Container>
            <h2 className="display-md max-w-[26ch] text-[2rem] sm:text-[2.6rem]">Four questions a label can’t answer</h2>
            <p className="mt-4 max-w-[60ch] text-[1.05rem] leading-relaxed text-muted">
              Others tell you whether a pack is real. TrustChain answers what happens next. Each answer comes with evidence anyone can check.
            </p>
            <div className="mt-12 grid gap-px overflow-hidden rounded-xl border border-line bg-line md:grid-cols-2">
              {CAPABILITIES.map(c => (
                <article key={c.slug} className="flex flex-col bg-paper p-6 sm:p-8">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-ledger-700">{c.name}</p>
                    <StatusTag status={c.status} />
                  </div>
                  <h3 className="display-md mt-3 text-[1.6rem]">{c.question}</h3>
                  <p className="mt-3 leading-relaxed text-muted">{c.what}</p>
                  <p className="mt-auto border-t border-line pt-4 text-[0.95rem] leading-relaxed">
                    <span className="font-semibold">Why it matters: </span>{c.evidence}{' '}
                    <a href={c.source.href} target="_blank" rel="noreferrer" className="whitespace-nowrap text-sm text-muted underline underline-offset-2 hover:text-ink">
                      {c.source.label}
                    </a>
                  </p>
                </article>
              ))}
            </div>
            <p className="mt-6 text-sm text-muted">
              Working prototype: built and tested with sample data. In development: being built with pilot partners in 2027.
            </p>
          </Container>
        </section>

        {/* Works with existing codes + journey */}
        <section className="py-20 lg:py-28">
          <Container>
            <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-end">
              <h2 className="display-md text-[2rem] sm:text-[2.6rem]">Keep your codes. Add the answers they can’t give.</h2>
              <p className="max-w-[52ch] text-[1.05rem] leading-relaxed text-muted">
                Already protected by Chekkit, Sproxil or another GS1 provider? Keep them. TrustChain reads any GS1 DataMatrix and builds
                one shared record of each batch’s journey. We don’t sell labels, so regulators and every brand can trust the same data.
              </p>
            </div>

            <ol className="mt-12 grid gap-px overflow-hidden rounded-t-xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
              {journey.map((j, i) => (
                <li key={j.who} className="bg-paper p-6">
                  <span className="tnum flex h-8 w-8 items-center justify-center rounded-full bg-ledger-700 text-sm font-semibold text-white" aria-hidden="true">
                    {i + 1}
                  </span>
                  <h3 className="mt-5 text-lg font-semibold">{j.who}</h3>
                  <p className="mt-2 leading-relaxed text-muted">{j.what}</p>
                </li>
              ))}
            </ol>
            <div className="rounded-b-xl border border-t-0 border-line bg-ledger-50 px-6 py-5 sm:flex sm:items-baseline sm:gap-6">
              <h3 className="shrink-0 text-lg font-semibold text-ledger-800">Regulators</h3>
              <p className="mt-1 leading-relaxed text-ink sm:mt-0">
                See the whole chain, inspect where the risk is highest, follow every recall to the last shelf, and receive case files on suppliers of fakes.
              </p>
            </div>
          </Container>
        </section>

        {/* Who it's for */}
        <section className="border-t border-line py-20 lg:py-24">
          <Container>
            <h2 className="display-md text-[2rem] sm:text-[2.6rem]">Who it’s for</h2>
            <ul className="mt-10 divide-y divide-line border-y border-line">
              {audiences.map(a => (
                <li key={a.to}>
                  <Link to={a.to} className="group grid gap-2 py-6 md:grid-cols-[18rem_1fr_auto] md:items-baseline md:gap-8">
                    <span className="text-lg font-semibold group-hover:text-ledger-700">{a.who}</span>
                    <span className="max-w-[60ch] leading-relaxed text-muted">{a.what}</span>
                    <ArrowUpRight className="hidden h-5 w-5 text-faint group-hover:text-ledger-700 md:block" aria-hidden="true" />
                  </Link>
                </li>
              ))}
            </ul>
          </Container>
        </section>

        {/* Manufacturers: the one dark, bold section */}
        <section id="manufacturers" className="scroll-mt-16 bg-ledger-800 py-20 text-white lg:py-28">
          <Container>
            <div className="grid grid-cols-[minmax(0,1fr)] gap-14 lg:grid-cols-2">
              <div>
                <h2 className="display-md text-[2rem] sm:text-[2.6rem]">Ready for NAFDAC’s traceability rules, and beyond them</h2>
                <p className="mt-4 max-w-[52ch] text-[1.05rem] leading-relaxed text-ledger-100">
                  Under the Pharmaceutical Products (Traceability) Regulations 2024, medicines need a GS1 code with a unique serial, and every move
                  must be reported. Marketing authorisations will depend on it, starting with these dates.
                </p>
                <ol className="mt-10 border-l border-ledger-500/60">
                  {[
                    { date: '1 Jan 2027', scope: 'Narcotics and controlled medicines' },
                    { date: '1 Jan 2028', scope: 'Antimalarials, antibiotics, and maternal, newborn and child health products' },
                    { date: '1 Jan 2029', scope: 'All finished pharmaceutical products' },
                  ].map(p => (
                    <li key={p.date} className="relative pb-7 pl-6 last:pb-0">
                      <span className="absolute -left-[5px] top-2 h-2.5 w-2.5 rounded-full bg-ledger-300" aria-hidden="true" />
                      <p className="tnum font-semibold">{p.date}</p>
                      <p className="mt-1 text-ledger-100">{p.scope}</p>
                    </li>
                  ))}
                </ol>
                <p className="mt-8 text-sm text-ledger-200">
                  Source:{' '}
                  <a className="underline underline-offset-2 hover:text-white" href="https://pharmanewsonline.com/nafdac-to-enforce-mandatory-pharma-products-traceability-compliance-from-2027/" target="_blank" rel="noreferrer">
                    Pharmanews, July 2026
                  </a>. Always confirm current dates with NAFDAC.
                </p>
              </div>

              <div className="lg:pt-2">
                <div className="rounded-xl bg-ledger-900/60 p-6 ring-1 ring-ledger-600/50 sm:p-8">
                  <h3 className="text-xl font-semibold">Compliance is the minimum. Here’s what else you get.</h3>
                  <ul className="mt-5 space-y-4">
                    {[
                      'Your traceability events in one record, using the GS1 codes you already print or a partner’s',
                      'An Integrity Score for every batch, so you hear about storage problems before patients do',
                      'Recall Command: every outlet holding a batch in minutes, with returns counted',
                      'Case Builder: evidence on who is copying your products, ready for investigators',
                    ].map(t => (
                      <li key={t} className="flex gap-3 leading-relaxed text-ledger-50">
                        <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-ledger-300" aria-hidden="true" />
                        {t}
                      </li>
                    ))}
                  </ul>
                  <p className="mt-6 border-t border-ledger-600/50 pt-5 leading-relaxed text-ledger-100">
                    We’re building direct reporting to NAFDAC’s Traceability Information System with our first pilot partners.
                  </p>
                  <div className="mt-6 flex flex-wrap gap-3">
                    <Link to="/for/manufacturers" className="rounded-lg bg-white px-5 py-3 font-semibold text-ledger-800 hover:bg-ledger-50">
                      For manufacturers
                    </Link>
                    <Link to="/contact?topic=pilot" className="rounded-lg px-5 py-3 font-semibold text-white ring-1 ring-ledger-400 hover:bg-ledger-700">
                      Apply for the pilot
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </Container>
        </section>

        {/* Proof plan */}
        <section id="proof" className="scroll-mt-16 py-20 lg:py-28">
          <Container>
            <h2 className="display-md max-w-[24ch] text-[2rem] sm:text-[2.6rem]">We’ll prove it in public</h2>
            <p className="mt-4 max-w-[62ch] text-[1.05rem] leading-relaxed text-muted">
              In 2027 we’ll run a six-month pilot with antimalarials and antibiotics moving from Lagos, through Onitsha’s Bridge Head market, to about
              50 outlets in Enugu, where the study above measured a 9.3% failure rate. Each result is checked by someone outside TrustChain and published,
              good or bad.
            </p>

            <div className="mt-10 overflow-x-auto rounded-xl border border-line">
              <table className="w-full min-w-[720px] text-left text-[0.95rem]">
                <thead className="bg-mist text-sm text-muted">
                  <tr>
                    <th scope="col" className="px-5 py-3 font-medium">Capability</th>
                    <th scope="col" className="px-5 py-3 font-medium">What we measure</th>
                    <th scope="col" className="px-5 py-3 font-medium">Today</th>
                    <th scope="col" className="px-5 py-3 font-medium">Our target</th>
                    <th scope="col" className="px-5 py-3 font-medium">Checked by</th>
                  </tr>
                </thead>
                <tbody>
                  {PROOF.map(p => (
                    <tr key={p.measure} className="border-t border-line align-top">
                      <td className="px-5 py-4 font-semibold">{p.capability}</td>
                      <td className="px-5 py-4">{p.measure}</td>
                      <td className="px-5 py-4 text-muted">{p.baseline}</td>
                      <td className="px-5 py-4 font-semibold text-ledger-700">{p.target}</td>
                      <td className="px-5 py-4 text-muted">{p.checker}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-12 grid gap-8 rounded-2xl bg-mist p-8 sm:p-10 lg:grid-cols-[minmax(0,1.4fr)_auto] lg:items-center">
              <div>
                <h3 className="display-md text-[1.6rem]">The Nigeria Product Integrity Index</h3>
                <p className="mt-3 max-w-[60ch] leading-relaxed text-muted">
                  Estimates of how many medicines are fake or substandard range from 11% to over 70%, depending on who you ask. Every quarter we’ll publish
                  one independent figure from checks, lab results and recalls, with open methods and an academic co-author. First edition after the pilot.
                </p>
              </div>
              <Link to="/contact?topic=index" className="justify-self-start rounded-lg bg-ledger-700 px-5 py-3 font-semibold text-white hover:bg-ledger-800">
                Get the Index by email
              </Link>
            </div>
          </Container>
        </section>

        {/* Channels */}
        <section className="border-t border-line py-20 lg:py-28">
          <Container>
            <h2 className="display-md max-w-[24ch] text-[2rem] sm:text-[2.6rem]">Check from any phone, in your language</h2>
            <ul className="mt-12 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
              {channels.map(c => (
                <li key={c.name}>
                  <c.icon className="h-6 w-6 text-ledger-600" aria-hidden="true" />
                  <h3 className="mt-4 text-lg font-semibold">{c.name}</h3>
                  <p className="mt-1.5 leading-relaxed text-muted">{c.text}</p>
                  <div className="mt-3"><StatusTag status={c.status} /></div>
                </li>
              ))}
            </ul>
          </Container>
        </section>

        {/* Evidence, with sources */}
        <section className="border-t border-line py-20 lg:py-28">
          <Container>
            <h2 className="display-md text-[2rem] sm:text-[2.6rem]">Why this matters</h2>
            <dl className="mt-10 divide-y divide-line border-y border-line">
              {facts.map(f => (
                <div key={f.figure} className="grid gap-2 py-7 md:grid-cols-[14rem_1fr_auto] md:items-baseline md:gap-8">
                  <dt className="display tnum text-[2.4rem] text-ledger-700">{f.figure}</dt>
                  <dd className="max-w-[58ch] text-[1.05rem] leading-relaxed">{f.text}</dd>
                  <dd className="text-sm">
                    <a href={f.href} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-muted underline-offset-2 hover:text-ink hover:underline">
                      {f.source} <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                    </a>
                  </dd>
                </div>
              ))}
            </dl>
          </Container>
        </section>

        {/* Close */}
        <section className="pb-24">
          <Container>
            <div className="flex flex-col gap-8 rounded-2xl bg-ledger-50 p-8 sm:p-12 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-[48ch]">
                <h2 className="display-md text-[1.9rem] sm:text-[2.3rem]">Join the 2027 pilot</h2>
                <p className="mt-3 text-[1.05rem] leading-relaxed text-muted">
                  We’re looking for one or two manufacturers or importers, a regulator office and about 50 outlets on the Lagos–Onitsha–Enugu route.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link to="/contact?topic=pilot" className="rounded-lg bg-ledger-700 px-5 py-3 font-semibold text-white hover:bg-ledger-800">Apply as a manufacturer</Link>
                <Link to="/contact?topic=regulator" className="rounded-lg border border-line bg-paper px-5 py-3 font-semibold hover:border-faint">Regulator access</Link>
                <Link to="/contact?topic=outlet" className="rounded-lg border border-line bg-paper px-5 py-3 font-semibold hover:border-faint">Register an outlet</Link>
              </div>
            </div>
          </Container>
        </section>
      </main>

      <Footer />
    </div>
  );
}
