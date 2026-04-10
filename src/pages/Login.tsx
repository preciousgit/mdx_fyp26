import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { api } from '../api';
import { useAuth, Role } from '../AuthContext';
import { ShieldCheck, Package, Truck, UserCircle, ArrowRight, Eye, EyeOff, ChevronLeft } from 'lucide-react';

const roles = [
  { id: 'producer', icon: Package, label: 'Producer', desc: 'Register & track your products', gradient: 'from-indigo-500 to-blue-500' },
  { id: 'distributor', icon: Truck, label: 'Distributor', desc: 'Log handoffs & conditions', gradient: 'from-violet-500 to-purple-500' },
  { id: 'regulator', icon: ShieldCheck, label: 'Regulator', desc: 'Review & approve flagged items', gradient: 'from-emerald-500 to-teal-500' },
  { id: 'consumer', icon: UserCircle, label: 'Consumer', desc: 'Verify products & leave reviews', gradient: 'from-amber-500 to-orange-500' },
];

export default function Login() {
  const { user, profile, login } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState<'auth' | 'role'>('auth');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [role, setRole] = useState<Role>('consumer');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [companyPrefix, setCompanyPrefix] = useState('');
  const [pendingEmail, setPendingEmail] = useState('');
  const [pendingPassword, setPendingPassword] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (user && profile) navigate('/dashboard');
  }, [user, profile, navigate]);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      setLoading(true);
      if (isSignUp) {
        setPendingEmail(email);
        setPendingPassword(password);
        setStep('role');
      } else {
        const result = await api.auth.login(email, password);
        login(result.token, result.user);
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      setLoading(true);
      const result = await api.auth.register({
        email: pendingEmail,
        password: pendingPassword,
        role,
        name: fullName,
        companyName: role === 'producer' || role === 'distributor' ? companyName : '',
        companyPrefix: role === 'producer' ? companyPrefix.toUpperCase() : '',
      });
      login(result.token, result.user);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#07070f] text-white flex overflow-hidden">
      {/* Left panel – decorative */}
      <div className="hidden lg:flex lg:w-1/2 relative flex-col items-center justify-center p-12 overflow-hidden">
        {/* Gradient bg */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-950 to-[#07070f]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(99,102,241,0.2)_0%,transparent_70%)]" />
        <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-60 h-60 bg-violet-600/10 rounded-full blur-3xl" />
        {/* Grid */}
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.5) 1px,transparent 1px)', backgroundSize: '50px 50px' }} />

        <div className="relative text-center max-w-md">
          <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.7 }} className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-indigo-500 to-violet-600 mb-8 shadow-[0_0_60px_rgba(99,102,241,0.5)]">
            <ShieldCheck className="h-10 w-10 text-white" />
          </motion.div>
          <motion.h2 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="text-4xl font-black mb-4">
            Trust<span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">Chain</span>
          </motion.h2>
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="text-slate-400 text-lg leading-relaxed mb-10">
            Blockchain-style trust across every link in the supply chain.
          </motion.p>
          {/* Feature bullets */}
          {['Immutable audit trails', 'Real-time risk scoring', 'Multi-role access control', 'Consumer product verification'].map((f, i) => (
            <motion.div key={f} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 + i * 0.1 }} className="flex items-center gap-3 text-left mb-3">
              <div className="w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center shrink-0">
                <div className="w-2 h-2 rounded-full bg-emerald-400" />
              </div>
              <span className="text-slate-300 text-sm">{f}</span>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Right panel – form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <Link to="/" className="flex lg:hidden items-center gap-3 mb-10 group w-fit">
            <div className="relative">
              <div className="absolute inset-0 bg-indigo-500 rounded-xl blur-md opacity-50" />
              <div className="relative bg-gradient-to-br from-indigo-500 to-violet-600 p-2 rounded-xl">
                <ShieldCheck className="h-5 w-5 text-white" />
              </div>
            </div>
            <span className="text-white font-bold text-xl">Trust<span className="text-indigo-400">Chain</span></span>
          </Link>

          <AnimatePresence mode="wait">
            {step === 'auth' ? (
              <motion.div key="auth" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.4 }}>
                <div className="mb-8">
                  <h1 className="text-3xl font-black text-white mb-2">
                    {isSignUp ? 'Create your account' : 'Welcome back'}
                  </h1>
                  <p className="text-slate-500">{isSignUp ? 'Join the TrustChain network today.' : 'Sign in to your TrustChain account.'}</p>
                </div>

                <form onSubmit={handleEmailAuth} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1.5">Email address</label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:bg-white/[0.07] transition-all text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1.5">Password</label>
                    <div className="relative">
                      <input
                        type={showPass ? 'text' : 'password'}
                        required
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:bg-white/[0.07] transition-all text-sm pr-12"
                      />
                      <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                        {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  {error && (
                    <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
                      {error}
                    </motion.div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-50 text-white font-semibold rounded-xl transition-all duration-300 hover:shadow-[0_0_30px_rgba(99,102,241,0.4)] text-sm"
                  >
                    {loading ? <span className="animate-pulse">Processing…</span> : (isSignUp ? <><span>Continue</span><ArrowRight className="h-4 w-4" /></> : 'Sign In')}
                  </button>
                </form>

                <p className="text-center text-slate-600 text-sm mt-6">
                  {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
                  <button onClick={() => { setIsSignUp(!isSignUp); setError(''); }} className="text-indigo-400 hover:text-indigo-300 font-semibold transition-colors">
                    {isSignUp ? 'Sign in' : 'Sign up'}
                  </button>
                </p>

                <div className="mt-6 pt-6 border-t border-white/5 text-center">
                  <button onClick={() => navigate('/verify')} className="text-slate-600 hover:text-slate-400 text-sm transition-colors">
                    Verify a product without signing in →
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div key="role" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.4 }}>
                <button onClick={() => setStep('auth')} className="flex items-center gap-1 text-slate-500 hover:text-slate-300 text-sm mb-8 transition-colors">
                  <ChevronLeft className="h-4 w-4" /> Back
                </button>
                <div className="mb-8">
                  <h1 className="text-3xl font-black text-white mb-2">Complete your profile</h1>
                  <p className="text-slate-500">Tell us about yourself so we can set up your workspace.</p>
                </div>

                <form onSubmit={handleRegister} className="space-y-5">
                  {/* Role selector */}
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-3">Select your role</label>
                    <div className="grid grid-cols-2 gap-3">
                      {roles.map(r => (
                        <button
                          key={r.id}
                          type="button"
                          onClick={() => setRole(r.id as Role)}
                          className={`relative p-4 rounded-xl border text-left transition-all duration-200 ${role === r.id ? 'border-indigo-500 bg-indigo-500/10' : 'border-white/10 bg-white/[0.02] hover:border-white/20'}`}
                        >
                          {role === r.id && <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-indigo-400" />}
                          <div className={`inline-flex p-2 rounded-lg bg-gradient-to-br ${r.gradient} mb-2`}>
                            <r.icon className="h-4 w-4 text-white" />
                          </div>
                          <p className="text-white font-semibold text-sm">{r.label}</p>
                          <p className="text-slate-500 text-xs mt-0.5">{r.desc}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1.5">Full Name</label>
                    <input type="text" required value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Jane Doe" className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-all text-sm" />
                  </div>

                  {(role === 'producer' || role === 'distributor') && (
                    <div>
                      <label className="block text-sm font-medium text-slate-400 mb-1.5">Company Name</label>
                      <input type="text" required value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="Acme Corp" className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-all text-sm" />
                    </div>
                  )}

                  {role === 'producer' && (
                    <div>
                      <label className="block text-sm font-medium text-slate-400 mb-1.5">Company Prefix <span className="text-slate-600">(max 5 chars, e.g. CCA)</span></label>
                      <input type="text" required maxLength={5} value={companyPrefix} onChange={e => setCompanyPrefix(e.target.value.toUpperCase())} placeholder="CCA" className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-all text-sm uppercase" />
                    </div>
                  )}

                  {error && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
                      {error}
                    </motion.div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-50 text-white font-semibold rounded-xl transition-all duration-300 hover:shadow-[0_0_30px_rgba(99,102,241,0.4)] text-sm"
                  >
                    {loading ? <span className="animate-pulse">Creating account…</span> : <><span>Join TrustChain</span><ArrowRight className="h-4 w-4" /></>}
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
