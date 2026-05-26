/**
 * [LAYER: INFRASTRUCTURE]
 */
import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLite } from '../contexts/LiteContext';
import { getOptimizedImageUrl } from '../lite-utils';
import { formatElapsed, messageForStage, STAGE_ORDER } from '../lib/generationFlow';
import { IconImage, IconLoader, IconMagic, IconZap } from '../icons';

const quickIdeas = [
  { label: 'Cute bee', prompt: 'A cute bee mascot, playful sticker style' },
  { label: 'Cozy studio', prompt: 'A cozy bee studio inside a sunflower, soft morning light' },
  { label: 'Honey jar', prompt: 'A premium honey jar, golden studio light' },
] as const;

export default function Generator() {
  const [prompt, setPrompt] = useState('');

  const {
    selectedModel, generate, generating, generationStage, generationProgress,
    generationPreviewUrl, activeGeneration, displayHistory, generateStartTime,
    currentUser, isOffline, zaps,
  } = useLite();

  const [, setElapsedTick] = useState(0);
  useEffect(() => {
    if (!generating || !generateStartTime) return;
    const id = setInterval(() => setElapsedTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, [generating, generateStartTime]);

  const cleanPrompt = prompt.trim();
  const latestImage = displayHistory[0];
  const recentImages = displayHistory.slice(1, 9);

  const hasCredits = zaps === 'unlimited' || zaps > 0;
  const canGenerate = Boolean(cleanPrompt && selectedModel && currentUser && !isOffline && !generating && hasCredits);

  const greeting = useMemo(() => {
    const firstName = currentUser?.displayName?.split(' ')[0];
    return firstName ? `Hi ${firstName}!` : 'Create a picture';
  }, [currentUser]);

  const creditsText = useMemo(() => {
    if (!currentUser) return null;
    if (zaps === 'unlimited') return 'Unlimited credits';
    if (typeof zaps === 'number') return `${Math.max(0, Math.floor(zaps))} credits left`;
    return null;
  }, [currentUser, zaps]);

  const progressLabel = generating ? messageForStage(generationStage) : null;
  const stageIndex = generating ? STAGE_ORDER.indexOf(generationStage as typeof STAGE_ORDER[number]) : -1;
  const previewSharpen = generationProgress >= 88;
  const elapsedText =
    generating && generateStartTime ? formatElapsed(Date.now() - generateStartTime) : null;

  const blockReason = useMemo(() => {
    if (generating || canGenerate) return null;
    if (isOffline) return 'You need internet';
    if (!currentUser) return 'Sign in first';
    if (!selectedModel) return 'Pick a style below';
    if (!hasCredits) return 'No credits left';
    if (!cleanPrompt) return 'Write what you want above';
    return null;
  }, [generating, canGenerate, isOffline, currentUser, selectedModel, hasCredits, cleanPrompt]);

  const handleGenerate = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!canGenerate) return;
    const submitted = cleanPrompt;
    const ok = await generate(submitted);
    if (ok) setPrompt('');
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
      <header className="page-head">
        <h1>{greeting}</h1>
        <p>Write an idea, pick a style, tap create.</p>
      </header>

      <main className="generator-layout">
        <aside className="input-column">
          <form onSubmit={handleGenerate} className="input-panel" aria-label="Create image">
            <label htmlFor="image-prompt" className="field-label">What do you want?</label>
            <textarea
              id="image-prompt"
              className="prompt-input"
              placeholder="A friendly bee painting a rainbow…"
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

            <div className="idea-row" aria-label="Quick ideas">
              {quickIdeas.map((idea) => (
                <button
                  type="button"
                  key={idea.label}
                  className="idea-pill"
                  onClick={() => setPrompt(idea.prompt)}
                >
                  {idea.label}
                </button>
              ))}
            </div>

            <Link to="/" className="style-row" aria-label="Choose style">
              <IconMagic size={18} />
              <span className="style-row-label">Style</span>
              <span className="style-row-value">{selectedModel?.name || 'Choose one'}</span>
              <span className="style-row-chevron" aria-hidden>›</span>
            </Link>

            <div className="create-zone">
              <button type="submit" className="btn-create" disabled={!canGenerate} aria-busy={generating}>
                {generating ? (
                  <>
                    <IconLoader size={22} className="spin" />
                    {progressLabel || 'Creating…'}
                  </>
                ) : (
                  <>
                    <IconZap size={22} fill={zaps === 'unlimited' ? '#fbbf24' : 'currentColor'} />
                    Create picture
                  </>
                )}
              </button>

              {creditsText ? <p className="credits-line">{creditsText}</p> : null}
              {blockReason ? <p className="block-line">{blockReason}</p> : null}
              {generating ? (
                <>
                  <p className="wait-line">
                    {progressLabel}
                    {elapsedText ? <span className="elapsed-hint"> · {elapsedText}</span> : null}
                  </p>
                  <div className="progress-track" role="progressbar" aria-valuenow={generationProgress} aria-valuemin={0} aria-valuemax={100} aria-label="Creation progress">
                    <div className="progress-fill" style={{ width: `${generationProgress}%` }} />
                  </div>
                  <div className="stage-dots" aria-hidden>
                    {STAGE_ORDER.map((step, i) => (
                      <span key={step} className={`stage-dot ${i <= stageIndex ? 'active' : ''}`} />
                    ))}
                  </div>
                </>
              ) : null}
            </div>
          </form>
        </aside>

        <section className="preview-column" aria-label="Preview and history">
          <div className="simple-card preview-card">
            <strong className="card-label">
              {generating ? 'Creating…' : latestImage ? 'Newest' : 'Preview'}
            </strong>

            <div className="preview-stage">
              {generating ? (
                <div className="preview-loading" role="status" aria-live="polite">
                  {generationPreviewUrl ? (
                    <img
                      src={
                        generationPreviewUrl.startsWith('data:')
                          ? generationPreviewUrl
                          : (getOptimizedImageUrl(generationPreviewUrl) || generationPreviewUrl)
                      }
                      alt=""
                      className={previewSharpen ? 'preview-sharp' : 'preview-blur'}
                    />
                  ) : (
                    <div className="preview-skeleton" aria-hidden />
                  )}
                  <div className="preview-overlay">
                    <IconLoader size={44} className="spin" />
                    <span>{progressLabel}</span>
                    {activeGeneration?.prompt ? (
                      <p className="preview-prompt">“{activeGeneration.prompt}”</p>
                    ) : null}
                    {elapsedText ? <p className="elapsed-line">{elapsedText}</p> : null}
                    <div className="progress-track preview-progress" aria-hidden>
                      <div className="progress-fill" style={{ width: `${generationProgress}%` }} />
                    </div>
                  </div>
                </div>
              ) : latestImage ? (
                <figure className="latest-figure">
                  <img src={getOptimizedImageUrl(latestImage.imageUrl) || ''} alt={latestImage.prompt || 'Generated image'} />
                  {latestImage.prompt ? <figcaption>{latestImage.prompt}</figcaption> : null}
                </figure>
              ) : (
                <div className="latest-empty">
                  <IconImage size={36} />
                  <span>Your picture shows here</span>
                </div>
              )}
            </div>
          </div>

          <div className="simple-card history-card">
            <div className="card-label-row">
              <strong className="card-label">Older pictures</strong>
              <Link to="/profile" className="text-link">See all</Link>
            </div>

            {recentImages.length > 0 ? (
              <div className="history-grid">
                {recentImages.map((item) => (
                  <Link key={item.id} to={`/generation/${item.id}`} className="history-thumb">
                    <img src={getOptimizedImageUrl(item.imageUrl) || ''} alt="" loading="lazy" />
                  </Link>
                ))}
              </div>
            ) : (
              <p className="history-empty">More pictures show up here later.</p>
            )}
          </div>
        </section>
      </main>

      <style>{`
        .generator-simple { min-height: 100vh; width: min(1180px, calc(100% - 28px)); margin: 0 auto; padding: 20px 0 120px; }
        .page-head { margin-bottom: 16px; }
        .page-head h1 { font-size: clamp(1.75rem, 5vw, 2.75rem); letter-spacing: -0.05em; margin: 0 0 6px; }
        .page-head p { margin: 0; color: var(--color-zinc-400); font-weight: 700; font-size: 0.95rem; }

        .generator-layout { display: grid; grid-template-columns: minmax(300px, 0.88fr) minmax(340px, 1.12fr); gap: 16px; align-items: start; }
        .input-column { position: sticky; top: 16px; }
        .preview-column { display: flex; flex-direction: column; gap: 12px; }
        .simple-card { border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; background: rgba(255,255,255,0.03); padding: 14px; }
        .card-label { display: block; font-size: 0.9rem; font-weight: 900; margin-bottom: 10px; }
        .card-label-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; }
        .card-label-row .card-label { margin-bottom: 0; }
        .text-link { color: var(--color-accent); font-size: 0.85rem; font-weight: 900; text-decoration: none; }
        .text-link:hover { color: white; }

        .input-panel {
          display: flex; flex-direction: column; gap: 14px;
          padding: 18px;
          border-radius: 20px;
          border: 1px solid rgba(255,255,255,0.1);
          background: rgba(255,255,255,0.04);
        }

        .field-label { font-size: 1rem; font-weight: 900; color: white; }

        .prompt-input {
          width: 100%; min-height: 110px; resize: vertical;
          border: 1px solid rgba(255,255,255,0.1); border-radius: 14px;
          background: rgba(0,0,0,0.2); color: white;
          padding: 14px; font-size: 1.05rem; line-height: 1.45;
          outline: none;
        }
        .prompt-input:focus { border-color: rgba(139, 92, 246, 0.7); box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.15); }
        .prompt-input::placeholder { color: var(--color-zinc-500); }

        .idea-row { display: flex; flex-wrap: wrap; gap: 8px; }
        .idea-pill {
          flex: 1; min-width: 0;
          padding: 10px 8px; border-radius: 12px;
          border: 1px solid rgba(255,255,255,0.1);
          background: rgba(255,255,255,0.04);
          color: var(--color-zinc-300); font-size: 0.8rem; font-weight: 850;
          cursor: pointer; text-align: center;
          transition: background 0.15s, border-color 0.15s, color 0.15s;
        }
        .idea-pill:hover { border-color: rgba(139, 92, 246, 0.45); color: white; background: rgba(139, 92, 246, 0.12); }

        .style-row {
          display: flex; align-items: center; gap: 10px;
          padding: 14px; border-radius: 14px;
          border: 1px solid rgba(255,255,255,0.1);
          background: rgba(0,0,0,0.15);
          color: white; text-decoration: none;
          transition: border-color 0.15s, background 0.15s;
        }
        .style-row:hover { border-color: rgba(139, 92, 246, 0.45); background: rgba(139, 92, 246, 0.08); }
        .style-row svg { color: var(--color-accent); flex-shrink: 0; }
        .style-row-label { font-size: 0.8rem; font-weight: 800; color: var(--color-zinc-500); }
        .style-row-value { flex: 1; font-size: 0.95rem; font-weight: 900; text-align: left; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .style-row-chevron { color: var(--color-zinc-500); font-size: 1.25rem; line-height: 1; }

        .create-zone {
          padding-top: 4px;
          border-top: 1px solid rgba(255,255,255,0.08);
          margin-top: 2px;
        }

        .btn-create {
          width: 100%; min-height: 58px; border: none; border-radius: 16px;
          background: linear-gradient(135deg, var(--color-accent), var(--color-dream-purple));
          color: white; font-size: 1.15rem; font-weight: 950;
          display: flex; align-items: center; justify-content: center; gap: 10px;
          cursor: pointer;
          box-shadow: 0 12px 28px rgba(139, 92, 246, 0.3);
          transition: transform 0.15s, box-shadow 0.15s, opacity 0.15s;
        }
        .btn-create:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 16px 32px rgba(139, 92, 246, 0.38); }
        .btn-create:disabled { opacity: 0.45; cursor: not-allowed; box-shadow: none; }

        .credits-line {
          margin: 12px 0 0; text-align: center;
          font-size: 0.9rem; font-weight: 900;
          color: var(--color-zinc-300);
        }
        .block-line {
          margin: 6px 0 0; text-align: center;
          font-size: 0.85rem; font-weight: 750;
          color: #fbbf24;
        }
        .wait-line {
          margin: 10px 0 6px; text-align: center;
          font-size: 0.8rem; font-weight: 700;
          color: var(--color-zinc-500); line-height: 1.35;
        }
        .elapsed-hint, .elapsed-line {
          font-weight: 650; color: var(--color-zinc-600);
        }
        .elapsed-line { margin: 0; font-size: 0.75rem; }
        .progress-track {
          height: 6px; border-radius: 999px;
          background: rgba(255,255,255,0.08); overflow: hidden;
        }
        .progress-fill {
          height: 100%; border-radius: inherit;
          background: linear-gradient(90deg, var(--color-accent), var(--color-dream-purple));
          transition: width 0.45s ease;
        }
        .stage-dots {
          display: flex; justify-content: center; gap: 8px; margin-top: 10px;
        }
        .stage-dot {
          width: 8px; height: 8px; border-radius: 50%;
          background: rgba(255,255,255,0.15);
          transition: background 0.2s, transform 0.2s;
        }
        .stage-dot.active { background: var(--color-accent); transform: scale(1.15); }

        .preview-stage {
          min-height: 340px; border-radius: 14px; overflow: hidden;
          border: 1px solid rgba(255,255,255,0.08);
          background: rgba(0,0,0,0.15);
          display: flex; align-items: center; justify-content: center;
          position: relative;
        }
        .preview-loading { width: 100%; min-height: 340px; position: relative; }
        .preview-blur, .preview-sharp {
          width: 100%; aspect-ratio: 1; object-fit: cover; display: block;
          animation: previewReveal 0.5s ease;
        }
        .preview-blur {
          filter: blur(8px) brightness(0.85); transform: scale(1.04);
        }
        .preview-sharp {
          filter: none; transform: none;
        }
        .preview-skeleton {
          position: absolute; inset: 0;
          background: linear-gradient(
            110deg,
            rgba(255,255,255,0.04) 25%,
            rgba(139,92,246,0.12) 50%,
            rgba(255,255,255,0.04) 75%
          );
          background-size: 200% 100%;
          animation: shimmer 1.4s ease-in-out infinite;
        }
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        @keyframes previewReveal {
          from { opacity: 0; transform: scale(1.08); }
          to { opacity: 1; transform: scale(1.04); }
        }
        .preview-overlay {
          position: absolute; inset: 0;
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          gap: 12px; padding: 20px; text-align: center;
          background: rgba(0,0,0,0.35); color: var(--color-accent); font-weight: 900;
        }
        .preview-progress { width: min(240px, 80%); margin-top: 4px; }
        .preview-prompt { margin: 4px 0 0; font-size: 0.85rem; font-weight: 700; color: var(--color-zinc-400); line-height: 1.4; max-width: 280px; }
        .latest-figure { margin: 0; width: 100%; }
        .latest-figure img { width: 100%; aspect-ratio: 1; object-fit: cover; display: block; }
        .latest-figure figcaption { padding: 10px 12px; font-size: 0.85rem; font-weight: 700; color: var(--color-zinc-300); background: rgba(0,0,0,0.35); line-height: 1.35; }
        .latest-empty { display: flex; flex-direction: column; align-items: center; gap: 10px; padding: 24px; color: var(--color-zinc-500); font-weight: 800; }

        .history-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
        .history-thumb { border-radius: 10px; overflow: hidden; border: 1px solid rgba(255,255,255,0.08); aspect-ratio: 1; }
        .history-thumb img { width: 100%; height: 100%; object-fit: cover; }
        .history-empty { margin: 0; font-size: 0.85rem; color: var(--color-zinc-500); font-weight: 750; }

        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }

        @media (max-width: 900px) {
          .generator-layout { grid-template-columns: 1fr; }
          .input-column { position: static; }
        }
        @media (max-width: 620px) {
          .idea-pill { flex: 1 1 calc(33% - 6px); }
          .history-grid { grid-template-columns: repeat(2, 1fr); }
        }
      `}</style>
    </div>
  );
}
