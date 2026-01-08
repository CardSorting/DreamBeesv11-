import { STYLE_REGISTRY } from './index';

export const getStylePrompt = (styleId, intensity = 'medium') => {
    // Note: STYLE_REGISTRY is imported from index, ensuring we have the aggregated list
    const style = STYLE_REGISTRY.find(s => s.id === styleId);
    if (!style) return { tags: [], negatives: [] };

    let tagsToApply = [];

    // Check for intensity profile
    const profile = style.intensity_profiles?.[intensity];

    if (intensity !== 'medium' && profile) {
        // Apply tags from specific intensity profile
        Object.values(profile).forEach(list => tagsToApply.push(...list));
    } else {
        // Default (Medium) or fallback to main tags
        Object.values(style.tags).forEach(list => tagsToApply.push(...list));
    }

    return {
        tags: tagsToApply,
        negatives: style.negatives || []
    };
};
