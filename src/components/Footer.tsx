import React from 'react';
import { Link } from 'react-router-dom';
import { Logo, Container } from './brand';

const columns = [
  {
    title: 'Product',
    links: [
      { label: 'Check a product', to: '/verify' },
      { label: 'For manufacturers', to: '/#manufacturers' },
      { label: 'How it works', to: '/#how-it-works' },
      { label: 'Sign in', to: '/login' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'Join the pilot', to: '/contact?topic=pilot' },
      { label: 'Contact', to: '/contact' },
      { label: 'Report a suspicious product', to: '/contact?topic=report' },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="border-t border-line bg-mist">
      <Container className="py-14">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr]">
          <div className="max-w-sm">
            <Logo />
            <p className="mt-4 text-[0.95rem] leading-relaxed text-muted">
              Unique codes and a shared record for every pack, so manufacturers, distributors, regulators and shoppers can tell real products from fakes.
            </p>
          </div>
          {columns.map(col => (
            <div key={col.title}>
              <h2 className="text-sm font-semibold text-ink">{col.title}</h2>
              <ul className="mt-4 space-y-3">
                {col.links.map(l => (
                  <li key={l.label}>
                    {l.to.includes('#')
                      ? <a href={l.to} className="text-[0.95rem] text-muted hover:text-ink">{l.label}</a>
                      : <Link to={l.to} className="text-[0.95rem] text-muted hover:text-ink">{l.label}</Link>}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-line pt-6 text-sm text-muted md:flex-row md:items-center md:justify-between">
          <p>© {new Date().getFullYear()} TrustChain. Built in Nigeria.</p>
          <p>
            If you think a medicine is fake, stop using it and report it to{' '}
            <a href="https://www.nafdac.gov.ng/" className="underline underline-offset-2 hover:text-ink" target="_blank" rel="noreferrer">NAFDAC</a>.
          </p>
        </div>
      </Container>
    </footer>
  );
}
