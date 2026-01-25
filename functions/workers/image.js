
import { db, FieldValue } from "../firebaseInit.js";
import { getS3Client, fetchWithTimeout, fetchWithRetry, fetchWithFallback, readFirstBytes, detectImageFormat, logger, retryOperation } from "../lib/utils.js";
import { B2_BUCKET, B2_PUBLIC_URL, CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_API_TOKEN } from "../lib/constants.js";
// import { withVertexRateLimiting } from "../lib/rateLimiter.js"; // [REMOVED]
import { vertexFlow } from "../lib/vertexFlow.js"; // [NEW]
import { GalmixClient } from "../lib/GalmixClient.js";

const galmixClient = new GalmixClient();

// Local helper
const looksLikeJSON = (buffer) => {
    if (!buffer || buffer.length === 0) return false;
    const firstChar = String.fromCharCode(buffer[0]);
    return firstChar === '{' || firstChar === '[' || firstChar === '"';
};

// ============================================================================
// ADVANCED LOAD BALANCER v2.0
// Production-grade intelligent routing with:
// - Cold start detection & warm-up routing
// - Exponential backoff for circuit recovery  
// - P95/P99 latency tracking
// - Error classification (transient vs permanent)
// - Capacity tracking & saturation detection
// - Jitter for thundering herd prevention
// ============================================================================

class LoadBalancer {
    constructor() {
        // Endpoint configuration with performance characteristics
        this.endpoints = {
            // Zit endpoints
            'zit-h100': {
                url: 'https://mariecoderinc--zit-h100-stable-fastapi-app.modal.run',
                tier: 'premium', costFactor: 1.5, baseLatency: 8000,
                coldStartLatency: 45000, maxConcurrency: 10
            },
            'zit-a10g': {
                url: 'https://mariecoderinc--zit-a10g-fastapi-app.modal.run',
                tier: 'standard', costFactor: 1.0, baseLatency: 15000,
                coldStartLatency: 60000, maxConcurrency: 5
            },
            // SDXL endpoints
            'sdxl-h100': {
                url: 'https://mariecoderinc--sdxl-multi-model-h100-model-web.modal.run',
                tier: 'premium', costFactor: 1.5, baseLatency: 8000,
                coldStartLatency: 45000, maxConcurrency: 10
            },
            'sdxl-a10g': {
                url: 'https://mariecoderinc--sdxl-multi-model-a10g-model-web.modal.run',
                tier: 'standard', costFactor: 1.0, baseLatency: 12000,
                coldStartLatency: 50000, maxConcurrency: 5
            },
            // Flux endpoint
            'flux': {
                url: 'https://mariecoderinc--flux-klein-4b-flux-fastapi-app.modal.run',
                tier: 'standard', costFactor: 1.0, baseLatency: 10000,
                coldStartLatency: 55000, maxConcurrency: 5
            },
            // Cloudflare Flux Endpoint
            'cf-flux-2-dev': {
                url: `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/ai/run/@cf/black-forest-labs/flux-2-dev`,
                tier: 'standard', costFactor: 1.0, baseLatency: 8000,
                coldStartLatency: 0, maxConcurrency: 50
            }
        };

        // Health metrics per endpoint (enhanced with P95, cold start, error classification)
        this.healthMetrics = {};
        for (const key of Object.keys(this.endpoints)) {
            this.healthMetrics[key] = {
                consecutiveFailures: 0,
                consecutiveSuccesses: 0,
                recentLatencies: [],
                avgLatency: null,
                p95Latency: null,
                p99Latency: null,
                lastSuccess: null,
                lastFailure: null,
                lastRequest: null,           // For cold start detection
                circuitState: 'closed',
                circuitOpenedAt: null,
                circuitBackoffMs: 15000,     // Exponential backoff starts at 15s
                circuitRecoveryAttempts: 0,
                totalRequests: 0,
                totalFailures: 0,
                transientErrors: 0,          // 429, 503, timeouts
                permanentErrors: 0,          // 400, 500, validation
                saturationEvents: 0,
                maxObservedConcurrent: 0
            };
        }

        // Circuit breaker - TUNED for responsiveness
        this.circuitBreaker = {
            failureThreshold: 3,
            successThreshold: 1,             // Faster recovery (was 2)
            minOpenDuration: 10000,          // 10s min (was 15s)
            maxOpenDuration: 120000,         // 2 min max (was 5 min)
            backoffMultiplier: 1.5,          // Slower backoff growth (was 2)
            jitterFactor: 0.15               // Less jitter (was 0.2)
        };

        // Cold start detection - LESS AGGRESSIVE
        this.coldStart = {
            idleThreshold: 600000,           // 10 min = likely cold (was 5 min)
            warmUpPenalty: 5000              // Lower penalty (was 10000)
        };

        // Latency tracking
        this.latencyWindowSize = 20;
        this.saturationLatencyMultiplier = 2.0;

        // Global load tracking
        this.activeJobs = new Map();
    }

    // Add jitter to prevent thundering herd
    _addJitter(value) {
        const jitter = value * this.circuitBreaker.jitterFactor;
        return value + (Math.random() * 2 - 1) * jitter;
    }

    // Get request spread delay - OPTIMIZED for responsiveness
    // Fast path: 0ms delay for healthy, low-load endpoints
    // Adaptive: scales up only when needed
    getRequestSpreadDelay(endpointKey) {
        const endpoint = this.endpoints[endpointKey];
        const health = this.healthMetrics[endpointKey];
        const currentLoad = this.activeJobs.get(endpointKey) || 0;
        const loadRatio = currentLoad / endpoint.maxConcurrency;

        // Fast path: No delay for healthy endpoints under 50% load
        if (health.circuitState === 'closed' &&
            health.consecutiveFailures === 0 &&
            loadRatio < 0.5) {
            return 0;
        }

        // Light spreading for moderate load (50-80%): 50-200ms jitter
        if (loadRatio >= 0.5 && loadRatio < 0.8 && health.consecutiveFailures === 0) {
            return Math.random() * 150 + 50; // 50-200ms random
        }

        // Heavier spreading for high load or issues
        let baseDelay = 0;

        // Scale with load above 80%
        if (loadRatio >= 0.8) {
            baseDelay = (loadRatio - 0.8) * 5000; // 0-1000ms at 80-100%
        }

        // Add recovery delay for failures (200ms per failure, not 500ms)
        if (health.consecutiveFailures > 0) {
            baseDelay += health.consecutiveFailures * 200;
        }

        // Half-open probing delay (500ms, not 1000ms)
        if (health.circuitState === 'half-open') {
            baseDelay += 500;
        }

        // Light jitter (±20%)
        const jitter = baseDelay * 0.2;
        const delay = Math.max(0, baseDelay + (Math.random() * 2 - 1) * jitter);

        // Cap at 2 seconds (was 5s - too slow)
        return Math.min(delay, 2000);
    }

    // Check if we should throttle - LESS AGGRESSIVE
    shouldThrottle(endpointKey) {
        const endpoint = this.endpoints[endpointKey];
        const health = this.healthMetrics[endpointKey];
        const currentLoad = this.activeJobs.get(endpointKey) || 0;

        // Only hard throttle if circuit is fully open
        if (health.circuitState === 'open') {
            const elapsed = Date.now() - health.circuitOpenedAt;
            // Allow through if backoff period has passed (will transition to half-open)
            if (elapsed >= health.circuitBackoffMs) return false;
            return true;
        }

        // Only throttle if significantly over capacity (not at capacity)
        if (currentLoad >= endpoint.maxConcurrency + 2) return true;

        // Only throttle on 3+ failures (was 2)
        if (health.consecutiveFailures >= 3) return true;

        return false;
    }

    // Apply rate limiting - RESPONSIVE version
    async applyRequestSpread(endpointKey) {
        const delay = this.getRequestSpreadDelay(endpointKey);
        if (delay > 50) { // Lower threshold - only log if notable
            logger.debug?.(`[LoadBalancer] Spread ${endpointKey}: ${Math.round(delay)}ms`) ||
                (delay > 200 && logger.info(`[LoadBalancer] Spreading ${endpointKey} by ${Math.round(delay)}ms`));
            await new Promise(r => setTimeout(r, delay));
        }
        return delay;
    }

    // Calculate latency percentile
    _percentile(sortedArray, p) {
        if (sortedArray.length === 0) return null;
        const index = Math.ceil((p / 100) * sortedArray.length) - 1;
        return sortedArray[Math.max(0, index)];
    }

    // Classify error type
    _classifyError(error) {
        const msg = error?.message?.toLowerCase() || '';
        const transient = ['429', '503', 'timeout', 'econnreset', 'etimedout', 'busy', 'throttl'];
        const permanent = ['400', '401', '403', '500', 'invalid', 'blocked', 'safety'];
        for (const p of transient) if (msg.includes(p)) return 'transient';
        for (const p of permanent) if (msg.includes(p)) return 'permanent';
        return 'transient'; // Default to transient
    }

    // Get the current score for an endpoint (lower is better) - RESPONSIVE
    _calculateScore(endpointKey, jobComplexity = 1.0, options = {}) {
        const endpoint = this.endpoints[endpointKey];
        const health = this.healthMetrics[endpointKey];
        const { priorityJob = false } = options;

        // Circuit breaker check with exponential backoff
        if (health.circuitState === 'open') {
            const elapsed = Date.now() - health.circuitOpenedAt;
            const backoffWithJitter = this._addJitter(health.circuitBackoffMs);

            if (elapsed < backoffWithJitter) {
                return Infinity; // Still in cooldown
            }
            // Transition to half-open for probe
            health.circuitState = 'half-open';
            logger.info(`[LoadBalancer] ${endpointKey} entering half-open after ${Math.round(elapsed / 1000)}s`);
        }

        // Base score from average latency (P95 was too pessimistic for responsiveness)
        const latency = health.avgLatency || endpoint.baseLatency;
        let score = latency;

        // Cold start detection: only penalize truly idle endpoints
        const timeSinceLastRequest = health.lastRequest ? (Date.now() - health.lastRequest) : Infinity;
        if (timeSinceLastRequest > this.coldStart.idleThreshold) {
            score += this.coldStart.warmUpPenalty;
        }

        // Current load - LIGHTER penalties for normal operation
        const currentLoad = this.activeJobs.get(endpointKey) || 0;
        const loadRatio = currentLoad / endpoint.maxConcurrency;

        if (loadRatio > 0.9) {
            score += 8000 + (loadRatio * 5000); // Near saturation (was 15000)
        } else if (loadRatio > 0.7) {
            score += loadRatio * 3000; // Moderate load (was 5000)
        } else {
            score += currentLoad * 800; // Low load (was 1500)
        }

        // Failure penalties - reduced
        score += health.consecutiveFailures * 3000; // Was 5000

        // Permanent errors penalty - reduced
        if (health.permanentErrors > health.transientErrors && health.permanentErrors > 0) {
            score += 5000; // Was 8000
        }

        // Success bonuses - INCREASED for faster recovery
        score -= Math.min(health.consecutiveSuccesses, 10) * 500; // Was 5 * 400

        // Low error rate bonus - easier to achieve
        if (health.totalRequests > 5 && (health.totalFailures / health.totalRequests) < 0.1) {
            score -= 1500; // Was 1000
        }

        // Cost factor for non-priority simple jobs
        if (!priorityJob && jobComplexity < 0.4) {
            score *= endpoint.costFactor;
        }

        // Half-open penalty - reduced for faster recovery attempts
        if (health.circuitState === 'half-open') {
            score += 2000; // Was 5000
        }

        // Saturation history penalty
        if (health.saturationEvents > 3) {
            score += 2000;
        }

        return score;
    }

    // Calculate job complexity score based on resolution and steps (0.0 - 1.0)
    calculateJobComplexity(width, height, steps) {
        const pixels = width * height;
        const pixelScore = Math.min(pixels / (1536 * 1536), 1.0); // Normalize to max common resolution
        const stepScore = Math.min(steps / 50, 1.0);             // Normalize to max common steps
        return (pixelScore * 0.6 + stepScore * 0.4);             // Weight pixels more
    }

    // Select optimal endpoint(s) for a model type with fallback ordering
    selectEndpoints(modelType, options = {}) {
        const {
            useTurbo = false,
            jobComplexity = 0.5,
            preferPremium = false
        } = options;

        let candidates = [];
        if (modelType === 'zit') {
            candidates = ['zit-h100', 'zit-a10g'];
        } else if (modelType === 'sdxl') {
            candidates = ['sdxl-h100', 'sdxl-a10g'];
        } else if (modelType === 'flux') {
            candidates = ['flux'];
        } else {
            return [];
        }

        const priorityJob = useTurbo || preferPremium;

        // Score all candidates with priority awareness
        const scored = candidates.map(key => ({
            key,
            endpoint: this.endpoints[key],
            score: this._calculateScore(key, jobComplexity, { priorityJob }),
            health: this.healthMetrics[key]
        }));

        // Filter out endpoints with Infinity score (circuit open) unless all are open
        const available = scored.filter(s => s.score !== Infinity);
        const ordered = available.length > 0 ? available : scored;

        // If turbo or preferPremium, heavily prefer premium tier
        if (useTurbo || preferPremium) {
            ordered.forEach(s => {
                if (s.endpoint.tier === 'premium') {
                    s.score -= 10000; // Strong preference for premium
                }
            });
        }

        // Sort by score (lower is better)
        ordered.sort((a, b) => a.score - b.score);

        logger.info(`[LoadBalancer] ${modelType} selection:`, {
            complexity: jobComplexity.toFixed(2),
            priority: priorityJob,
            candidates: ordered.map(s => ({
                key: s.key,
                score: Math.round(s.score),
                circuit: s.health.circuitState,
                p95: s.health.p95Latency ? Math.round(s.health.p95Latency) : null,
                load: `${this.activeJobs.get(s.key) || 0}/${s.endpoint.maxConcurrency}`,
                cold: s.health.lastRequest && (Date.now() - s.health.lastRequest > this.coldStart.idleThreshold) ? '⚠️' : '✓'
            }))
        });

        return ordered.map(s => ({ key: s.key, url: s.endpoint.url }));
    }

    // Record the start of a job - ENHANCED
    recordJobStart(endpointKey) {
        const current = this.activeJobs.get(endpointKey) || 0;
        const newCount = current + 1;
        this.activeJobs.set(endpointKey, newCount);

        const health = this.healthMetrics[endpointKey];
        health.lastRequest = Date.now();

        // Track max observed concurrency
        if (newCount > health.maxObservedConcurrent) {
            health.maxObservedConcurrent = newCount;
        }

        return Date.now();
    }

    // Record successful job completion - ENHANCED
    recordSuccess(endpointKey, startTime) {
        const latency = Date.now() - startTime;
        const health = this.healthMetrics[endpointKey];
        const endpoint = this.endpoints[endpointKey];

        // Decrement active jobs
        const current = this.activeJobs.get(endpointKey) || 1;
        this.activeJobs.set(endpointKey, Math.max(0, current - 1));

        // Update health metrics
        health.consecutiveFailures = 0;
        health.consecutiveSuccesses++;
        health.lastSuccess = Date.now();
        health.totalRequests++;

        // Update latency tracking with percentiles
        health.recentLatencies.push(latency);
        if (health.recentLatencies.length > this.latencyWindowSize) {
            health.recentLatencies.shift();
        }
        const sorted = [...health.recentLatencies].sort((a, b) => a - b);
        health.avgLatency = sorted.reduce((a, b) => a + b, 0) / sorted.length;
        health.p95Latency = this._percentile(sorted, 95);
        health.p99Latency = this._percentile(sorted, 99);

        // Detect saturation
        if (latency > endpoint.baseLatency * this.saturationLatencyMultiplier) {
            health.saturationEvents++;
        }

        // Circuit breaker recovery with backoff reset
        if (health.circuitState === 'half-open' &&
            health.consecutiveSuccesses >= this.circuitBreaker.successThreshold) {
            health.circuitState = 'closed';
            health.circuitBackoffMs = this.circuitBreaker.minOpenDuration; // Reset backoff
            health.circuitRecoveryAttempts = 0;
            logger.info(`[LoadBalancer] Circuit CLOSED for ${endpointKey} after recovery`);
        }

        // Decay saturation events on good performance
        if (health.saturationEvents > 0 && health.consecutiveSuccesses > 10) {
            health.saturationEvents = Math.max(0, health.saturationEvents - 1);
        }

        logger.info(`[LoadBalancer] ${endpointKey} ✓`, {
            latency: Math.round(latency),
            p95: health.p95Latency ? Math.round(health.p95Latency) : null,
            streak: health.consecutiveSuccesses,
            circuit: health.circuitState
        });
    }

    // Record job failure - ENHANCED
    recordFailure(endpointKey, startTime, error) {
        const health = this.healthMetrics[endpointKey];

        // Decrement active jobs
        const current = this.activeJobs.get(endpointKey) || 1;
        this.activeJobs.set(endpointKey, Math.max(0, current - 1));

        // Update health metrics
        health.consecutiveSuccesses = 0;
        health.consecutiveFailures++;
        health.lastFailure = Date.now();
        health.totalRequests++;
        health.totalFailures++;

        // Classify error
        const errorType = this._classifyError(error);
        if (errorType === 'transient') {
            health.transientErrors++;
        } else if (errorType === 'permanent') {
            health.permanentErrors++;
        }

        // Check for rate limiting (429)
        const is429 = error?.message?.includes('429');
        const shouldOpen = is429 || health.consecutiveFailures >= this.circuitBreaker.failureThreshold;

        if (shouldOpen && health.circuitState !== 'open') {
            health.circuitState = 'open';
            health.circuitOpenedAt = Date.now();
            health.circuitRecoveryAttempts++;

            // Exponential backoff
            health.circuitBackoffMs = Math.min(
                health.circuitBackoffMs * this.circuitBreaker.backoffMultiplier,
                this.circuitBreaker.maxOpenDuration
            );

            logger.warn(`[LoadBalancer] Circuit OPENED for ${endpointKey}`, {
                failures: health.consecutiveFailures,
                is429,
                errorType,
                backoffMs: health.circuitBackoffMs,
                attempts: health.circuitRecoveryAttempts
            });
        } else if (health.circuitState === 'half-open') {
            // Failed during probe, increase backoff
            health.circuitState = 'open';
            health.circuitOpenedAt = Date.now();
            health.circuitRecoveryAttempts++;
            health.circuitBackoffMs = Math.min(
                health.circuitBackoffMs * this.circuitBreaker.backoffMultiplier,
                this.circuitBreaker.maxOpenDuration
            );
            logger.warn(`[LoadBalancer] Half-open probe FAILED for ${endpointKey}, backoff: ${health.circuitBackoffMs}ms`);
        }

        logger.warn(`[LoadBalancer] ${endpointKey} ✗`, {
            failures: health.consecutiveFailures,
            errorType,
            circuit: health.circuitState,
            error: error?.message?.substring(0, 80)
        });
    }

    // Get dynamic concurrency limits - ENHANCED
    getDynamicConcurrencyLimit(endpointKey, baseLimit = 3) {
        const health = this.healthMetrics[endpointKey];
        const endpoint = this.endpoints[endpointKey];
        const maxLimit = endpoint.maxConcurrency;

        // Reduce limit if endpoint is struggling
        if (health.consecutiveFailures > 0) {
            return Math.max(1, Math.min(baseLimit - health.consecutiveFailures, maxLimit));
        }

        // Reduce if we've seen saturation
        if (health.saturationEvents > 2) {
            return Math.max(1, Math.min(baseLimit - 1, maxLimit));
        }

        // Increase limit if endpoint is performing well
        if (health.consecutiveSuccesses > 5 && health.p95Latency &&
            health.p95Latency < endpoint.baseLatency * 0.8) {
            return Math.min(baseLimit + 2, maxLimit);
        }

        return Math.min(baseLimit, maxLimit);
    }

    // Get health summary - ENHANCED
    getHealthSummary() {
        const summary = {};
        for (const [key, health] of Object.entries(this.healthMetrics)) {
            const endpoint = this.endpoints[key];
            const currentLoad = this.activeJobs.get(key) || 0;
            const timeSinceLast = health.lastRequest ? Math.round((Date.now() - health.lastRequest) / 1000) : null;

            summary[key] = {
                circuit: health.circuitState,
                load: `${currentLoad}/${endpoint.maxConcurrency}`,
                p95: health.p95Latency ? Math.round(health.p95Latency) : null,
                successRate: health.totalRequests > 0
                    ? `${Math.round((1 - health.totalFailures / health.totalRequests) * 100)}%`
                    : null,
                errors: { t: health.transientErrors, p: health.permanentErrors },
                saturation: health.saturationEvents,
                lastActive: timeSinceLast !== null ? `${timeSinceLast}s` : 'never',
                cold: timeSinceLast !== null && timeSinceLast > 300 ? '⚠️' : '✓'
            };
        }
        return summary;
    }

    // Export detailed metrics for monitoring
    exportMetrics() {
        const metrics = [];
        for (const [key, health] of Object.entries(this.healthMetrics)) {
            const endpoint = this.endpoints[key];
            metrics.push({
                endpoint: key,
                tier: endpoint.tier,
                timestamp: Date.now(),
                activeJobs: this.activeJobs.get(key) || 0,
                maxConcurrency: endpoint.maxConcurrency,
                circuitState: health.circuitState,
                avgLatencyMs: health.avgLatency,
                p95LatencyMs: health.p95Latency,
                p99LatencyMs: health.p99Latency,
                totalRequests: health.totalRequests,
                successRate: health.totalRequests > 0 ? (1 - health.totalFailures / health.totalRequests) : 1,
                transientErrors: health.transientErrors,
                permanentErrors: health.permanentErrors,
                saturationEvents: health.saturationEvents,
                circuitBackoffMs: health.circuitBackoffMs
            });
        }
        return metrics;
    }

    // Reset endpoint metrics (for manual intervention)
    resetEndpointMetrics(endpointKey) {
        const health = this.healthMetrics[endpointKey];
        if (!health) return false;
        health.consecutiveFailures = 0;
        health.consecutiveSuccesses = 0;
        health.circuitState = 'closed';
        health.circuitBackoffMs = this.circuitBreaker.minOpenDuration;
        health.circuitRecoveryAttempts = 0;
        health.saturationEvents = 0;
        health.transientErrors = 0;
        health.permanentErrors = 0;
        logger.info(`[LoadBalancer] Reset metrics for ${endpointKey}`);
        return true;
    }
}

const loadBalancer = new LoadBalancer();

// Export for testing
export { loadBalancer, LoadBalancer };

export const processImageTask = async (req) => {
    const { requestId, userId, modelId, negative_prompt, steps = 30, cfg = 7, aspectRatio = '1:1', scheduler, promptHash, promptMetadata } = req.data;
    let prompt = req.data.prompt;

    // Safety: Cap prompt length to 1500 chars for all models to prevent validation errors (Modal/Zit limit)
    if (prompt && prompt.length > 1500) {
        prompt = prompt.substring(0, 1500);
    }
    const docRef = db.collection("generation_queue").doc(requestId);

    const existingDoc = await docRef.get();
    if (existingDoc.exists && ['processing', 'completed'].includes(existingDoc.data().status)) {
        logger.info(`Idempotency check: Task ${requestId} already processed. Skipping.`, { requestId, status: existingDoc.data().status });
        return;
    }

    let originalFilename = null;
    let thumbFilename = null;
    let imageUrl = null;
    let thumbnailUrl = null;
    let lqip = null;

    const [activeJobsSnapshot, userSnap] = await Promise.all([
        db.collection('generation_queue').where('userId', '==', userId).where('status', '==', 'processing').get(),
        userId === 'anonymous-galmix' ? Promise.resolve({ data: () => ({}) }) : db.collection('users').doc(userId).get()
    ]);

    const activeCount = activeJobsSnapshot.docs.filter(d => d.id !== requestId).length;
    const userData = userSnap.data() || {};
    const useTurbo = req.data.useTurbo;
    const isPremiumModel = ['zit-model', 'qwen-image-2512'].includes(modelId);

    // 1. Resolve Resolution Early for Load Balancing
    const resolutionMap = {
        '1:1': { width: 1024, height: 1024 },
        '2:3': { width: 832, height: 1216 },
        '3:2': { width: 1216, height: 832 },
        '9:16': { width: 768, height: 1344 },
        '16:9': { width: 1344, height: 768 },
        '21:9': { width: 1536, height: 640 },
        '9:21': { width: 640, height: 1536 },
        '4:3': { width: 1152, height: 864 },
        '3:4': { width: 864, height: 1152 },
        '4:5': { width: 896, height: 1120 },
        '5:4': { width: 1120, height: 896 }
    };
    const resolution = resolutionMap[aspectRatio] || resolutionMap['1:1'];
    const jobSteps = steps || 30;

    // 2. Calculate Job Complexity for Smart Routing
    const jobComplexity = loadBalancer.calculateJobComplexity(
        resolution.width,
        resolution.height,
        jobSteps
    );

    // 3. Determine Model Type for Load Balancer
    let modelType = 'sdxl'; // default
    if (modelId === 'zit-model') modelType = 'zit';
    else if (modelId === 'flux-klein-4b') modelType = 'flux';
    else if (modelId === 'flux-2-dev') modelType = 'cf-flux';

    // 4. Get Dynamic Concurrency Limit Based on Endpoint Health
    let allowedConcurrency;
    if (modelType === 'cf-flux') {
        allowedConcurrency = 50; // Cloudflare concurrency
    } else {
        // Use the primary endpoint for the model type to determine limit
        const selectedEndpoints = loadBalancer.selectEndpoints(modelType, {
            useTurbo,
            jobComplexity,
            preferPremium: isPremiumModel || useTurbo
        });
        const primaryEndpoint = selectedEndpoints[0]?.key || 'sdxl-a10g';
        allowedConcurrency = loadBalancer.getDynamicConcurrencyLimit(
            primaryEndpoint,
            useTurbo ? 10 : 3
        );
    }

    if (activeCount >= allowedConcurrency) {
        logger.warn(`[Throttling] User ${userId} busy. Active: ${activeCount}/${allowedConcurrency}. Re-queuing task ${requestId}.`, {
            userId, activeCount, allowedConcurrency,
            primaryEndpoint,
            healthSummary: loadBalancer.getHealthSummary()
        });
        throw new Error(`Throttling: User Busy (${activeCount}/${allowedConcurrency}). Use Turbo for higher limits.`);
    }

    try {
        await docRef.update({ status: "processing" });

        let response;
        if (modelId === 'zit-model') {
            // Use LoadBalancer for intelligent endpoint selection
            const zitEndpoints = loadBalancer.selectEndpoints('zit', {
                useTurbo,
                jobComplexity,
                preferPremium: isPremiumModel
            });

            const zBody = { prompt, steps, width: resolution.width, height: resolution.height };

            if (useTurbo && ['1:1', '16:9', '9:16', '4:3', '3:4', '21:9', '9:21'].includes(aspectRatio)) {
                delete zBody.width; delete zBody.height; zBody.aspect_ratio = aspectRatio;
            }

            logger.info(`[${requestId}] Submitting zit-model via LoadBalancer`, {
                endpoints: zitEndpoints.map(e => e.key),
                jobComplexity: jobComplexity.toFixed(2),
                resolution: `${resolution.width}x${resolution.height}`,
                steps: jobSteps,
                concurrency: `${activeCount}/${allowedConcurrency}`
            });

            let submitResponse;
            let baseUrl;
            let usedEndpointKey = null;
            let jobStartTime = null;

            // Try endpoints in order based on LoadBalancer scoring
            for (const endpoint of zitEndpoints) {
                try {
                    // Check if we should throttle this endpoint
                    if (loadBalancer.shouldThrottle(endpoint.key)) {
                        logger.warn(`[LoadBalancer] ${endpoint.key} throttled, trying next`);
                        continue;
                    }

                    usedEndpointKey = endpoint.key;
                    jobStartTime = loadBalancer.recordJobStart(endpoint.key);

                    // Apply request spread delay to prevent thundering herd
                    await loadBalancer.applyRequestSpread(endpoint.key);

                    const result = await fetchWithRetry(`${endpoint.url}/generate`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(zBody),
                        timeout: 45000,
                        retries: 2
                    });
                    submitResponse = result;
                    baseUrl = endpoint.url;
                    break; // Success, exit the loop
                } catch (err) {
                    loadBalancer.recordFailure(endpoint.key, jobStartTime, err);

                    if (err.message.includes("429")) {
                        logger.warn(`[LoadBalancer] ${endpoint.key} rate limited (429), trying next endpoint`);
                        continue; // Try next endpoint
                    }

                    // For other errors, continue to next endpoint
                    logger.warn(`[LoadBalancer] ${endpoint.key} failed: ${err.message}, trying next endpoint`);
                }
            }

            if (!submitResponse) {
                logger.warn(`[Throttling] All Zit endpoints exhausted for task ${requestId}.`);
                throw new Error(`Throttling: Zit API Busy. All endpoints failed. Retrying...`);
            }

            const submitJson = await submitResponse.json();
            if (!submitJson.job_id) {
                loadBalancer.recordFailure(usedEndpointKey, jobStartTime, new Error("No job_id returned"));
                throw new Error("No job_id from Zit API");
            }
            const jobId = submitJson.job_id;
            logger.info(`[${requestId}] Zit job submitted to ${usedEndpointKey}: ${jobId}`);

            // Poll for result (max 180 seconds)
            const sleep = (ms) => new Promise(r => setTimeout(r, ms));
            let imageBuffer = null;
            // Poll every 2s for up to 90 attempts (180s)
            for (let poll = 0; poll < 90; poll++) {
                await sleep(2000);
                const resultRes = await fetch(`${baseUrl}/result/${jobId}`);

                if (resultRes.status === 202) {
                    // Still processing
                    continue;
                }

                if (!resultRes.ok) {
                    // Try to parse error
                    try {
                        const errJson = await resultRes.json();
                        if (errJson.status === 'failed') {
                            loadBalancer.recordFailure(usedEndpointKey, jobStartTime, new Error(errJson.error));
                            throw new Error(errJson.error || `Zit generation failed with status ${resultRes.status}`);
                        }
                    } catch {
                        // ignore json parse error, just throw status error
                    }
                    loadBalancer.recordFailure(usedEndpointKey, jobStartTime, new Error(`Status ${resultRes.status}`));
                    throw new Error(`Zit Polling Error (${resultRes.status}): ${await resultRes.text()}`);
                }

                const ct = resultRes.headers.get('content-type') || '';
                if (ct.includes('image/')) {
                    imageBuffer = Buffer.from(await resultRes.arrayBuffer());
                    loadBalancer.recordSuccess(usedEndpointKey, jobStartTime);
                    break;
                }

                const statusJson = await resultRes.json();
                if (statusJson.status === 'failed') {
                    loadBalancer.recordFailure(usedEndpointKey, jobStartTime, new Error(statusJson.error));
                    throw new Error(statusJson.error || 'Zit generation failed');
                }
                if (statusJson.status === 'completed' && !imageBuffer) {
                    // Should have been binary if completed, but handle edge case if it returns json with url
                    loadBalancer.recordFailure(usedEndpointKey, jobStartTime, new Error('Completed but no binary'));
                    throw new Error('Zit reported completed but returned JSON instead of binary image.');
                }
            }
            if (!imageBuffer) {
                loadBalancer.recordFailure(usedEndpointKey, jobStartTime, new Error('Timeout'));
                throw new Error("Zit generation timed out");
            }

            // Skip standard response processing
            response = { ok: true, _fluxImageBuffer: imageBuffer }; // reusing _fluxImageBuffer hack for now as it handles raw buffer bypass
        } else if (modelId === 'galmix') {
            logger.info(`[${requestId}] Submitting GalMix generation`);
            const galmixResult = await galmixClient.generateImage(prompt, {
                negative_prompt,
                steps: steps || 30
            });
            const imageBuffer = Buffer.from(galmixResult.result, 'base64');
            response = { ok: true, _fluxImageBuffer: imageBuffer };
        } else if (modelId === 'qwen-image-2512') {
            response = await fetchWithRetry("https://mariecoderinc--qwen-image-2512-qwenimage-api-generate.modal.run", {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ prompt, negative_prompt, aspect_ratio: aspectRatio }), timeout: 180000, retries: 3
            });
        } else if (modelId === 'flux-klein-4b') {
            // Flux uses async job pattern: submit, then poll for result
            // Use LoadBalancer for health tracking even though there's only one endpoint
            const fluxEndpoints = loadBalancer.selectEndpoints('flux', { jobComplexity });
            const fluxEndpoint = fluxEndpoints[0];
            const FLUX_ENDPOINT = fluxEndpoint?.url || "https://mariecoderinc--flux-klein-4b-flux-fastapi-app.modal.run";
            const fluxEndpointKey = fluxEndpoint?.key || 'flux';

            logger.info(`[${requestId}] Submitting flux-klein-4b via LoadBalancer`, {
                endpoint: fluxEndpointKey,
                jobComplexity: jobComplexity.toFixed(2),
                resolution: `${resolution.width}x${resolution.height}`
            });

            // 1. Submit job
            let submitResponse;

            // Check if endpoint is throttled
            if (loadBalancer.shouldThrottle(fluxEndpointKey)) {
                logger.warn(`[LoadBalancer] Flux endpoint throttled. Re-queuing task ${requestId}.`);
                throw new Error(`Throttling: Flux endpoint temporarily unavailable. Retrying...`);
            }

            const jobStartTime = loadBalancer.recordJobStart(fluxEndpointKey);

            // Apply request spread delay to prevent thundering herd
            await loadBalancer.applyRequestSpread(fluxEndpointKey);

            try {
                submitResponse = await fetchWithRetry(`${FLUX_ENDPOINT}/generate`, {
                    method: "POST", headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        prompt,
                        height: resolution.height,
                        width: resolution.width
                    }), timeout: 45000, retries: 3
                });
            } catch (err) {
                loadBalancer.recordFailure(fluxEndpointKey, jobStartTime, err);
                if (err.message.includes("429")) {
                    logger.warn(`[Throttling] Flux API rate limited (429). Re-queuing task ${requestId}.`);
                    throw new Error(`Throttling: Flux API Busy (429). Retrying...`);
                }
                throw err;
            }

            const submitJson = await submitResponse.json();
            if (!submitJson.job_id) {
                loadBalancer.recordFailure(fluxEndpointKey, jobStartTime, new Error("No job_id returned"));
                throw new Error("No job_id from Flux API");
            }
            const jobId = submitJson.job_id;
            logger.info(`[${requestId}] Flux job submitted to ${fluxEndpointKey}: ${jobId}`);

            // 2. Poll for result (max 120 seconds)
            const sleep = (ms) => new Promise(r => setTimeout(r, ms));
            let imageBuffer = null;
            for (let poll = 0; poll < 60; poll++) {
                await sleep(2000);
                const resultRes = await fetch(`${FLUX_ENDPOINT}/result/${jobId}`);
                const ct = resultRes.headers.get('content-type') || '';
                if (ct.includes('image/')) {
                    imageBuffer = Buffer.from(await resultRes.arrayBuffer());
                    loadBalancer.recordSuccess(fluxEndpointKey, jobStartTime);
                    break;
                }
                const statusJson = await resultRes.json();
                if (statusJson.status === 'failed') {
                    loadBalancer.recordFailure(fluxEndpointKey, jobStartTime, new Error(statusJson.error));
                    throw new Error(statusJson.error || 'Flux generation failed');
                }
            }
            if (!imageBuffer) {
                loadBalancer.recordFailure(fluxEndpointKey, jobStartTime, new Error('Timeout'));
                throw new Error("Flux generation timed out");
            }

            // Skip the normal response parsing; we already have imageBuffer
            // Jump directly to image processing (after the main if/else block handles response)
            response = { ok: true, _fluxImageBuffer: imageBuffer };
        } else if (modelId === 'gemini-2.5-flash-image') {
            const { VertexAI } = await import("@google-cloud/vertexai");
            const vertexAI = new VertexAI({ project: 'dreambees-alchemist', location: 'us-central1' });
            const model = vertexAI.getGenerativeModel({ model: "gemini-2.5-flash-image" });

            const request = {
                contents: [
                    {
                        role: 'user',
                        parts: [
                            { text: prompt }
                        ]
                    }
                ]
            };

            logger.info(`[${requestId}] Calling Vertex AI for gemini-2.5-flash-image generation`);

            // [MODIFIED] Use VertexFlow (Low Priority for Background Worker)
            const geminiResponse = await vertexFlow.execute('WORKER_GEMINI_IMAGE', async () => {
                const result = await model.generateContent(request);
                return result.response;
            }, vertexFlow.constructor.PRIORITY.LOW); // Low Priority for background jobs

            const candidate = geminiResponse.candidates?.[0];
            if (candidate?.finishReason === 'SAFETY') {
                throw new Error("Blocked by Safety Filter");
            }

            const imagePart = candidate?.content?.parts?.find(p => p.inlineData);
            const base64Data = imagePart?.inlineData?.data;

            if (!base64Data) {
                throw new Error("No image data returned from Gemini");
            }

            const imageBuffer = Buffer.from(base64Data, 'base64');
            response = { ok: true, _fluxImageBuffer: imageBuffer };
        } else if (modelId === 'flux-2-dev') {
            if (!CLOUDFLARE_ACCOUNT_ID || !CLOUDFLARE_API_TOKEN) {
                throw new Error("Cloudflare credentials not configured");
            }

            logger.info(`[${requestId}] Calling Cloudflare (via VertexFlow/LB) for flux-2-dev`);

            const CF_ENDPOINT = 'cf-flux-2-dev';

            // Use VertexFlow for queuing and concurrency management
            response = await vertexFlow.execute('WORKER_FLUX_DEV', async () => {
                // LoadBalancer: Check throttling (logging only, VertexFlow handles queue)
                if (loadBalancer.shouldThrottle(CF_ENDPOINT)) {
                    logger.debug(`[LoadBalancer] ${CF_ENDPOINT} reports throttled state.`);
                }

                const jobStartTime = loadBalancer.recordJobStart(CF_ENDPOINT);

                // LoadBalancer: Spread requests (jitter)
                await loadBalancer.applyRequestSpread(CF_ENDPOINT);

                const formData = new FormData();
                formData.append('prompt', prompt);
                formData.append('num_steps', (steps || 20).toString());
                formData.append('guidance', (cfg || 3.5).toString());

                const controller = new AbortController();
                const timeout = setTimeout(() => controller.abort(), 120000); // 2 min

                try {
                    // Use the URL from the LoadBalancer config to ensure consistency
                    const endpointUrl = loadBalancer.endpoints[CF_ENDPOINT].url;

                    const cfResponse = await fetch(endpointUrl, {
                        method: "POST",
                        headers: {
                            "Authorization": `Bearer ${CLOUDFLARE_API_TOKEN}`
                        },
                        body: formData,
                        signal: controller.signal
                    });

                    if (!cfResponse.ok) {
                        const errText = await cfResponse.text();
                        const error = new Error(`Cloudflare Flux-2 Error (${cfResponse.status}): ${errText}`);
                        loadBalancer.recordFailure(CF_ENDPOINT, jobStartTime, error);
                        throw error;
                    }

                    const cfJson = await cfResponse.json();
                    let base64Img = null;
                    if (cfJson.result && cfJson.result.image) {
                        base64Img = cfJson.result.image;
                    } else if (typeof cfJson.result === 'string') {
                        base64Img = cfJson.result;
                    }

                    if (!base64Img) {
                        const error = new Error("No image data found in Cloudflare response");
                        loadBalancer.recordFailure(CF_ENDPOINT, jobStartTime, error);
                        throw error;
                    }

                    const imageBuffer = Buffer.from(base64Img, 'base64');
                    loadBalancer.recordSuccess(CF_ENDPOINT, jobStartTime);

                    // Return consistent response object
                    return { ok: true, _fluxImageBuffer: imageBuffer };
                } catch (e) {
                    // Ensure we record failure if we haven't already
                    // (Simple check: if we're catching here, it's likely a failure of the fetch block)
                    loadBalancer.recordFailure(CF_ENDPOINT, jobStartTime, e);
                    throw e;
                } finally {
                    clearTimeout(timeout);
                }
            }, vertexFlow.constructor.PRIORITY.NORMAL);
        } else {
            // SDXL Handling - Use LoadBalancer for intelligent endpoint selection
            const sdxlEndpoints = loadBalancer.selectEndpoints('sdxl', {
                useTurbo,
                jobComplexity,
                preferPremium: useTurbo
            });

            const sBody = {
                prompt,
                model: modelId || "wai-illustrious",
                negative_prompt, // Optional
                steps,
                width: resolution.width,
                height: resolution.height,
                scheduler: scheduler || 'DPM++ 2M Karras'
            };

            logger.info(`[${requestId}] Submitting SDXL via LoadBalancer`, {
                endpoints: sdxlEndpoints.map(e => e.key),
                jobComplexity: jobComplexity.toFixed(2),
                resolution: `${resolution.width}x${resolution.height}`,
                steps: jobSteps,
                concurrency: `${activeCount}/${allowedConcurrency}`
            });

            let submitResponse;
            let baseUrl;
            let usedEndpointKey = null;
            let jobStartTime = null;

            // Try endpoints in order based on LoadBalancer scoring
            for (const endpoint of sdxlEndpoints) {
                try {
                    // Check if we should throttle this endpoint
                    if (loadBalancer.shouldThrottle(endpoint.key)) {
                        logger.warn(`[LoadBalancer] ${endpoint.key} throttled, trying next`);
                        continue;
                    }

                    usedEndpointKey = endpoint.key;
                    jobStartTime = loadBalancer.recordJobStart(endpoint.key);

                    // Apply request spread delay to prevent thundering herd
                    await loadBalancer.applyRequestSpread(endpoint.key);

                    const result = await fetchWithRetry(`${endpoint.url}/generate`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(sBody),
                        timeout: 45000,
                        retries: 2
                    });

                    if (!result.ok) {
                        throw new Error(`SDXL Submission Failed (${result.status})`);
                    }

                    submitResponse = result;
                    baseUrl = endpoint.url;
                    break; // Success, exit the loop
                } catch (err) {
                    loadBalancer.recordFailure(endpoint.key, jobStartTime, err);

                    if (err.message.includes("429")) {
                        logger.warn(`[LoadBalancer] ${endpoint.key} rate limited (429), trying next endpoint`);
                        continue; // Try next endpoint
                    }

                    // For other errors, continue to next endpoint
                    logger.warn(`[LoadBalancer] ${endpoint.key} failed: ${err.message}, trying next endpoint`);
                }
            }

            if (!submitResponse) {
                logger.warn(`[Throttling] All SDXL endpoints exhausted for task ${requestId}.`);
                throw new Error(`Throttling: SDXL API Busy. All endpoints failed. Retrying...`);
            }

            const submitJson = await submitResponse.json();
            if (!submitJson.job_id) {
                loadBalancer.recordFailure(usedEndpointKey, jobStartTime, new Error("No job_id returned"));
                throw new Error("No job_id from SDXL API");
            }
            const jobId = submitJson.job_id;
            logger.info(`[${requestId}] SDXL job submitted to ${usedEndpointKey}: ${jobId}`);

            // Poll for result (max 180 seconds)
            const sleep = (ms) => new Promise(r => setTimeout(r, ms));
            let imageBuffer = null;
            for (let poll = 0; poll < 90; poll++) {
                await sleep(2000);

                // Try /result/ first, then fallback to /jobs/ if 404
                let resultRes = await fetch(`${baseUrl}/result/${jobId}`);
                if (resultRes.status === 404) {
                    resultRes = await fetch(`${baseUrl}/jobs/${jobId}`);
                }

                if (resultRes.status === 202) continue; // Still processing (Queued/Generating)

                if (!resultRes.ok) {
                    try {
                        const errJson = await resultRes.json();
                        if (errJson.status === 'failed') {
                            loadBalancer.recordFailure(usedEndpointKey, jobStartTime, new Error(errJson.error));
                            throw new Error(errJson.error || `SDXL generation failed with status ${resultRes.status}`);
                        }
                    } catch {
                        // ignore parse error
                    }
                    loadBalancer.recordFailure(usedEndpointKey, jobStartTime, new Error(`Status ${resultRes.status}`));
                    throw new Error(`SDXL Polling Error (${resultRes.status}): ${await resultRes.text()}`);
                }

                const ct = resultRes.headers.get('content-type') || '';
                if (ct.includes('image/')) {
                    imageBuffer = Buffer.from(await resultRes.arrayBuffer());
                    loadBalancer.recordSuccess(usedEndpointKey, jobStartTime);
                    break;
                }

                const statusJson = await resultRes.json();
                if (statusJson.status === 'failed') {
                    loadBalancer.recordFailure(usedEndpointKey, jobStartTime, new Error(statusJson.error));
                    throw new Error(statusJson.error || 'SDXL generation failed');
                }

                if (['queued', 'generating', 'processing'].includes(statusJson.status)) continue;
            }

            if (!imageBuffer) {
                loadBalancer.recordFailure(usedEndpointKey, jobStartTime, new Error('Timeout'));
                throw new Error("SDXL generation timed out");
            }
            response = { ok: true, _fluxImageBuffer: imageBuffer }; // reusing _fluxImageBuffer hack
        }

        if (!response.ok && !response._fluxImageBuffer) throw new Error(`Model Provider Error (${response.status}): ${await response.text()}`);

        let imageBuffer;
        let responseProcessed = false;

        // Special case: Flux async pattern already has the image buffer
        if (response._fluxImageBuffer) {
            imageBuffer = response._fluxImageBuffer;
            responseProcessed = true;
        } else {
            try {
                const contentType = response.headers.get("content-type") || "";
                const clonedResponse = response.clone();
                const firstBytesClone = response.clone();
                const firstBytes = await readFirstBytes(firstBytesClone, 12);
                if (!firstBytes || firstBytes.length === 0) throw new Error("Response body is empty");
                const detectedFormat = detectImageFormat(firstBytes);
                const isLikelyImage = detectedFormat !== null;
                const isLikelyJSON = looksLikeJSON(firstBytes);

                if (isLikelyImage) {
                    const arrayBuffer = await clonedResponse.arrayBuffer();
                    imageBuffer = Buffer.from(arrayBuffer);
                    responseProcessed = true;
                } else if (contentType.includes("application/json") || (isLikelyJSON && !contentType.includes("image/"))) {
                    try {
                        const jsonData = await clonedResponse.json();
                        const base64Image = jsonData.image || jsonData.data || jsonData.output || jsonData.result;
                        if (jsonData.image_bytes) {
                            imageBuffer = Buffer.from(jsonData.image_bytes, 'hex');
                            responseProcessed = true;
                        }
                        if (typeof base64Image === 'string') {
                            if (base64Image.startsWith('data:')) {
                                const matches = base64Image.match(/^data:image\/[^;]+;base64,(.+)$/);
                                if (matches) imageBuffer = Buffer.from(matches[1], 'base64');
                            } else if (base64Image.length > 100) {
                                try { imageBuffer = Buffer.from(base64Image, 'base64'); } catch { /* ignore decode error */ }
                            }
                            if (imageBuffer) responseProcessed = true;
                        }
                        if (!responseProcessed && (jsonData.url || jsonData.imageUrl)) {
                            const ir = await fetchWithTimeout(jsonData.url || jsonData.imageUrl);
                            imageBuffer = Buffer.from(await ir.arrayBuffer());
                            responseProcessed = true;
                        }
                    } catch {
                        const fb = response.clone();
                        const ab = await fb.arrayBuffer();
                        if (detectImageFormat(Buffer.from(ab))) {
                            imageBuffer = Buffer.from(ab);
                            responseProcessed = true;
                        }
                    }
                } else {
                    const ab = await clonedResponse.arrayBuffer();
                    imageBuffer = Buffer.from(ab);
                    responseProcessed = true;
                }
                if (!imageBuffer || imageBuffer.length < 100) throw new Error("Invalid image buffer extracted");
            } catch (error) {
                logger.error(`[${requestId}] Processing error: ${error.message}`, error);
                throw error;
            }
        }

        // Image processing - runs for all models
        const { default: sharp } = await import("sharp");
        const sharpImg = sharp(imageBuffer);
        const webpBuffer = await sharpImg.webp({ quality: 90 }).toBuffer();
        const thumbBuffer = await sharpImg.resize(512, 512, { fit: 'inside', withoutEnlargement: true }).webp({ quality: 80 }).toBuffer();
        const lqipBuffer = await sharpImg.resize(20, 20, { fit: 'inside' }).webp({ quality: 20 }).toBuffer();
        lqip = `data:image/webp;base64,${lqipBuffer.toString('base64')}`;

        const baseFolder = `generated/${userId}/${Date.now()}`;
        originalFilename = `${baseFolder}.webp`;
        thumbFilename = `${baseFolder}_thumb.webp`;

        const { PutObjectCommand } = await import("@aws-sdk/client-s3");
        const s3 = await getS3Client();

        await Promise.all([
            s3.send(new PutObjectCommand({ Bucket: B2_BUCKET, Key: originalFilename, Body: webpBuffer, ContentType: "image/webp" })),
            s3.send(new PutObjectCommand({ Bucket: B2_BUCKET, Key: thumbFilename, Body: thumbBuffer, ContentType: "image/webp" }))
        ]);

        imageUrl = `${B2_PUBLIC_URL}/file/${B2_BUCKET}/${originalFilename}`;
        thumbnailUrl = `${B2_PUBLIC_URL}/file/${B2_BUCKET}/${thumbFilename}`;

        const imageRef = await db.collection("images").add({
            userId, prompt, negative_prompt, steps, cfg, aspectRatio, modelId,
            imageUrl, thumbnailUrl, lqip, promptHash, promptMetadata,
            createdAt: FieldValue.serverTimestamp(), originalRequestId: requestId
        });

        await docRef.update({ status: "completed", imageUrl, thumbnailUrl, lqip, completedAt: new Date(), resultImageId: imageRef.id });

    } catch (error) {
        logger.error(`[${requestId}] Task Failed`, error);
        let recoverySucceeded = false;
        if (imageUrl && thumbnailUrl) {
            try {
                const queueDoc = await docRef.get();
                if (queueDoc.exists && !queueDoc.data().imageUrl) {
                    await docRef.update({ status: "completed", imageUrl, thumbnailUrl, lqip, completedAt: new Date() });
                    recoverySucceeded = true;
                }
            } catch (recErr) { logger.error("Recovery failed", recErr); }
        }

        if (!recoverySucceeded) {
            if (userId !== 'anonymous-galmix') {
                await retryOperation(() => db.collection('users').doc(userId).update({ zaps: FieldValue.increment(1) }), { context: 'Refund Image Task' })
                    .catch(e => logger.error("Refund Error", e, { userId }));
            }
            await docRef.update({ status: "failed", error: error.message });
        }
    }
}

