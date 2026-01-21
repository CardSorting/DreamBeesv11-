export const slugify = (text) => {
    if (!text) return '';
    return text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/&/g, '-and-')         // Replace & with 'and'
        .replace(/[\s\W-]+/g, '-')      // Replace spaces, non-word chars and dashes with a single dash
        .replace(/^-+|-+$/g, '');       // Remove leading/trailing dashes
};

export const unslugify = (slug) => {
    if (!slug) return '';
    return slug
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
};
