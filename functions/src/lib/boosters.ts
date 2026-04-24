import { db, FieldValue } from "../firebaseInit.js";
import { logger } from "./utils.js";

export class BoosterService {
    /**
     * Filters out expired boosters from a user profile.
     * Returns the updated boosters array and a boolean indicating if changes occurred.
     */
    static cleanupExpiredBoosters(boosters: any[]): { updatedBoosters: any[], changed: boolean } {
        if (!boosters || boosters.length === 0) return { updatedBoosters: [], changed: false };

        const now = Date.now();
        const initialCount = boosters.length;

        const updatedBoosters = boosters.filter(booster => {
            const expiresAt = booster.expiresAt?.toMillis ? booster.expiresAt.toMillis() :
                booster.expiresAt instanceof Date ? booster.expiresAt.getTime() :
                    booster.expiresAt;
            return expiresAt > now;
        });

        return {
            updatedBoosters,
            changed: updatedBoosters.length !== initialCount
        };
    }

    /**
     * Checks if a specific booster type is currently active for a user.
     */
    static isBoosterActive(boosters: any[], type: string): boolean {
        if (!boosters || boosters.length === 0) return false;

        const now = Date.now();
        return boosters.some(booster => {
            if (booster.type !== type) return false;
            const expiresAt = booster.expiresAt?.toMillis ? booster.expiresAt.toMillis() :
                booster.expiresAt instanceof Date ? booster.expiresAt.getTime() :
                    booster.expiresAt;
            return expiresAt > now;
        });
    }
}
