import React, { createContext, useContext, useState } from 'react';

const ModelContext = createContext();

export const AVAILABLE_MODELS = [
    {
        id: 'sdxl-cat-carrier',
        name: 'SDXL-Cat-Carrier',
        description: 'Fine-tuned SDXL model for superior generation quality.',
        image: '/models/cat_carrier_preview.png',
        tags: ['SDXL', 'Fine-tuned', 'High Quality']
    },
    {
        id: 'hassaku-illustrious',
        name: 'Hassaku Illustrious',
        description: 'High-quality anime style model with vibrant colors and details.',
        image: '/models/hassaku_illustrious_preview.png',
        tags: ['Anime', 'Illustrious', 'Vibrant']
    }
];

export function useModel() {
    return useContext(ModelContext);
}

export function ModelProvider({ children }) {
    const [selectedModel, setSelectedModel] = useState(AVAILABLE_MODELS[0]);

    const value = {
        selectedModel,
        setSelectedModel,
        availableModels: AVAILABLE_MODELS
    };

    return (
        <ModelContext.Provider value={value}>
            {children}
        </ModelContext.Provider>
    );
}
