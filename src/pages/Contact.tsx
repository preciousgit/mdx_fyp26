import React, { useId, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import { api } from '../api';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Container } from '../components/brand';

type Topic = 'pilot' | 'regulator' | 'report' | 'general';

const topics: Record<Topic, { label: string; heading: string; intro: string; subject: string }> = {
  pilot: {
    label: 'Join the pilot',
    heading: 'Apply for the pilot',
    intro: 'Tell us what you make or import and roughly how many packs a month. We’ll come back within two working days to arrange a call.',
    subject: 'Pilot application',
  },
  regulator: {
    label: 'Regulator access',
    heading: 'Request regulator access',
    intro: 'Regulator accounts can see every company’s records and order recalls, so we verify each one before it is created. Use your official email address.',
    subject: 'Regulator access request',
  },
  report: {
    label: 'Report a product',
    heading: 'Report a suspicious product',
    intro: 'Tell us the code and where you bought it. We share reports with the brand and the regulator. If you’ve had a bad reaction to a medicine, see a health worker first.',
    subject: 'Suspicious product report',
  },
  general: {
    label: 'Something else',
    heading: 'Contact us',
    intro: 'Questions about TrustChain, partnerships or press. We reply within two working days.',
    subject: 'General enquiry',
  },
};

const field = 'w-full rounded-lg border border-line bg-paper px-3.5 py-3 text-[0.98rem] placeholder:text-faint focus:border-ledger-500 focus:outline-none';

export default function Contact() {
  const [params, setParams] = useSearchParams();
  const topic = (Object.keys(topics).includes(params.get('topic') || '') ? params.get('topic') : 'general') as Topic;
  const t = topics[topic];
  const ids = { name: useId(), email: useId(), org: useId(), code: useId(), where: useId(), msg: useId() };

  const [form, setForm] = useState({ name: '', email: '', org: '', code: params.get('product') || '', where: '', message: '' });
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const lines = [
      form.org && `Organisation: ${form.org}`,
      topic === 'report' && form.code && `Product code: ${form.code}`,
      topic === 'report' && form.where && `Bought at: ${form.where}`,
      form.message,
    ].filter(Boolean);
    try {
      setLoading(true);
      await api.contact({ name: form.name, email: form.email, subject: t.subject, message: lines.join('\n\n') });
      setSent(true);
    } catch (err: any) {
      setError(err.message || 'Your message didn’t send. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-paper text-ink">
      <Navbar />
      <main className="flex-1">
        <Container className="grid gap-12 py-12 lg:grid-cols-[1fr_1.3fr] lg:gap-20 lg:py-20">
          <div>
            <h1 className="display text-[2.6rem] sm:text-[3.2rem]">{t.heading}</h1>
            <p className="mt-4 max-w-[44ch] text-[1.05rem] leading-relaxed text-muted">{t.intro}</p>

            <nav aria-label="What is this about?" className="mt-10">
              <p className="text-sm font-medium">What is this about?</p>
              <ul className="mt-3 flex flex-wrap gap-2">
                {(Object.keys(topics) as Topic[]).map(k => (
                  <li key={k}>
                    <button
                      onClick={() => { setParams({ topic: k }); setSent(false); }}
                      aria-current={k === topic ? 'true' : undefined}
                      className={`rounded-full border px-3.5 py-1.5 text-sm transition-colors ${k === topic ? 'border-ledger-600 bg-ledger-50 text-ledger-800' : 'border-line text-muted hover:text-ink'}`}
                    >
                      {topics[k].label}
                    </button>
                  </li>
                ))}
              </ul>
            </nav>

            {topic === 'report' && (
              <p className="mt-10 border-l-2 border-caution pl-4 text-[0.95rem] leading-relaxed text-muted">
                You can also report directly to NAFDAC through its <a href="https://www.nafdac.gov.ng/" target="_blank" rel="noreferrer" className="underline underline-offset-2 hover:text-ink">website</a>.
                Keep the pack and receipt.
              </p>
            )}
          </div>

          <div>
            {sent ? (
              <div className="result-in rounded-2xl border border-genuine/30 bg-genuine-bg p-8" role="status">
                <CheckCircle2 className="h-7 w-7 text-genuine" aria-hidden="true" />
                <h2 className="display-md mt-4 text-[1.7rem]">Message sent</h2>
                <p className="mt-2 leading-relaxed">Thanks, {form.name.split(' ')[0] || 'there'}. We’ll reply to {form.email} within two working days.</p>
                <Link to="/" className="mt-6 inline-block font-semibold text-ledger-700 hover:underline">Back to home</Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5 rounded-2xl border border-line p-6 sm:p-8">
                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label htmlFor={ids.name} className="mb-1.5 block text-sm font-medium">Your name</label>
                    <input id={ids.name} required autoComplete="name" value={form.name} onChange={set('name')} className={field} />
                  </div>
                  <div>
                    <label htmlFor={ids.email} className="mb-1.5 block text-sm font-medium">Email address</label>
                    <input id={ids.email} type="email" required autoComplete="email" value={form.email} onChange={set('email')} className={field} />
                  </div>
                </div>

                {(topic === 'pilot' || topic === 'regulator') && (
                  <div>
                    <label htmlFor={ids.org} className="mb-1.5 block text-sm font-medium">{topic === 'pilot' ? 'Company' : 'Agency and office'}</label>
                    <input id={ids.org} required autoComplete="organization" value={form.org} onChange={set('org')} className={field} />
                  </div>
                )}

                {topic === 'report' && (
                  <div className="grid gap-5 sm:grid-cols-2">
                    <div>
                      <label htmlFor={ids.code} className="mb-1.5 block text-sm font-medium">Code on the pack</label>
                      <input id={ids.code} value={form.code} onChange={set('code')} className={`${field} code-text`} />
                    </div>
                    <div>
                      <label htmlFor={ids.where} className="mb-1.5 block text-sm font-medium">Where you bought it</label>
                      <input id={ids.where} required value={form.where} onChange={set('where')} placeholder="Shop name, market, town" className={field} />
                    </div>
                  </div>
                )}

                <div>
                  <label htmlFor={ids.msg} className="mb-1.5 block text-sm font-medium">
                    {topic === 'pilot' ? 'What do you make, and how many packs a month?' : topic === 'report' ? 'What made you suspicious?' : 'Message'}
                  </label>
                  <textarea id={ids.msg} required rows={6} value={form.message} onChange={set('message')} className={`${field} resize-y`} />
                </div>

                {error && <p role="alert" className="rounded-lg bg-recalled-bg px-3.5 py-3 text-sm text-recalled">{error}</p>}

                <button type="submit" disabled={loading} className="rounded-lg bg-ledger-700 px-6 py-3 font-semibold text-white hover:bg-ledger-800 disabled:opacity-60">
                  {loading ? 'Sending…' : 'Send message'}
                </button>
              </form>
            )}
          </div>
        </Container>
      </main>
      <Footer />
    </div>
  );
}
