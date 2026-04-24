import { db, FieldValue } from "../firebaseInit.js";
import { logger } from "./utils.js";
export const LEAGUES = ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond'];
export class LeagueService {
    /**
     * Gets or creates a room for the current week and league.
     */
    static async getOrCreateRoom(league, weekId) {
        const roomsRef = db.collection('league_rooms');
        const query = roomsRef
            .where('league', '==', league)
            .where('weekId', '==', weekId)
            .where('isFull', '==', false)
            .limit(1);
        const snapshot = await query.get();
        if (snapshot.empty) {
            // Create a new room
            const roomRef = await roomsRef.add({
                league,
                weekId,
                userCount: 0,
                isFull: false,
                createdAt: FieldValue.serverTimestamp()
            });
            return roomRef.id;
        }
        return snapshot.docs[0].id;
    }
    /**
     * Assigns a user to a league room if they don't have one for this week.
     */
    static async assignToRoom(uid, currentLeague, transaction) {
        const weekId = this.getCurrentWeekId();
        const userRef = db.collection('users').doc(uid);
        const userDoc = transaction ? await transaction.get(userRef) : await userRef.get();
        const userData = userDoc.data();
        if (userData?.currentRoomId && userData?.currentWeekId === weekId) {
            return userData.currentRoomId;
        }
        const roomId = await this.getOrCreateRoom(currentLeague, weekId);
        const roomRef = db.collection('league_rooms').doc(roomId);
        const execute = async (t) => {
            const roomDoc = await t.get(roomRef);
            const roomData = roomDoc.data();
            if (roomData.userCount >= 50) {
                // Technically we should check if it's full before assignment in a perfect world,
                // but for V1 we'll just increment.
                t.update(roomRef, { isFull: true });
                throw new Error("Room filled up, retry assignment.");
            }
            t.update(userRef, {
                currentRoomId: roomId,
                currentWeekId: weekId,
                weeklyExp: 0 // Reset weekly exp upon assignment
            });
            t.update(roomRef, {
                userCount: FieldValue.increment(1)
            });
            // Add user to room's subcollection for easy leaderboard querying
            t.set(roomRef.collection('users').doc(uid), {
                username: userData.username || 'Anonymous',
                photoURL: userData.photoURL || null,
                weeklyExp: 0,
                joinedAt: FieldValue.serverTimestamp()
            });
        };
        if (transaction) {
            await execute(transaction);
        }
        else {
            await db.runTransaction(execute);
        }
        return roomId;
    }
    /**
     * Increments weekly XP for the user and their current room standings.
     */
    static async incrementWeeklyExp(uid, exp) {
        const userRef = db.collection('users').doc(uid);
        const userDoc = await userRef.get();
        const userData = userDoc.data();
        if (!userData?.currentRoomId || userData?.currentWeekId !== this.getCurrentWeekId()) {
            return;
        }
        await db.runTransaction(async (t) => {
            t.update(userRef, {
                weeklyExp: FieldValue.increment(exp)
            });
            const roomUserRef = db.collection('league_rooms')
                .doc(userData.currentRoomId)
                .collection('users')
                .doc(uid);
            t.update(roomUserRef, {
                weeklyExp: FieldValue.increment(exp)
            });
        });
    }
    static getCurrentWeekId() {
        const now = new Date();
        const startOfYear = new Date(now.getFullYear(), 0, 1);
        const pastDaysOfYear = (now.getTime() - startOfYear.getTime()) / 86400000;
        const weekNum = Math.ceil((pastDaysOfYear + startOfYear.getDay() + 1) / 7);
        return `${now.getFullYear()}_W${weekNum}`;
    }
    /**
     * Gets the EXP multiplier for a specific league.
     */
    static getLeagueMultiplier(league) {
        switch (league) {
            case 'Diamond': return 1.10;
            case 'Platinum': return 1.08;
            case 'Gold': return 1.05;
            case 'Silver': return 1.02;
            case 'Bronze':
            default: return 1.0;
        }
    }
    /**
     * End of week processing: handles rewards, promotions, and demotions.
     * (Called by a scheduled function)
     */
    static async processLeagueResults(weekId) {
        logger.info(`[LeagueService] Starting weekly results processing for ${weekId}`);
        const roomsSnapshot = await db.collection('league_rooms')
            .where('weekId', '==', weekId)
            .get();
        for (const roomDoc of roomsSnapshot.docs) {
            const roomData = roomDoc.data();
            // IDEMPOTENCY LOCK: Prevent double-processing the same room for the same week
            if (roomData.lastProcessedWeekId === weekId) {
                logger.warn(`[LeagueService] Room ${roomDoc.id} already processed for ${weekId}. Skipping.`);
                continue;
            }
            const usersSnapshot = await roomDoc.ref.collection('users')
                .orderBy('weeklyExp', 'desc')
                .get();
            const totalUsers = usersSnapshot.size;
            if (totalUsers === 0)
                continue;
            // PRECISE PROMOTION/DEMOTION LOGIC
            // Top 3: Promote
            // Bottom 5: Demote (if totalUsers > 10, otherwise Bottom 1)
            const PROMOTION_COUNT = 3;
            const DEMOTION_COUNT = totalUsers > 15 ? 5 : 1;
            let rank = 1;
            for (const userDoc of usersSnapshot.docs) {
                const uid = userDoc.id;
                const userRef = db.collection('users').doc(uid);
                const currentLeagueIndex = LEAGUES.indexOf(roomData.league);
                let nextLeague = roomData.league;
                let notification = "";
                if (rank <= PROMOTION_COUNT && currentLeagueIndex < LEAGUES.length - 1) {
                    nextLeague = LEAGUES[currentLeagueIndex + 1];
                    notification = `VICTORY! You've been promoted to the ${nextLeague} League! 🏆`;
                }
                else if (rank > (totalUsers - DEMOTION_COUNT) && currentLeagueIndex > 0) {
                    nextLeague = LEAGUES[currentLeagueIndex - 1];
                    notification = `DEMOTED: You've moved down to ${nextLeague} League. Fight back next week! ✊`;
                }
                else if (rank <= 3) {
                    notification = `PODIUM! You finished #${rank} in the ${roomData.league} League! 🌟`;
                }
                await userRef.update({
                    league: nextLeague,
                    lastLeagueRank: rank,
                    lastLeagueWeekId: weekId,
                    pendingLeagueNotification: notification,
                    weeklyExp: 0 // Reset for the next week
                });
                rank++;
            }
            // Mark room as processed
            await roomDoc.ref.update({
                lastProcessedWeekId: weekId,
                processedAt: FieldValue.serverTimestamp()
            });
            logger.info(`[LeagueService] Processed room ${roomDoc.id} (${roomData.league})`);
        }
    }
}
//# sourceMappingURL=leagues.js.map