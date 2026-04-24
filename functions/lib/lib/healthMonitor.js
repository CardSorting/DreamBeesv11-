import { logger } from "./utils.js";
export class EndpointHealthMonitor {
    loadBalancer;
    checkIntervalMs;
    healthTimeout;
    intervalId = null;
    lastChecks = new Map();
    constructor(loadBalancer, options = {}) {
        this.loadBalancer = loadBalancer;
        this.checkIntervalMs = options.checkIntervalMs || 5 * 60 * 1000;
        this.healthTimeout = options.healthTimeout || 10000;
    }
    /**
     * Start periodic health monitoring
     */
    start() {
        if (this.intervalId) {
            return;
        }
        logger.info("[HealthMonitor] Starting endpoint health monitoring", {
            intervalMs: this.checkIntervalMs
        });
        this.runHealthChecks().catch(err => logger.error("[HealthMonitor] Initial health check failed", err));
        this.intervalId = setInterval(() => {
            this.runHealthChecks().catch(err => logger.error("[HealthMonitor] Periodic health check failed", err));
        }, this.checkIntervalMs);
    }
    /**
     * Stop health monitoring
     */
    stop() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
            logger.info("[HealthMonitor] Stopped endpoint health monitoring");
        }
    }
    /**
     * Run health checks on all endpoints
     */
    async runHealthChecks() {
        const endpoints = Object.keys(this.loadBalancer.endpoints);
        const results = await Promise.allSettled(endpoints.map(key => this.checkEndpoint(key)));
        const summary = {
            healthy: 0,
            unhealthy: 0,
            cold: 0,
            timestamp: Date.now()
        };
        results.forEach((result, idx) => {
            const key = endpoints[idx];
            if (result.status === 'fulfilled' && result.value.healthy) {
                summary.healthy++;
            }
            else {
                summary.unhealthy++;
            }
            const health = this.loadBalancer.healthMetrics[key];
            const timeSinceLast = health?.lastRequest
                ? (Date.now() - health.lastRequest)
                : Infinity;
            if (timeSinceLast > this.loadBalancer.coldStart.idleThreshold) {
                summary.cold++;
            }
        });
        logger.info("[HealthMonitor] Health check complete", summary);
        return summary;
    }
    /**
     * Check a single endpoint's health
     */
    async checkEndpoint(endpointKey) {
        const endpoint = this.loadBalancer.endpoints[endpointKey];
        if (!endpoint) {
            return { healthy: false, error: 'Unknown endpoint' };
        }
        const healthUrl = endpoint.url;
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), this.healthTimeout);
        const checkStart = Date.now();
        try {
            const response = await fetch(healthUrl, {
                method: 'HEAD',
                signal: controller.signal
            });
            const latency = Date.now() - checkStart;
            const healthy = response.status < 500 || response.status === 404 || response.status === 405;
            const result = {
                healthy,
                latency,
                status: response.status,
                timestamp: Date.now()
            };
            this.lastChecks.set(endpointKey, result);
            if (healthy) {
                this.loadBalancer.markHealthy?.(endpointKey);
                logger.info(`[HealthMonitor] ${endpointKey} ✓`, { latency, status: response.status });
            }
            else {
                this.loadBalancer.markPreemptiveWarning?.(endpointKey, `Status ${response.status}`);
                logger.warn(`[HealthMonitor] ${endpointKey} ✗`, { latency, status: response.status });
            }
            return result;
        }
        catch (error) {
            const latency = Date.now() - checkStart;
            const isTimeout = error.name === 'AbortError';
            const result = {
                healthy: false,
                latency,
                error: error.message,
                timestamp: Date.now()
            };
            this.lastChecks.set(endpointKey, result);
            this.loadBalancer.markPreemptiveWarning?.(endpointKey, error.message);
            logger.warn(`[HealthMonitor] ${endpointKey} unreachable`, {
                latency,
                isTimeout,
                error: error.message
            });
            return result;
        }
        finally {
            clearTimeout(timeout);
        }
    }
    /**
     * Get the latest health check results
     */
    getLastChecks() {
        const result = {};
        for (const [key, value] of this.lastChecks.entries()) {
            result[key] = value;
        }
        return result;
    }
}
let healthMonitorInstance = null;
export const createHealthMonitor = (loadBalancer, options = {}) => {
    if (!healthMonitorInstance) {
        healthMonitorInstance = new EndpointHealthMonitor(loadBalancer, options);
    }
    return healthMonitorInstance;
};
export const getHealthMonitor = () => healthMonitorInstance;
//# sourceMappingURL=healthMonitor.js.map