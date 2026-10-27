import React, { useId, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, AlertTriangle, OctagonX, Thermometer } from 'lucide-react';
import { DataMatrix } from './brand';

type Outcome = 'safe' | 'heat' | 'recalled' | 'copied';

interface DemoPack {
  code: string;
  label: string;
  batch: string;
  expiry: string;
  outcome: Outcome;
}

/* Sample packs for the demo only. The manufacturer is fictional. */
const PRODUCT = 'Artemether/Lumefantrine 80/480 mg, 6 tablets';
const MAKER = 'Kanem Pharma (sample)';
const PACKS: DemoPack[] = [
  { code: 'TC7K-Q492-XMBD', label: 'Genuine and safe', batch: 'AL-2604', expiry: 'Mar 2028', outcome: 'safe' },
  { code: 'TC4H-T38R-WQ2E', label: 'Stored too hot', batch: 'AL-2609', expiry: 'Apr 2028', outcome: 'heat' },
  { code: 'TC9D-5HJ2-KT4N', label: 'Recalled batch', batch: 'AL-2511', expiry: 'Nov 2027', outcome: 'recalled' },
  { code: 'TC3P-81LW-ZR6A', label: 'Copied code', batch: 'AL-2604', expiry: 'Mar 2028', outcome: 'copied' },
];

const norm = (s: string) => s.toUpperCase().replace(/[^A-Z0-9]/g, '');

export default function VerifyDemo() {
  const inputId = useId();
  const navigate = useNavigate();
  const [value, setValue] = useState(PACKS[0].code);
  const [pack, setPack] = useState<DemoPack>(PACKS[0]);
  const [result, setResult] = useState<DemoPack | null>(null);
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
          <dd className="font-semibold leading-snug text-ink">{PRODUCT}</dd>
          <dt className="sr-only">Manufacturer</dt>
          <dd className="text-muted">{MAKER}</dd>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-muted">
            <span>Batch <span className="tnum text-ink">{pack.batch}</span></span>
            <span>Expires <span className="tnum text-ink">{pack.expiry}</span></span>
          </div>
        </dl>
      </div>

      {/* The check */}
      <form onSubmit={check} className="p-5 sm:p-6">
        <label htmlFor={inputId} className="block text-sm font-medium text-ink">
          Code on the pack
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
          <legend className="sr-only">Try a sample pack</legend>
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

function Result({ result }: { result: DemoPack }) {
  if (result.outcome === 'safe') {
    return (
      <Panel tone="genuine" icon={<CheckCircle2 className="h-5 w-5" />} title="Genuine, and kept within its safe range.">
        <ol className="mt-1 space-y-2">
          <Step when="12 Aug 2026" text="Made by Kanem Pharma, Ikeja" />
          <Step when="19 Aug 2026" text="Distributor in Onitsha, stored at 22–26°C" />
          <Step when="27 Aug 2026" text="Verified outlet in Enugu" />
        </ol>
      </Panel>
    );
  }
  if (result.outcome === 'heat') {
    return (
      <Panel tone="caution" icon={<Thermometer className="h-5 w-5" />} title="Genuine label, but this batch may not be safe.">
        <p>
          Batch AL-2609 spent <span className="tnum font-semibold">3 days</span> at 34–38°C in an Onitsha warehouse. The label limit is 30°C,
          and heat can weaken this medicine. Ask for a pack from another batch. The batch has been sent for lab testing.
        </p>
      </Panel>
    );
  }
  if (result.outcome === 'recalled') {
    return (
      <Panel tone="caution" icon={<AlertTriangle className="h-5 w-5" />} title="Recalled. Return this pack to where you bought it.">
        <p>The manufacturer recalled batch AL-2511 on 14 Oct 2026 after a failed quality test. Every outlet that received it has been told.</p>
      </Panel>
    );
  }
  return (
    <Panel tone="recalled" icon={<OctagonX className="h-5 w-5" />} title="Don't use this pack. The code has been copied.">
      <p>
        This code was first checked in Lagos on 2 Sep 2026. It has since been checked <span className="tnum font-semibold">37</span> times in Kano, Kaduna and Abuja,
        and the brand and regulator have been alerted.
      </p>
      <a href="/contact?topic=report" className="mt-3 inline-block font-semibold underline underline-offset-2">Report where you bought it</a>
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
