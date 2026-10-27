import React, { useEffect, useId, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { CheckCircle2, AlertTriangle, OctagonX, SearchX, Link2, Unlink, Star } from 'lucide-react';
import { format } from 'date-fns';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Container } from '../components/brand';
import { api } from '../api';

/* Public page. Works without an account: /verify and /verify/:code */
export default function ConsumerPortal() {
  const { id } = useParams();
  return (
    <div className="flex min-h-screen flex-col bg-paper text-ink">
      <Navbar />
      <main className="flex-1">
        <Container className="py-12 lg:py-16">
          <div className="mx-auto max-w-[44rem]">
            {id ? <VerifyResult code={id} /> : <VerifyIntro />}
          </div>
        </Container>
      </main>
      <Footer />
    </div>
  );
}

function CodeForm({ initial = '', compact = false }: { initial?: string; compact?: boolean }) {
  const [value, setValue] = useState(initial);
  const navigate = useNavigate();
  const inputId = useId();
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const v = value.trim();
    if (v) navigate(`/verify/${encodeURIComponent(v)}`);
  };
  return (
    <form onSubmit={submit} className={compact ? '' : 'mt-8'}>
      <label htmlFor={inputId} className="block text-sm font-medium">Code on the pack</label>
      <div className="mt-2 flex gap-2">
        <input
          id={inputId}
          value={value}
          onChange={e => setValue(e.target.value)}
          required
          autoComplete="off"
          spellCheck={false}
          placeholder="Type the code exactly as printed"
          className="code-text min-w-0 flex-1 rounded-lg border border-line bg-mist px-3.5 py-3 text-[1.05rem] placeholder:font-normal placeholder:tracking-normal placeholder:text-faint focus:border-ledger-500 focus:bg-white focus:outline-none"
        />
        <button type="submit" className="rounded-lg bg-ledger-700 px-5 font-semibold text-white hover:bg-ledger-800">Check</button>
      </div>
    </form>
  );
}

function VerifyIntro() {
  return (
    <>
      <h1 className="display text-[2.6rem] sm:text-[3.4rem]">Check a product</h1>
      <p className="mt-4 text-[1.1rem] leading-relaxed text-muted">
        Enter the code printed on the pack, usually under a scratch panel or next to the barcode. You'll see who made it,
        where it has been, and whether there's any reason not to use it.
      </p>
      <CodeForm />
      <ul className="mt-10 space-y-3 border-t border-line pt-8 text-[0.98rem] leading-relaxed text-muted">
        <li><span className="font-semibold text-ink">No account needed.</span> Anyone can check a code.</li>
        <li><span className="font-semibold text-ink">If a code is not found,</span> or is flagged, don't use the product. Keep the pack and receipt.</li>
        <li><span className="font-semibold text-ink">Medicines:</span> you can also check registration in NAFDAC's{' '}
          <a href="https://greenbook.nafdac.gov.ng/" target="_blank" rel="noreferrer" className="underline underline-offset-2 hover:text-ink">Greenbook</a>.</li>
      </ul>
    </>
  );
}

type Tone = 'genuine' | 'caution' | 'recalled';

function VerifyResult({ code }: { code: string }) {
  const [state, setState] = useState<'loading' | 'missing' | 'error' | 'ok'>('loading');
  const [product, setProduct] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);

  useEffect(() => {
    let live = true;
    setState('loading');
    (async () => {
      try {
        const p = await api.products.get(code);
        const [ev, rv] = await Promise.all([
          api.events.list(code).catch(() => []),
          api.reviews.list(code).catch(() => []),
        ]);
        if (!live) return;
        setProduct(p);
        setEvents([...ev].sort((a: any, b: any) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()));
        setReviews(rv);
        setState('ok');
      } catch (err: any) {
        if (!live) return;
        setState(/not found/i.test(err?.message || '') ? 'missing' : 'error');
      }
    })();
    return () => { live = false; };
  }, [code]);

  if (state === 'loading') {
    return <p className="py-16 text-center text-muted" role="status">Checking <span className="code-text text-ink">{code}</span>…</p>;
  }

  if (state === 'missing' || state === 'error') {
    return (
      <>
        <StatusBand
          tone="recalled"
          icon={<SearchX className="h-6 w-6" />}
          title={state === 'missing' ? "We can't find this code" : "We couldn't check this code right now"}
          code={code}
        >
          {state === 'missing'
            ? 'Check you typed it exactly as printed. If it still isn’t found, don’t buy or use the product. It may be fake.'
            : 'Something went wrong on our side. Please try again in a minute. Don’t use the product until you have a result.'}
        </StatusBand>
        <div className="mt-8"><CodeForm initial={code} compact /></div>
        {state === 'missing' && (
          <p className="mt-6 text-muted">
            Bought it already?{' '}
            <Link to={`/contact?topic=report&product=${encodeURIComponent(code)}`} className="font-semibold text-ink underline underline-offset-2">Report this product</Link>{' '}
            and keep the pack and receipt.
          </p>
        )}
      </>
    );
  }

  const verdict = getVerdict(product);
  const links = checkLinks(events);
  const avg = reviews.length ? reviews.reduce((s, r) => s + (r.rating || 0), 0) / reviews.length : 0;

  return (
    <>
      <StatusBand tone={verdict.tone} icon={verdict.icon} title={verdict.title} code={code}>
        {verdict.text}
      </StatusBand>

      <section className="mt-10" aria-labelledby="facts">
        <h2 id="facts" className="text-xl font-semibold">{product.name}</h2>
        <dl className="mt-4 grid grid-cols-1 gap-x-8 border-t border-line sm:grid-cols-2">
          <Fact label="Made by" value={product.producerName} />
          <Fact label="Category" value={product.category} />
          <Fact label="Batch" value={product.batchNumber} mono />
          <Fact label="Made in" value={product.origin} />
          <Fact label="Manufactured" value={fmtDate(product.manufacturingDate)} />
          <Fact label="Expires" value={fmtDate(product.expiryDate)} />
          <Fact label="Storage" value={product.storageConditions} />
          <Fact label="Allergens" value={product.allergens} />
        </dl>
      </section>

      <section className="mt-12" aria-labelledby="journey">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h2 id="journey" className="text-xl font-semibold">Where it has been</h2>
          <p className={`inline-flex items-center gap-1.5 text-sm font-medium ${links.ok ? 'text-genuine' : 'text-recalled'}`}>
            {links.ok ? <Link2 className="h-4 w-4" aria-hidden="true" /> : <Unlink className="h-4 w-4" aria-hidden="true" />}
            {links.ok ? `Record unbroken across ${events.length} ${events.length === 1 ? 'entry' : 'entries'}` : `Record broken at entry ${links.brokenAt}`}
          </p>
        </div>
        {events.length === 0 ? (
          <p className="mt-4 text-muted">No movements recorded yet.</p>
        ) : (
          <ol className="mt-6 border-l-2 border-ledger-100">
            {events.map(ev => <JourneyStep key={ev.id} ev={ev} />)}
          </ol>
        )}
      </section>

      <section className="mt-12 border-t border-line pt-8" aria-labelledby="reviews">
        <h2 id="reviews" className="text-xl font-semibold">What people say</h2>
        {reviews.length === 0 ? (
          <p className="mt-3 text-muted">No reviews yet.</p>
        ) : (
          <p className="mt-3 flex items-center gap-2">
            <Star className="h-5 w-5 fill-caution text-caution" aria-hidden="true" />
            <span className="tnum font-semibold">{avg.toFixed(1)} out of 5</span>
            <span className="text-muted">from {reviews.length} {reviews.length === 1 ? 'review' : 'reviews'} by shoppers, distributors and regulators</span>
          </p>
        )}
        <div className="mt-6 flex flex-wrap gap-3">
          <Link to={`/contact?topic=report&product=${encodeURIComponent(code)}`} className="rounded-lg border border-line px-4 py-2.5 font-semibold hover:border-faint">
            Report a problem
          </Link>
          <Link to="/login" className="rounded-lg px-4 py-2.5 font-semibold text-ledger-700 hover:bg-ledger-50">Sign in to leave a review</Link>
        </div>
      </section>

      <div className="mt-14 border-t border-line pt-8">
        <h2 className="text-lg font-semibold">Check another product</h2>
        <div className="mt-4"><CodeForm compact /></div>
      </div>
    </>
  );
}

function getVerdict(p: any): { tone: Tone; icon: React.ReactNode; title: string; text: string } {
  const expired = p.expiryDate && !isNaN(Date.parse(p.expiryDate)) && new Date(p.expiryDate) < new Date();
  if (p.status === 'rejected' || p.status === 'recalled') {
    return { tone: 'recalled', icon: <OctagonX className="h-6 w-6" />, title: 'Do not use this product',
      text: 'A regulator rejected this product after inspection. Return it to where you bought it.' };
  }
  if (expired) {
    return { tone: 'caution', icon: <AlertTriangle className="h-6 w-6" />, title: `Expired on ${fmtDate(p.expiryDate)}`,
      text: 'This is a registered product, but it is past its expiry date. Don’t use it.' };
  }
  if (p.status === 'flagged' || (p.riskScore ?? 0) > 50) {
    return { tone: 'caution', icon: <AlertTriangle className="h-6 w-6" />, title: 'Registered, but a problem was reported',
      text: 'A handler reported a storage or condition problem and a regulator is reviewing it. Ask the seller for another batch if you can.' };
  }
  if (p.status === 'approved') {
    return { tone: 'genuine', icon: <CheckCircle2 className="h-6 w-6" />, title: 'Genuine and inspected',
      text: 'This product is registered with TrustChain and passed a regulatory inspection.' };
  }
  return { tone: 'genuine', icon: <CheckCircle2 className="h-6 w-6" />, title: 'Genuine registered product',
    text: 'This product is registered with TrustChain and no problems have been reported.' };
}

function checkLinks(events: any[]) {
  for (let i = 0; i < events.length; i++) {
    const expected = i === 0 ? '0' : events[i - 1].hash;
    if (events[i].previousHash !== expected) return { ok: false, brokenAt: i + 1 };
  }
  return { ok: true, brokenAt: 0 };
}

function JourneyStep({ ev }: { ev: any }) {
  const d = ev.data || {};
  const where = d.location ? ` in ${d.location}` : '';
  let title = '';
  if (ev.type === 'CREATED') title = `Registered by ${ev.actorName}${where}`;
  else if (ev.type === 'HANDOFF') title = `Received by ${ev.actorName}${where}`;
  else if (ev.type === 'INSPECTION') title = `Inspected by a regulator: ${d.decision === 'approved' ? 'passed' : d.decision === 'rejected' ? 'failed' : 'reviewed'}`;
  else title = `${ev.type.toLowerCase()} by ${ev.actorName}`;

  const details: string[] = [];
  if (typeof d.temperature === 'number') details.push(`${d.temperature}°C`);
  if (typeof d.humidity === 'number') details.push(`${d.humidity}% humidity`);
  if (d.conditionGrade) details.push(`condition ${d.conditionGrade}`);
  if (d.visibleDamage === 'yes') details.push('visible damage reported');
  const problems: string[] = Array.isArray(d.anomalies) ? d.anomalies : [];

  return (
    <li className="relative pb-7 pl-6 last:pb-0">
      <span className={`absolute -left-[7px] top-1.5 h-3 w-3 rounded-full ring-4 ring-paper ${problems.length ? 'bg-caution' : 'bg-ledger-500'}`} aria-hidden="true" />
      <p className="tnum text-sm text-muted">{fmtDateTime(ev.timestamp)}</p>
      <p className="mt-0.5 font-medium">{title}</p>
      {details.length > 0 && <p className="mt-1 text-[0.95rem] text-muted">{details.join(', ')}</p>}
      {problems.map(pr => <p key={pr} className="mt-1 text-[0.95rem] text-caution">{pr}</p>)}
    </li>
  );
}

function StatusBand({ tone, icon, title, code, children }: { tone: Tone; icon: React.ReactNode; title: string; code: string; children: React.ReactNode }) {
  const tones = {
    genuine: 'bg-genuine-bg border-genuine/30 text-genuine',
    caution: 'bg-caution-bg border-caution/30 text-caution',
    recalled: 'bg-recalled-bg border-recalled/30 text-recalled',
  }[tone];
  return (
    <div className={`result-in rounded-2xl border p-6 sm:p-8 ${tones}`} role="status">
      <p className="text-sm text-ink/70">Code <span className="code-text text-ink">{code}</span></p>
      <h1 className="display-md mt-3 flex items-start gap-3 text-[1.9rem] sm:text-[2.3rem]">
        <span className="mt-1.5 shrink-0">{icon}</span>{title}
      </h1>
      <p className="mt-3 max-w-[56ch] text-[1.05rem] leading-relaxed text-ink">{children}</p>
    </div>
  );
}

function Fact({ label, value, mono = false }: { label: string; value?: string; mono?: boolean }) {
  return (
    <div className="flex justify-between gap-4 border-b border-line py-3">
      <dt className="text-muted">{label}</dt>
      <dd className={`text-right ${mono ? 'code-text' : ''} ${value ? '' : 'text-faint'}`}>{value || 'Not provided'}</dd>
    </div>
  );
}

function fmtDate(s?: string) {
  if (!s || isNaN(Date.parse(s))) return s || '';
  return format(new Date(s), 'd MMM yyyy');
}
function fmtDateTime(s?: string) {
  if (!s || isNaN(Date.parse(s))) return '';
  return format(new Date(s), "d MMM yyyy, HH:mm");
}
