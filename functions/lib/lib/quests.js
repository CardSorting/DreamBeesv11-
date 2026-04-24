export const ACHIEVEMENTS = {
    'night_owl': {
        id: 'night_owl',
        title: 'Night Owl 🦉',
        description: 'Generate an image between midnight and 4 AM.',
        rewardZaps: 500
    },
    'prompt_poet_bronze': {
        id: 'prompt_poet_bronze',
        title: 'Prompt Poet (Bronze) 📜',
        description: 'Write a prompt longer than 200 characters.',
        rewardZaps: 500
    },
    'prompt_poet_silver': {
        id: 'prompt_poet_silver',
        title: 'Prompt Poet (Silver) 📜📜',
        description: 'Write a prompt longer than 500 characters.',
        rewardZaps: 1500
    },
    'prompt_poet_gold': {
        id: 'prompt_poet_gold',
        title: 'Prompt Poet (Gold) 📜📜📜',
        description: 'Write a prompt longer than 1000 characters.',
        rewardZaps: 5000
    },
    'daily_driver': {
        id: 'daily_driver',
        title: 'Daily Driver 🚗',
        description: 'Hit a 7-day creation streak.',
        rewardZaps: 2000
    }
};
export class QuestEngine {
    /**
     * Checks today's date (YYYY-MM-DD in UTC or similar consistent timezone)
     * and rolls 3 random quests if the date has changed.
     */
    static checkAndInitQuests(userData) {
        const today = new Date().toISOString().split('T')[0];
        const currentQuests = userData?.dailyQuests;
        if (!currentQuests || currentQuests.date !== today) {
            // Roll new quests
            const newQuests = [
                { id: `q_${Date.now()}_1`, type: 'generate_image', target: 5, progress: 0, completed: false, claimed: false, rewardZaps: 20 },
                { id: `q_${Date.now()}_2`, type: 'earn_exp', target: 100, progress: 0, completed: false, claimed: false, rewardZaps: 30 },
                { id: `q_${Date.now()}_3`, type: 'use_turbo', target: 1, progress: 0, completed: false, claimed: false, rewardZaps: 40 }
            ];
            return { date: today, quests: newQuests };
        }
        return currentQuests;
    }
    /**
     * Evaluates Quest Progress based on a Generation Action.
     * Returns the updated Quests array, and any newly completed quest IDs.
     */
    static evaluateQuests(quests, action) {
        const updatedQuests = [...quests];
        const completedIds = [];
        for (const q of updatedQuests) {
            if (q.completed)
                continue;
            let progressed = false;
            if (q.type === 'generate_image' && action.type === 'generation') {
                q.progress += 1;
                progressed = true;
            }
            else if (q.type === 'earn_exp' && action.expGained > 0) {
                q.progress += action.expGained;
                progressed = true;
            }
            else if (q.type === 'use_turbo' && action.isTurbo) {
                q.progress += 1;
                progressed = true;
            }
            if (progressed && q.progress >= q.target) {
                q.progress = q.target;
                q.completed = true;
                completedIds.push(q.id);
            }
        }
        return { updatedQuests, completedIds };
    }
    /**
     * Evaluates Mastery Badges based on action metadata.
     */
    static evaluateAchievements(userData, action) {
        const unlocked = userData?.unlockedAchievements || [];
        const newlyUnlocked = [];
        // Night Owl
        if (!unlocked.includes('night_owl')) {
            const hour = new Date().getUTCHours();
            if (hour >= 0 && hour < 4)
                newlyUnlocked.push('night_owl');
        }
        // Prompt Poet (Tiered)
        if (!unlocked.includes('prompt_poet_bronze') && action.promptLength > 200)
            newlyUnlocked.push('prompt_poet_bronze');
        if (!unlocked.includes('prompt_poet_silver') && action.promptLength > 500)
            newlyUnlocked.push('prompt_poet_silver');
        if (!unlocked.includes('prompt_poet_gold') && action.promptLength > 1000)
            newlyUnlocked.push('prompt_poet_gold');
        // Daily Driver
        if (!unlocked.includes('daily_driver') && action.claimStreak >= 7) {
            newlyUnlocked.push('daily_driver');
        }
        return newlyUnlocked;
    }
}
//# sourceMappingURL=quests.js.map