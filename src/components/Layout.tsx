import React, { useState, useEffect, useCallback } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { api } from '../api';
import { LayoutDashboard, PackageSearch, User, LogOut, Bell, ShieldCheck, X, BarChart2, Wallet, Unlink } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';
import { connectWallet, getConnectedAccount } from '../utils/wallet';

export default function Layout() {
  const { profile, user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [walletAccount, setWalletAccount] = useState<string | null>(null);
  const [walletLoading, setWalletLoading] = useState(false);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    try { setNotifications(await api.notifications.list()); } catch { /* silent */ }
  }, [user]);

  useEffect(() => {
    fetchNotifications();
    const iv = setInterval(fetchNotifications, 15000);
    return () => clearInterval(iv);
  }, [fetchNotifications]);

  // Wallet: check on mount + listen for account changes
  useEffect(() => {
    getConnectedAccount().then(setWalletAccount);
    const provider = (Array.isArray(window.ethereum?.providers)
      ? window.ethereum.providers.find((p: any) => p.isMetaMask)
      : window.ethereum) ?? null;
    if (!provider) return;
    const handler = (accounts: string[]) => setWalletAccount(accounts[0]?.toLowerCase() || null);
    provider.on('accountsChanged', handler);
    return () => provider.removeListener('accountsChanged', handler);
  }, []);

  const handleConnectWallet = async () => {
    setWalletLoading(true);
    try {
      const addr = await connectWallet();
      setWalletAccount(addr);
      await api.auth.updateProfile({ walletAddress: addr }).catch(() => {});
    } catch (err: any) {
      alert(err.message || 'Failed to connect wallet.');
    } finally {
      setWalletLoading(false);
    }
  };

  const handleDisconnectWallet = async () => {
    setWalletAccount(null);
    await api.auth.updateProfile({ walletAddress: '' }).catch(() => {});
  };

  const handleLogout = () => { logout(); navigate('/login'); };

  const markAsRead = async (id: string) => {
    await api.notifications.markRead(id).catch(console.error);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const navItems = [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Analytics', href: '/analytics', icon: BarChart2, roles: ['regulator', 'producer'] },
    { label: 'Verify', href: '/verify', icon: PackageSearch },
    { label: 'Profile', href: '/profile', icon: User },
  ];

  return (
    <div className="min-h-screen bg-[#060B14] text-white">
      {/* Top nav */}
      <nav className="fixed top-0 left-0 right-0 z-40 bg-[#08111E]/90 backdrop-blur-xl border-b border-white/6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3 group">
              <div className="relative">
                <div className="absolute inset-0 bg-indigo-500 rounded-xl blur-md opacity-40 group-hover:opacity-70 transition-opacity" />
                <div className="relative bg-linear-to-br from-indigo-500 to-violet-600 p-1.5 rounded-xl">
                  <ShieldCheck className="h-5 w-5 text-white" />
                </div>
              </div>
              <span className="text-white font-bold text-lg tracking-tight hidden sm:block">
                Trust<span className="text-indigo-400">Chain</span>
              </span>
            </Link>

            {/* Nav links */}
            <div className="flex items-center gap-1">
              {navItems.filter(item => !item.roles || (profile?.role && item.roles.includes(profile.role))).map(({ label, href, icon: Icon }) => {
                const active = location.pathname === href;
                return (
                  <Link
                    key={href}
                    to={href}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                      active
                        ? 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/20'
                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="hidden sm:block">{label}</span>
                  </Link>
                );
              })}
            </div>

            {/* Right side */}
            <div className="flex items-center gap-2 relative">
              {/* Notification bell */}
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-all"
              >
                <Bell className={`h-5 w-5 transition-colors ${unreadCount > 0 ? 'text-white' : ''}`} />
                <AnimatePresence>
                  {unreadCount > 0 && (
                    <motion.span
                      initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                      className="absolute top-0.5 right-0.5 w-4 h-4 bg-indigo-500 rounded-full text-[9px] font-bold text-white flex items-center justify-center shadow-[0_0_6px_rgba(59,130,246,0.8)]"
                    >
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </motion.span>
                  )}
                </AnimatePresence>
              </button>

              {/* User badge */}
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-white/3 border border-white/6 rounded-xl">
                {profile?.avatar ? (
                  <img src={profile.avatar} alt={profile.name} className="w-6 h-6 rounded-full object-cover" />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-linear-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-xs font-bold text-white">
                    {profile?.name?.[0]?.toUpperCase()}
                  </div>
                )}
                <div className="text-right">
                  <p className="text-white text-xs font-semibold leading-none">{profile?.name}</p>
                  <p className="text-indigo-400 text-[10px] capitalize leading-none mt-0.5">{profile?.role}</p>
                </div>
              </div>

              {/* Wallet button */}
              {walletAccount ? (
                <button
                  onClick={handleDisconnectWallet}
                  title={`Connected: ${walletAccount}`}
                  className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 hover:bg-red-500/10 border border-emerald-500/20 hover:border-red-500/20 text-emerald-400 hover:text-red-400 text-xs font-semibold rounded-xl transition-all group"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 group-hover:bg-red-400 transition-colors" />
                  <span className="font-mono">{walletAccount.slice(0, 6)}…{walletAccount.slice(-4)}</span>
                  <Unlink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              ) : (
                <button
                  onClick={handleConnectWallet}
                  disabled={walletLoading}
                  title="Connect MetaMask"
                  className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-indigo-500/10 border border-white/10 hover:border-indigo-500/20 text-slate-400 hover:text-indigo-400 text-xs font-semibold rounded-xl transition-all disabled:opacity-50"
                >
                  <Wallet className="h-3.5 w-3.5" />
                  {walletLoading ? 'Connecting…' : 'Connect'}
                </button>
              )}

              {/* Sign out — red */}
              <button onClick={handleLogout} className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 hover:border-red-500/30 text-red-400 hover:text-red-300 text-xs font-semibold rounded-xl transition-all" title="Sign out">
                <LogOut className="h-3.5 w-3.5" />
                <span className="hidden sm:block">Sign out</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Notification drawer */}
      <AnimatePresence>
        {showNotifications && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-30" onClick={() => setShowNotifications(false)} />
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.97 }}
              transition={{ duration: 0.2 }}
              className="fixed top-20 right-4 z-40 w-80 bg-[#0D1626] border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="px-4 py-3 border-b border-white/6 flex items-center justify-between">
                <h3 className="text-white font-semibold text-sm">Notifications</h3>
                <button onClick={() => setShowNotifications(false)} className="text-slate-500 hover:text-white transition-colors"><X className="h-4 w-4" /></button>
              </div>
              <div className="max-h-96 overflow-y-auto divide-y divide-white/4">
                {notifications.length === 0 ? (
                  <div className="px-4 py-8 text-center text-slate-600 text-sm">No notifications yet</div>
                ) : (
                  notifications.map(n => {
                    const dotColor = n.type === 'REVIEW' ? 'bg-amber-400' : n.type === 'RISK_ALERT' ? 'bg-red-400' : n.type === 'COMPLIANCE' ? 'bg-emerald-400' : n.type === 'SETUP_DONE' ? 'bg-emerald-400' : 'bg-indigo-400';
                    return (
                      <div
                        key={n.id}
                        onClick={() => { markAsRead(n.id); if (n.link) { setShowNotifications(false); navigate(n.link); } }}
                        className={`px-4 py-3 cursor-pointer hover:bg-white/2 transition-colors ${!n.read ? 'bg-indigo-500/5' : ''}`}
                      >
                        <div className="flex items-start gap-2">
                          <div className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${!n.read ? dotColor : 'bg-transparent'}`} />
                          <div className="flex-1 min-w-0">
                            <p className={`text-xs font-semibold ${!n.read ? 'text-white' : 'text-slate-400'}`}>{n.title}</p>
                            <p className="text-slate-500 text-xs mt-0.5 leading-relaxed">{n.message}</p>
                            <p className="text-slate-700 text-[10px] mt-1">{n.timestamp ? format(new Date(n.timestamp), 'PP · p') : ''}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
              {notifications.length > 0 && unreadCount > 0 && (
                <div className="px-4 py-2.5 border-t border-white/6">
                  <button onClick={() => { notifications.forEach(n => { if (!n.read) markAsRead(n.id); }); }} className="text-indigo-400 hover:text-indigo-300 text-xs transition-colors">Mark all as read</button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Page content */}
      <main className="pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
