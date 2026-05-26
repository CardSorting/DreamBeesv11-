/**
 * Shared generation UX: stages, progress, and child-friendly copy.
 */

export type GenerationStage = 'idle' | 'submitting' | 'queued' | 'processing' | 'finishing';

export const STAGE_MESSAGES: Record<Exclude<GenerationStage, 'idle'>, string> = {
  submitting: 'Sending your idea…',
  queued: 'Getting ready…',
  processing: 'Drawing your picture…',
  finishing: 'Almost done…',
};

export const STAGE_ORDER: Exclude<GenerationStage, 'idle'>[] = [
  'submitting',
  'queued',
  'processing',
  'finishing',
];

/** Map Firestore queue doc → UI stage */
export function stageFromQueueDoc(data: {
  status?: string;
  stage?: string;
} | undefined): GenerationStage {
  if (!data?.status) return 'submitting';
  if (data.status === 'queued') return 'queued';
  if (data.status === 'processing') {
    return data.stage === 'saving' ? 'finishing' : 'processing';
  }
  return 'submitting';
}

/** Blend server progress (0–100) with stage fallback for smooth bar */
export function progressPercent(stage: GenerationStage, serverProgress?: number | null): number {
  if (typeof serverProgress === 'number' && serverProgress > 0) {
    return Math.min(99, Math.round(serverProgress));
  }
  switch (stage) {
    case 'submitting':
      return 10;
    case 'queued':
      return 25;
    case 'processing':
      return 55;
    case 'finishing':
      return 90;
    default:
      return 0;
  }
}

export function messageForStage(stage: GenerationStage): string {
  if (stage === 'idle') return 'Creating…';
  return STAGE_MESSAGES[stage] || 'Creating…';
}

export const LONG_RUNNING_MESSAGE = 'Still working — big pictures take a little longer…';
export const ENQUEUE_RETRY_MESSAGE = 'Connecting to the art studio…';
export const IN_LINE_MESSAGE = 'Your idea is in line…';
export const SLOW_START_MESSAGE = 'Still connecting — hang tight…';

export function formatElapsed(ms: number): string | null {
  if (ms < 3000) return null;
  const sec = Math.floor(ms / 1000);
  if (sec < 60) return `About ${sec}s`;
  return `About ${Math.floor(sec / 60)}m ${sec % 60}s`;
}

/** Creep the bar while waiting for the first Firestore update */
export function smoothIdleProgress(current: number, cap = 22): number {
  return Math.min(cap, current + 1);
}

/** Progress bar never jumps backward between server updates */
export function monotonicProgress(floor: number, next: number): number {
  return Math.max(floor, Math.min(99, next));
}

const PENDING_KEY = 'lite_pending_generation';
const PENDING_MAX_AGE_MS = 15 * 60 * 1000;

export interface PendingGeneration {
  requestId: string;
  prompt: string;
  startedAt: number;
}

export function savePendingGeneration(pending: PendingGeneration): void {
  try {
    sessionStorage.setItem(PENDING_KEY, JSON.stringify(pending));
  } catch {
    /* private mode / quota */
  }
}

export function loadPendingGeneration(): PendingGeneration | null {
  try {
    const raw = sessionStorage.getItem(PENDING_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PendingGeneration;
    if (!parsed?.requestId || !parsed.startedAt) return null;
    if (Date.now() - parsed.startedAt > PENDING_MAX_AGE_MS) {
      clearPendingGeneration();
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function clearPendingGeneration(): void {
  try {
    sessionStorage.removeItem(PENDING_KEY);
  } catch {
    /* ignore */
  }
}

export function toHistoryTimestamp(value: unknown): number {
  if (typeof value === 'number') return value;
  if (value && typeof value === 'object' && 'toMillis' in value) {
    return (value as { toMillis: () => number }).toMillis();
  }
  if (value && typeof value === 'object' && 'seconds' in value) {
    return (value as { seconds: number }).seconds * 1000;
  }
  return 0;
}

/** Warm the browser cache so the preview appears instantly */
export function preloadImage(url: string): Promise<void> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = () => resolve();
    img.src = url;
  });
}

/** Merge cloud + local history, newest first */
export function mergeGenerationHistory(local: any[], cloud: any[]): any[] {
  const byKey = new Map<string, any>();

  for (const item of cloud) {
    const key = (item.originalRequestId as string) || item.id;
    byKey.set(key, {
      ...item,
      id: item.id,
      createdAt: toHistoryTimestamp(item.createdAt),
    });
  }

  for (const item of local) {
    byKey.set(item.id, {
      ...item,
      createdAt: toHistoryTimestamp(item.createdAt) || item.createdAt || Date.now(),
    });
  }

  return Array.from(byKey.values()).sort(
    (a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0)
  );
}
