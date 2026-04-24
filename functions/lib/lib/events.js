import { db } from "../firebaseInit.js";
import { logger } from "./utils.js";
export class GlobalEventService {
    static cache = null;
    static lastFetchAt = 0;
    static CACHE_TTL = 5 * 60 * 1000; // 5 minutes
    /**
     * Retrieves all currently active global events.
     */
    static async getActiveEvents() {
        const now = Date.now();
        if (this.cache && (now - this.lastFetchAt < this.CACHE_TTL)) {
            return this.cache.filter(e => e.isActive && e.startTime.toMillis() <= now && e.endTime.toMillis() >= now);
        }
        try {
            const snapshot = await db.collection('config').doc('events').collection('active').where('isActive', '==', true).get();
            this.cache = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            this.lastFetchAt = now;
            return this.cache.filter(e => e.startTime.toMillis() <= now && e.endTime.toMillis() >= now);
        }
        catch (error) {
            logger.error(`[GlobalEventService] Failed to fetch events`, error);
            return [];
        }
    }
    /**
     * Calculates the cumulative global multiplier for a specific type.
     */
    static async getGlobalMultiplier(type) {
        const events = await this.getActiveEvents();
        let totalMultiplier = 1.0;
        for (const event of events) {
            if (type === 'exp' && event.type === 'exp_warp') {
                totalMultiplier *= event.multiplier;
            }
            else if (type === 'karma' && event.type === 'karma_flood') {
                totalMultiplier *= event.multiplier;
            }
        }
        return totalMultiplier;
    }
}
//# sourceMappingURL=events.js.map