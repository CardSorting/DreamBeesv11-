export const slugify = (text) => {
    return text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/&/g, '-and-')         // Replace & with 'and'
        .replace(/[\s\W-]+/g, '-')      // Replace spaces, non-word chars and dashes with a single dash
        .replace(/^-+|-+$/g, '');       // Remove leading/trailing dashes
};

export const unslugify = (slug, originalNames = []) => {
    // If we have a list of original names, try to find a match where the slugified version equals our slug
    if (originalNames.length > 0) {
        const match = originalNames.find(name => slugify(name) === slug);
        if (match) return match;
    }

    // Fallback: simple text transformation
    return slug
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
};
