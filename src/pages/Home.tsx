import React from 'react';
import { Link } from 'react-router-dom';
import { Globe2, Camera, MessageCircle, Phone, ExternalLink } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import VerifyDemo from '../components/VerifyDemo';
import { Container } from '../components/brand';

const journey = [
  { who: 'Manufacturer', what: 'Registers the batch and prints a unique code on every pack.' },
  { who: 'Distributor', what: 'Records each handoff, with temperature and condition, before the pack can move on.' },
  { who: 'Pharmacy or shop', what: 'Confirms the pack arrived from a known supplier.' },
  { who: 'You', what: 'Check the code before you buy, and see the whole journey.' },
];

const scanLog = [
  { when: '2 Sep, 10:14', where: 'Lagos', result: 'First check', ok: true },
  { when: '5 Sep, 16:02', where: 'Kano', result: 'Already checked', ok: false },
  { when: '5 Sep, 16:09', where: 'Kano', result: 'Already checked', ok: false },
  { when: '6 Sep, 09:40', where: 'Kaduna', result: 'Already checked', ok: false },
];

const phases = [
  { date: '1 Jan 2027', scope: 'Narcotics and controlled medicines' },
  { date: '1 Jan 2028', scope: 'Antimalarials, antibiotics, and maternal, newborn and child health products' },
  { date: '1 Jan 2029', scope: 'All finished pharmaceutical products' },
];

const pilotIncludes = [
  'GS1 DataMatrix codes carrying GTIN, batch, expiry and a unique serial for each pack',
  'Help registering a Global Location Number (GLN) for each of your sites',
  'A dashboard showing where every batch is, and where its codes are being checked',
  'Batch recall in minutes, with a list of every distributor and outlet that received it',
];

const channels = [
  { icon: Globe2, name: 'Website', text: 'Type the code on this website, from any browser.', status: 'Available now' },
  { icon: Camera, name: 'Phone camera', text: 'Point the camera at the code on the pack.', status: 'In development' },
  { icon: MessageCircle, name: 'WhatsApp', text: 'Send the code in a chat and get the answer back.', status: 'In development' },
  { icon: Phone, name: 'USSD', text: 'Dial a short code from any phone, no data needed.', status: 'Planned' },
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
    figure: '401 of 821',
    text: 'NAFDAC seizure entries in 2026 so far were cosmetics. Drinks were next with 215.',
    source: 'Tribune, Oct 2026',
    href: 'https://tribuneonlineng.com/nafdac-destroys-n22-73bn-in-unsafe-products-records-5542-enforcement-operations/',
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-paper text-ink">
      <Navbar />

      <main>
        {/* Hero: the product itself */}
        <section className="border-b border-line">
          <Container className="grid grid-cols-[minmax(0,1fr)] items-center gap-12 py-14 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:gap-16 lg:py-24">
            <div className="min-w-0">
              <h1 className="display text-[2.7rem] sm:text-[3.6rem] lg:text-[4.4rem] text-ink">
                Know it's real before you take it.
              </h1>
              <p className="mt-6 max-w-[34rem] text-[1.15rem] leading-relaxed text-muted">
                TrustChain gives every pack of medicine, cosmetics or drink its own code. Check the code and see who made it,
                every hand it passed through, and whether it has been recalled.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link to="/verify" className="rounded-lg bg-ledger-700 px-5 py-3 font-semibold text-white hover:bg-ledger-800">
                  Check a product
                </Link>
                <a href="#manufacturers" className="rounded-lg border border-line px-5 py-3 font-semibold text-ink hover:border-faint">
                  I make or import products
                </a>
              </div>
              <p className="mt-6 text-sm text-muted">No app or account needed to check a product.</p>
            </div>

            <div className="min-w-0">
              <VerifyDemo />
              <p className="mt-3 text-center text-xs text-faint">Sample packs and results for demonstration. The manufacturer shown is fictional.</p>
            </div>
          </Container>
        </section>

        {/* Journey: a real sequence, so it is numbered */}
        <section id="how-it-works" className="scroll-mt-20 py-20 lg:py-28">
          <Container>
            <h2 className="display-md max-w-[22ch] text-[2rem] sm:text-[2.6rem]">One code follows the pack from factory to shelf</h2>
            <p className="mt-4 max-w-[60ch] text-[1.05rem] leading-relaxed text-muted">
              Everyone who handles the pack adds to the same record. Each entry is linked to the one before it, so a changed record shows up as broken.
            </p>

            <ol className="mt-12 grid gap-px overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
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
            <div className="mt-px rounded-b-xl border border-t-0 border-line bg-ledger-50 px-6 py-5 sm:flex sm:items-baseline sm:gap-6">
              <h3 className="shrink-0 text-lg font-semibold text-ledger-800">Regulators</h3>
              <p className="mt-1 leading-relaxed text-ink sm:mt-0">
                See every step for every product, trace a batch to each outlet that received it, and order a recall from one screen.
              </p>
            </div>
          </Container>
        </section>

        {/* Clone detection */}
        <section className="border-y border-line bg-mist py-20 lg:py-28">
          <Container className="grid grid-cols-[minmax(0,1fr)] gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:items-center">
            <div>
              <h2 className="display-md text-[2rem] sm:text-[2.6rem]">How a copied code gets caught</h2>
              <p className="mt-4 max-w-[52ch] text-[1.05rem] leading-relaxed text-muted">
                Counterfeiters can photocopy a label, but they can't copy its history. Each code is printed once and expected to be checked once.
                When the same code turns up again, somewhere else, we tell the shopper not to use the pack and alert the brand and the regulator with where it happened.
              </p>
            </div>
            <figure className="overflow-hidden rounded-xl border border-line bg-paper">
              <figcaption className="flex items-center justify-between border-b border-line px-5 py-3 text-sm">
                <span className="font-semibold">Checks of code <span className="code-text">TC3P-81LW-ZR6A</span></span>
                <span className="text-muted">Sample</span>
              </figcaption>
              <table className="w-full text-left text-[0.95rem]">
                <thead className="text-sm text-muted">
                  <tr>
                    <th scope="col" className="px-5 py-2.5 font-medium">When</th>
                    <th scope="col" className="px-5 py-2.5 font-medium">Where</th>
                    <th scope="col" className="px-5 py-2.5 font-medium">Result</th>
                  </tr>
                </thead>
                <tbody>
                  {scanLog.map((s, i) => (
                    <tr key={i} className="border-t border-line">
                      <td className="tnum px-5 py-3 text-muted">{s.when}</td>
                      <td className="px-5 py-3">{s.where}</td>
                      <td className="px-5 py-3">
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-sm font-medium ${s.ok ? 'bg-genuine-bg text-genuine' : 'bg-recalled-bg text-recalled'}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${s.ok ? 'bg-genuine' : 'bg-recalled'}`} aria-hidden="true" />
                          {s.result}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </figure>
          </Container>
        </section>

        {/* Manufacturers: the one dark, bold section */}
        <section id="manufacturers" className="scroll-mt-16 bg-ledger-800 py-20 text-white lg:py-28">
          <Container>
            <div className="grid grid-cols-[minmax(0,1fr)] gap-14 lg:grid-cols-2">
              <div>
                <h2 className="display-md text-[2rem] sm:text-[2.6rem]">Ready for NAFDAC's traceability rules</h2>
                <p className="mt-4 max-w-[52ch] text-[1.05rem] leading-relaxed text-ledger-100">
                  Under the Pharmaceutical Products (Traceability) Regulations 2024, medicines need a GS1 barcode with a unique serial, and every
                  move through the supply chain must be reported. Marketing authorisations will depend on it, starting with these dates.
                </p>
                <ol className="mt-10 border-l border-ledger-500/60">
                  {phases.map(p => (
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
                  <h3 className="text-xl font-semibold">What pilot partners get</h3>
                  <ul className="mt-5 space-y-4">
                    {pilotIncludes.map(t => (
                      <li key={t} className="flex gap-3 leading-relaxed text-ledger-50">
                        <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-ledger-300" aria-hidden="true" />
                        {t}
                      </li>
                    ))}
                  </ul>
                  <p className="mt-6 border-t border-ledger-600/50 pt-5 leading-relaxed text-ledger-100">
                    We're building direct reporting to NAFDAC's Traceability Information System with our first partners. Not a pharma company?
                    Cosmetics, drinks and food brands use the same codes to stop fakes of their products.
                  </p>
                  <Link to="/contact?topic=pilot" className="mt-6 inline-block rounded-lg bg-white px-5 py-3 font-semibold text-ledger-800 hover:bg-ledger-50">
                    Apply for the pilot
                  </Link>
                </div>
              </div>
            </div>
          </Container>
        </section>

        {/* Channels */}
        <section className="py-20 lg:py-28">
          <Container>
            <h2 className="display-md max-w-[24ch] text-[2rem] sm:text-[2.6rem]">Check from any phone, with or without data</h2>
            <ul className="mt-12 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
              {channels.map(c => (
                <li key={c.name}>
                  <c.icon className="h-6 w-6 text-ledger-600" aria-hidden="true" />
                  <h3 className="mt-4 text-lg font-semibold">{c.name}</h3>
                  <p className="mt-1.5 leading-relaxed text-muted">{c.text}</p>
                  <p className={`mt-3 text-sm font-medium ${c.status === 'Available now' ? 'text-genuine' : 'text-faint'}`}>{c.status}</p>
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
            <div className="flex flex-col gap-8 rounded-2xl bg-mist p-8 sm:p-12 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-[46ch]">
                <h2 className="display-md text-[1.9rem] sm:text-[2.3rem]">We're choosing our first ten partners</h2>
                <p className="mt-3 text-[1.05rem] leading-relaxed text-muted">
                  Manufacturers, importers and brand owners in Nigeria who want to protect their products and get ready for traceability rules.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link to="/contact?topic=pilot" className="rounded-lg bg-ledger-700 px-5 py-3 font-semibold text-white hover:bg-ledger-800">Apply for the pilot</Link>
                <Link to="/contact?topic=regulator" className="rounded-lg border border-line bg-paper px-5 py-3 font-semibold hover:border-faint">Regulator access</Link>
              </div>
            </div>
          </Container>
        </section>
      </main>

      <Footer />
    </div>
  );
}
