'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowUpRight, Menu, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { MakersMark } from '@/components/MakersMark';

const navItems = [
  { index: '01', label: 'How it works', href: '/#how-it-works', match: 'hash:how-it-works' },
  { index: '02', label: 'Features', href: '/#features', match: 'hash:features' },
  { index: '03', label: 'Download', href: '/downloads', match: '/downloads' },
  { index: '04', label: 'Pricing', href: '/pricing', match: '/pricing' },
  { index: '05', label: 'FAQ', href: '/#faq', match: 'hash:faq' },
] as const;

export function SiteHeader() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [hash, setHash] = useState('');
  const pathname = usePathname();
  const { user } = useAuth();
  const closeMenu = () => setIsMenuOpen(false);
  const ctaHref = user ? '/dashboard' : '/auth';
  const ctaLabel = user ? 'Your account' : 'Get started';

  React.useEffect(() => {
    const sync = () => setHash(window.location.hash);
    sync();
    window.addEventListener('hashchange', sync);
    return () => window.removeEventListener('hashchange', sync);
  }, []);

  const linkActive = (match: string) => {
    if (match.startsWith('/')) return pathname === match || pathname.startsWith(`${match}/`);
    if (pathname !== '/') return false;
    return hash === `#${match.slice(5)}`;
  };

  return (
    <>
      <style>{`
        .site-header {
          --header-ink: #fbbf24;
          --header-paper: rgba(12, 12, 14, 0.82);
          position: fixed;
          top: 14px;
          left: 0;
          right: 0;
          z-index: 50;
          padding: 0 16px;
          font-family: var(--font-outfit), Outfit, sans-serif;
          pointer-events: none;
        }
        .site-header-inner {
          pointer-events: auto;
          max-width: 1120px;
          margin: 0 auto;
          position: relative;
          transform: rotate(-0.35deg);
        }
        .site-header-bar {
          display: flex;
          align-items: stretch;
          gap: 0;
          border: 1px solid rgba(255, 255, 255, 0.14);
          border-radius: 22px 30px 20px 26px;
          background: var(--header-paper);
          backdrop-filter: blur(18px) saturate(1.2);
          box-shadow:
            0 1px 0 rgba(251, 191, 36, 0.12) inset,
            0 20px 50px rgba(0, 0, 0, 0.45),
            4px 6px 0 rgba(0, 0, 0, 0.25);
          overflow: hidden;
        }
        .site-header-bar::before {
          content: '';
          position: absolute;
          inset: 0;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E");
          opacity: 0.5;
          pointer-events: none;
          mix-blend-mode: overlay;
        }
        .site-header-brand {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 12px 18px 12px 16px;
          text-decoration: none;
          color: #fff;
          border-right: 1px dashed rgba(255, 255, 255, 0.12);
          background: linear-gradient(135deg, rgba(251, 191, 36, 0.08), transparent 55%);
          flex-shrink: 0;
        }
        .site-header-mark {
          color: #fbbf24;
          flex-shrink: 0;
          filter: drop-shadow(0 2px 0 rgba(0, 0, 0, 0.4));
        }
        .site-header-title {
          display: block;
          font-size: 15px;
          font-weight: 1000;
          letter-spacing: -0.04em;
          line-height: 1.05;
        }
        .site-header-tagline {
          display: block;
          margin-top: 3px;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: rgba(255, 255, 255, 0.42);
        }
        .site-header-stamp {
          display: inline-block;
          margin-top: 6px;
          padding: 2px 7px;
          border: 1px solid rgba(251, 191, 36, 0.35);
          border-radius: 4px;
          font-size: 9px;
          font-weight: 900;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: rgba(251, 191, 36, 0.75);
          transform: rotate(-2deg);
        }
        .site-header-nav {
          display: flex;
          align-items: center;
          flex: 1;
          padding: 0 8px;
          gap: 2px;
        }
        .site-header-link {
          position: relative;
          display: flex;
          align-items: baseline;
          gap: 8px;
          padding: 10px 14px;
          text-decoration: none;
          color: rgba(255, 255, 255, 0.5);
          font-size: 13px;
          font-weight: 800;
          letter-spacing: -0.02em;
          transition: color 0.2s ease;
        }
        .site-header-link:hover {
          color: rgba(255, 255, 255, 0.92);
        }
        .site-header-link.is-active {
          color: #fff;
        }
        .site-header-link.is-active .site-header-index {
          color: var(--header-ink);
        }
        .site-header-link.is-active::after {
          content: '';
          position: absolute;
          left: 14px;
          right: 14px;
          bottom: 6px;
          height: 2px;
          background: linear-gradient(90deg, transparent, var(--header-ink) 20%, var(--header-ink) 80%, transparent);
          border-radius: 2px;
          transform: scaleX(1) rotate(-0.5deg);
          opacity: 0.9;
        }
        .site-header-index {
          font-size: 10px;
          font-weight: 1000;
          letter-spacing: 0.08em;
          color: rgba(255, 255, 255, 0.22);
          font-variant-numeric: tabular-nums;
        }
        .site-header-cta-wrap {
          display: flex;
          align-items: center;
          padding: 8px 10px 8px 0;
          flex-shrink: 0;
        }
        .site-header-cta {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 11px 18px 11px 16px;
          border-radius: 14px 18px 12px 16px;
          background: #fbbf24;
          color: #111;
          text-decoration: none;
          font-size: 12px;
          font-weight: 1000;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          border: 1.5px solid #111;
          box-shadow: 2px 3px 0 #111;
          transition: transform 0.15s ease, box-shadow 0.15s ease;
        }
        .site-header-cta:hover {
          transform: translate(-1px, -1px);
          box-shadow: 3px 4px 0 #111;
        }
        .site-header-menu-btn {
          display: none;
          width: 44px;
          height: 44px;
          margin: 8px;
          border-radius: 12px 14px 11px 13px;
          border: 1px solid rgba(255, 255, 255, 0.14);
          background: rgba(255, 255, 255, 0.05);
          color: #fff;
          place-items: center;
          cursor: pointer;
        }
        .site-header-mobile {
          border-top: 1px dashed rgba(255, 255, 255, 0.12);
          padding: 12px 14px 14px;
          display: grid;
          gap: 4px;
          background: rgba(0, 0, 0, 0.35);
        }
        .site-header-mobile .site-header-link {
          padding: 12px 10px;
          border-radius: 10px;
        }
        .site-header-mobile .site-header-link:hover {
          background: rgba(255, 255, 255, 0.04);
        }
        .site-header-rule {
          position: absolute;
          top: -6px;
          right: 28px;
          width: 48px;
          height: 6px;
          background: var(--header-ink);
          border-radius: 2px;
          transform: rotate(4deg);
          opacity: 0.85;
        }
        @media (max-width: 900px) {
          .site-header-nav,
          .site-header-cta-wrap { display: none !important; }
          .site-header-menu-btn { display: grid !important; }
          .site-header-brand { flex: 1; border-right: none; }
          .site-header-bar { flex-wrap: wrap; }
        }
      `}</style>

      <header className="site-header">
        <div className="site-header-inner">
          <span className="site-header-rule" aria-hidden />
          <nav className="site-header-bar" aria-label="Main navigation">
            <Link href="/" onClick={closeMenu} className="site-header-brand">
              <MakersMark className="site-header-mark" />
              <span>
                <span className="site-header-title">DreamBees</span>
                <span className="site-header-tagline">Desktop atelier</span>
                <span className="site-header-stamp">Handmade tools</span>
              </span>
            </Link>

            <div className="site-header-nav">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`site-header-link${linkActive(item.match) ? ' is-active' : ''}`}
                >
                  <span className="site-header-index">{item.index}</span>
                  <span>{item.label}</span>
                </Link>
              ))}
            </div>

            <div className="site-header-cta-wrap">
              <Link href={ctaHref} className="site-header-cta">
                {ctaLabel}
                <ArrowUpRight size={14} strokeWidth={2.5} />
              </Link>
            </div>

            <button
              type="button"
              className="site-header-menu-btn"
              onClick={() => setIsMenuOpen((v) => !v)}
              aria-label="Toggle navigation"
              aria-expanded={isMenuOpen}
            >
              {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>

            <AnimatePresence>
              {isMenuOpen && (
                <motion.div
                  className="site-header-mobile"
                  style={{ width: '100%' }}
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                >
                  {navItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={closeMenu}
                      className={`site-header-link${linkActive(item.match) ? ' is-active' : ''}`}
                    >
                      <span className="site-header-index">{item.index}</span>
                      <span>{item.label}</span>
                    </Link>
                  ))}
                  <Link href={ctaHref} onClick={closeMenu} className="site-header-cta" style={{ marginTop: 8, justifyContent: 'center' }}>
                    {ctaLabel}
                    <ArrowUpRight size={14} strokeWidth={2.5} />
                  </Link>
                </motion.div>
              )}
            </AnimatePresence>
          </nav>
        </div>
      </header>
    </>
  );
}
