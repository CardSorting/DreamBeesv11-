export const RESERVED_USERNAMES = [
    'admin', 'administrator', 'root', 'system', 'support', 'help', 'info',
    'contact', 'webmaster', 'security', 'billing', 'abuse', 'legal', 'privacy',
    'terms', 'policy', 'settings', 'profile', 'account', 'user', 'users',
    'group', 'groups', 'team', 'teams', 'org', 'organization', 'organizations',
    'api', 'dev', 'developer', 'developers', 'app', 'apps', 'application',
    'applications', 'project', 'projects', 'product', 'products', 'test',
    'testing', 'demo', 'example', 'login', 'logout', 'signin', 'signout',
    'signup', 'register', 'auth', 'authentication', 'password', 'reset',
    'recover', 'verify', 'confirm', 'dashboard', 'control', 'panel', 'manage',
    'manager', 'management', 'config', 'configuration', 'setup', 'install',
    'update', 'upgrade', 'delete', 'remove', 'edit', 'create', 'new', 'add',
    'mockup', 'mockups', 'studio', 'gallery', 'feed', 'discover', 'explore',
    'search', 'browse', 'feed', 'timeline', 'messages', 'notifications',
    'activity', 'history', 'stats', 'analytics', 'insights', 'reports',
    'moderator', 'mod', 'staff', 'employee', 'dreambees', 'dream', 'bee',
    'bees'
];

export const BLOCKED_SUBSTRINGS = [
    'admin', 'support', 'mod', 'staff', 'system', 'official', 'verified'
];

export const BAD_WORDS = [
    'anal', 'anus', 'arse', 'ass', 'bastard', 'bitch', 'boob', 'cock', 'cum', 'cunt',
    'dick', 'dildo', 'dyke', 'fag', 'faggot', 'fuck', 'hell', 'hitler', 'jizz',
    'kike', 'nigger', 'nigga', 'penis', 'piss', 'poop', 'pussy', 'queer', 'rape',
    'sex', 'shit', 'slut', 'tit', 'tits', 'tranny', 'twat', 'vagina', 'wanker',
    'whore', 'retard'
]; // Expand as needed, keep basic for now to avoid bloating bundle

export const isValidUsername = (username) => {
    if (!username) return { valid: false, error: "Username is required" };

    // Convert to lowercase for checking
    const lowerUsername = username.toLowerCase();

    // Length check
    if (lowerUsername.length < 3) {
        return { valid: false, error: "Username must be at least 3 characters" };
    }
    if (lowerUsername.length > 30) {
        return { valid: false, error: "Username must be less than 30 characters" };
    }

    // Regex check: alphanumeric and underscores only
    const usernameRegex = /^[a-z0-9_]+$/;
    if (!usernameRegex.test(lowerUsername)) {
        return { valid: false, error: "Username can only contain letters, numbers, and underscores" };
    }

    // Exact Reserved check
    if (RESERVED_USERNAMES.includes(lowerUsername)) {
        return { valid: false, error: "This username is reserved" };
    }

    // Substring Check
    for (const substring of BLOCKED_SUBSTRINGS) {
        if (lowerUsername.includes(substring)) {
            return { valid: false, error: "Username contains a reserved term" };
        }
    }

    // Profanity Check
    for (const badWord of BAD_WORDS) {
        if (lowerUsername.includes(badWord)) {
            return { valid: false, error: "Username contains restricted words" };
        }
    }

    return { valid: true, error: null };
};
