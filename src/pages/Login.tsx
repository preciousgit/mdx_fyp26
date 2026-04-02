import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db, googleProvider, signInWithPopup, signOut, doc, getDoc, setDoc, serverTimestamp, signInWithEmailAndPassword, createUserWithEmailAndPassword } from '../firebase';
import { useAuth, Role } from '../AuthContext';
import { ShieldCheck, Package, Truck, UserCircle } from 'lucide-react';

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const getGoogleAuthErrorMessage = (errorCode?: string, rawMessage?: string) => {
  switch (errorCode) {
    case 'auth/configuration-not-found':
    case 'auth/operation-not-allowed':
      return 'Google sign-in is not enabled in this Firebase project. In Firebase Console, go to Authentication > Sign-in method and enable Google.';
    case 'auth/unauthorized-domain':
      return 'This domain is not authorized for Firebase Auth. Add your current host (for example localhost or your Vercel domain) in Authentication > Settings > Authorized domains.';
    case 'auth/popup-blocked':
      return 'The sign-in popup was blocked by your browser. Allow popups for this site and try again.';
    case 'auth/popup-closed-by-user':
      return 'The Google sign-in popup was closed before completion. Please try again and complete the flow.';
    case 'permission-denied':
      return 'Google sign-in succeeded, but Firestore access was denied while loading your profile. Deploy/update Firestore rules and try again.';
    case 'unavailable':
      return 'Google sign-in succeeded, but Firestore is currently unreachable. Check your internet, disable VPN/ad blockers for this site, and make sure Firestore database is created in this Firebase project.';
    default:
      return `Google login failed${errorCode ? ` (${errorCode})` : ''}${rawMessage ? `: ${rawMessage}` : '.'}`;
  }
};

export default function Login() {
  const { user, profile, setProfile } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [needsRegistration, setNeedsRegistration] = useState(false);
  const [role, setRole] = useState<Role>('consumer');
  const [companyName, setCompanyName] = useState('');
  const [companyPrefix, setCompanyPrefix] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [fullName, setFullName] = useState('');

  useEffect(() => {
    if (user && profile) {
      navigate('/dashboard');
    }
  }, [user, profile, navigate]);

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      const result = await signInWithPopup(auth, googleProvider);
      const userRef = doc(db, 'users', result.user.uid);
      let userSnap;

      try {
        userSnap = await getDoc(userRef);
      } catch (profileError: any) {
        if (profileError?.code === 'unavailable') {
          // Retry once for transient connection issues.
          await wait(1200);
          userSnap = await getDoc(userRef);
        } else {
          throw profileError;
        }
      }

      if (userSnap.exists()) {
        setProfile(userSnap.data() as any);
        navigate('/dashboard');
      } else {
        setFullName(result.user.displayName || '');
        setNeedsRegistration(true);
      }
    } catch (error: any) {
      console.error("Login error:", error);
      if (error?.code === 'unavailable') {
        // Avoid keeping a partially signed-in state when profile bootstrap cannot complete.
        await signOut(auth);
      }
      const errorCode = error?.code as string | undefined;
      alert(getGoogleAuthErrorMessage(errorCode, error?.message));
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      if (isSignUp) {
        const result = await createUserWithEmailAndPassword(auth, email, password);
        setNeedsRegistration(true);
      } else {
        const result = await signInWithEmailAndPassword(auth, email, password);
        const userRef = doc(db, 'users', result.user.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          setProfile(userSnap.data() as any);
          navigate('/dashboard');
        } else {
          setNeedsRegistration(true);
        }
      }
    } catch (error: any) {
      console.error("Email auth error:", error);
      alert(error.message || "Authentication failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;

    try {
      setLoading(true);
      const newUser = {
        uid: auth.currentUser.uid,
        role,
        name: fullName || auth.currentUser.displayName || 'Unknown User',
        email: auth.currentUser.email || email || '',
        companyName: role === 'producer' || role === 'distributor' ? companyName : '',
        companyPrefix: role === 'producer' ? companyPrefix.toUpperCase() : '',
        documentsVerified: false,
        twoFactorEnabled: false,
        createdAt: serverTimestamp(),
      };

      await setDoc(doc(db, 'users', auth.currentUser.uid), newUser);
      setProfile(newUser as any);
      navigate('/dashboard');
    } catch (error) {
      console.error("Registration error:", error);
      alert("Failed to complete registration.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <ShieldCheck className="h-12 w-12 text-indigo-600" />
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          TrustChain Traceability
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Blockchain-style trust across the supply chain
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {!needsRegistration ? (
            <div>
              <form onSubmit={handleEmailAuth} className="space-y-6 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email address</label>
                  <div className="mt-1">
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Password</label>
                  <div className="mt-1">
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                  {loading ? 'Processing...' : (isSignUp ? 'Create Account' : 'Sign In')}
                </button>
              </form>

              <div className="text-sm text-center mb-6">
                <button
                  type="button"
                  onClick={() => setIsSignUp(!isSignUp)}
                  className="font-medium text-indigo-600 hover:text-indigo-500"
                >
                  {isSignUp ? 'Already have an account? Sign in' : 'Need an account? Sign up'}
                </button>
              </div>

              <div className="relative mb-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">Or continue with</span>
                </div>
              </div>

              <button
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {loading ? 'Signing in...' : 'Google'}
              </button>

              <div className="mt-6">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-500">Or verify a product</span>
                  </div>
                </div>
                <div className="mt-6">
                  <button
                    onClick={() => navigate('/verify')}
                    className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Consumer Portal
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleRegister} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">Select your role</label>
                <div className="mt-4 grid grid-cols-2 gap-4">
                  {[
                    { id: 'producer', icon: Package, label: 'Producer' },
                    { id: 'distributor', icon: Truck, label: 'Distributor' },
                    { id: 'regulator', icon: ShieldCheck, label: 'Regulator' },
                    { id: 'consumer', icon: UserCircle, label: 'Consumer' },
                  ].map((r) => (
                    <div
                      key={r.id}
                      onClick={() => setRole(r.id as Role)}
                      className={`cursor-pointer border rounded-lg p-4 flex flex-col items-center justify-center ${role === r.id ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-gray-300 hover:bg-gray-50'
                        }`}
                    >
                      <r.icon className="h-6 w-6 mb-2" />
                      <span className="text-sm font-medium">{r.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">
                  Full Name
                </label>
                <div className="mt-1">
                  <input
                    id="fullName"
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>
              </div>

              {(role === 'producer' || role === 'distributor') && (
                <div>
                  <label htmlFor="companyName" className="block text-sm font-medium text-gray-700">
                    Company Name
                  </label>
                  <div className="mt-1">
                    <input
                      id="companyName"
                      type="text"
                      required
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                  </div>
                </div>
              )}

              {role === 'producer' && (
                <div>
                  <label htmlFor="companyPrefix" className="block text-sm font-medium text-gray-700">
                    Unique Company Prefix (e.g., CCA)
                  </label>
                  <div className="mt-1">
                    <input
                      id="companyPrefix"
                      type="text"
                      required
                      maxLength={5}
                      value={companyPrefix}
                      onChange={(e) => setCompanyPrefix(e.target.value)}
                      className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm uppercase"
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {loading ? 'Completing...' : 'Complete Registration'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
