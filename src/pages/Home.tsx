import React, { useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, useInView, type Variants } from 'motion/react';
import {
  ShieldCheck, Package, Truck, BarChart3, ArrowRight, CheckCircle,
  Star, ChevronRight, Zap, Lock, Globe, Layers, Clock, TrendingUp
} from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import PlexusBackground from '../components/PlexusBackground';

// ─── Animation helpers ────────────────────────────────────────────────────────
const fadeUp: Variants = {
  hidden: { opacity: 0, y: 40 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: 'easeOut' } },
};
const stagger = (i: number): Variants => ({
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, delay: i * 0.12, ease: 'easeOut' } },
});

function Section({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  return (
    <motion.div ref={ref} initial="hidden" animate={inView ? 'show' : 'hidden'} variants={fadeUp} className={className}>
      {children}
    </motion.div>
  );
}

// ─── Static data ──────────────────────────────────────────────────────────────
const sponsors = ['Maersk', 'DHL', 'Unilever', 'Nestlé', 'Walmart', 'Amazon', 'FedEx', 'BASF', 'Pfizer', 'Toyota', 'Samsung', 'Siemens'];

const services = [
  { icon: Package, title: 'Product Registration', desc: 'Register products with unique blockchain IDs, media, and full metadata. Every item gets an immutable digital passport.', gradient: 'from-blue-600 to-cyan-400' },
  { icon: Truck, title: 'Supply Chain Tracking', desc: 'Real-time handoff logging with environmental conditions. Every transfer is cryptographically sealed on the ledger.', gradient: 'from-violet-500 to-purple-600' },
  { icon: ShieldCheck, title: 'Regulatory Compliance', desc: 'Automated risk scoring and instant regulatory review workflows. Stay ahead of compliance without the paperwork.', gradient: 'from-emerald-500 to-teal-500' },
  { icon: BarChart3, title: 'Analytics & Insights', desc: 'Deep supply chain analytics with risk heatmaps, audit trails, and consumer sentiment reports in real time.', gradient: 'from-orange-500 to-amber-500' },
];

const steps = [
  { step: '01', title: 'Register Your Product', desc: 'Upload product details, photos, and videos. A unique blockchain-style ID is instantly minted.' },
  { step: '02', title: 'Track Every Handoff', desc: 'Distributors log real-world conditions at each transfer. Temperature, humidity, location — all sealed immutably.' },
  { step: '03', title: 'Regulatory Review', desc: 'Flagged items surface automatically to regulators. One-click approvals or rejections with full audit logs.' },
  { step: '04', title: 'Consumer Verification', desc: 'Anyone can scan a product ID to verify its full origin-to-shelf journey, reviews, and compliance status.' },
];

const testimonials = [
  { name: 'Sarah Mitchell', role: 'Head of Supply Chain, NatureFresh', text: 'TrustChain gave us complete visibility across 12 distribution hubs. We reduced compliance incidents by 67% in the first quarter.', rating: 5, avatar: 'SM' },
  { name: 'David Okafor', role: 'Regulatory Director, FoodSafe EU', text: "The immutable audit trail is exactly what regulators need. We've cut inspection processing time from 5 days to under 4 hours.", rating: 5, avatar: 'DO' },
  { name: 'Priya Sharma', role: 'Operations VP, GlobalTrace Logistics', text: "Best-in-class UX for a compliance platform. Our team adopted it with zero training. The risk scoring caught 3 cold-chain breaches we would have missed.", rating: 5, avatar: 'PS' },
];

const news = [
  { tag: 'Industry', date: 'Apr 9, 2026', title: 'How Blockchain Traceability Is Reshaping Food Safety Regulations in 2026', excerpt: 'New EU mandates require end-to-end digital traceability for all imported food products by Q3 2026. Here\'s what that means for producers.', readTime: '5 min read' },
  { tag: 'Platform', date: 'Apr 2, 2026', title: 'TrustChain v2.0: Real-Time Risk Scoring and Enhanced Distributor Workflows', excerpt: 'Our latest release introduces AI-powered risk prediction, multi-media product registration, and a redesigned regulatory dashboard.', readTime: '3 min read' },
  { tag: 'Research', date: 'Mar 28, 2026', title: 'The True Cost of Supply Chain Opacity: A 2026 Global Study', excerpt: 'Opaque supply chains cost the global economy $1.7 trillion annually. This study breaks down where the losses occur and how traceability closes the gap.', readTime: '8 min read' },
];

const stats = [
  { value: '2.4M+', label: 'Products Verified' },
  { value: '98.7%', label: 'Audit Accuracy' },
  { value: '340+', label: 'Supply Chains' },
  { value: '<4h', label: 'Avg. Review Time' },
];

// ─── Component ────────────────────────────────────────────────────────────────
export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#060B14] text-white overflow-x-hidden">
      <Navbar />

      {/* ── Hero ── */}
      <section className="relative min-h-screen flex items-center justify-center px-4 overflow-hidden">
        {/* ── Plexus network layer (matches blue network image aesthetic) ── */}
        <div
          className="absolute inset-0 z-0"
          style={{
            // Fade: fully visible at bottom-left (where the network is dense),
            // dissolves toward the top-center and right edge, merging with #060B14
            WebkitMaskImage: [
              'radial-gradient(ellipse 80% 55% at 25% 80%, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.5) 45%, transparent 70%)',
              'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.3) 45%, transparent 75%)',
            ].join(','),
            maskImage: [
              'radial-gradient(ellipse 80% 55% at 25% 80%, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.5) 45%, transparent 70%)',
              'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.3) 45%, transparent 75%)',
            ].join(','),
          }}
        >
          <PlexusBackground className="absolute inset-0" />
        </div>

        {/* ── Original ambience (kept on top of plexus for depth layering) ── */}
        <div className="absolute inset-0 z-[1] pointer-events-none">
          {/* Top glow pushes through the plexus mesh giving volumetric feel */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(59,130,246,0.12)_0%,transparent_60%)]" />
          {/* Subtle colour blobs */}
          <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-indigo-600/5 rounded-full blur-3xl" />
          <div className="absolute top-1/3 right-1/4 w-[400px] h-[400px] bg-violet-600/5 rounded-full blur-3xl" />
          {/* Fine grid overlaid at very low opacity */}
          <div
            className="absolute inset-0 opacity-[0.025]"
            style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.3) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.3) 1px,transparent 1px)', backgroundSize: '60px 60px' }}
          />
          {/* Bottom vignette — hard seal against the next section */}
          <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-[#060B14] to-transparent" />
        </div>

        <div className="relative z-2 max-w-6xl mx-auto pt-32 pb-24 text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-sm font-medium mb-8"
          >
            <Zap className="h-4 w-4" />
            Blockchain-style supply chain traceability
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="text-5xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-[1.05] mb-6"
          >
            <span className="text-white">Trust Every</span>
            <br />
            <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-purple-400 bg-clip-text text-transparent">
              Link in the Chain
            </span>
          </motion.h1>

          {/* Sub */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="max-w-2xl mx-auto text-lg sm:text-xl text-slate-400 leading-relaxed mb-10"
          >
            TrustChain gives producers, distributors, regulators, and consumers a single source of truth — an immutable, cryptographically verified record of every product's journey.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
          >
            <button
              onClick={() => navigate('/login')}
              className="group flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold rounded-2xl text-lg transition-all duration-300 hover:shadow-[0_0_40px_rgba(59,130,246,0.5)] hover:-translate-y-0.5"
            >
              Start for Free
              <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              onClick={() => navigate('/verify')}
              className="flex items-center gap-2 px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-white font-semibold rounded-2xl text-lg transition-all duration-300"
            >
              Verify a Product
            </button>
          </motion.div>

          {/* Stats strip */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-white/5 rounded-2xl overflow-hidden border border-white/5"
          >
            {stats.map(({ value, label }) => (
              <div key={label} className="bg-[#0D1626] px-6 py-5 text-center">
                <div className="text-2xl font-black bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">{value}</div>
                <div className="text-xs text-slate-500 mt-1">{label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Sponsors Marquee ── */}
      <section className="py-12 border-y border-white/5 overflow-hidden">
        <p className="text-center text-slate-600 text-xs uppercase tracking-[0.2em] mb-8">Trusted by leaders across global supply chains</p>
        <div className="relative flex">
          <motion.div
            className="flex gap-16 items-center whitespace-nowrap"
            animate={{ x: ['0%', '-50%'] }}
            transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
          >
            {[...sponsors, ...sponsors].map((name, i) => (
              <span key={i} className="text-slate-600 font-bold text-lg tracking-wide hover:text-slate-400 transition-colors cursor-default select-none">
                {name}
              </span>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Services ── */}
      <section className="py-24 px-4 max-w-7xl mx-auto">
        <Section className="text-center mb-16">
          <span className="inline-block px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold uppercase tracking-widest mb-4">What We Do</span>
          <h2 className="text-4xl sm:text-5xl font-black text-white mb-4">One Platform.<br /><span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">Total Visibility.</span></h2>
          <p className="text-slate-400 text-lg max-w-xl mx-auto">Everything you need to run a transparent, compliant, and trustworthy supply chain operation.</p>
        </Section>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {services.map((s, i) => (
            <motion.div
              key={s.title}
              variants={stagger(i)}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: '-60px' }}
              whileHover={{ y: -6, transition: { duration: 0.2 } }}
              className="group relative bg-white/[0.03] border border-white/6 rounded-2xl p-6 hover:border-white/10 hover:bg-white/[0.05] transition-all duration-300 cursor-default"
            >
              <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${s.gradient} mb-5 shadow-lg`}>
                <s.icon className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-white font-bold text-lg mb-2">{s.title}</h3>
              <p className="text-slate-500 text-sm leading-relaxed">{s.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── How It Works ── */}
      <section className="py-24 px-4 bg-[#08111E]">
        <div className="max-w-5xl mx-auto">
          <Section className="text-center mb-16">
            <span className="inline-block px-4 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 text-xs font-semibold uppercase tracking-widest mb-4">How It Works</span>
            <h2 className="text-4xl sm:text-5xl font-black text-white mb-4">Four Steps to <span className="bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">Full Traceability</span></h2>
          </Section>

          <div className="space-y-6">
            {steps.map((s, i) => (
              <motion.div
                key={s.step}
                variants={stagger(i)}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, margin: '-40px' }}
                className="flex gap-6 items-start bg-white/[0.02] border border-white/[0.05] rounded-2xl p-6 hover:border-indigo-500/20 transition-colors duration-300"
              >
                <div className="shrink-0 w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-600/20 to-violet-600/20 border border-indigo-500/20 flex items-center justify-center">
                  <span className="text-indigo-400 font-black text-sm">{s.step}</span>
                </div>
                <div>
                  <h4 className="text-white font-bold text-lg mb-1">{s.title}</h4>
                  <p className="text-slate-500 text-sm leading-relaxed">{s.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── News / Blog ── */}
      <section className="py-24 px-4 max-w-7xl mx-auto">
        <Section className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-12 gap-4">
          <div>
            <span className="inline-block px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold uppercase tracking-widest mb-3">Latest News</span>
            <h2 className="text-3xl sm:text-4xl font-black text-white">From the Frontlines<br />of Supply Chain</h2>
          </div>
          <Link to="/" className="flex items-center gap-2 text-indigo-400 hover:text-indigo-300 text-sm font-semibold transition-colors">
            View all posts <ChevronRight className="h-4 w-4" />
          </Link>
        </Section>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {news.map((post, i) => (
            <motion.article
              key={post.title}
              variants={stagger(i)}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: '-60px' }}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              className="group bg-white/[0.03] border border-white/6 rounded-2xl overflow-hidden hover:border-white/10 cursor-pointer transition-all duration-300"
            >
              {/* Image placeholder */}
              <div className={`h-44 bg-gradient-to-br ${i === 0 ? 'from-indigo-900/50 to-violet-900/50' : i === 1 ? 'from-violet-900/50 to-purple-900/50' : 'from-emerald-900/50 to-teal-900/50'} flex items-center justify-center`}>
                {i === 0 ? <ShieldCheck className="h-12 w-12 text-indigo-400/40" /> : i === 1 ? <Layers className="h-12 w-12 text-violet-400/40" /> : <TrendingUp className="h-12 w-12 text-emerald-400/40" />}
              </div>
              <div className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest rounded-full bg-indigo-500/10 text-indigo-400">{post.tag}</span>
                  <span className="text-slate-600 text-xs flex items-center gap-1"><Clock className="h-3 w-3" /> {post.readTime}</span>
                </div>
                <h3 className="text-white font-bold text-base leading-snug mb-2 group-hover:text-indigo-300 transition-colors">{post.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed line-clamp-2">{post.excerpt}</p>
                <p className="text-slate-600 text-xs mt-4">{post.date}</p>
              </div>
            </motion.article>
          ))}
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section className="py-24 px-4 bg-[#08111E]">
        <div className="max-w-6xl mx-auto">
          <Section className="text-center mb-14">
            <span className="inline-block px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold uppercase tracking-widest mb-4">Testimonials</span>
            <h2 className="text-4xl sm:text-5xl font-black text-white">Trusted by the <span className="bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">Best in the Business</span></h2>
          </Section>

          <div className="grid sm:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <motion.div
                key={t.name}
                variants={stagger(i)}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, margin: '-60px' }}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                className="bg-white/[0.03] border border-white/6 rounded-2xl p-6 hover:border-white/10 transition-all duration-300"
              >
                <div className="flex gap-1 mb-4">
                  {[...Array(t.rating)].map((_, j) => (
                    <Star key={j} className="h-4 w-4 text-amber-400 fill-current" />
                  ))}
                </div>
                <p className="text-slate-300 text-sm leading-relaxed mb-6">"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
                    {t.avatar}
                  </div>
                  <div>
                    <p className="text-white font-semibold text-sm">{t.name}</p>
                    <p className="text-slate-500 text-xs">{t.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section className="py-24 px-4">
        <Section className="max-w-4xl mx-auto">
          <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-indigo-600/20 to-violet-600/20 border border-indigo-500/20 p-12 text-center">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(59,130,246,0.15)_0%,transparent_70%)]" />
            <div className="relative">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 mb-6 shadow-[0_0_40px_rgba(59,130,246,0.5)]">
                <Lock className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-4xl sm:text-5xl font-black text-white mb-4">Ready to Build Trust?</h2>
              <p className="text-slate-400 text-lg mb-8 max-w-xl mx-auto">
                Join hundreds of organisations using TrustChain to make their supply chains transparent, compliant, and consumer-ready.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={() => navigate('/login')}
                  className="group flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold rounded-2xl text-lg transition-all duration-300 hover:shadow-[0_0_40px_rgba(59,130,246,0.5)]"
                >
                  Get Started Free
                </button>
                <button
                  onClick={() => navigate('/contact')}
                  className="flex items-center justify-center gap-2 px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold rounded-2xl text-lg transition-all duration-300"
                >
                  Talk to Sales
                </button>
              </div>
            </div>
          </div>
        </Section>
      </section>

      <Footer />
    </div>
  );
}
