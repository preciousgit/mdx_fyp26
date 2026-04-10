import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { ShieldCheck, Twitter, Linkedin, Github, Mail, Globe } from 'lucide-react';

const footerLinks = {
  Product: [
    { label: 'Home', href: '/' },
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Verify Product', href: '/verify' },
    { label: 'Contact Us', href: '/contact' },
  ],
  Solutions: [
    { label: 'For Producers', href: '/login' },
    { label: 'For Distributors', href: '/login' },
    { label: 'For Regulators', href: '/login' },
    { label: 'For Consumers', href: '/verify' },
  ],
  Company: [
    { label: 'About', href: '/' },
    { label: 'Blog', href: '/' },
    { label: 'Privacy Policy', href: '/' },
    { label: 'Terms of Service', href: '/' },
  ],
};

const socials = [
  { icon: Twitter, label: 'Twitter', href: '#' },
  { icon: Linkedin, label: 'LinkedIn', href: '#' },
  { icon: Github, label: 'GitHub', href: '#' },
  { icon: Globe, label: 'Website', href: '#' },
];

export default function Footer() {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) { setSubscribed(true); setEmail(''); }
  };

  return (
    <footer className="relative bg-[#07070f] border-t border-white/5 overflow-hidden">
      {/* Glow orbs */}
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-8">
        {/* Newsletter banner */}
        <div className="mb-16 rounded-2xl bg-gradient-to-r from-indigo-600/20 to-violet-600/20 border border-indigo-500/20 p-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="text-xl font-bold text-white mb-1">Stay ahead of the chain</h3>
            <p className="text-slate-400 text-sm">Get supply chain insights, platform updates, and industry news delivered to your inbox.</p>
          </div>
          {subscribed ? (
            <motion.p initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-emerald-400 font-medium flex items-center gap-2">
              <span className="text-lg">✓</span> You're subscribed!
            </motion.p>
          ) : (
            <form onSubmit={handleSubscribe} className="flex gap-3 w-full md:w-auto">
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="flex-1 md:w-64 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
              />
              <button
                type="submit"
                className="px-5 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl transition-all duration-200 hover:shadow-[0_0_20px_rgba(99,102,241,0.4)] flex items-center gap-2 whitespace-nowrap"
              >
                Subscribe
              </button>
            </form>
          )}
        </div>

        {/* Main footer grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
          {/* Brand */}
          <div className="col-span-2">
            <Link to="/" className="flex items-center gap-3 mb-4 group w-fit">
              <div className="relative">
                <div className="absolute inset-0 bg-indigo-500 rounded-xl blur-md opacity-40 group-hover:opacity-70 transition-opacity" />
                <div className="relative bg-gradient-to-br from-indigo-500 to-violet-600 p-2 rounded-xl">
                  <ShieldCheck className="h-5 w-5 text-white" />
                </div>
              </div>
              <span className="text-white font-bold text-lg tracking-tight">
                Trust<span className="text-indigo-400">Chain</span>
              </span>
            </Link>
            <p className="text-slate-500 text-sm leading-relaxed mb-6 max-w-xs">
              Blockchain-style trust across every link in the supply chain. Transparent, immutable, and verifiable — always.
            </p>
            {/* Social links */}
            <div className="flex items-center gap-3">
              {socials.map(({ icon: Icon, label, href }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="w-9 h-9 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:bg-indigo-600/30 hover:border-indigo-500/50 transition-all duration-200"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(footerLinks).map(([group, links]) => (
            <div key={group}>
              <h4 className="text-white font-semibold text-sm mb-4 tracking-wide">{group}</h4>
              <ul className="space-y-3">
                {links.map(({ label, href }) => (
                  <li key={label}>
                    <Link
                      to={href}
                      className="text-slate-500 hover:text-slate-200 text-sm transition-colors duration-200"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-slate-600 text-sm">
            © {new Date().getFullYear()} TrustChain. All rights reserved.
          </p>
          <div className="flex items-center gap-2 text-slate-600 text-sm">
            <Mail className="h-4 w-4" />
            <a href="mailto:hello@trustchain.io" className="hover:text-slate-400 transition-colors">
              hello@trustchain.io
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
