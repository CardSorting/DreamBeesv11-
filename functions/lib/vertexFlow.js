
import { logger } from "./utils.js";

/**
 * VertexFlowProcessor
 * 
 * A centralized processor for Google Cloud Vertex AI interactions that implements:
 * 1. Circuit Breaker Pattern - Fails fast when the service is unhealthy.
 * 2. Adaptive Throttling - Uses decorrelated jitter for backoff to prevent thundering herds.
 * 3. Error Classification - Distinguishes between transient (retriable) and permanent errors.
 * 4. Metrics - Tracks health per "app" or feature context.
 */
class VertexFlowProcessor {
    constructor() {
        this.metrics = {
            totalRequests: 0,
            totalFailures: 0,
            circuitTrips: 0,
            consecutiveFailures: 0,
            lastFailureTime: 0,
            lastFailureError: null
        };

        this.circuit = {
            state: 'CLOSED', // CLOSED, OPEN, HALF_OPEN
            failureThreshold: 5,
            resetTimeoutMs: 30000,
            nextTryTime: 0
        };

        // Configuration
        // [MODIFIED] Phase 4: Reliability & Cost
        this.MAX_RETRIES = 1; // "Don't spam retry" -> Cost saver
        this.BASE_DELAY_MS = 1000;
        this.MAX_DELAY_MS = 15000;

        // Phase 2: Bulkhead & Queue
        // [MODIFIED] Phase 3: Dynamic Concurrency (AIMD)
        this.MAX_CAP = 20;
        this.MIN_CAP = 1;
        this.currentConcurrencyLimit = 5; // Start conservative
        this.lastAdjustmentTime = 0;
        this.ADJUSTMENT_COOLDOWN_MS = 5000; // Don't increase immediately after decrease

        this.activeCount = 0;
        this.queue = []; // Array of { resolver, rejecter, priority, timestamp }
        this.QUEUE_TIMEOUT_MS = 60000; // Shed load if queued > 60s

        // Start Healer Loop
        // This ensures that if the queue has items but no new traffic comes in,
        // we still check the circuit and process the queue.
        if (typeof setInterval !== 'undefined') {
            setInterval(() => this._healerTick(), 1000);
        }
    }

    // Priority Constants
    static get PRIORITY() {
        return {
            HIGH: 2,   // Interactive (Transformation)
            NORMAL: 1, // Standard
            LOW: 0     // Background (Showcase, Slideshow)
        };
    }

    /**
     * Executes a Vertex AI operation with flow control.
     * 
     * @param {string} context - The feature name (e.g., 'MEOWACC', 'SLIDESHOW')
     * @param {Function} operation - Async function performing the Vertex AI call
     * @returns {Promise<any>} - The result of the operation
     */
    async execute(context, operation, priority = VertexFlowProcessor.PRIORITY.NORMAL) {
        // [MODIFIED] Phase 4: Patient Queuing
        // If circuit is OPEN, we don't fail fast anymore. We treat it as "High Congestion"
        // and force the request into the queue to wait for a slot/recovery.
        const isCircuitOpen = (this.circuit.state === 'OPEN');

        // [MODIFIED] Phase 3: Dynamic Check
        // Use floor because limit can be fractional (e.g. 5.2)
        const currentLimit = Math.floor(this.currentConcurrencyLimit);

        // Queue if:
        // 1. Circuit is OPEN (Wait patiently for recovery)
        // 2. OR Active count exceeds limit (Bulkhead)
        if (isCircuitOpen || this.activeCount >= currentLimit) {
            const reason = isCircuitOpen ? "Circuit OPEN" : `Active: ${this.activeCount}/${currentLimit}`;
            logger.info(`[VertexFlow] ${context} Queued (${reason}) Priority: ${priority}`);
            await this._enqueue(priority);
        }

        this.activeCount++;

        try {
            return await this._executeWithRetries(context, operation);
        } finally {
            this.activeCount--;
            this._processQueue(); // Allow next in line
        }
    }

    async _enqueue(priority) {
        return new Promise((resolve, reject) => {
            const item = {
                resolve,
                reject,
                priority,
                timestamp: Date.now()
            };

            // Insert based on priority (Highest first)
            // Simple logic: Find first item with LOWER priority and insert before it
            const index = this.queue.findIndex(q => q.priority < priority);
            if (index === -1) {
                this.queue.push(item);
            } else {
                this.queue.splice(index, 0, item);
            }

            // Safety timeout check (Load Shedding) handled in _processQueue or separate cleaner?
            // Let's do a simple check when adding: if queue is huge, maybe reject oldest?
            // For now, rely on _processQueue to check timeouts when dequeuing.
        });
    }

    _processQueue() {
        const currentLimit = Math.floor(this.currentConcurrencyLimit);

        // Check circuit state first. If OPEN, we can't process queue unless probing.
        // Actually execute() calls _checkCircuit() which might transition to HALF_OPEN.
        // But _processQueue isn't executing. It's dequeuing.

        // Fix: Force a check here
        this._checkCircuit();
        const canExecute = (this.circuit.state !== 'OPEN') && (this.activeCount < currentLimit);

        if (canExecute && this.queue.length > 0) {
            const item = this.queue.shift(); // Get highest priority (front of array)

            // Check timeout (Load Shedding)
            const queuedDuration = Date.now() - item.timestamp;
            if (queuedDuration > this.QUEUE_TIMEOUT_MS) {
                logger.warn(`[VertexFlow] Dropped queued item (Timeout ${Math.round(queuedDuration / 1000)}s)`);
                item.reject(new Error("Service Overloaded (Queue Timeout)"));
                // Recursively try next
                this._processQueue();
            } else {
                item.resolve();
            }
        }
    }

    _healerTick() {
        if (this.queue.length > 0) {
            this._processQueue();
        }
    }

    async _executeWithRetries(context, operation) {
        let attempt = 0;
        let lastError = null;

        while (attempt <= this.MAX_RETRIES) {
            try {
                if (attempt > 0) {
                    const delay = this._calculateBackoff(attempt);
                    logger.info(`[VertexFlow] ${context} Retry ${attempt}/${this.MAX_RETRIES} waiting ${delay}ms`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                }

                // If circuit failed during wait, we used to re-check here.
                // But now we want to be patient. If it's open, proceed anyway?
                // Actually, if we are here, we are "Active".
                // If the circuit TRIPS while we are waiting, we might want to fail the retry?
                // But the user said "Don't throw errors".
                // So let's try anyway. If it fails again, it fails.

                this.metrics.totalRequests++;
                const result = await operation();

                this._recordSuccess();
                return result;

            } catch (error) {
                lastError = error;
                const classification = this._classifyError(error);

                logger.warn(`[VertexFlow] ${context} Attempt ${attempt + 1} failed: ${classification}`, { error: error.message });

                if (classification === 'PERMANENT') {
                    throw error; // Don't retry
                }

                if (classification === 'QUOTA' || classification === 'OVERLOAD') {
                    this._recordFailure(error);
                }

                // If it's a safety filter issue, it's permanent for this specific prompt, but not a system failure
                if (error.message.includes("Safety") || error.message.includes("SAFETY")) {
                    throw error; // Don't retry safety blocks
                }

                attempt++;
            }
        }

        throw lastError;
    }

    _classifyError(error) {
        const msg = error.message.toLowerCase();
        if (msg.includes('429') || msg.includes('quota') || msg.includes('resource exhausted')) return 'QUOTA';
        if (msg.includes('503') || msg.includes('service unavailable') || msg.includes('overloaded')) return 'OVERLOAD';
        if (msg.includes('safety') || msg.includes('blocked')) return 'PERMANENT';
        if (msg.includes('invalid') || msg.includes('argument')) return 'PERMANENT';
        return 'TRANSIENT';
    }

    _calculateBackoff(attempt) {
        // Decorrelated Jitter: standard exponential backoff is too predictable.
        // sleep = min(cap, random_between(base, sleep * 3))
        // Here we simplify to: min(MAX, (2^attempt * BASE) + random_jitter)
        const exp = Math.pow(2, attempt) * this.BASE_DELAY_MS;
        const jitter = Math.random() * 1000;
        return Math.min(this.MAX_DELAY_MS, exp + jitter);
    }

    _checkCircuit() {
        // [MODIFIED] Phase 4: Removed Throws
        // We no longer throw here. The check is moved to execute() to trigger queuing.
        if (this.circuit.state === 'OPEN') {
            if (Date.now() > this.circuit.nextTryTime) {
                this.circuit.state = 'HALF_OPEN';
                logger.info("[VertexFlow] Circuit transitioning to HALF_OPEN (Probing)");
            }
        }
    }

    _recordSuccess() {
        if (this.circuit.state === 'HALF_OPEN') {
            this.circuit.state = 'CLOSED';
            this.metrics.consecutiveFailures = 0;
            logger.info("[VertexFlow] Circuit CLOSED (Recovered)");
        } else if (this.circuit.state === 'CLOSED') {
            this.metrics.consecutiveFailures = 0;

            // [NEW] AIMD: Additive Increase
            // Slowly increase limit if we are utilizing it and successful
            if (this.activeCount >= Math.floor(this.currentConcurrencyLimit) * 0.8) {
                // Only increase if we are actually under load, otherwise limit stays stable
                if (this.currentConcurrencyLimit < this.MAX_CAP) {
                    this.currentConcurrencyLimit += 0.2; // Increase by 1 every 5 successful requests under load
                    // logger.debug(`[VertexFlow] AIMD Increase: Limit=${this.currentConcurrencyLimit.toFixed(1)}`);
                }
            }
        }
    }

    _recordFailure(error) {
        this.metrics.totalFailures++;
        this.metrics.consecutiveFailures++;
        this.metrics.lastFailureTime = Date.now();
        this.metrics.lastFailureError = error.message;

        // [NEW] AIMD: Multiplicative Decrease
        // If we hit limits, slash the concurrency limit
        if (Date.now() - this.lastAdjustmentTime > this.ADJUSTMENT_COOLDOWN_MS) {
            const oldLimit = this.currentConcurrencyLimit;
            this.currentConcurrencyLimit = Math.max(this.MIN_CAP, this.currentConcurrencyLimit * 0.5);
            this.lastAdjustmentTime = Date.now();
            logger.warn(`[VertexFlow] AIMD Throttling: Limit dropped ${oldLimit.toFixed(1)} -> ${this.currentConcurrencyLimit.toFixed(1)} (Reason: ${error.message})`);
        }

        if (this.circuit.state === 'CLOSED' && this.metrics.consecutiveFailures >= this.circuit.failureThreshold) {
            this._tripCircuit();
        } else if (this.circuit.state === 'HALF_OPEN') {
            this._tripCircuit(); // Trip immediately if probing fails
        }
    }

    _tripCircuit() {
        this.circuit.state = 'OPEN';
        this.metrics.circuitTrips++;
        this.circuit.nextTryTime = Date.now() + this.circuit.resetTimeoutMs;
        logger.error(`[VertexFlow] Circuit TRIPPED! consec_fails=${this.metrics.consecutiveFailures}. Cooldown until ${new Date(this.circuit.nextTryTime).toISOString()}`);
    }
}

// Singleton instance
export const vertexFlow = new VertexFlowProcessor();
