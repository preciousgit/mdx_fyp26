import React, { useEffect, useId, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, ChevronLeft, Factory, Truck, UserRound } from 'lucide-react';
import { api } from '../api';
import { useAuth, Role } from '../AuthContext';
import { Logo, DataMatrix } from '../components/brand';

/* Regulators are not offered self sign-up: their accounts can recall products
   and see every company's data, so they are created by invitation only. */
const roles: { id: Role; icon: typeof Factory; label: string; desc: string }[] = [
  { id: 'producer', icon: Factory, label: 'Manufacturer or brand', desc: 'Register products and print codes' },
  { id: 'distributor', icon: Truck, label: 'Distributor', desc: 'Record handoffs and storage conditions' },
  { id: 'consumer', icon: UserRound, label: 'Shopper', desc: 'Check products and leave reviews' },
];

const field = 'w-full rounded-lg border border-line bg-paper px-3.5 py-3 text-[0.98rem] text-ink placeholder:text-faint focus:border-ledger-500 focus:outline-none';

export default function Login() {
  const { user, profile, login } = useAuth();
  const navigate = useNavigate();
  const ids = { email: useId(), pass: useId(), name: useId(), co: useId(), prefix: useId() };
  const [step, setStep] = useState<'auth' | 'role'>('auth');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [role, setRole] = useState<Role>('producer');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [companyPrefix, setCompanyPrefix] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (user && profile) navigate('/dashboard');
  }, [user, profile, navigate]);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (isSignUp) {
      if (password.length < 10) { setError('Use at least 10 characters for your password.'); return; }
      setStep('role');
      return;
    }
    try {
      setLoading(true);
      const result = await api.auth.login(email, password);
      login(result.token, result.user);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Email or password is incorrect.');
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
        email,
        password,
        role,
        name: fullName,
        companyName: role === 'producer' || role === 'distributor' ? companyName : '',
        companyPrefix: role === 'producer' ? companyPrefix.toUpperCase() : '',
      });
      login(result.token, result.user);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'We couldn’t create your account. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid min-h-screen bg-paper text-ink lg:grid-cols-[1fr_1.1fr]">
      {/* Context panel */}
      <aside className="hidden flex-col justify-between bg-ledger-800 p-12 text-white lg:flex">
        <Logo inverted />
        <div className="max-w-md">
          <div className="inline-block rounded-lg bg-white p-3">
            <DataMatrix seed="sign-in" size={96} modules={14} color="#0E4D3A" />
          </div>
          <p className="display-md mt-8 text-[2.2rem]">Every pack, one record, shared by everyone who handles it.</p>
          <p className="mt-4 leading-relaxed text-ledger-100">
            Manufacturers register batches, distributors log each handoff, regulators see the whole chain and shoppers check before they buy.
          </p>
        </div>
        <p className="text-sm text-ledger-200">Shopping? You don't need an account. <Link to="/verify" className="underline underline-offset-2 hover:text-white">Check a product</Link></p>
      </aside>

      {/* Form */}
      <main className="flex items-center justify-center px-4 py-12 sm:px-8">
        <div className="w-full max-w-[26rem]">
          <div className="mb-10 lg:hidden"><Logo /></div>

          {step === 'auth' ? (
            <>
              <h1 className="display-md text-[2rem]">{isSignUp ? 'Create your account' : 'Sign in'}</h1>
              <p className="mt-2 text-muted">{isSignUp ? 'For manufacturers, brands, distributors and shoppers.' : 'Welcome back to TrustChain.'}</p>

              <form onSubmit={handleEmailAuth} className="mt-8 space-y-5" noValidate={false}>
                <div>
                  <label htmlFor={ids.email} className="mb-1.5 block text-sm font-medium">Email address</label>
                  <input id={ids.email} type="email" required autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} className={field} />
                </div>
                <div>
                  <label htmlFor={ids.pass} className="mb-1.5 block text-sm font-medium">Password</label>
                  <div className="relative">
                    <input
                      id={ids.pass}
                      type={showPass ? 'text' : 'password'}
                      required
                      autoComplete={isSignUp ? 'new-password' : 'current-password'}
                      minLength={isSignUp ? 10 : undefined}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      className={`${field} pr-12`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass(s => !s)}
                      aria-label={showPass ? 'Hide password' : 'Show password'}
                      className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-2 text-muted hover:text-ink"
                    >
                      {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {isSignUp && <p className="mt-1.5 text-sm text-muted">At least 10 characters. A short phrase is easiest to remember.</p>}
                </div>

                {error && <p role="alert" className="rounded-lg bg-recalled-bg px-3.5 py-3 text-sm text-recalled">{error}</p>}

                <button type="submit" disabled={loading} className="w-full rounded-lg bg-ledger-700 py-3 font-semibold text-white hover:bg-ledger-800 disabled:opacity-60">
                  {loading ? 'Signing in…' : isSignUp ? 'Continue' : 'Sign in'}
                </button>
              </form>

              <p className="mt-6 text-sm text-muted">
                {isSignUp ? 'Already have an account?' : 'New to TrustChain?'}{' '}
                <button onClick={() => { setIsSignUp(s => !s); setError(''); }} className="font-semibold text-ledger-700 hover:underline">
                  {isSignUp ? 'Sign in' : 'Create an account'}
                </button>
              </p>
              <p className="mt-8 border-t border-line pt-6 text-sm text-muted">
                Work for a regulator? <Link to="/contact?topic=regulator" className="font-semibold text-ink hover:underline">Request regulator access</Link>
              </p>
            </>
          ) : (
            <>
              <button onClick={() => setStep('auth')} className="-ml-1 mb-6 inline-flex items-center gap-1 rounded-md px-1 py-1 text-sm text-muted hover:text-ink">
                <ChevronLeft className="h-4 w-4" /> Back
              </button>
              <h1 className="display-md text-[2rem]">About you</h1>
              <p className="mt-2 text-muted">This sets up the right workspace for you.</p>

              <form onSubmit={handleRegister} className="mt-8 space-y-5">
                <fieldset>
                  <legend className="mb-2 text-sm font-medium">I am a</legend>
                  <div className="space-y-2">
                    {roles.map(r => (
                      <label
                        key={r.id}
                        className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3.5 transition-colors ${role === r.id ? 'border-ledger-600 bg-ledger-50' : 'border-line hover:border-faint'}`}
                      >
                        <input type="radio" name="role" value={r.id} checked={role === r.id} onChange={() => setRole(r.id)} className="sr-only" />
                        <r.icon className={`h-5 w-5 shrink-0 ${role === r.id ? 'text-ledger-700' : 'text-muted'}`} aria-hidden="true" />
                        <span>
                          <span className="block font-semibold">{r.label}</span>
                          <span className="block text-sm text-muted">{r.desc}</span>
                        </span>
                      </label>
                    ))}
                  </div>
                </fieldset>

                <div>
                  <label htmlFor={ids.name} className="mb-1.5 block text-sm font-medium">Full name</label>
                  <input id={ids.name} required autoComplete="name" value={fullName} onChange={e => setFullName(e.target.value)} className={field} />
                </div>

                {(role === 'producer' || role === 'distributor') && (
                  <div>
                    <label htmlFor={ids.co} className="mb-1.5 block text-sm font-medium">Company name</label>
                    <input id={ids.co} required autoComplete="organization" value={companyName} onChange={e => setCompanyName(e.target.value)} className={field} />
                  </div>
                )}

                {role === 'producer' && (
                  <div>
                    <label htmlFor={ids.prefix} className="mb-1.5 block text-sm font-medium">Product code prefix</label>
                    <input id={ids.prefix} required maxLength={5} value={companyPrefix} onChange={e => setCompanyPrefix(e.target.value.toUpperCase())} className={`${field} code-text uppercase`} />
                    <p className="mt-1.5 text-sm text-muted">Up to 5 letters, shown at the start of your product IDs.</p>
                  </div>
                )}

                {error && <p role="alert" className="rounded-lg bg-recalled-bg px-3.5 py-3 text-sm text-recalled">{error}</p>}

                <button type="submit" disabled={loading} className="w-full rounded-lg bg-ledger-700 py-3 font-semibold text-white hover:bg-ledger-800 disabled:opacity-60">
                  {loading ? 'Creating account…' : 'Create account'}
                </button>
              </form>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
