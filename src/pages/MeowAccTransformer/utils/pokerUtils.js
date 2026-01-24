
const SUITS = ['Hearts', 'Diamonds', 'Clubs', 'Spades'];
const RANKS = ['A', 'K', 'Q', 'J', '10', '9', '8', '7', '6', '5', '4', '3', '2'];

export const generateFullDeck = () => {
    const deck = [];

    for (const suit of SUITS) {
        for (const rank of RANKS) {
            deck.push({
                suit,
                rank,
                id: `${rank}-of-${suit}`
            });
        }
    }

    return deck;
};

export const getSuitSymbol = (suit) => {
    switch (suit) {
        case 'Hearts': return '♥';
        case 'Diamonds': return '♦';
        case 'Clubs': return '♣';
        case 'Spades': return '♠';
        default: return '';
    }
};

export const getSuitColor = (suit) => {
    return (suit === 'Hearts' || suit === 'Diamonds') ? 'text-red-400' : 'text-slate-600';
};
