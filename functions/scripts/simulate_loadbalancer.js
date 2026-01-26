
import { LoadBalancer } from '../workers/image.js';



// Override the global logger if the module uses it
// Since workers/image.js imports logger from ../lib/utils.js, 
// we might need to be careful if we wanted to true-isolate it.
// For now, we'll just instantiate a new LoadBalancer and test its methods.

async function runSimulation() {
    console.log("=== Load Balancer Simulation Profile ===");
    const lb = new LoadBalancer();

    // Simulation parameters
    const TOTAL_REQUESTS = 100;
    const CONCURRENCY = 8;
    const MODEL_TYPE = 'zit';

    const stats = {
        'zit-h100': { requests: 0, successes: 0, failures: 0, latencies: [] },
        'zit-a10g': { requests: 0, successes: 0, failures: 0, latencies: [] }
    };

    // Helper to simulate endpoint response
    const simulateEndpoint = async (key) => {
        const endpoint = lb.endpoints[key];
        const health = lb.healthMetrics[key];

        // Base behavior
        let latency = endpoint.baseLatency + (Math.random() * 2000 - 1000);

        // Add cold start if idle
        const timeSinceLast = health.lastRequest ? (Date.now() - health.lastRequest) : Infinity;
        if (timeSinceLast > lb.coldStart.idleThreshold) {
            latency += endpoint.coldStartLatency;
        }

        // Add load-based latency
        const currentLoad = lb.activeJobs.get(key) || 0;
        latency += (currentLoad * 1500);

        stats[key].requests++;

        // Simulate potential failures or rate limits
        // h100 is more stable, a10g might struggle at high load
        let failChance = 0.02;
        if (currentLoad >= endpoint.maxConcurrency) {
            failChance = 0.4; // High fail chance when saturated
        }

        await new Promise(r => setTimeout(r, 100)); // Small simulation tick

        if (Math.random() < failChance) {
            const is429 = Math.random() > 0.5;
            const error = new Error(is429 ? "429 Too Many Requests" : "503 Service Unavailable");
            return { error, latency };
        }

        return { success: true, latency };
    };

    console.log(`Starting simulation: ${TOTAL_REQUESTS} requests, Max Concurrency ${CONCURRENCY} per user logic...`);

    const runRequest = async (i) => {
        const requestId = `req_${i}`;

        // 1. Select endpoint
        const selected = lb.selectEndpoints(MODEL_TYPE, { jobComplexity: 0.5 });
        if (selected.length === 0) {
            console.error(`[${requestId}] No endpoints available!`);
            return;
        }

        const primary = selected[0];

        // 2. Check throttling (simulation of the logic in processImageTask)
        if (lb.shouldThrottle(primary.key)) {
            // In reality we try the next one or re-queue
            // Here we'll try to find one that isn't throttled
            const alternative = selected.find(e => !lb.shouldThrottle(e.key));
            if (!alternative) {
                // stats.throttled++;
                return;
            }
        }

        const endpointToUse = selected.find(e => !lb.shouldThrottle(e.key)) || selected[0];
        const key = endpointToUse.key;

        // 3. Record Start
        const startTime = lb.recordJobStart(key);

        // 4. Spread delay (optional in simulation)
        // await lb.applyRequestSpread(key);

        // 5. Simulate the work
        const result = await simulateEndpoint(key);

        // 6. Record Result
        if (result.error) {
            lb.recordFailure(key, startTime, result.error);
            stats[key].failures++;
        } else {
            // We simulate the time elapsed as the reported latency
            // To make lb metrics accurate, we need to fake the clock or just wait
            // For simulation we just pass the latency we calculated back into recordSuccess
            // but recordSuccess uses Date.now() - startTime.
            // So we'll wait for a bit? Or just modify health metrics directly.
            // Let's just wait a tiny bit and let it record naturally for the demo
            await new Promise(r => setTimeout(r, 50));
            lb.recordSuccess(key, startTime);
            stats[key].successes++;
            stats[key].latencies.push(result.latency);
        }
    };

    // Run in batches
    console.log("\nSimulating Load Distribution...");
    for (let i = 0; i < TOTAL_REQUESTS; i += CONCURRENCY) {
        const batch = [];
        for (let j = 0; j < CONCURRENCY && (i + j) < TOTAL_REQUESTS; j++) {
            batch.push(runRequest(i + j));
        }
        await Promise.all(batch);

        // Progress bar simulation
        const progress = Math.round(((i + CONCURRENCY) / TOTAL_REQUESTS) * 20);
        const bar = "█".repeat(Math.min(20, progress)) + "░".repeat(Math.max(0, 20 - progress));
        process.stdout.write(`\r[${bar}] ${Math.min(100, Math.round(((i + CONCURRENCY) / TOTAL_REQUESTS) * 100))}% `);
    }
    console.log("\n\nSimulation Complete.\n");

    console.log("┌──────────────────────────────────────────────────────────┐");
    console.log("│                  END-TO-END STATS REPORT                 │");
    console.log("├───────────────────────┬───────────┬───────────┬──────────┤");
    console.log("│ Endpoint              │ Requests  │ Successes │ Failures │");
    console.log("├───────────────────────┼───────────┼───────────┼──────────┤");

    for (const [key, s] of Object.entries(stats)) {
        const name = key.padEnd(21);
        const reqs = s.requests.toString().padStart(9);
        const succ = s.successes.toString().padStart(9);
        const fail = s.failures.toString().padStart(8);
        console.log(`│ ${name} │ ${reqs} │ ${succ} │ ${fail} │`);
    }
    console.log("└───────────────────────┴───────────┴───────────┴──────────┘");

    console.log("\n=== LOAD BALANCER HEALTH SUMMARY ===");
    const summary = lb.getHealthSummary();
    console.table(Object.entries(summary).map(([key, val]) => ({
        endpoint: key,
        ...val
    })));

    const h100Ratio = (stats['zit-h100'].requests / (stats['zit-h100'].requests + stats['zit-a10g'].requests || 1)) * 100;
    console.log(`\nLoad Balancer Effectiveness: H100 handled ${h100Ratio.toFixed(1)}% of processed traffic.`);
}

runSimulation().catch(console.error);
