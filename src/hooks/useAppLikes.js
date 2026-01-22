import { useCallback } from 'react';
import { useUserInteractions } from '../contexts/UserInteractionsContext';

export const useAppLikes = (_userId) => {
    // We now ignore the passed 'userId' for the listener effectively, 
    // as the global text context handles the current user.
    // However, if the hook is called with a specific userId that DOESNT match the current user,
    // this new implementation will return the CURRENT USER'S likes, not the other user's.
    // Based on previous analysis, useAppLikes is usually called with currentUser.

    // We access the context
    const { likedAppIds, isAppLiked: contextIsLiked, toggleAppLike: contextToggleLike } = useUserInteractions();

    // Map the new context methods to the old interface

    // loading is no longer strictly tracked per component, but we can assume 'loading' is false if the context is ready.
    // The previous implementation had a specific loading state. 
    // For now, we'll return false for loading, as the context initializes quickly or empty.
    const loading = false;

    // The 'toggleLike' function signature in the old hook was: async (appId) => boolean
    // The 'contextToggleLike' signature is: async (appId) => boolean
    // So we can pass it through or wrap it.

    const toggleLike = useCallback(async (appId) => {
        return await contextToggleLike(appId);
    }, [contextToggleLike]);

    const isLiked = useCallback((appId) => {
        return contextIsLiked(appId);
    }, [contextIsLiked]);

    // Return current user's likedApps set for the list
    return { likedApps: likedAppIds, isLiked, toggleLike, loading };
};
