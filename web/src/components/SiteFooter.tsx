'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowUpRight, Download } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { MakersMark } from '@/components/MakersMark';

const sitemap = [
  { index: '01', label: 'How it works', href: '/#how-it-works', match: 'hash:how-it-works' },
  { index: '02', label: 'Features', href: '/#features', match: 'hash:features' },
  { index: '03', label: 'Download', href: '/downloads/', match: '/downloads' },
  { index: '04', label: 'Pricing', href: '/pricing', match: '/pricing' },
  { index: '05', label: 'FAQ', href: '/#faq', match: 'hash:faq' },
] as const;

const studioNotes = [
  'Local-first workspace',
  'macOS app',
  'Optional cloud boost',
] as const;

const benchSteps = [
  { step: 'I', label: 'Describe', detail: 'Write the scene in plain words' },
  { step: 'II', label: 'Generate', detail: 'Pick a style, let the model work' },
  { step: 'III', label: 'Keep', detail: 'Save history on your desktop' },
] as const;

const tierNames: Record<string, string> = {
  free: 'Dreamer',
  pro: 'Alchemist',
  architect: 'Architect',
};

const DESKTOP_DOWNLOADS_URL =
  process.env.NEXT_PUBLIC_DESKTOP_DOWNLOADS_URL ?? 'https://dreambees-alchemist.web.app/downloads/';

function firstName(user: { displayName?: string | null; email?: string | null } | null) {
  if (!user) return null;
  if (user.displayName) return user.displayName.split(' ')[0];
  if (user.email) return user.email.split('@')[0];
  return null;
}

function atelierLogDate() {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date());
}

function ColophonStamp() {
  return (
    <svg className="site-footer-stamp-svg" viewBox="0 0 88 88" fill="none" aria-hidden>
      <circle cx="44" cy="44" r="40" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 4" opacity="0.55" />
      <circle cx="44" cy="44" r="32" stroke="currentColor" strokeWidth="2" opacity="0.35" />
      <text x="44" y="40" textAnchor="middle" fill="currentColor" fontSize="13" fontWeight="800" letterSpacing="2">
        DB
      </text>
      <text x="44" y="54" textAnchor="middle" fill="currentColor" fontSize="8" fontWeight="700" opacity="0.7" letterSpacing="1">
        ATELIER
      </text>
      <text x="44" y="66" textAnchor="middle" fill="currentColor" fontSize="7" opacity="0.5">
        2026
      </text>
    </svg>
  );
}

export function SiteFooter() {
  const [hash, setHash] = React.useState('');
  const pathname = usePathname();
  const { user, userData } = useAuth();
  const accountHref = user ? '/dashboard' : '/auth';
  const accountLabel = user ? 'Your studio' : 'Sign in';
  const name = firstName(user);
  const tier = userData?.tier || 'free';
  const tierLabel = tierNames[tier] ?? 'Dreamer';

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
        .site-footer {
          --footer-ink: #fbbf24;
          --footer-violet: rgba(139, 92, 246, 0.35);
          --footer-paper: rgba(10, 10, 12, 0.92);
          position: relative;
          z-index: 1;
          margin-top: auto;
          padding: 56px 16px 32px;
          font-family: var(--font-outfit), Outfit, sans-serif;
          color: rgba(255, 255, 255, 0.45);
        }
        .site-footer-glow {
          position: absolute;
          left: 50%;
          bottom: 40px;
          width: min(720px, 90vw);
          height: 120px;
          transform: translateX(-50%);
          background: radial-gradient(ellipse, rgba(251, 191, 36, 0.14) 0%, transparent 70%);
          pointer-events: none;
          filter: blur(24px);
        }
        .site-footer-seam {
          max-width: 1120px;
          margin: 0 auto 14px;
          height: 1px;
          background: linear-gradient(
            90deg,
            transparent,
            rgba(251, 191, 36, 0.35) 15%,
            rgba(139, 92, 246, 0.25) 50%,
            rgba(251, 191, 36, 0.35) 85%,
            transparent
          );
          opacity: 0.8;
        }
        .site-footer-inner {
          max-width: 1120px;
          margin: 0 auto;
          transform: rotate(0.28deg);
        }
        .site-footer-panel {
          position: relative;
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 28px 18px 22px 32px;
          background: var(--footer-paper);
          backdrop-filter: blur(20px) saturate(1.15);
          box-shadow:
            0 -1px 0 rgba(251, 191, 36, 0.14) inset,
            0 -20px 48px rgba(0, 0, 0, 0.4),
            -4px 5px 0 rgba(0, 0, 0, 0.22);
          overflow: hidden;
        }
        .site-footer-panel::before {
          content: '';
          position: absolute;
          inset: 0;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.05'/%3E%3C/svg%3E");
          pointer-events: none;
          mix-blend-mode: overlay;
        }
        .site-footer-corner {
          position: absolute;
          width: 12px;
          height: 12px;
          border-color: rgba(251, 191, 36, 0.35);
          border-style: solid;
          pointer-events: none;
        }
        .site-footer-corner--tl { top: 10px; left: 10px; border-width: 1px 0 0 1px; }
        .site-footer-corner--tr { top: 10px; right: 10px; border-width: 1px 1px 0 0; }
        .site-footer-corner--bl { bottom: 10px; left: 10px; border-width: 0 0 1px 1px; }
        .site-footer-corner--br { bottom: 10px; right: 10px; border-width: 0 1px 1px 0; }
        .site-footer-notch {
          position: absolute;
          top: -5px;
          left: 48px;
          width: 64px;
          height: 5px;
          background: var(--footer-ink);
          border-radius: 2px;
          transform: rotate(-2deg);
          opacity: 0.8;
        }
        .site-footer-notch-2 {
          position: absolute;
          top: -4px;
          right: 80px;
          width: 28px;
          height: 4px;
          background: var(--footer-violet);
          border-radius: 2px;
          transform: rotate(5deg);
          opacity: 0.9;
        }
        .site-footer-top {
          display: grid;
          grid-template-columns: 1.2fr 0.8fr 0.72fr;
          gap: 0;
          border-bottom: 1px dashed rgba(255, 255, 255, 0.1);
        }
        .site-footer-brand {
          padding: 30px 26px 26px;
          border-right: 1px dashed rgba(255, 255, 255, 0.1);
          background: linear-gradient(155deg, rgba(251, 191, 36, 0.09), transparent 58%);
        }
        .site-footer-brand-row {
          display: flex;
          align-items: flex-start;
          gap: 14px;
        }
        .site-footer-mark {
          color: var(--footer-ink);
          flex-shrink: 0;
          filter: drop-shadow(0 2px 0 rgba(0, 0, 0, 0.35));
        }
        .site-footer-name {
          display: block;
          font-size: 19px;
          font-weight: 1000;
          letter-spacing: -0.04em;
          color: #fff;
          line-height: 1.05;
        }
        .site-footer-role {
          display: block;
          margin-top: 4px;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: rgba(255, 255, 255, 0.38);
        }
        .site-footer-welcome {
          margin-top: 10px;
          padding: 8px 12px;
          border-left: 2px solid var(--footer-ink);
          background: rgba(0, 0, 0, 0.22);
          border-radius: 0 8px 8px 0;
          font-size: 12px;
          font-weight: 700;
          line-height: 1.5;
          color: rgba(226, 232, 240, 0.72);
        }
        .site-footer-welcome strong {
          color: #fde68a;
          font-weight: 900;
        }
        .site-footer-blurb {
          margin: 14px 0 0;
          max-width: 300px;
          font-size: 13px;
          line-height: 1.7;
          font-weight: 600;
          color: rgba(226, 232, 240, 0.52);
        }
        .site-footer-notes {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 18px;
        }
        .site-footer-note {
          padding: 5px 10px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 6px 9px 5px 7px;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: rgba(251, 191, 36, 0.72);
          background: rgba(0, 0, 0, 0.28);
        }
        .site-footer-sitemap {
          padding: 30px 24px 26px;
          border-right: 1px dashed rgba(255, 255, 255, 0.1);
        }
        .site-footer-heading {
          margin: 0 0 18px;
          font-size: 10px;
          font-weight: 1000;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: var(--footer-ink);
        }
        .site-footer-links {
          display: grid;
          gap: 2px;
          list-style: none;
          margin: 0;
          padding: 0;
        }
        .site-footer-link {
          position: relative;
          display: flex;
          align-items: baseline;
          gap: 10px;
          padding: 7px 8px 7px 4px;
          margin-left: -4px;
          border-radius: 8px;
          text-decoration: none;
          color: rgba(255, 255, 255, 0.46);
          font-size: 13px;
          font-weight: 800;
          transition: color 0.2s ease, background 0.2s ease;
        }
        .site-footer-link:hover {
          color: rgba(255, 255, 255, 0.95);
          background: rgba(255, 255, 255, 0.04);
        }
        .site-footer-link.is-active {
          color: #fff;
          background: rgba(251, 191, 36, 0.08);
        }
        .site-footer-link.is-active .site-footer-index {
          color: var(--footer-ink);
        }
        .site-footer-link.is-active::before {
          content: '';
          position: absolute;
          left: 0;
          top: 50%;
          width: 2px;
          height: 60%;
          transform: translateY(-50%);
          background: var(--footer-ink);
          border-radius: 2px;
        }
        .site-footer-link:hover .site-footer-index,
        .site-footer-link.is-active .site-footer-index {
          color: var(--footer-ink);
        }
        .site-footer-index {
          font-size: 10px;
          font-weight: 1000;
          letter-spacing: 0.08em;
          color: rgba(255, 255, 255, 0.2);
          font-variant-numeric: tabular-nums;
          min-width: 18px;
        }
        .site-footer-colophon {
          padding: 30px 22px 26px;
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 16px;
        }
        .site-footer-stamp-wrap {
          transform: rotate(-10deg);
          color: rgba(251, 191, 36, 0.8);
          filter: drop-shadow(0 3px 6px rgba(0, 0, 0, 0.35));
        }
        .site-footer-stamp-svg {
          width: 80px;
          height: 80px;
        }
        .site-footer-meta {
          width: 100%;
          font-size: 11px;
          font-weight: 700;
          line-height: 1.75;
          color: rgba(255, 255, 255, 0.3);
          text-align: right;
        }
        .site-footer-meta strong {
          display: block;
          color: rgba(255, 255, 255, 0.58);
          font-weight: 900;
          font-size: 12px;
        }
        .site-footer-log {
          display: block;
          margin-top: 4px;
          font-variant-numeric: tabular-nums;
          letter-spacing: 0.04em;
          color: rgba(255, 255, 255, 0.22);
        }
        .site-footer-bench {
          display: grid;
          grid-template-columns: 1fr auto;
          gap: 20px;
          align-items: center;
          padding: 20px 24px;
          border-bottom: 1px dashed rgba(255, 255, 255, 0.08);
          background: rgba(0, 0, 0, 0.2);
        }
        .site-footer-bench-steps {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
        }
        .site-footer-bench-step {
          padding: 12px 14px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 12px 14px 10px 13px;
          background: rgba(255, 255, 255, 0.025);
        }
        .site-footer-bench-step-num {
          font-size: 9px;
          font-weight: 1000;
          letter-spacing: 0.16em;
          color: rgba(251, 191, 36, 0.55);
        }
        .site-footer-bench-step-label {
          display: block;
          margin-top: 4px;
          font-size: 13px;
          font-weight: 1000;
          color: rgba(255, 255, 255, 0.88);
          letter-spacing: -0.02em;
        }
        .site-footer-bench-step-detail {
          display: block;
          margin-top: 4px;
          font-size: 11px;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.34);
          line-height: 1.45;
        }
        .site-footer-actions {
          display: flex;
          flex-direction: column;
          gap: 8px;
          min-width: 168px;
        }
        .site-footer-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 12px 18px;
          border-radius: 14px 16px 12px 15px;
          font-size: 11px;
          font-weight: 1000;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          text-decoration: none;
          transition: transform 0.15s ease, box-shadow 0.15s ease;
        }
        .site-footer-btn--primary {
          background: #fbbf24;
          color: #111;
          border: 1.5px solid #111;
          box-shadow: 2px 3px 0 #111;
        }
        .site-footer-btn--primary:hover {
          transform: translate(-1px, -1px);
          box-shadow: 3px 4px 0 #111;
        }
        .site-footer-btn--ghost {
          background: rgba(255, 255, 255, 0.05);
          color: rgba(255, 255, 255, 0.75);
          border: 1px solid rgba(255, 255, 255, 0.12);
        }
        .site-footer-btn--ghost:hover {
          background: rgba(255, 255, 255, 0.09);
          color: #fff;
        }
        .site-footer-ribbon {
          padding: 16px 28px;
          text-align: center;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.02em;
          color: rgba(255, 255, 255, 0.26);
          background: rgba(0, 0, 0, 0.32);
        }
        .site-footer-ribbon em {
          font-style: normal;
          color: rgba(251, 191, 36, 0.58);
        }
        .site-footer-bar {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 12px 24px;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: rgba(255, 255, 255, 0.22);
          border-top: 1px solid rgba(255, 255, 255, 0.05);
        }
        .site-footer-bar-sep {
          opacity: 0.35;
        }
        @media (max-width: 900px) {
          .site-footer-top,
          .site-footer-bench {
            grid-template-columns: 1fr;
          }
          .site-footer-brand,
          .site-footer-sitemap {
            border-right: none;
            border-bottom: 1px dashed rgba(255, 255, 255, 0.1);
          }
          .site-footer-bench-steps {
            grid-template-columns: 1fr;
          }
          .site-footer-actions {
            flex-direction: row;
            flex-wrap: wrap;
            min-width: 0;
          }
          .site-footer-colophon {
            flex-direction: row;
            align-items: center;
            justify-content: space-between;
          }
          .site-footer-meta { text-align: left; }
          .site-footer-stamp-wrap { order: -1; }
        }
      `}</style>

      <footer className="site-footer">
        <div className="site-footer-glow" aria-hidden />
        <div className="site-footer-seam" aria-hidden />
        <div className="site-footer-inner">
          <motion.div
            className="site-footer-panel"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          >
            <span className="site-footer-notch" aria-hidden />
            <span className="site-footer-notch-2" aria-hidden />
            <span className="site-footer-corner site-footer-corner--tl" aria-hidden />
            <span className="site-footer-corner site-footer-corner--tr" aria-hidden />
            <span className="site-footer-corner site-footer-corner--bl" aria-hidden />
            <span className="site-footer-corner site-footer-corner--br" aria-hidden />

            <div className="site-footer-top">
              <section className="site-footer-brand" aria-label="Studio">
                <div className="site-footer-brand-row">
                  <MakersMark size={38} className="site-footer-mark" />
                  <div>
                    <span className="site-footer-name">DreamBees</span>
                    <span className="site-footer-role">Lite · Desktop atelier</span>
                  </div>
                </div>
                {user && name && (
                  <p className="site-footer-welcome">
                    <strong>{name}</strong> — you&apos;re on the {tierLabel} bench today.
                  </p>
                )}
                <p className="site-footer-blurb">
                  A quiet studio for turning prompts into images — saved on your machine, sharpened only when you ask for cloud power.
                </p>
                <div className="site-footer-notes">
                  {studioNotes.map((note) => (
                    <span key={note} className="site-footer-note">{note}</span>
                  ))}
                </div>
              </section>

              <nav className="site-footer-sitemap" aria-label="Footer navigation">
                <p className="site-footer-heading">Quick links</p>
                <ul className="site-footer-links">
                  {sitemap.map((item) => (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className={`site-footer-link${linkActive(item.match) ? ' is-active' : ''}`}
                      >
                        <span className="site-footer-index">{item.index}</span>
                        <span>{item.label}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>

              <aside className="site-footer-colophon" aria-label="Colophon">
                <div className="site-footer-stamp-wrap">
                  <ColophonStamp />
                </div>
                <div className="site-footer-meta">
                  <strong>© 2026 DreamBeesAI</strong>
                  <span>Edition XII · Web atelier</span>
                  <span>Stripe-secured upgrades</span>
                  <time className="site-footer-log" dateTime={new Date().toISOString().slice(0, 10)}>
                    Log · {atelierLogDate()}
                  </time>
                </div>
              </aside>
            </div>

            <div className="site-footer-bench">
              <div className="site-footer-bench-steps" aria-label="Studio workflow">
                {benchSteps.map((item) => (
                  <div key={item.step} className="site-footer-bench-step">
                    <span className="site-footer-bench-step-num">{item.step}</span>
                    <span className="site-footer-bench-step-label">{item.label}</span>
                    <span className="site-footer-bench-step-detail">{item.detail}</span>
                  </div>
                ))}
              </div>
              <div className="site-footer-actions">
                <a href={DESKTOP_DOWNLOADS_URL} className="site-footer-btn site-footer-btn--primary">
                  <Download size={14} strokeWidth={2.5} />
                  Download for macOS
                </a>
                <Link href={accountHref} className="site-footer-btn site-footer-btn--ghost">
                  {accountLabel}
                  <ArrowUpRight size={13} strokeWidth={2.5} />
                </Link>
                <Link href="/pricing" className="site-footer-btn site-footer-btn--ghost">
                  View plans
                </Link>
              </div>
            </div>

            <p className="site-footer-ribbon">
              Crafted for creators who prefer <em>desks over dashboards</em> — close the tab, keep the work on your machine.
            </p>

            <div className="site-footer-bar">
              <span>Made by hand, shipped with care</span>
              <span className="site-footer-bar-sep" aria-hidden>·</span>
              <span>dreambeesai.com</span>
              <span className="site-footer-bar-sep" aria-hidden>·</span>
              <span>No noise · No feed</span>
            </div>
          </motion.div>
        </div>
      </footer>
    </>
  );
}
