/**
 * Shared queue snapshot → UI state (used by generate + session resume).
 */
import {
  ENQUEUE_RETRY_MESSAGE,
  GenerationStage,
  messageForStage,
  monotonicProgress,
  progressPercent,
  stageFromQueueDoc,
} from './generationFlow';

export interface QueueSnapshot {
  status?: string;
  stage?: string;
  progress?: number;
  thumbnailUrl?: string;
  lqip?: string;
  imageUrl?: string;
  enqueueError?: string;
  enqueuedAt?: unknown;
  error?: string;
}

export interface GenerationUiPatch {
  stage: GenerationStage;
  progress: number;
  message: string;
  previewUrl: string | null;
  showEnqueueRetry: boolean;
}

/** Prefer LQIP (instant) then thumbnail then full image */
export function pickPreviewUrl(data: QueueSnapshot): string | null {
  if (data.lqip && typeof data.lqip === 'string') return data.lqip;
  if (data.thumbnailUrl) return data.thumbnailUrl;
  if (data.imageUrl) return data.imageUrl;
  return null;
}

export function patchFromQueueDoc(
  data: QueueSnapshot,
  progressFloor: number
): { patch: GenerationUiPatch; progressFloor: number } {
  const stage = stageFromQueueDoc(data);
  const progress = progressPercent(stage, data.progress);
  const nextFloor = monotonicProgress(progressFloor, progress);
  const showEnqueueRetry = Boolean(data.enqueueError && !data.enqueuedAt);

  return {
    progressFloor: nextFloor,
    patch: {
      stage,
      progress: nextFloor,
      message: showEnqueueRetry ? ENQUEUE_RETRY_MESSAGE : messageForStage(stage),
      previewUrl: pickPreviewUrl(data),
      showEnqueueRetry,
    },
  };
}

export function isQueueTerminal(data: QueueSnapshot): boolean {
  return data.status === 'completed' || data.status === 'failed';
}

export function isQueueSuccess(data: QueueSnapshot): boolean {
  return data.status === 'completed' && Boolean(data.imageUrl);
}

export function isQueueInFlight(data: QueueSnapshot): boolean {
  return data.status === 'queued' || data.status === 'processing';
}
