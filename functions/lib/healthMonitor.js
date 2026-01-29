/**
 * Endpoint Health Monitor
 * 
 * Proactive health checking system for Modal endpoints.
 * - Periodically pings endpoints to detect issues before user requests fail
 * - Updates LoadBalancer health metrics preemptively
 * - Optionally warms cold endpoints
 */

import { logger } from "./utils.js";

export class EndpointHealthMonitor {
    constructor(loadBalancer, options = {}) {
        this.loadBalancer = loadBalancer;
        this.checkIntervalMs = options.checkIntervalMs || 5 * 60 * 1000; // 5 minutes default
        this.healthTimeout = options.healthTimeout || 10000; // 10s health check timeout
        this.intervalId = null;

        // Track health check results
        this.lastChecks = new Map();
    }

    /**
     * Start periodic health monitoring
     */
    start() {
        if (this.intervalId) {return;}

        logger.info("[HealthMonitor] Starting endpoint health monitoring", {
            intervalMs: this.checkIntervalMs
        });

        // Run immediately, then on interval
        this.runHealthChecks().catch(err =>
            logger.error("[HealthMonitor] Initial health check failed", err)
        );

        this.intervalId = setInterval(() => {
            this.runHealthChecks().catch(err =>
                logger.error("[HealthMonitor] Periodic health check failed", err)
            );
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
        const results = await Promise.allSettled(
            endpoints.map(key => this.checkEndpoint(key))
        );

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
            } else {
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
     * Uses a lightweight HEAD request or minimal GET to /health endpoint if available
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
            // Try a HEAD request first (lightweight)
            const response = await fetch(healthUrl, {
                method: 'HEAD',
                signal: controller.signal
            });

            const latency = Date.now() - checkStart;

            // 404 is OK for HEAD on Modal (endpoint exists but no handler)
            // 2xx, 3xx, and 404/405 indicate the service is up
            const healthy = response.status < 500 || response.status === 404 || response.status === 405;

            this.lastChecks.set(endpointKey, {
                healthy,
                latency,
                status: response.status,
                timestamp: Date.now()
            });

            if (healthy) {
                // Preemptively mark as reachable
                this.loadBalancer.markHealthy?.(endpointKey);
                logger.info(`[HealthMonitor] ${endpointKey} ✓`, { latency, status: response.status });
            } else {
                this.loadBalancer.markPreemptiveWarning?.(endpointKey, `Status ${response.status}`);
                logger.warn(`[HealthMonitor] ${endpointKey} ✗`, { latency, status: response.status });
            }

            return { healthy, latency, status: response.status };

        } catch (error) {
            const latency = Date.now() - checkStart;
            const isTimeout = error.name === 'AbortError';

            this.lastChecks.set(endpointKey, {
                healthy: false,
                latency,
                error: error.message,
                timestamp: Date.now()
            });

            this.loadBalancer.markPreemptiveWarning?.(endpointKey, error.message);

            logger.warn(`[HealthMonitor] ${endpointKey} unreachable`, {
                latency,
                isTimeout,
                error: error.message
            });

            return { healthy: false, latency, error: error.message };
        } finally {
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

// Singleton instance (created when imported with a LoadBalancer)
let healthMonitorInstance = null;

export const createHealthMonitor = (loadBalancer, options = {}) => {
    if (!healthMonitorInstance) {
        healthMonitorInstance = new EndpointHealthMonitor(loadBalancer, options);
    }
    return healthMonitorInstance;
};

export const getHealthMonitor = () => healthMonitorInstance;
