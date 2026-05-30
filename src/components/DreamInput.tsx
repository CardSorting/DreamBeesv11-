import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  applyEditorialAction,
  DreamTrailMode,
  DreamTrailEditorialAction,
  DreamTrailResponse,
  DreamTrailSuggestion,
  filterDreamTrailSuggestions,
  getAcceptedHistory,
  getArrivalState,
  getCadenceState,
  getCreativeState,
  getDecisionState,
  getEditorialChips,
  getLocalDreamTrailSuggestions,
  getTasteGravity,
  getTasteVector,
  normalizeSuggestion,
  rememberAcceptedSuggestion,
  takeGhostPhrase,
} from '../lib/dreamtrail';

type DreamInputProps = {
  id: string;
  value: string;
  mode: DreamTrailMode;
  placeholder?: string;
  maxLength?: number;
  onChange: (value: string) => void;
  onSubmit: () => void;
};

const REQUEST_DEBOUNCE_MS = 180;
const STALE_AFTER_MS = 1000;

export default function DreamInput({
  id,
  value,
  mode,
  placeholder,
  maxLength,
  onChange,
  onSubmit,
}: DreamInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const requestIdRef = useRef(0);
  const dismissedForValueRef = useRef<string | null>(null);
  const [suggestions, setSuggestions] = useState<DreamTrailSuggestion[]>([]);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [caretAtEnd, setCaretAtEnd] = useState(true);

  const cleanPrompt = value.trim();
  const cadenceState = useMemo(() => getCadenceState(cleanPrompt), [cleanPrompt]);
  const decisionState = useMemo(() => getDecisionState(cleanPrompt, cadenceState), [cleanPrompt, cadenceState]);
  const arrivalState = useMemo(() => getArrivalState(cleanPrompt, decisionState), [cleanPrompt, decisionState]);
  const creativeState = useMemo(() => getCreativeState(cleanPrompt, decisionState, arrivalState, cadenceState), [arrivalState, cadenceState, cleanPrompt, decisionState]);
  const editorialChips = useMemo(() => getEditorialChips(arrivalState), [arrivalState]);
  const hasArrived = creativeState === 'refining' || creativeState === 'finished';
  const activeSuggestion = suggestions[activeSuggestionIndex] ?? suggestions[0] ?? null;
  const rawGhost = activeSuggestion?.text ?? '';
  const visibleGhost = !hasArrived && caretAtEnd && dismissedForValueRef.current !== value
    ? cleanPrompt ? rawGhost : rawGhost.replace(/^,\s*/, '')
    : '';

  const updateCaret = useCallback(() => {
    const node = textareaRef.current;
    if (!node) return;
    setCaretAtEnd(node.selectionStart === value.length && node.selectionEnd === value.length);
  }, [value.length]);

  const acceptSuggestion = useCallback((suggestion: DreamTrailSuggestion | null) => {
    if (!suggestion) return;
    const accepted = normalizeSuggestion(suggestion.text);
    if (!accepted) return;
    rememberAcceptedSuggestion(value, { ...suggestion, text: accepted });
    dismissedForValueRef.current = null;
    setSuggestions([]);
    setActiveSuggestionIndex(0);
    onChange(value.trim() ? `${value}${accepted}` : accepted.replace(/^,\s*/, ''));
    requestAnimationFrame(() => {
      const node = textareaRef.current;
      node?.focus();
      node?.setSelectionRange(node.value.length, node.value.length);
    });
  }, [onChange, value]);

  const applyEditorialChip = useCallback((action: DreamTrailEditorialAction) => {
    if (action === 'generate') {
      onSubmit();
      return;
    }

    const nextPrompt = applyEditorialAction(value, action);
    if (nextPrompt !== value) {
      dismissedForValueRef.current = null;
      setSuggestions([]);
      setActiveSuggestionIndex(0);
      onChange(nextPrompt);
      requestAnimationFrame(() => {
        const node = textareaRef.current;
        node?.focus();
        node?.setSelectionRange(node.value.length, node.value.length);
      });
    }
  }, [onChange, onSubmit, value]);

  useEffect(() => {
    if (dismissedForValueRef.current === value) {
      setSuggestions([]);
      setActiveSuggestionIndex(0);
      setLoading(false);
      return;
    }

    const tasteVector = getTasteVector();
    const tasteGravity = getTasteGravity(tasteVector);
    const local = getLocalDreamTrailSuggestions(cleanPrompt, mode, tasteVector, tasteGravity, cadenceState, decisionState, arrivalState, creativeState);
    setSuggestions(local);
    setActiveSuggestionIndex(0);
    if (hasArrived || creativeState === 'blank') {
      setLoading(false);
      return;
    }

    const requestId = ++requestIdRef.current;
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), STALE_AFTER_MS);
    const debounceId = window.setTimeout(async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/dreamtrail', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: cleanPrompt,
            acceptedHistory: getAcceptedHistory(),
            tasteVector,
            tasteGravity,
            cadenceState,
            decisionState,
            arrivalState,
            creativeState,
            mode,
          }),
          signal: controller.signal,
        });
        if (!response.ok) return;
        const data = await response.json() as DreamTrailResponse;
        if (requestId !== requestIdRef.current || dismissedForValueRef.current === value) return;
        const remote = filterDreamTrailSuggestions(data.suggestions ?? [], cleanPrompt, tasteVector, mode, tasteGravity, cadenceState, decisionState, arrivalState, creativeState);
        const merged = filterDreamTrailSuggestions([...remote, ...local], cleanPrompt, tasteVector, mode, tasteGravity, cadenceState, decisionState, arrivalState, creativeState).slice(0, 3);
        setSuggestions(merged);
        setActiveSuggestionIndex(0);
      } catch {
        if (requestId === requestIdRef.current) {
          setSuggestions(local);
          setActiveSuggestionIndex(0);
        }
      } finally {
        window.clearTimeout(timeoutId);
        if (requestId === requestIdRef.current) setLoading(false);
      }
    }, REQUEST_DEBOUNCE_MS);

    return () => {
      window.clearTimeout(debounceId);
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, [arrivalState, cadenceState, cleanPrompt, creativeState, decisionState, hasArrived, mode, value]);

  const panelSuggestions = useMemo(
    () => suggestions.filter((_, index) => index !== activeSuggestionIndex).slice(0, 2),
    [suggestions, activeSuggestionIndex]
  );

  return (
    <div className="dream-input-shell">
      <div className="dream-input-wrap" data-loading={loading ? 'true' : 'false'}>
        <DreamTrailOverlay prompt={value} ghostText={visibleGhost} />
        <textarea
          ref={textareaRef}
          id={id}
          className="prompt-input dream-input-textarea"
          placeholder={placeholder}
          value={value}
          onChange={(event) => {
            dismissedForValueRef.current = null;
            onChange(event.target.value);
          }}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault();
              onSubmit();
              return;
            }
            if (event.key === 'Tab' && visibleGhost) {
              event.preventDefault();
              acceptSuggestion(activeSuggestion);
              return;
            }
            if (event.key === 'ArrowDown' && suggestions.length > 1) {
              event.preventDefault();
              setActiveSuggestionIndex((index) => (index + 1) % suggestions.length);
              return;
            }
            if (event.key === 'ArrowRight' && visibleGhost && caretAtEnd && activeSuggestion) {
              event.preventDefault();
              acceptSuggestion({
                ...activeSuggestion,
                text: takeGhostPhrase(visibleGhost),
              });
              return;
            }
            if (event.key === 'Escape' && suggestions.length) {
              event.preventDefault();
              dismissedForValueRef.current = value;
              setSuggestions([]);
              setActiveSuggestionIndex(0);
            }
          }}
          onClick={updateCaret}
          onKeyUp={updateCaret}
          onSelect={updateCaret}
          maxLength={maxLength}
          spellCheck
          aria-describedby={`${id}-hint`}
        />
      </div>
      <div id={`${id}-hint`} className="dreamtrail-hint">
        {visibleGhost ? 'Tab accepts the trail. Right arrow accepts a phrase.' : 'DreamTrail listens for the edge of your idea.'}
      </div>
      {hasArrived && editorialChips.length > 0 ? (
        <div className="dreamtrail-panel dreamtrail-editorial-panel" aria-label="DreamTrail editorial moves">
          {editorialChips.map((chip) => (
            <button type="button" key={chip.id} onClick={() => applyEditorialChip(chip.id)}>
              {chip.label}
            </button>
          ))}
        </div>
      ) : panelSuggestions.length > 0 ? (
        <div className="dreamtrail-panel" aria-label="DreamTrail alternatives">
          {panelSuggestions.map((suggestion) => (
            <button type="button" key={`${suggestion.mutation}:${suggestion.text}`} onClick={() => acceptSuggestion(suggestion)}>
              {suggestion.text.replace(/^,\s*/, '')}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function DreamTrailOverlay({ prompt, ghostText }: { prompt: string; ghostText: string }) {
  return (
    <div className="dreamtrail-overlay" aria-hidden>
      <span className="dreamtrail-overlay-prompt">{prompt || ' '}</span>
      {ghostText ? <span className="dreamtrail-ghost">{ghostText}</span> : null}
    </div>
  );
}
