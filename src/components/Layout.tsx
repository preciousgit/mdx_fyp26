import React, { useState, useEffect, useCallback } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { api } from '../api';
import { LogOut, Bell, X, Wallet, Unlink } from 'lucide-react';
import { Logo, Container } from './brand';
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
    { label: 'Overview', href: '/dashboard' },
    { label: 'Analytics', href: '/analytics', roles: ['regulator', 'producer'] },
    { label: 'Check a product', href: '/verify' },
    { label: 'Profile', href: '/profile' },
  ];
  const visibleNav = navItems.filter(item => !item.roles || (profile?.role && item.roles.includes(profile.role)));
  const roleLabel = ({ producer: 'Manufacturer', distributor: 'Distributor', regulator: 'Regulator', consumer: 'Consumer' } as Record<string, string>)[profile?.role || ''] || '';

  return (
    <div className="flex min-h-screen flex-col bg-mist text-ink">
      <header className="sticky top-0 z-40 border-b border-line bg-paper/95 backdrop-blur">
        <Container className="flex h-16 items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-8">
            <Logo />
            <nav aria-label="Workspace" className="hidden md:flex items-center gap-1 text-[0.95rem]">
              {visibleNav.map(({ label, href }) => {
                const active = location.pathname === href;
                return (
                  <Link
                    key={href}
                    to={href}
                    aria-current={active ? 'page' : undefined}
                    className={`rounded-lg px-3 py-2 transition-colors ${active ? 'bg-ledger-50 font-semibold text-ledger-800' : 'text-muted hover:text-ink hover:bg-mist'}`}
                  >
                    {label}
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="relative flex items-center gap-2">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              aria-label={unreadCount ? `Notifications, ${unreadCount} unread` : 'Notifications'}
              className="relative rounded-lg p-2 text-muted hover:bg-mist hover:text-ink transition-colors"
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-recalled px-1 text-[10px] font-bold text-white tnum">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {walletAccount ? (
              <button
                onClick={handleDisconnectWallet}
                title={`Wallet ${walletAccount} — click to disconnect`}
                className="hidden sm:flex items-center gap-1.5 rounded-lg border border-line px-3 py-2 text-xs font-medium text-ink hover:border-recalled/40 hover:text-recalled transition-colors group"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-genuine group-hover:bg-recalled" />
                <span className="code-text">{walletAccount.slice(0, 6)}…{walletAccount.slice(-4)}</span>
                <Unlink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            ) : (
              <button
                onClick={handleConnectWallet}
                disabled={walletLoading}
                className="hidden sm:flex items-center gap-1.5 rounded-lg border border-line px-3 py-2 text-xs font-medium text-muted hover:text-ink hover:border-ledger-300 transition-colors disabled:opacity-50"
              >
                <Wallet className="h-3.5 w-3.5" />
                {walletLoading ? 'Connecting…' : 'Connect wallet'}
              </button>
            )}

            <div className="hidden lg:flex items-center gap-2.5 border-l border-line pl-3 ml-1">
              {profile?.avatar ? (
                <img src={profile.avatar} alt="" className="h-8 w-8 rounded-full object-cover" />
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-ledger-100 text-sm font-semibold text-ledger-800" aria-hidden="true">
                  {profile?.name?.[0]?.toUpperCase()}
                </div>
              )}
              <div className="leading-tight">
                <p className="text-sm font-semibold text-ink">{profile?.name}</p>
                <p className="text-xs text-muted">{roleLabel}</p>
              </div>
            </div>

            <button onClick={handleLogout} className="rounded-lg px-3 py-2 text-sm font-medium text-muted hover:bg-mist hover:text-ink transition-colors" title="Sign out">
              <span className="hidden sm:inline">Sign out</span>
              <LogOut className="h-4 w-4 sm:hidden" />
            </button>
          </div>
        </Container>

        {/* Phone: workspace links as a scrollable row */}
        <nav aria-label="Workspace" className="md:hidden border-t border-line">
          <Container className="flex gap-1 overflow-x-auto py-2 text-sm">
            {visibleNav.map(({ label, href }) => {
              const active = location.pathname === href;
              return (
                <Link key={href} to={href} aria-current={active ? 'page' : undefined}
                  className={`shrink-0 rounded-lg px-3 py-1.5 ${active ? 'bg-ledger-50 font-semibold text-ledger-800' : 'text-muted'}`}>
                  {label}
                </Link>
              );
            })}
          </Container>
        </nav>
      </header>

      {showNotifications && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)} />
          <div className="result-in fixed top-20 right-4 z-50 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-line bg-paper shadow-[0_12px_40px_-12px_rgba(21,32,27,0.25)]" role="dialog" aria-label="Notifications">
            <div className="flex items-center justify-between border-b border-line px-4 py-3">
              <h2 className="text-sm font-semibold">Notifications</h2>
              <button onClick={() => setShowNotifications(false)} aria-label="Close" className="rounded p-1 text-muted hover:text-ink"><X className="h-4 w-4" /></button>
            </div>
            <div className="max-h-96 divide-y divide-line overflow-y-auto">
              {notifications.length === 0 ? (
                <p className="px-4 py-10 text-center text-sm text-muted">No notifications yet</p>
              ) : (
                notifications.map(n => {
                  const dot = n.type === 'REVIEW' ? 'bg-caution' : n.type === 'RISK_ALERT' ? 'bg-recalled' : 'bg-genuine';
                  return (
                    <button
                      key={n.id}
                      onClick={() => { markAsRead(n.id); if (n.link) { setShowNotifications(false); navigate(n.link); } }}
                      className={`block w-full px-4 py-3 text-left hover:bg-mist transition-colors ${!n.read ? 'bg-ledger-50/60' : ''}`}
                    >
                      <div className="flex items-start gap-2.5">
                        <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${!n.read ? dot : 'bg-transparent'}`} />
                        <div className="min-w-0 flex-1">
                          <p className={`text-sm ${!n.read ? 'font-semibold text-ink' : 'text-muted'}`}>{n.title}</p>
                          <p className="mt-0.5 text-sm leading-snug text-muted">{n.message}</p>
                          <p className="mt-1 text-xs text-faint">{n.timestamp ? format(new Date(n.timestamp), 'PP · p') : ''}</p>
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
            {unreadCount > 0 && (
              <div className="border-t border-line px-4 py-2.5">
                <button onClick={() => { notifications.forEach(n => { if (!n.read) markAsRead(n.id); }); }} className="text-sm font-medium text-ledger-700 hover:underline">Mark all as read</button>
              </div>
            )}
          </div>
        </>
      )}

      <main className="flex-1">
        <Container className="py-8 sm:py-10">
          <Outlet />
        </Container>
      </main>

      <footer className="border-t border-line bg-paper">
        <Container className="flex flex-col gap-2 py-5 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>TrustChain · Proof that products are safe, not just genuine.</p>
          <div className="flex gap-5">
            <Link to="/verify" className="hover:text-ink">Check a product</Link>
            <Link to="/contact?topic=report" className="hover:text-ink">Report a product</Link>
            <Link to="/contact" className="hover:text-ink">Help</Link>
          </div>
        </Container>
      </footer>
    </div>
  );
}
