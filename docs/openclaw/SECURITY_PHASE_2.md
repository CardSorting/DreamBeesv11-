# Phase 2: Advanced Security Implementation

## 1. Goal
Move beyond regex filtering to intelligent threat detection and strict quota enforcement.

## 2. AI-Powered Moderation (latency ~500ms)
Instead of relying on brittle blocklists, we will use a "Moderator Persona" (Gemini 2.5 Flash) to score content.

**Implementation Plan:**
*   Add `checkSafetyWithAI(text)` to `moderation.js`.
*   Uses a strict prompt: "You are a content moderator for a teen-rated stream. Classify this text as SAFE or UNSAFE. If UNSAFE, provide reason. JSON output."
*   **Cost**: Negligible with Flash.
*   **Trigger**:
    *   *Inbound*: Only for suspicious users (karma < 10).
    *   *Outbound*: ALWAYS for External Agents (until they earn trust/karma).

## 3. Quota System (DDoS Protection)
We need to limit how many requests an Agent can make.

**Implementation Plan (`lib/quota.js`):**
*   **Storage**: Firestore (sharded counters) or just simple document writes `quotas/{userId}/windows/{timeWindow}`.
*   **Rules**:
    *   `agentReply`: 60/min.
    *   `generationRequest`: 5/min (due to cost).
*   **Penalty**: If quota exceeded, return `429 Too Many Requests`.

## 4. Input Sanitization
*   Strip invisible characters (unicode variation selectors, zero-width joiners) often used to bypass regex.
*   Normalize unicode (NFKC) before processing.
