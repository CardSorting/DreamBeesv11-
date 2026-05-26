'use client';

import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight, CheckCircle2, ChevronDown, Clock, Cloud, Cpu, ImagePlus, Lock, Monitor, Sparkles, Zap } from 'lucide-react';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';

const features = [
  { title: 'Easy to start', body: 'Write a simple idea, choose a style, and generate without learning complex settings.', icon: Sparkles },
  { title: 'Desktop-first', body: 'Keep prompts, images, and history in one focused workspace instead of scattered tabs.', icon: Monitor },
  { title: 'Private by default', body: 'Work locally first, then use cloud power only when you choose to.', icon: Lock },
];

const faqs = [
  { q: 'Is this beginner friendly?', a: 'Yes. DreamBees is presented around a simple flow: describe, choose, create, and save.' },
  { q: 'Is it a desktop app?', a: 'Yes. DreamBees Lite is positioned as a desktop AI image studio for Mac and Windows.' },
  { q: 'Can it use cloud power?', a: 'Yes. The page explains cloud generation as an optional boost, not a requirement.' },
];

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    background: '#070708',
    color: '#fff',
    fontFamily: 'Outfit, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif',
    overflowX: 'hidden',
    position: 'relative',
  },
  glowOne: {
    position: 'fixed',
    top: -260,
    left: '50%',
    width: 760,
    height: 560,
    transform: 'translateX(-50%)',
    borderRadius: 999,
    background: 'rgba(251, 191, 36, 0.12)',
    filter: 'blur(150px)',
    pointerEvents: 'none',
  },
  glowTwo: {
    position: 'fixed',
    right: -240,
    bottom: -260,
    width: 560,
    height: 560,
    borderRadius: 999,
    background: 'rgba(168, 85, 247, 0.12)',
    filter: 'blur(150px)',
    pointerEvents: 'none',
  },
  shell: {
    position: 'relative',
    zIndex: 1,
  },
  buttonPrimary: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    minHeight: 52,
    padding: '0 26px',
    borderRadius: 22,
    background: '#fbbf24',
    color: '#111',
    textDecoration: 'none',
    fontWeight: 950,
    border: 'none',
    cursor: 'pointer',
  },
  buttonSecondary: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
    padding: '0 26px',
    borderRadius: 22,
    background: 'rgba(255,255,255,0.06)',
    color: '#fff',
    textDecoration: 'none',
    fontWeight: 900,
    border: '1px solid rgba(255,255,255,0.10)',
  },
  section: {
    maxWidth: 1120,
    margin: '0 auto',
    padding: '112px 20px',
  },
  hero: {
    display: 'grid',
    gridTemplateColumns: '1.04fr 0.96fr',
    gap: 72,
    alignItems: 'center',
    paddingTop: 168,
    paddingBottom: 96,
  },
  eyebrow: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    padding: '8px 14px',
    borderRadius: 999,
    border: '1px solid rgba(251,191,36,0.24)',
    background: 'rgba(251,191,36,0.10)',
    color: '#fde68a',
    fontSize: 14,
    fontWeight: 850,
    marginBottom: 24,
  },
  h1: {
    margin: 0,
    fontSize: 'clamp(48px, 7vw, 84px)',
    lineHeight: 0.96,
    letterSpacing: '-0.06em',
    fontWeight: 1000,
    maxWidth: 760,
  },
  lead: {
    margin: '26px 0 0',
    color: 'rgba(226,232,240,0.86)',
    fontSize: 20,
    lineHeight: 1.65,
    maxWidth: 640,
  },
  heroActions: {
    display: 'flex',
    gap: 14,
    flexWrap: 'wrap',
    marginTop: 34,
  },
  trust: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 24,
  },
  pill: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    padding: '9px 12px',
    borderRadius: 999,
    border: '1px solid rgba(255,255,255,0.10)',
    background: 'rgba(255,255,255,0.045)',
    color: 'rgba(255,255,255,0.68)',
    fontSize: 14,
    fontWeight: 800,
  },
  mockup: {
    border: '1px solid rgba(255,255,255,0.10)',
    borderRadius: 36,
    background: 'rgba(255,255,255,0.045)',
    padding: 16,
    boxShadow: '0 32px 100px rgba(0,0,0,0.38)',
  },
  mockInner: {
    border: '1px solid rgba(255,255,255,0.10)',
    borderRadius: 28,
    background: 'rgba(0,0,0,0.42)',
    padding: 22,
  },
  promptBox: {
    padding: 18,
    borderRadius: 20,
    background: 'rgba(255,255,255,0.045)',
    border: '1px solid rgba(255,255,255,0.10)',
    color: '#e5e7eb',
    lineHeight: 1.65,
    marginTop: 16,
    fontFamily: 'monospace',
  },
  preview: {
    marginTop: 16,
    aspectRatio: '4 / 3',
    borderRadius: 26,
    padding: 16,
    background: 'linear-gradient(135deg, rgba(251,191,36,0.28), rgba(168,85,247,0.18), rgba(59,130,246,0.20))',
  },
  previewInner: {
    height: '100%',
    borderRadius: 20,
    border: '1px solid rgba(255,255,255,0.12)',
    background: 'rgba(0,0,0,0.22)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 950,
    color: 'rgba(255,255,255,0.2)',
  },
  band: {
    borderTop: '1px solid rgba(255,255,255,0.08)',
    borderBottom: '1px solid rgba(255,255,255,0.08)',
    background: 'rgba(255,255,255,0.025)',
  },
  sectionHeader: {
    maxWidth: 660,
    marginBottom: 38,
  },
  h2: {
    margin: '12px 0 0',
    fontSize: 'clamp(36px, 5vw, 56px)',
    lineHeight: 1,
    letterSpacing: '-0.045em',
    fontWeight: 1000,
  },
  grid3: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: 18,
  },
  card: {
    border: '1px solid rgba(255,255,255,0.10)',
    borderRadius: 28,
    background: 'rgba(255,255,255,0.038)',
    padding: 28,
  },
  cardTitle: {
    margin: '18px 0 0',
    fontSize: 24,
    lineHeight: 1.1,
    letterSpacing: '-0.035em',
    fontWeight: 1000,
  },
  cardText: {
    margin: '12px 0 0',
    color: 'rgba(203,213,225,0.78)',
    lineHeight: 1.7,
  },
  privacy: {
    display: 'grid',
    gridTemplateColumns: '0.9fr 1.1fr',
    gap: 34,
    alignItems: 'center',
    border: '1px solid rgba(255,255,255,0.10)',
    borderRadius: 36,
    background: 'rgba(255,255,255,0.038)',
    padding: 40,
  },
  rows: {
    display: 'grid',
    gap: 12,
  },
  row: {
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    padding: 16,
    borderRadius: 20,
    background: 'rgba(0,0,0,0.24)',
    border: '1px solid rgba(255,255,255,0.09)',
    color: 'rgba(226,232,240,0.86)',
    fontWeight: 800,
  },
  faq: {
    maxWidth: 780,
    margin: '0 auto',
  },
  faqItem: {
    border: '1px solid rgba(255,255,255,0.10)',
    borderRadius: 24,
    background: 'rgba(255,255,255,0.038)',
    overflow: 'hidden',
    marginBottom: 12,
  },
  faqButton: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
    padding: '18px 20px',
    border: 0,
    background: 'transparent',
    color: '#fff',
    textAlign: 'left',
    fontWeight: 950,
    fontSize: 16,
  },
  cta: {
    maxWidth: 880,
    margin: '0 auto',
    borderRadius: 38,
    background: '#fbbf24',
    color: '#111',
    textAlign: 'center',
    padding: '52px 28px',
  },
};

const DEMOS = [
  {
    prompt: "A futuristic honey bee drone, sleek gold and black carbon fiber, glowing yellow eyes, macro photography, 8k.",
    image: "https://images.unsplash.com/photo-1558449028-b53a39d100fc?w=800&q=80",
    model: "SDXL Turbo",
    time: "0.8s"
  },
  {
    prompt: "Cyberpunk street market at night, neon signs in Japanese, rainy puddles reflecting pink and teal lights.",
    image: "https://images.unsplash.com/photo-1545156521-77bd85671d30?w=800&q=80",
    model: "Flux Pro",
    time: "1.2s"
  },
  {
    prompt: "Ethereal forest with floating glowing lanterns, fireflies, magical atmosphere, cinematic lighting.",
    image: "https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?w=800&q=80",
    model: "SDXL 1.0",
    time: "0.9s"
  }
];

function MockupDemo() {
  const [index, setIndex] = useState(0);
  const [displayedPrompt, setDisplayedPrompt] = useState("");
  const [isTyping, setIsTyping] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showImage, setShowImage] = useState(false);

  useEffect(() => {
    let timeout: any;
    const current = DEMOS[index];

    if (isTyping) {
      if (displayedPrompt.length < current.prompt.length) {
        timeout = setTimeout(() => {
          setDisplayedPrompt(current.prompt.slice(0, displayedPrompt.length + 1));
        }, 30);
      } else {
        timeout = setTimeout(() => {
          setIsTyping(false);
          setIsGenerating(true);
        }, 1000);
      }
    } else if (isGenerating) {
      timeout = setTimeout(() => {
        setIsGenerating(false);
        setShowImage(true);
      }, 2000);
    } else if (showImage) {
      timeout = setTimeout(() => {
        setShowImage(false);
        setIsTyping(true);
        setDisplayedPrompt("");
        setIndex((prev) => (prev + 1) % DEMOS.length);
      }, 4000);
    }

    return () => clearTimeout(timeout);
  }, [displayedPrompt, isTyping, isGenerating, showImage, index]);

  return (
    <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} style={styles.mockup}>
      <div style={styles.mockInner}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <strong>Studio Preview</strong>
          <div style={{ display: 'flex', gap: 8 }}>
            <span style={{ ...styles.pill, color: '#fbbf24', background: 'rgba(251,191,36,0.10)', border: '1px solid rgba(251,191,36,0.2)', fontSize: 11 }}>
              {isGenerating ? 'Synthesizing...' : isTyping ? 'Drafting...' : 'Complete'}
            </span>
          </div>
        </div>
        
        <div style={{ ...styles.promptBox, minHeight: 88, position: 'relative', fontSize: 14 }}>
          <span style={{ color: '#fbbf24', marginRight: 8, fontWeight: 900 }}>➜</span>
          {displayedPrompt}
          {isTyping && <span className="typing-cursor"></span>}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginTop: 14 }}>
          <StatusBadge icon={Cpu} label="Model" value={DEMOS[index].model} active={!isTyping} />
          <StatusBadge icon={Clock} label="Time" value={DEMOS[index].time} active={!isTyping} />
          <StatusBadge icon={Sparkles} label="Status" value="Verified" active={!isTyping} color="#34d399" />
        </div>

        <div style={{ ...styles.preview, position: 'relative', overflow: 'hidden' }}>
          <AnimatePresence mode="wait">
            {isGenerating && (
              <motion.div
                key="generating"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', background: 'rgba(0,0,0,0.6)', zIndex: 2, borderRadius: 20 }}
              >
                <div className="scan-line scan-active"></div>
                <div style={{ color: '#fbbf24', fontWeight: 1000, fontSize: 13, letterSpacing: '0.2em' }}>DIFFUSING LATENT SPACE...</div>
              </motion.div>
            )}
            {showImage && (
              <motion.img
                key="image"
                src={DEMOS[index].image}
                initial={{ opacity: 0, scale: 1.05 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 20 }}
              />
            )}
            {!isGenerating && !showImage && (
              <motion.div
                key="placeholder"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                style={styles.previewInner}
              >
                <Sparkles size={32} style={{ opacity: 0.1, marginBottom: 12 }} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}

function StatusBadge({ icon: Icon, label, value, active, color = '#fbbf24' }: { icon: any, label: string, value: string, active: boolean, color?: string }) {
  return (
    <div style={{ ...styles.promptBox, marginTop: 0, padding: '12px 14px', opacity: active ? 1 : 0.4, transition: 'all 0.5s', border: active ? `1px solid ${color}33` : styles.promptBox.border }}>
      <span style={{ color: 'rgba(255,255,255,0.38)', fontSize: 10, fontWeight: 900, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 4 }}>
        <Icon size={10} color={active ? color : 'currentColor'} /> {label}
      </span>
      <strong style={{ fontSize: 12, display: 'block', marginTop: 2, color: active ? '#fff' : 'rgba(255,255,255,0.5)' }}>{value}</strong>
    </div>
  );
}

export default function Home() {
  const [activeFaq, setActiveFaq] = useState<number | null>(0);

  return (
    <div style={styles.page}>
      <div style={styles.glowOne} />
      <div style={styles.glowTwo} />
      <style>{`
        @media (max-width: 860px) {
          .landing-hero, .landing-grid-3, .landing-privacy { grid-template-columns: 1fr !important; }
          .landing-hero { gap: 40px !important; padding-top: 140px !important; }
          .landing-section { padding-top: 72px !important; padding-bottom: 72px !important; }
          .landing-actions { flex-direction: column !important; }
          .landing-actions a { width: 100% !important; }
        }
        .typing-cursor::after {
          content: '▋';
          animation: blink 1s step-end infinite;
          color: #fbbf24;
          margin-left: 4px;
        }
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        .scan-line {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: linear-gradient(180deg, transparent 0%, rgba(251, 191, 36, 0.2) 50%, #fbbf24 50%, rgba(251, 191, 36, 0.2) 50%, transparent 100%);
          background-size: 100% 200%;
          z-index: 10;
          opacity: 0;
          mix-blend-mode: screen;
          pointer-events: none;
        }
        .scan-active {
          animation: hologramScan 1.6s ease-in-out forwards;
        }
        @keyframes hologramScan {
          0% { background-position: 0% -100%; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { background-position: 0% 200%; opacity: 0; }
        }
      `}</style>

      <SiteHeader />

      <main id="top" style={styles.shell}>
        <section className="landing-section landing-hero" style={{ ...styles.section, ...styles.hero }}>
          <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}>
            <div style={styles.eyebrow}><Sparkles size={16} /> Simple desktop AI image creation</div>
            <h1 style={styles.h1}>Create AI images without the confusing setup.</h1>
            <p style={styles.lead}>DreamBees Lite is a local-first desktop studio for turning ideas into images with clear controls, saved history, and optional cloud power.</p>
            <div className="landing-actions" style={styles.heroActions}>
              <Link href="/auth" style={styles.buttonPrimary}>Begin Journey <ArrowRight size={20} /></Link>
              <Link href="/pricing" style={styles.buttonSecondary}>View Pricing</Link>
            </div>
            <div style={styles.trust}>{['Mac & Windows', 'Private local history', 'Optional cloud boost'].map((item) => <span key={item} style={styles.pill}><CheckCircle2 size={16} color="#34d399" /> {item}</span>)}</div>
          </motion.div>

          <MockupDemo />
        </section>

        <section id="how-it-works" style={styles.band}><div className="landing-section" style={styles.section}><SectionHeader eyebrow="How it works" title="Three simple steps." /><div className="landing-grid-3" style={styles.grid3}>{[['Describe', 'Type what you want to see.', ImagePlus], ['Choose', 'Pick a style or use a simple default.', Sparkles], ['Create', 'Generate, save, and revisit your work.', ArrowRight]].map(([title, body, Icon], i) => { const I = Icon as any; return <div key={String(title)} style={styles.card}><div style={{ display: 'flex', justifyContent: 'space-between' }}><I color="#fbbf24" /><strong style={{ color: 'rgba(255,255,255,0.24)' }}>0{i + 1}</strong></div><h3 style={styles.cardTitle}>{String(title)}</h3><p style={styles.cardText}>{String(body)}</p></div>; })}</div></div></section>

        <section id="features" className="landing-section" style={styles.section}><SectionHeader eyebrow="Features" title="Only what users need first." /><div className="landing-grid-3" style={styles.grid3}>{features.map(feature => { const Icon = feature.icon; return <div key={feature.title} style={styles.card}><Icon color="#fbbf24" /><h3 style={styles.cardTitle}>{feature.title}</h3><p style={styles.cardText}>{feature.body}</p></div>; })}</div></section>

        <section id="privacy" className="landing-section" style={{ ...styles.section, paddingTop: 0 }}><div className="landing-privacy" style={styles.privacy}><div><div style={styles.eyebrow}><Lock size={16} /> Privacy</div><h2 style={styles.h2}>Local-first, explained simply.</h2></div><div style={styles.rows}>{[['Your prompts and history are organized on your desktop.', Monitor], ['Use optional cloud power only when you choose it.', Cloud], ['Simple labels replace unnecessary technical jargon.', Sparkles]].map(([copy, Icon]) => { const I = Icon as any; return <div key={String(copy)} style={styles.row}><I size={20} color="#86efac" /> {String(copy)}</div>; })}</div></div></section>

        <section id="faq" className="landing-section" style={{ ...styles.section, paddingTop: 0 }}><div style={styles.faq}><SectionHeader eyebrow="FAQ" title="Quick answers." center />{faqs.map((faq, i) => { const open = activeFaq === i; return <div key={faq.q} style={styles.faqItem}><button type="button" onClick={() => setActiveFaq(open ? null : i)} style={styles.faqButton}>{faq.q}<ChevronDown size={20} style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 160ms' }} /></button><AnimatePresence initial={false}>{open && <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}><p style={{ ...styles.cardText, padding: '0 20px 20px', margin: 0 }}>{faq.a}</p></motion.div>}</AnimatePresence></div>; })}</div></section>

        <section id="download" className="landing-section" style={{ ...styles.section, paddingTop: 0 }}><div style={styles.cta}><h2 style={{ ...styles.h2, color: '#111' }}>Start creating on desktop.</h2><p style={{ margin: '18px auto 0', maxWidth: 620, color: 'rgba(0,0,0,0.68)', fontSize: 18, lineHeight: 1.6, fontWeight: 750 }}>A cleaner first impression: clear promise, clear benefits, clear next step.</p><a href="#" style={{ ...styles.buttonPrimary, marginTop: 30, background: '#111', color: '#fff' }}>Download DreamBees Lite <ArrowRight size={20} /></a></div></section>
      </main>

      <SiteFooter />
    </div>
  );
}

function SectionHeader({ eyebrow, title, center = false }: { eyebrow: string; title: string; center?: boolean }) {
  return <div style={{ ...styles.sectionHeader, ...(center ? { marginLeft: 'auto', marginRight: 'auto', textAlign: 'center' as const } : {}) }}><span style={{ color: '#fbbf24', fontSize: 13, fontWeight: 1000, letterSpacing: '0.22em', textTransform: 'uppercase' }}>{eyebrow}</span><h2 style={styles.h2}>{title}</h2></div>;
}
