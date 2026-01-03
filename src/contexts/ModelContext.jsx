import React, { createContext, useContext, useState } from 'react';

const ModelContext = createContext();

export const AVAILABLE_MODELS = [
    {
        id: 'sdxl-cat-carrier',
        name: 'SDXL-Cat-Carrier',
        description: 'Fine-tuned SDXL model for superior generation quality.',
        image: 'https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?auto=format&fit=crop&q=80&w=400',
        tags: ['SDXL', 'Fine-tuned', 'High Quality']
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
