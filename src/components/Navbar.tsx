import React, { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { useAuth } from '../AuthContext';
import { Logo, Container } from './brand';

const links = [
  { label: 'Check a product', href: '/verify' },
  { label: 'For manufacturers', href: '/#manufacturers' },
  { label: 'How it works', href: '/#how-it-works' },
  { label: 'Contact', href: '/contact' },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { user } = useAuth();
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => setOpen(false), [location.pathname, location.hash]);

  return (
    <header className={`sticky top-0 z-50 bg-paper/95 backdrop-blur border-b transition-colors ${scrolled ? 'border-line' : 'border-transparent'}`}>
      <Container className="flex h-16 items-center justify-between gap-6">
        <Logo />

        <nav aria-label="Main" className="hidden md:flex items-center gap-7 text-[0.95rem]">
          {links.map(l => (
            l.href.includes('#') ? (
              <a key={l.href} href={l.href} className="text-muted hover:text-ink transition-colors">{l.label}</a>
            ) : (
              <NavLink
                key={l.href}
                to={l.href}
                className={({ isActive }) => `transition-colors ${isActive ? 'text-ink font-semibold' : 'text-muted hover:text-ink'}`}
              >
                {l.label}
              </NavLink>
            )
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-2">
          {user ? (
            <Link to="/dashboard" className="rounded-lg bg-ledger-700 px-4 py-2 text-sm font-semibold text-white hover:bg-ledger-800">
              Open dashboard
            </Link>
          ) : (
            <>
              <Link to="/login" className="rounded-lg px-3 py-2 text-sm font-medium text-ink hover:bg-mist">Sign in</Link>
              <Link to="/contact?topic=pilot" className="rounded-lg bg-ledger-700 px-4 py-2 text-sm font-semibold text-white hover:bg-ledger-800">
                Join the pilot
              </Link>
            </>
          )}
        </div>

        <button
          className="md:hidden -mr-2 rounded-lg p-2 text-ink hover:bg-mist"
          onClick={() => setOpen(o => !o)}
          aria-expanded={open}
          aria-controls="mobile-menu"
          aria-label={open ? 'Close menu' : 'Open menu'}
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </Container>

      {open && (
        <div id="mobile-menu" className="md:hidden border-t border-line bg-paper">
          <Container className="py-4 flex flex-col">
            {links.map(l => (
              <a key={l.href} href={l.href} className="py-3 text-[1.05rem] text-ink border-b border-line last:border-0">{l.label}</a>
            ))}
            <div className="mt-4 grid grid-cols-2 gap-3">
              <Link to={user ? '/dashboard' : '/login'} className="rounded-lg border border-line px-4 py-3 text-center font-medium">
                {user ? 'Dashboard' : 'Sign in'}
              </Link>
              <Link to="/contact?topic=pilot" className="rounded-lg bg-ledger-700 px-4 py-3 text-center font-semibold text-white">
                Join the pilot
              </Link>
            </div>
          </Container>
        </div>
      )}
    </header>
  );
}
