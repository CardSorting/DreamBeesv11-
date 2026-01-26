/**
 * Google Analytics utility for tracking events and identifying users.
 * This wraps the global `gtag` function provided by the analytics script.
 */

const GA_MEASUREMENT_ID = 'G-2MB0XFEC9G';

/**
 * Tracks a custom event.
 * @param {string} action - The event action (e.g., 'generate_image').
 * @param {Object} params - Additional parameters for the event.
 */
export const trackEvent = (action, params = {}) => {
    if (typeof window.gtag === 'function') {
        window.gtag('event', action, params);
    }
};

/**
 * Identifies the current user for tracking.
 * @param {string} userId - The unique ID of the user.
 */
export const identifyUser = (userId) => {
    if (typeof window.gtag === 'function') {
        window.gtag('config', GA_MEASUREMENT_ID, {
            user_id: userId,
        });
    }
};

/**
 * Tracks a page view.
 * @param {string} path - The URL path.
 * @param {string} title - The page title.
 */
export const trackPageView = (path, title) => {
    if (typeof window.gtag === 'function') {
        window.gtag('config', GA_MEASUREMENT_ID, {
            page_path: path,
            page_title: title || document.title,
        });
    }
};

/**
 * Tracks an exception/error.
 * @param {string} description - Description of the error.
 * @param {boolean} fatal - Whether the error was fatal.
 */
export const trackException = (description, fatal = false) => {
    if (typeof window.gtag === 'function') {
        window.gtag('event', 'exception', {
            description: description,
            fatal: fatal,
        });
    }
};

/**
 * Sets user properties for the current session.
 * @param {Object} properties - Key-value pairs of user properties.
 */
export const setUserProperties = (properties) => {
    if (typeof window.gtag === 'function') {
        window.gtag('set', 'user_properties', properties);
    }
};

/**
 * Tracks an outbound link click.
 * @param {string} url - The destination URL.
 */
export const trackOutboundLink = (url) => {
    trackEvent('click_outbound_link', {
        event_category: 'outbound',
        event_label: url,
        transport_type: 'beacon',
    });
};

/**
 * Tracks a search query.
 * @param {string} query - The search term.
 */
export const trackSearch = (query) => {
    trackEvent('search', {
        search_term: query,
    });
};

/**
 * Tracks a setting change.
 * @param {string} settingName - Name of the setting.
 * @param {any} value - The new value.
 */
export const trackSettingChange = (settingName, value) => {
    trackEvent('setting_change', {
        setting_name: settingName,
        setting_value: value,
    });
};

/**
 * Tracks e-commerce item list views.
 * @param {Array} items - List of items being viewed.
 */
export const trackViewItemList = (items) => {
    trackEvent('view_item_list', {
        items: items.map(item => ({
            item_id: item.id,
            item_name: item.name,
            price: item.price,
            item_category: item.category || 'credits'
        }))
    });
};

/**
 * Tracks begin checkout event.
 * @param {Object} item - The item being purchased.
 */
export const trackBeginCheckout = (item) => {
    trackEvent('begin_checkout', {
        currency: 'USD',
        value: parseFloat(item.price),
        items: [{
            item_id: item.id,
            item_name: item.name,
            price: item.price,
            item_category: item.category || 'credits',
            quantity: 1
        }]
    });
};

/**
 * Tracks performance metrics (Web Vitals).
 * @param {Object} metric - The performance metric object.
 */
export const trackMetric = ({ name, delta, id, value }) => {
    trackEvent(name, {
        value: Math.round(name === 'CLS' ? delta * 1000 : delta),
        event_label: id,
        non_interaction: true,
    });
};
