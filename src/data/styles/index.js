import { cinematicStyles } from './categories/cinematic';
import { artisticStyles } from './categories/artistic';
import { photographyStyles } from './categories/photography';
import { experimentalStyles } from './categories/experimental';

// Aggregated Registry
export const STYLE_REGISTRY = [
    ...cinematicStyles,
    ...artisticStyles,
    ...photographyStyles,
    ...experimentalStyles
];

export { GLOBAL_NEGATIVES } from './constants';
export { getStylePrompt } from './utils';
