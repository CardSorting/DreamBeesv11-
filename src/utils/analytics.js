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
 * Tracks specialized search quality signals.
 * @param {string} query - The search term that yielded results (or not).
 * @param {number} resultCount - Number of items found.
 */
export const trackSearchQuality = (query, resultCount) => {
    trackEvent('search_quality', {
        search_term: query,
        result_count: resultCount,
        is_empty: resultCount === 0
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
export const trackMetric = ({ name, delta, id, value: _value }) => {
    trackEvent(name, {
        value: Math.round(name === 'CLS' ? delta * 1000 : delta),
        event_label: id,
        non_interaction: true,
    });
};

/**
 * Tracks an A/B testing experiment assignment.
 * @param {string} experimentName - Name of the experiment.
 * @param {string} variant - The assigned variant (e.g., 'A', 'B', 'control').
 */
export const trackExperiment = (experimentName, variant) => {
    trackEvent('experiment_assignment', {
        experiment_name: experimentName,
        variant: variant
    });
};

/**
 * Tracks behavioral metrics like rage clicks or scroll depth.
 * @param {string} type - 'rage_click', 'scroll_depth', etc.
 * @param {Object} params - Contextual parameters.
 */
export const trackBehavior = (type, params = {}) => {
    trackEvent(`behavior_${type}`, params);
};

/**
 * Tracks an 'AHA' moment (e.g., first successful generation).
 * @param {string} moment - Type of moment.
 */
export const trackAhaMoment = (moment) => {
    trackEvent('aha_moment', { moment_type: moment });
};

/**
 * Tracks the credit lifecycle (low balance, etc).
 * @param {string} type - 'low_balance', 'exhausted'.
 * @param {number} currentAmount - The current credit count.
 */
export const trackCreditLifecycle = (type, currentAmount) => {
    trackEvent('credit_lifecycle', { lifecycle_type: type, amount: currentAmount });
};

/**
 * Tracks navigation intent between pages (Journey Mapping).
 * @param {string} target - The destination page/action.
 * @param {string} source - Where the user is coming from.
 */
export const trackNavigationPath = (target, source) => {
    trackEvent('navigation_intent', { target_page: target, source_page: source });
};

/**
 * Tracks quality signals (Loss Analytics).
 * @param {string} type - 'batch_delete', 'single_delete'.
 * @param {Object} params - Parameters like count, age, etc.
 */
export const trackQualitySignal = (type, params = {}) => {
    trackEvent(`quality_${type}`, params);
};

/**
 * Tracks engagement loops (Conversion from browsing to creating).
 * @param {string} source - 'showcase_modal', 'discovery_feed', etc.
 * @param {string} modelId - The model used for conversion.
 */
export const trackLoopConversion = (source, modelId) => {
    trackEvent('engagement_loops_conversion', { source_origin: source, model_id: modelId });
};

/**
 * Tracks social intent (Sharing content).
 * @param {string} method - 'copy_link', 'whatsapp', 'x', etc.
 * @param {string} contentType - 'image', 'mockup', 'meme', etc.
 */
export const trackSocialIntent = (method, contentType) => {
    trackEvent('share_intent', { method: method, content_type: contentType });
};

/**
 * Updates cookie consent status.
 * @param {Object} consent - { ad_storage: 'granted/denied', analytics_storage: 'granted/denied' }
 */
export const setConsent = (consent) => {
    if (typeof window.gtag === 'function') {
        window.gtag('consent', 'update', consent);
    }
};

/**
 * Tracks user sentiment (Ratings/Feedback).
 * @param {number} rating - 1 to 5.
 * @param {Object} context - Optional context like modelId, promptLength, etc.
 */
export const trackSentiment = (rating, context = {}) => {
    trackEvent('user_sentiment', {
        rating: rating,
        ...context
    });
};

/**
 * Tracks creative telemetry for deeper content analysis.
 * @param {string} action - 'generation_start', 'generation_success'.
 * @param {Object} params - style, ratio, prompt_length_bucket.
 */
export const trackCreativeTelemetry = (action, params = {}) => {
    trackEvent(`creative_${action}`, params);
};

/**
 * Tracks a step in a multi-step funnel.
 * @param {string} funnelName - 'acquisition', 'checkout', etc.
 * @param {string} stepName - descriptive name of the step.
 * @param {number} stepNumber - 1-indexed step number.
 * @param {Object} params - additional metadata.
 */
export const trackFunnelStep = (funnelName, stepName, stepNumber, params = {}) => {
    trackEvent('funnel_step', {
        funnel_id: funnelName,
        step_name: stepName,
        step_number: stepNumber,
        ...params
    });
};

/**
 * Tracks friction points (validation errors, timeouts, etc).
 * @param {string} type - 'validation_error', 'timeout', 'api_failure'.
 * @param {string} source - component or page name.
 * @param {string} message - error details.
 */
export const trackFriction = (type, source, message) => {
    trackEvent('friction_event', {
        friction_type: type,
        friction_source: source,
        friction_message: message
    });
};

/**
 * Tracks adoption of specific professional features.
 * @param {string} featureId - 'turbo_mode', 'aspect_ratio_unlock', etc.
 * @param {Object} context - additional metadata about the usage.
 */
export const trackFeatureAdoption = (featureId, context = {}) => {
    trackEvent('feature_adoption', {
        feature_id: featureId,
        ...context
    });
};

/**
 * Tracks high-risk signals indicating potential churn.
 * @param {string} signalType - 'exit_intent', 'dormancy_warning', 'friction_abandonment'.
 * @param {string} reason - description of the trigger.
 * @param {Object} params - contextual data.
 */
export const trackChurnSignal = (signalType, reason, params = {}) => {
    trackEvent('churn_risk_signal', {
        signal_type: signalType,
        reason: reason,
        ...params
    });
};
