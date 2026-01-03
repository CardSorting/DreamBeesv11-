import React, { createContext, useContext, useState } from 'react';

const ModelContext = createContext();

export const AVAILABLE_MODELS = [
    {
        id: 'sdxl-cat-carrier',
        name: 'SDXL-Cat-Carrier',
        description: 'Fine-tuned SDXL model for superior generation quality and consistency.',
        image: '/models/cat_carrier_preview.png',
        tags: ['SDXL', 'Fine-tuned', 'High Quality', 'Photorealistic']
    },
    {
        id: 'hassaku-illustrious',
        name: 'Hassaku Illustrious',
        description: 'High-quality anime style model with vibrant colors and complex details.',
        image: '/models/hassaku_illustrious_preview.png',
        tags: ['Anime', 'Illustrious', 'Vibrant', 'Stylized']
    },
    {
        id: 'cyber-realism',
        name: 'Cyber Realism V2',
        description: 'Hyper-realistic cyberpunk aesthetic with advanced lighting and textures.',
        image: 'https://images.unsplash.com/photo-1614728263952-84ea256f9679?auto=format&fit=crop&q=80&w=1200&h=800',
        tags: ['Cyberpunk', 'Photorealistic', 'Scifi']
    },
    {
        id: 'minimalist-arch',
        name: 'Minimalist Architecture',
        description: 'Clean, modern architectural renders with focus on space and light.',
        image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=1200&h=800',
        tags: ['Architecture', 'Minimalist', '3D Render']
    },
    {
        id: 'oil-brush-pro',
        name: 'Oil Brush Pro',
        description: 'Simulates classical oil painting techniques with rich impasto effects.',
        image: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?auto=format&fit=crop&q=80&w=1200&h=800',
        tags: ['Artistic', 'Oil Painting', 'Traditional']
    },
    {
        id: 'vogue-fashion',
        name: 'Vogue Fashion AI',
        description: 'Trained on high-end fashion photography and studio lighting setups.',
        image: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&q=80&w=1200&h=800',
        tags: ['Fashion', 'Photorealistic', 'Studio']
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
