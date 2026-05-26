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
  const recentImages = localHistory.slice(1, 9);

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

      <main className="generator-layout">
        <aside className="input-column">
        <form onSubmit={handleGenerate} className="input-panel" aria-label="Create image">
          <section className="input-block">
            <div className="block-head">
              <span className="step-badge">1</span>
              <label htmlFor="image-prompt" className="block-title">Describe your picture</label>
            </div>
            <textarea
              id="image-prompt"
              className="prompt-input"
              placeholder="Example: A friendly bee painting a rainbow, cute sticker style"
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
            <p className="input-hint">Press Enter to create · Shift+Enter for a new line</p>

            <p className="ideas-label">Try an idea</p>
            <div className="quick-ideas" aria-label="Quick ideas">
              {quickIdeas.map((idea) => (
                <button type="button" key={idea} className="idea-chip" onClick={() => setPrompt(idea)}>
                  <IconSparkles size={14} />
                  <span>{idea}</span>
                </button>
              ))}
            </div>

            <button type="button" className="btn-ghost" onClick={() => setShowHelp((v) => !v)} aria-expanded={showHelp}>
              {showHelp ? 'Hide tips' : 'Tips for writing'}
            </button>
            {showHelp && (
              <div className="help-panel" aria-label="Simple help">
                <p><strong>Who or what</strong> + <strong>where</strong> + <strong>look</strong> (cartoon, photo, watercolor).</p>
                <p>One or two sentences is plenty.</p>
              </div>
            )}
          </section>

          <section className="input-block">
            <div className="block-head">
              <span className="step-badge">2</span>
              <span className="block-title">Pick a style</span>
            </div>
            <Link to="/" className="btn-style" aria-label="Choose style">
              <span className="btn-style-icon"><IconMagic size={20} /></span>
              <span className="btn-style-text">
                <strong>{selectedModel?.name || 'Choose a style'}</strong>
                <small>{selectedModel ? 'Tap to change' : 'Required before creating'}</small>
              </span>
              <span className="btn-style-arrow" aria-hidden="true">›</span>
            </Link>
            {availableModels?.length ? (
              <p className="input-hint">{availableModels.length} styles available</p>
            ) : null}
          </section>

          <section className="input-block input-block-action">
            <div className="block-head">
              <span className="step-badge">3</span>
              <span className="block-title">Create</span>
            </div>

            <button type="submit" className="btn-create" disabled={!canGenerate} aria-busy={generating}>
              <span className="btn-create-glow" aria-hidden="true" />
              {generating ? (
                <>
                  <IconLoader size={20} className="btn-spin" /> Creating your picture...
                </>
              ) : (
                <>
                  <IconZap size={20} fill={zaps === 'unlimited' ? '#fbbf24' : 'currentColor'} />
                  <span>{generateLabel}</span>
                  {hasCredits && zaps !== 'unlimited' && <span className="credits-tag">{zaps}</span>}
                </>
              )}
            </button>

            <ul className="ready-checklist" aria-label="Ready to create">
              <li className={currentUser ? 'done' : ''}>{currentUser ? '✓' : '○'} Signed in</li>
              <li className={selectedModel ? 'done' : ''}>{selectedModel ? '✓' : '○'} Style picked</li>
              <li className={cleanPrompt ? 'done' : ''}>{cleanPrompt ? '✓' : '○'} Description written</li>
              <li className={hasCredits ? 'done' : ''}>{hasCredits ? '✓' : '○'} Credits available</li>
              <li className={!isOffline ? 'done' : ''}>{!isOffline ? '✓' : '○'} Online</li>
            </ul>

            <GenerationTimeEstimator generating={generating} showProgressBar={true} />
          </section>
        </form>
        </aside>

        <section className="preview-column" aria-label="Preview and history">
          <div className="simple-card preview-card">
            <div className="latest-header">
              <strong>{generating ? 'Creating...' : latestImage ? 'Newest picture' : 'Your picture'}</strong>
            </div>

            <div className="preview-stage">
              {generating ? (
                <div className="preview-loading" role="status" aria-live="polite">
                  <IconLoader size={40} />
                  <span>Making your picture...</span>
                </div>
              ) : latestImage ? (
                <figure className="latest-figure">
                  <img src={getOptimizedImageUrl(latestImage.imageUrl) || ''} alt={latestImage.prompt || 'Generated image'} />
                  {latestImage.prompt ? <figcaption>{latestImage.prompt}</figcaption> : null}
                </figure>
              ) : (
                <div className="latest-empty">
                  <IconImage size={32} />
                  <span>Your picture shows up here.</span>
                </div>
              )}
            </div>
          </div>

          <div className="simple-card history-card">
            <div className="latest-header">
              <strong>Older pictures</strong>
              <Link to="/profile" className="small-link">See all</Link>
            </div>

            {recentImages.length > 0 ? (
              <div className="history-grid">
                {recentImages.map((item) => (
                  <Link key={item.id} to={`/generation/${item.id}`} className="history-thumb">
                    <img src={getOptimizedImageUrl(item.imageUrl) || ''} alt={item.prompt || 'Picture'} loading="lazy" />
                  </Link>
                ))}
              </div>
            ) : (
              <p className="history-empty">More pictures will appear here after you create them.</p>
            )}
          </div>
        </section>
      </main>

      <style>{`
        .generator-simple { min-height: 100vh; width: min(1180px, calc(100% - 28px)); margin: 0 auto; padding: 22px 0 120px; }
        .simple-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 14px; margin-bottom: 14px; }
        .simple-title h1 { font-size: clamp(1.8rem, 5vw, 3.2rem); letter-spacing: -0.06em; margin: 0 0 8px; }
        .simple-title p { margin: 0; color: var(--color-zinc-400); font-weight: 700; }
        .active-style-pill { display: inline-flex; align-items: center; gap: 6px; padding: 0 14px; border-radius: 14px; background: rgba(139, 92, 246, 0.12); border: 1px solid rgba(139, 92, 246, 0.28); color: white; font-size: 0.8rem; font-weight: 800; min-height: 42px; }
        .active-style-pill svg { color: var(--color-accent); }

        .generator-layout { display: grid; grid-template-columns: minmax(340px, 0.92fr) minmax(360px, 1.08fr); gap: 18px; align-items: start; }
        .input-column { position: sticky; top: 16px; }
        .preview-column { display: flex; flex-direction: column; gap: 12px; }
        .simple-card { border: 1px solid rgba(255,255,255,0.08); border-radius: 18px; background: rgba(255,255,255,0.03); padding: 14px; }

        /* ─── Left column: input panel ─── */
        .input-panel {
          display: flex; flex-direction: column; gap: 0;
          border-radius: 22px;
          border: 1px solid rgba(139, 92, 246, 0.22);
          background: linear-gradient(165deg, rgba(139, 92, 246, 0.08) 0%, rgba(255,255,255,0.02) 42%, rgba(0,0,0,0.2) 100%);
          box-shadow: 0 20px 50px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.06);
          overflow: hidden;
        }
        .input-block { padding: 18px 18px 20px; border-bottom: 1px solid rgba(255,255,255,0.06); }
        .input-block:last-child { border-bottom: none; }
        .input-block-action { background: rgba(0,0,0,0.15); }

        .block-head { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; }
        .step-badge {
          width: 28px; height: 28px; border-radius: 10px; flex-shrink: 0;
          display: grid; place-items: center;
          font-size: 0.8rem; font-weight: 950; color: white;
          background: linear-gradient(135deg, var(--color-accent), var(--color-dream-purple));
          box-shadow: 0 4px 12px rgba(139, 92, 246, 0.35);
        }
        .block-title { font-size: 1rem; font-weight: 950; letter-spacing: -0.02em; margin: 0; color: white; }

        .prompt-input {
          width: 100%; min-height: 128px; resize: vertical;
          border: 1px solid rgba(255,255,255,0.1); border-radius: 14px;
          background: rgba(0,0,0,0.25); color: white;
          padding: 14px 16px; font-size: 1rem; line-height: 1.5;
          outline: none; transition: border-color 0.2s, box-shadow 0.2s;
        }
        .prompt-input::placeholder { color: var(--color-zinc-500); }
        .prompt-input:focus {
          border-color: rgba(139, 92, 246, 0.75);
          box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.2);
        }

        .input-hint { margin: 8px 0 0; font-size: 0.72rem; font-weight: 700; color: var(--color-zinc-500); }
        .ideas-label { margin: 14px 0 8px; font-size: 0.7rem; font-weight: 950; text-transform: uppercase; letter-spacing: 0.08em; color: var(--color-zinc-500); }

        .quick-ideas { display: flex; flex-direction: column; gap: 8px; }
        .idea-chip {
          display: flex; align-items: flex-start; gap: 10px; width: 100%;
          text-align: left; padding: 10px 12px; border-radius: 12px;
          border: 1px solid rgba(255,255,255,0.08);
          background: rgba(255,255,255,0.03); color: var(--color-zinc-300);
          font-size: 0.8rem; font-weight: 750; line-height: 1.35;
          cursor: pointer; transition: border-color 0.2s, background 0.2s, transform 0.15s;
        }
        .idea-chip svg { flex-shrink: 0; margin-top: 2px; color: var(--color-accent); opacity: 0.85; }
        .idea-chip span { flex: 1; }
        .idea-chip:hover {
          border-color: rgba(139, 92, 246, 0.5); color: white;
          background: rgba(139, 92, 246, 0.12); transform: translateX(2px);
        }
        .idea-chip:active { transform: translateX(0) scale(0.99); }

        .btn-ghost {
          margin-top: 12px; padding: 0; border: none; background: none;
          color: var(--color-accent); font-size: 0.8rem; font-weight: 850;
          cursor: pointer; text-decoration: underline; text-underline-offset: 3px;
        }
        .btn-ghost:hover { color: white; }

        .help-panel {
          margin-top: 10px; padding: 12px 14px; border-radius: 12px;
          background: rgba(139, 92, 246, 0.1); border: 1px solid rgba(139, 92, 246, 0.2);
          color: var(--color-zinc-300); font-size: 0.82rem; line-height: 1.45; font-weight: 650;
        }
        .help-panel p { margin: 0 0 6px; }
        .help-panel p:last-child { margin-bottom: 0; }

        .btn-style {
          display: flex; align-items: center; gap: 12px; width: 100%;
          min-height: 64px; padding: 12px 14px; border-radius: 14px;
          border: 1px solid rgba(255,255,255,0.1);
          background: rgba(0,0,0,0.2);
          color: white; text-decoration: none;
          transition: border-color 0.2s, background 0.2s, box-shadow 0.2s;
        }
        .btn-style:hover {
          border-color: rgba(139, 92, 246, 0.55);
          background: rgba(139, 92, 246, 0.12);
          box-shadow: 0 8px 24px rgba(139, 92, 246, 0.15);
        }
        .btn-style-icon {
          width: 40px; height: 40px; border-radius: 12px; flex-shrink: 0;
          display: grid; place-items: center;
          background: rgba(139, 92, 246, 0.2); color: var(--color-accent);
          border: 1px solid rgba(139, 92, 246, 0.3);
        }
        .btn-style-text { flex: 1; min-width: 0; text-align: left; }
        .btn-style-text strong { display: block; font-size: 0.95rem; font-weight: 950; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .btn-style-text small { display: block; margin-top: 2px; font-size: 0.72rem; font-weight: 700; color: var(--color-zinc-500); }
        .btn-style-arrow { font-size: 1.5rem; font-weight: 300; color: var(--color-zinc-500); line-height: 1; }

        .btn-create {
          position: relative; width: 100%; min-height: 56px; border: none; border-radius: 14px;
          background: linear-gradient(135deg, #7c3aed 0%, var(--color-accent) 45%, var(--color-dream-purple) 100%);
          color: white; font-size: 1.05rem; font-weight: 950;
          display: inline-flex; align-items: center; justify-content: center; gap: 10px;
          cursor: pointer; overflow: hidden;
          box-shadow: 0 14px 32px rgba(139, 92, 246, 0.35), inset 0 1px 0 rgba(255,255,255,0.2);
          transition: transform 0.2s ease, box-shadow 0.2s ease, filter 0.2s;
        }
        .btn-create-glow {
          position: absolute; inset: 0;
          background: radial-gradient(circle at 30% 0%, rgba(255,255,255,0.25), transparent 55%);
          pointer-events: none;
        }
        .btn-create:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 18px 40px rgba(139, 92, 246, 0.45), inset 0 1px 0 rgba(255,255,255,0.25);
          filter: brightness(1.05);
        }
        .btn-create:active:not(:disabled) { transform: translateY(0); }
        .btn-create:disabled {
          cursor: not-allowed; color: var(--color-zinc-500);
          background: rgba(255,255,255,0.06); box-shadow: none; filter: none;
        }
        .btn-create .credits-tag {
          margin-left: 4px; padding: 3px 8px; border-radius: 8px;
          background: rgba(0,0,0,0.25); font-size: 0.8rem; font-weight: 900;
        }
        .btn-spin { animation: spin 1s linear infinite; }

        .ready-checklist {
          list-style: none; margin: 14px 0 0; padding: 12px 14px;
          border-radius: 12px; background: rgba(0,0,0,0.2);
          border: 1px solid rgba(255,255,255,0.06);
          display: grid; gap: 6px;
        }
        .ready-checklist li {
          font-size: 0.78rem; font-weight: 800; color: var(--color-zinc-500);
          letter-spacing: 0.01em;
        }
        .ready-checklist li.done { color: var(--color-zinc-200); }

        .latest-header { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-bottom: 10px; }
        .small-link { color: var(--color-accent); text-decoration: none; font-weight: 950; font-size: 0.85rem; }
        .small-link:hover { color: white; }

        .preview-stage { min-height: 360px; border-radius: 16px; overflow: hidden; border: 1px solid rgba(255,255,255,0.08); background: rgba(0,0,0,0.12); display: flex; align-items: center; justify-content: center; }
        .preview-loading { text-align: center; color: var(--color-accent); display: grid; gap: 12px; justify-items: center; padding: 24px; }
        .preview-loading span { font-weight: 900; color: var(--color-zinc-300); }
        .preview-loading svg { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .latest-figure { margin: 0; width: 100%; height: 100%; }
        .latest-figure img { width: 100%; display: block; aspect-ratio: 1 / 1; object-fit: cover; }
        .latest-figure figcaption { padding: 10px 12px; color: var(--color-zinc-200); font-weight: 700; font-size: 0.9rem; line-height: 1.35; background: rgba(0,0,0,0.4); }
        .latest-empty { display: flex; flex-direction: column; align-items: center; gap: 10px; padding: 24px; color: var(--color-zinc-400); font-weight: 800; text-align: center; }

        .history-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
        .history-thumb { border-radius: 12px; overflow: hidden; border: 1px solid rgba(255,255,255,0.08); aspect-ratio: 1 / 1; }
        .history-thumb:hover { border-color: rgba(139, 92, 246, 0.45); }
        .history-thumb img { width: 100%; height: 100%; object-fit: cover; display: block; }
        .history-empty { margin: 0; color: var(--color-zinc-500); font-weight: 750; font-size: 0.85rem; }

        @media (max-width: 900px) {
          .generator-layout { grid-template-columns: 1fr; }
          .input-column { position: static; }
          .preview-stage { min-height: 280px; }
        }

        @media (max-width: 620px) {
          .simple-header { flex-direction: column; align-items: flex-start; }
          .active-style-pill { width: fit-content; }
          .history-grid { grid-template-columns: repeat(2, 1fr); }
        }
      `}</style>
    </div>
  );
}