import { useContext } from 'react';
import { TwitchContext } from '../contexts/TwitchContext';

export const useTwitch = () => {
    const context = useContext(TwitchContext);
    if (!context) {
        throw new Error("useTwitch must be used within a TwitchProvider");
    }
    return context;
};
