import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Mail, MessageSquare, Send, MapPin, Phone, CheckCircle } from 'lucide-react';
import { api } from '../api';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const contactInfo = [
  { icon: Mail, label: 'Email', value: 'hello@trustchain.io', href: 'mailto:hello@trustchain.io' },
  { icon: Phone, label: 'Phone', value: '+1 (555) 012-3456', href: 'tel:+15550123456' },
  { icon: MapPin, label: 'Location', value: 'London, UK · San Francisco, CA', href: '#' },
];

const faqs = [
  { q: 'How does TrustChain create product IDs?', a: 'Each product gets a unique ID based on your company prefix plus a random 5-digit code. This ID is immutably linked to all events in the product\'s lifecycle.' },
  { q: 'Can consumers verify products without an account?', a: 'Yes. The Consumer Portal at /verify is fully public. Anyone can enter a product ID to view its complete audit trail, status, and reviews.' },
  { q: 'Is data stored on a real blockchain?', a: 'TrustChain uses a blockchain-style hash chain — each event references the SHA256 hash of the previous one, making the ledger tamper-evident without full blockchain infrastructure.' },
];

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      setLoading(true);
      await api.contact(form);
      setSent(true);
    } catch (err: any) {
      setError(err.message || 'Failed to send message.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#07070f] text-white">
      <Navbar />

      {/* Hero */}
      <section className="relative pt-36 pb-20 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(99,102,241,0.12)_0%,transparent_60%)]" />
        <div className="relative max-w-3xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-sm font-medium mb-6">
            <MessageSquare className="h-4 w-4" /> Get in touch
          </motion.div>
          <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-5xl sm:text-6xl font-black mb-4">
            We'd Love to <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">Hear from You</span>
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="text-slate-400 text-lg">
            Whether you have a question, feedback, or want to explore an enterprise plan — our team responds within 24 hours.
          </motion.p>
        </div>
      </section>

      {/* Main content */}
      <section className="pb-24 px-4 max-w-6xl mx-auto">
        <div className="grid lg:grid-cols-5 gap-8">
          {/* Left – info + FAQ */}
          <div className="lg:col-span-2 space-y-6">
            {/* Contact cards */}
            {contactInfo.map(({ icon: Icon, label, value, href }, i) => (
              <motion.a
                key={label}
                href={href}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 + 0.3 }}
                className="flex items-center gap-4 p-5 bg-white/[0.03] border border-white/[0.06] rounded-2xl hover:border-indigo-500/30 transition-all duration-300 group"
              >
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600/20 to-violet-600/20 border border-indigo-500/20 flex items-center justify-center shrink-0 group-hover:border-indigo-500/40 transition-colors">
                  <Icon className="h-5 w-5 text-indigo-400" />
                </div>
                <div>
                  <p className="text-slate-500 text-xs uppercase tracking-widest mb-0.5">{label}</p>
                  <p className="text-white text-sm font-medium">{value}</p>
                </div>
              </motion.a>
            ))}

            {/* FAQ */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="mt-6">
              <h3 className="text-white font-bold text-lg mb-4">Common Questions</h3>
              <div className="space-y-4">
                {faqs.map(({ q, a }) => (
                  <div key={q} className="p-5 bg-white/[0.02] border border-white/[0.05] rounded-xl">
                    <p className="text-slate-200 font-medium text-sm mb-2">{q}</p>
                    <p className="text-slate-500 text-sm leading-relaxed">{a}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Right – form */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="lg:col-span-3"
          >
            <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-8">
              {sent ? (
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mb-4">
                    <CheckCircle className="h-8 w-8 text-emerald-400" />
                  </div>
                  <h3 className="text-white font-bold text-xl mb-2">Message Sent!</h3>
                  <p className="text-slate-400">We'll get back to you within 24 hours. Check your inbox for a confirmation.</p>
                </motion.div>
              ) : (
                <>
                  <h2 className="text-white font-bold text-2xl mb-6">Send us a message</h2>
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-400 mb-1.5">Full Name</label>
                        <input type="text" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Jane Doe" className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-all text-sm" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-400 mb-1.5">Email Address</label>
                        <input type="email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="you@example.com" className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-all text-sm" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-400 mb-1.5">Subject</label>
                      <input type="text" required value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} placeholder="How can we help?" className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-all text-sm" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-400 mb-1.5">Message</label>
                      <textarea required rows={6} value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} placeholder="Tell us more about your needs…" className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-all text-sm resize-none" />
                    </div>

                    {error && (
                      <div className="px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">{error}</div>
                    )}

                    <button type="submit" disabled={loading} className="w-full flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-50 text-white font-semibold rounded-xl transition-all duration-300 hover:shadow-[0_0_30px_rgba(99,102,241,0.4)]">
                      {loading ? <span className="animate-pulse">Sending…</span> : <><Send className="h-4 w-4" /> Send Message</>}
                    </button>
                  </form>
                </>
              )}
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
