import React, { useId, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, AlertTriangle, OctagonX, SearchX } from 'lucide-react';
import { DataMatrix } from './brand';

type Outcome = 'genuine' | 'copied' | 'recalled';

interface DemoPack {
  code: string;
  label: string;
  product: string;
  maker: string;
  batch: string;
  expiry: string;
  outcome: Outcome;
}

/* Sample packs for the demo only. The manufacturer is fictional. */
const PACKS: DemoPack[] = [
  { code: 'TC7K-Q492-XMBD', label: 'Genuine pack', product: 'Artemether/Lumefantrine 80/480 mg, 6 tablets', maker: 'Kanem Pharma (sample)', batch: 'AL-2604', expiry: 'Mar 2028', outcome: 'genuine' },
  { code: 'TC3P-81LW-ZR6A', label: 'Copied code', product: 'Artemether/Lumefantrine 80/480 mg, 6 tablets', maker: 'Kanem Pharma (sample)', batch: 'AL-2604', expiry: 'Mar 2028', outcome: 'copied' },
  { code: 'TC9D-5HJ2-KT4N', label: 'Recalled batch', product: 'Artemether/Lumefantrine 80/480 mg, 6 tablets', maker: 'Kanem Pharma (sample)', batch: 'AL-2511', expiry: 'Nov 2027', outcome: 'recalled' },
];

const norm = (s: string) => s.toUpperCase().replace(/[^A-Z0-9]/g, '');

export default function VerifyDemo() {
  const inputId = useId();
  const navigate = useNavigate();
  const [value, setValue] = useState(PACKS[0].code);
  const [pack, setPack] = useState<DemoPack>(PACKS[0]);
  const [result, setResult] = useState<DemoPack | 'missing' | null>(null);
  const [checks, setChecks] = useState(0);

  const choose = (p: DemoPack) => {
    setPack(p);
    setValue(p.code);
    setResult(null);
  };

  const check = (e: React.FormEvent) => {
    e.preventDefault();
    const v = norm(value);
    if (!v) return;
    const match = PACKS.find(p => norm(p.code) === v);
    if (match) {
      setPack(match);
      setResult(match);
      setChecks(c => c + 1);
      return;
    }
    // Anything that isn't a sample code is looked up for real.
    navigate(`/verify/${encodeURIComponent(value.trim())}`);
  };

  return (
    <div className="rounded-2xl border border-line bg-paper shadow-[0_1px_0_#DCE3DF,0_24px_48px_-24px_rgba(14,77,58,0.25)]">
      {/* The pack */}
      <div className="flex gap-4 border-b border-line p-5 sm:p-6">
        <div className="shrink-0 rounded-md border border-line bg-white p-2">
          <DataMatrix seed={pack.code} size={84} modules={14} />
        </div>
        <dl className="min-w-0 text-sm">
          <dt className="sr-only">Product</dt>
          <dd className="font-semibold text-ink leading-snug">{pack.product}</dd>
          <dt className="sr-only">Manufacturer</dt>
          <dd className="text-muted">{pack.maker}</dd>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-muted">
            <span>Batch <span className="tnum text-ink">{pack.batch}</span></span>
            <span>Expires <span className="tnum text-ink">{pack.expiry}</span></span>
          </div>
        </dl>
      </div>

      {/* The check */}
      <form onSubmit={check} className="p-5 sm:p-6">
        <label htmlFor={inputId} className="block text-sm font-medium text-ink">
          Code under the scratch panel
        </label>
        <div className="mt-2 flex gap-2">
          <input
            id={inputId}
            value={value}
            onChange={e => { setValue(e.target.value); setResult(null); }}
            autoComplete="off"
            spellCheck={false}
            className="code-text w-full min-w-0 flex-1 rounded-lg border border-line bg-mist px-3.5 py-3 text-[1.05rem] text-ink placeholder:text-faint focus:border-ledger-500 focus:bg-white focus:outline-none"
            placeholder="e.g. TC7K-Q492-XMBD"
          />
          <button type="submit" className="rounded-lg bg-ledger-700 px-5 font-semibold text-white hover:bg-ledger-800">
            Check
          </button>
        </div>

        <fieldset className="mt-3">
          <legend className="sr-only">Try a sample code</legend>
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="text-muted">Try a sample:</span>
            {PACKS.map(p => (
              <button
                type="button"
                key={p.code}
                onClick={() => choose(p)}
                aria-pressed={pack.code === p.code}
                className={`rounded-full border px-3 py-1 transition-colors ${pack.code === p.code ? 'border-ledger-600 bg-ledger-50 text-ledger-800' : 'border-line text-muted hover:border-faint hover:text-ink'}`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </fieldset>

        <div aria-live="polite">
          {result && <Result key={checks} result={result} />}
        </div>
      </form>
    </div>
  );
}

function Result({ result }: { result: DemoPack | 'missing' }) {
  if (result === 'missing') {
    return (
      <Panel tone="caution" icon={<SearchX className="h-5 w-5" />} title="We can't find this code">
        <p>Check you typed it exactly as printed. If it still isn't found, don't use the product.</p>
      </Panel>
    );
  }
  if (result.outcome === 'genuine') {
    return (
      <Panel tone="genuine" icon={<CheckCircle2 className="h-5 w-5" />} title="Genuine. This is the first check of this code.">
        <ol className="mt-1 space-y-2">
          <Step when="12 Aug 2026" text="Made and sealed by Kanem Pharma, Ikeja" />
          <Step when="19 Aug 2026" text="Received by distributor in Onitsha, stored at 18°C" />
          <Step when="27 Aug 2026" text="Delivered to a licensed pharmacy in Enugu" />
        </ol>
      </Panel>
    );
  }
  if (result.outcome === 'copied') {
    return (
      <Panel tone="recalled" icon={<OctagonX className="h-5 w-5" />} title="Don't use this pack. The code has been copied.">
        <p>
          This code was first checked in Lagos on 2 Sep 2026. It has since been checked <span className="tnum font-semibold">37</span> times in Kano, Kaduna and Abuja.
          Each real code is meant to be checked once.
        </p>
        <a href="/contact?topic=report" className="mt-3 inline-block font-semibold underline underline-offset-2">Report where you bought it</a>
      </Panel>
    );
  }
  return (
    <Panel tone="caution" icon={<AlertTriangle className="h-5 w-5" />} title="Recalled. Return this pack to where you bought it.">
      <p>The manufacturer recalled batch AL-2511 on 14 Oct 2026 after a failed quality test. Ask the pharmacy for a replacement from a different batch.</p>
    </Panel>
  );
}

function Panel({ tone, icon, title, children }: { tone: 'genuine' | 'caution' | 'recalled'; icon: React.ReactNode; title: string; children: React.ReactNode }) {
  const tones = {
    genuine: 'bg-genuine-bg text-genuine border-genuine/25',
    caution: 'bg-caution-bg text-caution border-caution/25',
    recalled: 'bg-recalled-bg text-recalled border-recalled/25',
  }[tone];
  return (
    <div className={`result-in mt-5 rounded-xl border p-4 ${tones}`}>
      <p className="flex items-start gap-2 font-semibold leading-snug">
        <span className="mt-px shrink-0">{icon}</span>
        {title}
      </p>
      <div className="mt-2 pl-7 text-[0.92rem] leading-relaxed text-ink">{children}</div>
    </div>
  );
}

function Step({ when, text }: { when: string; text: string }) {
  return (
    <li className="grid grid-cols-[6.5rem_1fr] gap-2">
      <span className="tnum text-muted">{when}</span>
      <span>{text}</span>
    </li>
  );
}
