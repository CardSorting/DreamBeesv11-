/**
 * Circuit Breaker Infrastructure Layer
 *
 * Purpose: Prevent cascading failures and handle external service outages gracefully
 * Location: Infrastructure (retry patterns, reliability patterns)
 * Principle: Pure circuit breaker state management with no side effects
 */
/**
* Defines the state of the circuit breaker
*/
export var CircuitState;
(function (CircuitState) {
    CircuitState["CLOSED"] = "CLOSED";
    CircuitState["OPEN"] = "OPEN";
    CircuitState["HALF_OPEN"] = "HALF_OPEN"; // Temporary state - allows test requests
})(CircuitState || (CircuitState = {}));
/**
* Default logger implementation
*/
const defaultLogger = {
    logEvent(event, metadata) {
        // In production, this would send to centralized logging system
        console.log(`[CircuitBreaker:${event}] ${JSON.stringify(metadata || {})}`);
    }
};
/**
* Thresholds for automatic operations
*/
const DEFAULT_THRESHOLDS = {
    FAILURE_THRESHOLD: 5, // 5 consecutive failures trigger open
    RESET_TIMEOUT_MS: 60000, // 1 minute before attempting to close
    HALF_OPEN_MAX_ATTEMPTS: 3, // Allow 3 successful requests before fully closed
    MAX_FAILURE_STORAGE_DAYS: 30 // Clean up old failures after 30 days
};
/**
* Circuit Breaker implementation for production reliability
*
* Provides automatic failure handling and state management for external service calls
*
 * @param config Circuit breaker configuration
 * @returns Circuit breaker instance that can be used for async operations
 *
 * @throws Will throw if folder path is missing or invalid
 */
export class CircuitBreaker {
    state;
    config;
    localLog; // Local memoized state
    constructor(config) {
        this.config = {
            failureThreshold: config.failureThreshold || DEFAULT_THRESHOLDS.FAILURE_THRESHOLD,
            resetTimeoutMs: config.resetTimeoutMs || DEFAULT_THRESHOLDS.RESET_TIMEOUT_MS,
            halfOpenMaxAttempts: config.halfOpenMaxAttempts || DEFAULT_THRESHOLDS.HALF_OPEN_MAX_ATTEMPTS,
            name: config.name || 'default_circuit',
            logger: config.logger || defaultLogger
        };
        // Initialize state
        this.state = {
            state: CircuitState.CLOSED,
            failureCount: 0,
            successCount: 0,
            totalFailureCount: 0,
            totalSuccessCount: 0,
            stateTimestamp: new Date()
        };
        // Start monitoring loop for reset detection
        this.startMonitoring();
        this.localLog = { ...this.state };
    }
    /**
     * Execute a function call through the circuit breaker
     *
     * Automatically handles state transitions and failure tracking
     *
     * @param fn The function to execute
     * @returns Execution result with whether it succeeded and any error
     */
    async execute(fn) {
        const result = {
            success: false,
            circuitState: this.state.state
        };
        try {
            // Check if circuit is open
            if (this.state.state === CircuitState.OPEN) {
                // Check if reset timeout has passed
                const timeSinceOpen = Date.now() - this.state.lastFailureTime?.getTime() || 0;
                if (timeSinceOpen >= this.config.resetTimeoutMs) {
                    // Transition to half-open state - allow test requests
                    this.transitionState(CircuitState.HALF_OPEN);
                    this.config.logger.logEvent('CIRCUIT_RETRY', {
                        breakerName: this.config.name,
                        timeSinceOpen,
                        resetTimeoutMs: this.config.resetTimeoutMs
                    });
                }
                else {
                    result.wasRejected = true;
                    result.error = new Error(`Circuit breaker OPEN for ${this.config.name}. Retry later.`);
                    this.config.logger.logEvent('CIRCUIT_REJECTED_OPEN', {
                        breakerName: this.config.name,
                        timeSinceOpen,
                        resetTimeoutMs: this.config.resetTimeoutMs
                    });
                    return result;
                }
            }
            // Execute the function
            const value = await fn();
            result.success = true;
            result.value = value;
            // Handle success based on current state
            if (this.state.state === CircuitState.OPEN) {
                // Currently open but successfully executed - transition to half-open
                this.recordSuccess();
                this.config.logger.logEvent('CIRCUIT_SUCCESS_HALF_OPEN', {
                    breakerName: this.config.name,
                    successCount: this.state.successCount
                });
            }
            else {
                // Normal success
                this.recordSuccess();
                if (this.state.state === CircuitState.HALF_OPEN) {
                    // All required successful attempts made
                    this.transitionState(CircuitState.CLOSED);
                    this.config.logger.logEvent('CIRCUIT_CLOSED', {
                        breakerName: this.config.name,
                        totalAttempts: this.state.successCount
                    });
                }
            }
            return result;
        }
        catch (error) {
            result.success = false;
            result.error = error;
            return this.handleError(error);
        }
    }
    /**
     * Record a failure and update circuit state
     *
     * @param error The error that occurred
     * @returns Result with rejection info
     */
    handleError(error) {
        this.recordFailure();
        const result = {
            success: false,
            error,
            circuitState: this.state.state,
            wasRejected: false
        };
        // Check if circuit should be opened
        if (this.state.state !== CircuitState.OPEN &&
            this.state.failureCount >= this.config.failureThreshold) {
            this.transitionState(CircuitState.OPEN);
            this.config.logger.logEvent('CIRCUIT_OPENED', {
                breakerName: this.config.name,
                failureCount: this.state.failureCount,
                totalFailures: this.state.totalFailureCount
            });
        }
        return result;
    }
    /**
     * Record a successful operation
     */
    recordSuccess() {
        this.state.successCount++;
        this.state.successCount = Math.min(this.state.successCount, this.config.halfOpenMaxAttempts);
        this.state.lastSuccessTime = new Date();
        this.state.totalSuccessCount++;
    }
    /**
     * Record a failed operation
     */
    recordFailure() {
        this.state.failureCount++;
        this.state.totalFailureCount++;
        this.state.lastFailureTime = new Date();
        if (this.state.state === CircuitState.HALF_OPEN) {
            // Got a failure in half-open state - it's not reliable yet, reopen
            this.transitionState(CircuitState.OPEN);
            this.state.failureCount = 1; // Reset for next open cycle
            this.config.logger.logEvent('CIRCUIT_REOPENED', {
                breakerName: this.config.name,
                totalFailures: this.state.totalFailureCount
            });
        }
    }
    /**
     * Transition to a new state
     *
     * @param newState The target state
     */
    transitionState(newState) {
        this.config.logger.logEvent('STATE_TRANSITION', {
            breakerName: this.config.name,
            from: this.state.state,
            to: newState
        });
        this.state.state = newState;
        this.state.successCount = 0; // Reset success counter on state change
        this.state.stateTimestamp = new Date();
    }
    /**
     * Start monitoring loop to automatically manage circuit states
     *
     * Runs in background to handle timing-based state transitions
     */
    startMonitoring() {
        // Check for reset timeouts every 5 seconds
        setInterval(() => {
            if (this.state.state === CircuitState.OPEN) {
                const timeSinceOpen = Date.now() - (this.state.lastFailureTime?.getTime() || 0);
                if (timeSinceOpen >= this.config.resetTimeoutMs) {
                    this.config.logger.logEvent('AUTO_RESET_CHECK', {
                        breakerName: this.config.name,
                        timeSinceOpen,
                        resetTimeoutMs: this.config.resetTimeoutMs
                    });
                    // This will be verified in the next execute() call
                }
            }
        }, 5000);
    }
    /**
     * Get current state (useful for monitoring/alerting)
     */
    getState() {
        return { ...this.state };
    }
    /**
     * Manually reset the circuit breaker (emergency operations)
     *
     * @param immediateIfOpen Force clear circuit even if open
     */
    reset(immediateIfOpen = false) {
        if (this.state.state === CircuitState.OPEN && !immediateIfOpen) {
            return;
        }
        this.transitionState(CircuitState.CLOSED);
        this.state.failureCount = 0;
        this.state.successCount = 0;
        this.config.logger.logEvent('MANUAL_RESET', {
            breakerName: this.config.name,
            previousState: this.state.state
        });
    }
    /**
     * Get health and statistics
     */
    getHealth() {
        const isHealthy = this.state.state === CircuitState.CLOSED;
        return {
            state: this.state.state,
            isHealthy,
            stats: {
                breakerName: this.config.name,
                failureCount: this.state.failureCount,
                totalFailureCount: this.state.totalFailureCount,
                successCount: this.state.successCount,
                totalSuccessCount: this.state.totalSuccessCount,
                currentRate: this.calculateSuccessRate()
            }
        };
    }
    /**
     * Calculate success rate percentage
     */
    calculateSuccessRate() {
        const total = this.state.totalFailureCount + this.state.totalSuccessCount;
        if (total === 0)
            return 100;
        return Math.round((this.state.totalSuccessCount / total) * 100);
    }
}
/**
* Create reusable circuit breakers for common use cases
*/
export const createCircuitBreakers = () => {
    // AI Model Circuit Breaker (handles external AI service failures)
    const aiCircuit = new CircuitBreaker({
        name: 'ai_model_service',
        failureThreshold: 3,
        resetTimeoutMs: 30000, // 30 second reset
        halfOpenMaxAttempts: 2,
        logger: defaultLogger
    });
    // Infrastructure Circuit Breaker (handles storage/API failures)
    const infraCircuit = new CircuitBreaker({
        name: 'infrastructure_storage',
        failureThreshold: 5,
        resetTimeoutMs: 60000, // 1 minute reset
        halfOpenMaxAttempts: 3,
        logger: defaultLogger
    });
    return {
        aiCircuit,
        infraCircuit
    };
};
//# sourceMappingURL=circuitBreaker.js.map