import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { PackageSearch, ArrowRight, ShieldCheck } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function ConsumerPortal() {
  const [searchId, setSearchId] = useState('');
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchId.trim()) navigate(`/product/${searchId.trim()}`);
  };

  return (
    <div className="min-h-screen bg-[#07070f] text-white flex flex-col">
      <Navbar />

      <section className="flex-1 flex items-center justify-center px-4 py-32 relative overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(99,102,241,0.12)_0%,transparent_60%)]" />
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.3) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.3) 1px,transparent 1px)', backgroundSize: '60px 60px' }} />
        <div className="relative max-w-lg w-full text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-linear-to-br from-indigo-500 to-violet-600 mb-8 shadow-[0_0_60px_rgba(99,102,241,0.4)] float"
          >
            <PackageSearch className="h-10 w-10 text-white" />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl font-black mb-4"
          >
            Verify a <span className="bg-linear-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">Product</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-slate-400 text-lg mb-10"
          >
            Enter a product ID to view its full origin-to-shelf journey, compliance status, and consumer reviews.
          </motion.p>

          <motion.form
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            onSubmit={handleSearch}
            className="flex gap-3"
          >
            <input
              type="text"
              required
              placeholder="e.g. CCA-12345"
              value={searchId}
              onChange={e => setSearchId(e.target.value)}
              className="flex-1 px-5 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500 focus:bg-white/[0.07] transition-all font-mono"
            />
            <button
              type="submit"
              className="flex items-center gap-2 px-6 py-4 bg-linear-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold rounded-2xl transition-all hover:shadow-[0_0_30px_rgba(99,102,241,0.4)]"
            >
              Verify <ArrowRight className="h-4 w-4" />
            </button>
          </motion.form>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-8 flex items-center justify-center gap-6 text-slate-600 text-sm"
          >
            <span className="flex items-center gap-1.5"><ShieldCheck className="h-4 w-4 text-emerald-500" /> No login required</span>
            <span className="flex items-center gap-1.5"><ShieldCheck className="h-4 w-4 text-emerald-500" /> Tamper-evident audit trail</span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-6"
          >
            <button
              onClick={() => navigate('/login')}
              className="text-slate-600 hover:text-slate-400 text-sm transition-colors"
            >
              Sign in to your account →
            </button>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
