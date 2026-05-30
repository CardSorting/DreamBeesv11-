export const DEFAULT_ASPECT_RATIO = '4:5' as const;

export const aspectRatioOptions = [
  {
    label: 'Feed',
    value: '4:5',
    useCase: 'Best default for social posts',
    badge: 'Recommended',
  },
  {
    label: 'Square',
    value: '1:1',
    useCase: 'Avatars and classic posts',
  },
  {
    label: 'Portrait',
    value: '3:4',
    useCase: 'Photos and phone wallpapers',
  },
  {
    label: 'Pin',
    value: '2:3',
    useCase: 'Pinterest and posters',
  },
  {
    label: 'Story',
    value: '9:16',
    useCase: 'Stories and Shorts',
  },
  {
    label: 'Wide',
    value: '16:9',
    useCase: 'YouTube and web',
  },
] as const;

export type AspectRatio = typeof aspectRatioOptions[number]['value'];

export function isSupportedAspectRatio(value: unknown): value is AspectRatio {
  return typeof value === 'string' && aspectRatioOptions.some((option) => option.value === value);
}

export function normalizeAspectRatio(value: unknown): AspectRatio {
  return isSupportedAspectRatio(value) ? value : DEFAULT_ASPECT_RATIO;
}

export function getAspectRatioOption(value: unknown) {
  return aspectRatioOptions.find((option) => option.value === value);
}

export function toCssAspectRatio(value: unknown): string {
  if (typeof value !== 'string' || !/^\d+:\d+$/.test(value)) return '1 / 1';
  return value.replace(':', ' / ');
}
