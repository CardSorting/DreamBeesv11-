# 03. MLOps Lifecycle & Processes

This document details the operational lifecycle of data flowing through the DreamBees pipeline, focusing on Velocity, Hygiene, and Persistence.

## Phase 1: High-Velocity Ingestion

### The Bottleneck Problem
In a standard Firestore implementation, if a user swipes rapidly (e.g., 5 images/sec), the client sends 5 separate write requests. This:
1.  Spikes Cloud/Network costs.
2.  Hits Firestore's "1 write/sec per document" soft limit (if updating user stats).
3.  Hits the "500 writes/sec per collection" hard limit (if creating sequential logs).

### The DreamBees Solution: Buffered Batches
We implement a **3-second Buffer** in `ModelContext.jsx`.

1.  **Queueing**: When `rateGeneration(job, rating)` is called, we do *not* write to DB. We add `job.id -> {job, rating}` to a local `Map`.
    *   *Effect*: If user clicks "Like" then "Dislike" rapidly, the Map key (JobId) ensures we only store the *latest* intent. (Client-side Idempotency).
2.  **Flushing**: Every 3 seconds (`setInterval`), we check the Map size.
    *   If `size > 0`, we construct a `WriteBatch`.
    *   We can pack up to 500 operations in one batch.
    *   The batch is sent as a single HTTP/gRPC frame.
3.  **Result**: 90%+ reduction in Write Operations and Network Overhead.

## Phase 2: Data Hygiene Enforcement

We enforce data hygiene using three mechanisms:

### 1. Server-Side Idempotency
We use `setDoc` (Upsert) with a key `feedback_{JobId}` instead of `addDoc` (Auto-ID).
*   **Scenario**: User rates an image on Desktop. Later, rates the same image on Mobile.
*   **Outcome**: The second write *overwrites* the first document perfectly. No duplicate rows. No "dedup" scripts needed.

### 2. Deterministic Splitting
We solve the "Data Leakage" problem by hashing the Job ID.
*   **Logic**: `CRC32(JobId) % 100`
*   **Result**: 
    *   0-89 -> `train`
    *   90-99 -> `validation`
*   **Benefit**: An image is mathematically bound to its split. You can delete the database, re-import the logs, and the splits will remain identical.

### 3. Index Contention Avoidance
We disable indexing on monotonic fields (`timestamp`).
*   **Why**: Firestore physically writes index entries sequentially. Monotonic fields create "Hotspots" on tablet servers, capping throughput at ~500 ops/sec.
*   **Fix**: By disabling the index in `firestore.indexes.json`, writes are purely random (based on Random JobID keys), allowing essentially infinite horizontal scaling.

## Phase 3: The "Stateless" Agent Loop

We treat data enrichment as a "Side Car" process.

1.  **Creation**: Frontend creates the log. `enrichment.status` is 'pending'.
2.  **Detection**: Background Worker queries `where('enrichment.status', '==', 'pending')`.
3.  **Processing**: Worker reads `agent_task.input`. It does NOT need to query `users` or `generation_queue` or understand the app logic. It just sees an image URL and a prompt.
4.  **Completion**: Worker updates `enrichment` fields and sets status to 'completed'.

This decoupling allows us to change the Agent logic (e.g., upgrade from GPT-4 to GPT-5) without touching the Frontend code.
