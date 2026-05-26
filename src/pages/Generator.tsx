/**
 * [LAYER: INFRASTRUCTURE]
 */
import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLite } from '../contexts/LiteContext';
import { getOptimizedImageUrl } from '../lite-utils';
import { IconImage, IconLoader, IconMagic, IconSparkles, IconZap } from '../icons';
import GenerationTimeEstimator from '../components/GenerationTimeEstimator';

const quickIdeas = [
  'A cozy bee studio inside a giant sunflower, soft morning light',
  'A cute bee mascot holding a tiny paintbrush, playful sticker style',
  'A premium honey jar on a marble counter, golden reflections, soft studio light',
] as const;

export default function Generator() {
  const [prompt, setPrompt] = useState('');
  const [showHelp, setShowHelp] = useState(false);

  const { selectedModel, generate, generating, localHistory, currentUser, isOffline, availableModels, zaps } = useLite();

  const cleanPrompt = prompt.trim();
  const latestImage = localHistory[0];

  const hasCredits = zaps === 'unlimited' || zaps > 0;
  const canGenerate = Boolean(cleanPrompt && selectedModel && currentUser && !isOffline && !generating && hasCredits);

  const greeting = useMemo(() => {
    const firstName = currentUser?.displayName?.split(' ')[0];
    return firstName ? `Hi ${firstName}! What should we make?` : 'What should we make?';
  }, [currentUser]);

  const generateLabel = generating
    ? 'Creating image...'
    : isOffline
      ? 'Reconnect to create'
      : !currentUser
        ? 'Sign in to create'
        : !selectedModel
          ? 'Choose a style first'
          : !hasCredits
            ? 'Out of credits'
            : cleanPrompt
              ? 'Create image'
              : 'Describe your image first';

  const handleGenerate = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!canGenerate) return;
    await generate(cleanPrompt);
    setPrompt('');
  };

  useEffect(() => {
    const handleKeys = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') handleGenerate();
    };
    window.addEventListener('keydown', handleKeys);
    return () => window.removeEventListener('keydown', handleKeys);
  }, [cleanPrompt, canGenerate]);

  return (
    <div className="generator-simple fade-in">
      <header className="simple-header" aria-label="Create header">
        <div className="simple-title">
          <h1>{greeting}</h1>
          <p>Type one sentence. Pick a style. Press Create.</p>
        </div>

        {selectedModel && (
          <div className="active-style-pill" aria-label={`Active style: ${selectedModel.name}`}>
            <IconSparkles size={12} />
            <span>{selectedModel.name}</span>
          </div>
        )}
      </header>

      <main className="simple-main">
        <form onSubmit={handleGenerate} className="simple-card" aria-label="Create image">
          <div className="simple-step">
            <div className="step-number">1</div>
            <div className="step-body">
              <label htmlFor="image-prompt" className="step-title">
                Describe your picture
              </label>
              <textarea
                id="image-prompt"
                placeholder="Example: A friendly bee painting a rainbow in the sky, cute sticker style"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleGenerate();
                  }
                }}
                maxLength={1000}
              />

              <div className="quick-ideas" aria-label="Quick ideas">
                {quickIdeas.map((idea) => (
                  <button type="button" key={idea} className="idea-chip" onClick={() => setPrompt(idea)}>
                    {idea}
                  </button>
                ))}
              </div>

              <button type="button" className="help-toggle" onClick={() => setShowHelp((v) => !v)} aria-expanded={showHelp}>
                {showHelp ? 'Hide help' : 'Need help?'}
              </button>

              {showHelp && (
                <div className="help-panel" aria-label="Simple help">
                  <ul>
                    <li>
                      Start with: <strong>who/what</strong> + <strong>place</strong> + <strong>style</strong>.
                    </li>
                    <li>Good styles: “photo”, “watercolor”, “cartoon”, “cinematic”, “3D”.</li>
                    <li>Keep it short. One or two sentences is enough.</li>
                  </ul>
                </div>
              )}
            </div>
          </div>

          <div className="simple-step">
            <div className="step-number">2</div>
            <div className="step-body">
              <div className="step-title">Pick a style</div>
              <Link to="/" className="big-link" aria-label="Choose style">
                <IconMagic size={16} />
                {selectedModel?.name ? `Style: ${selectedModel.name}` : 'Choose a style'}
              </Link>
              {availableModels?.length ? <div className="muted">You can change this anytime.</div> : null}
            </div>
          </div>

          <div className="simple-step">
            <div className="step-number">3</div>
            <div className="step-body">
              <button type="submit" className="create-button" disabled={!canGenerate} aria-busy={generating}>
                {generating ? (
                  <>
                    <IconLoader size={18} /> Creating...
                  </>
                ) : (
                  <>
                    <IconZap size={18} fill={zaps === 'unlimited' ? '#fbbf24' : 'currentColor'} /> {generateLabel}{' '}
                    {hasCredits && zaps !== 'unlimited' && `(${zaps})`}
                  </>
                )}
              </button>

              <div className="status-row" aria-label="Status">
                <span className={`status-pill ${currentUser ? 'ok' : 'warn'}`}>{currentUser ? 'Signed in' : 'Sign in needed'}</span>
                <span className={`status-pill ${selectedModel ? 'ok' : 'warn'}`}>{selectedModel ? 'Style picked' : 'Pick a style'}</span>
                <span className={`status-pill ${cleanPrompt ? 'ok' : 'warn'}`}>{cleanPrompt ? 'Description ready' : 'Type a description'}</span>
                <span className={`status-pill ${hasCredits ? 'ok' : 'warn'}`}>{hasCredits ? 'Credits OK' : 'No credits'}</span>
                <span className={`status-pill ${!isOffline ? 'ok' : 'warn'}`}>{!isOffline ? 'Online' : 'Offline'}</span>
              </div>

              <GenerationTimeEstimator generating={generating} showProgressBar={true} />
            </div>
          </div>
        </form>

        <section className="simple-card" aria-label="Latest creation">
          <div className="latest-header">
            <strong>Latest creation</strong>
            <Link to="/profile" className="small-link">
              Open history
            </Link>
          </div>

          {latestImage ? (
            <figure className="latest-figure">
              <img src={getOptimizedImageUrl(latestImage.imageUrl) || ''} alt={latestImage.prompt || 'Generated image'} />
              {latestImage.prompt ? <figcaption>{latestImage.prompt}</figcaption> : null}
            </figure>
          ) : (
            <div className="latest-empty">
              <IconImage size={22} />
              <span>Your newest image will show up here.</span>
            </div>
          )}
        </section>
      </main>

      <style>{`
        .generator-simple { min-height: 100vh; width: min(860px, calc(100% - 28px)); margin: 0 auto; padding: 22px 0 120px; }
        .simple-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 14px; margin-bottom: 14px; }
        .simple-title h1 { font-size: clamp(1.8rem, 5vw, 3.2rem); letter-spacing: -0.06em; margin: 0 0 8px; }
        .simple-title p { margin: 0; color: var(--color-zinc-400); font-weight: 700; }
        .active-style-pill { display: inline-flex; align-items: center; gap: 6px; padding: 0 14px; border-radius: 14px; background: rgba(139, 92, 246, 0.12); border: 1px solid rgba(139, 92, 246, 0.28); color: white; font-size: 0.8rem; font-weight: 800; min-height: 42px; }
        .active-style-pill svg { color: var(--color-accent); }

        .simple-main { display: grid; gap: 12px; }
        .simple-card { border: 1px solid rgba(255,255,255,0.08); border-radius: 18px; background: rgba(255,255,255,0.03); padding: 14px; }
        .simple-step { display: grid; grid-template-columns: 34px 1fr; gap: 12px; padding: 10px 6px; }
        .simple-step + .simple-step { border-top: 1px solid rgba(255,255,255,0.06); }
        .step-number { width: 34px; height: 34px; border-radius: 12px; display: grid; place-items: center; font-weight: 950; color: white; background: rgba(139, 92, 246, 0.18); border: 1px solid rgba(139, 92, 246, 0.25); }
        .step-title { display: block; font-weight: 950; margin-bottom: 8px; }
        textarea#image-prompt { width: 100%; min-height: 120px; resize: vertical; border: 1px solid rgba(255,255,255,0.09); border-radius: 16px; background: rgba(0,0,0,0.12); color: white; padding: 12px; font-size: 1rem; line-height: 1.4; outline: none; }
        textarea#image-prompt:focus { border-color: rgba(139, 92, 246, 0.8); box-shadow: 0 0 0 4px rgba(139, 92, 246, 0.14); }

        .quick-ideas { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 10px; }
        .idea-chip { text-align: left; border: 1px solid rgba(255,255,255,0.08); background: rgba(255,255,255,0.02); color: var(--color-zinc-300); padding: 8px 10px; border-radius: 14px; font-size: 0.78rem; font-weight: 800; cursor: pointer; }
        .idea-chip:hover { border-color: rgba(139, 92, 246, 0.45); color: white; background: rgba(139, 92, 246, 0.08); }

        .help-toggle { margin-top: 10px; border: 1px solid rgba(255,255,255,0.08); border-radius: 999px; background: rgba(255,255,255,0.03); color: white; padding: 8px 12px; font-size: 0.78rem; font-weight: 900; cursor: pointer; }
        .help-panel { margin-top: 10px; padding: 10px 12px; border-radius: 14px; background: rgba(139, 92, 246, 0.08); border: 1px solid rgba(139, 92, 246, 0.16); color: var(--color-zinc-200); }
        .help-panel ul { margin: 0; padding-left: 18px; display: grid; gap: 6px; }

        .big-link { display: inline-flex; align-items: center; gap: 10px; min-height: 52px; padding: 0 14px; border-radius: 16px; border: 1px solid rgba(255,255,255,0.09); background: rgba(255,255,255,0.03); color: white; text-decoration: none; font-weight: 950; }
        .big-link:hover { border-color: rgba(139, 92, 246, 0.45); background: rgba(139, 92, 246, 0.10); }
        .muted { margin-top: 6px; color: var(--color-zinc-400); font-weight: 700; font-size: 0.8rem; }

        .create-button { width: 100%; min-height: 54px; border: none; border-radius: 16px; background: linear-gradient(135deg, var(--color-accent), var(--color-dream-purple)); color: white; display: inline-flex; align-items: center; justify-content: center; gap: 8px; font-weight: 950; font-size: 1rem; cursor: pointer; box-shadow: 0 12px 24px rgba(139, 92, 246, 0.18); transition: transform 0.2s ease, box-shadow 0.2s ease; }
        .create-button:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 16px 30px rgba(139, 92, 246, 0.26); }
        .create-button:disabled { cursor: not-allowed; color: var(--color-zinc-500); background: rgba(255,255,255,0.05); box-shadow: none; }

        .status-row { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 10px; }
        .status-pill { display: inline-flex; align-items: center; padding: 6px 10px; border-radius: 999px; font-size: 0.72rem; font-weight: 950; border: 1px solid rgba(255,255,255,0.10); background: rgba(255,255,255,0.03); color: var(--color-zinc-400); }
        .status-pill.ok { color: white; border-color: rgba(34, 197, 94, 0.25); background: rgba(34, 197, 94, 0.08); }
        .status-pill.warn { border-color: rgba(245, 158, 11, 0.25); background: rgba(245, 158, 11, 0.08); }

        .latest-header { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-bottom: 10px; }
        .small-link { color: var(--color-accent); text-decoration: none; font-weight: 950; font-size: 0.85rem; }
        .small-link:hover { color: white; }
        .latest-figure { margin: 0; overflow: hidden; border-radius: 16px; border: 1px solid rgba(255,255,255,0.08); background: rgba(0,0,0,0.12); }
        .latest-figure img { width: 100%; display: block; aspect-ratio: 1 / 1; object-fit: cover; }
        .latest-figure figcaption { padding: 10px 12px; color: var(--color-zinc-200); font-weight: 700; font-size: 0.9rem; line-height: 1.35; }
        .latest-empty { display: flex; align-items: center; gap: 10px; padding: 14px; border: 1px dashed rgba(255,255,255,0.12); border-radius: 16px; color: var(--color-zinc-400); font-weight: 800; }

        @media (max-width: 620px) {
          .simple-header { flex-direction: column; align-items: flex-start; }
          .active-style-pill { width: fit-content; }
        }
      `}</style>
    </div>
  );
}