import React from 'react';
import { useModel } from '../contexts/ModelContext';
import { Check, Cpu } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Models() {
    const { selectedModel, setSelectedModel, availableModels } = useModel();
    const navigate = useNavigate();

    function handleSelect(model) {
        setSelectedModel(model);
        navigate('/');
    }

    return (
        <div className="container" style={{ paddingTop: '100px', paddingBottom: '40px' }}>
            <header style={{ marginBottom: '40px', textAlign: 'center' }}>
                <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '12px' }}>Choose Your Engine</h1>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '1.1rem' }}>
                    Select the AI model that best fits your creative vision.
                </p>
            </header>

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                gap: '24px'
            }}>
                {availableModels.map(model => {
                    const isSelected = selectedModel.id === model.id;
                    return (
                        <div
                            key={model.id}
                            className="glass-panel"
                            onClick={() => handleSelect(model)}
                            style={{
                                padding: '20px',
                                cursor: 'pointer',
                                border: isSelected ? '2px solid var(--color-primary)' : '1px solid rgba(255,255,255,0.05)',
                                transition: 'all 0.3s ease',
                                transform: isSelected ? 'scale(1.02)' : 'none',
                                position: 'relative',
                                overflow: 'hidden'
                            }}
                        >
                            <div style={{ aspectRatio: '16/9', marginBottom: '16px', borderRadius: '8px', overflow: 'hidden' }}>
                                <img src={model.image} alt={model.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px' }}>
                                <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'white' }}>{model.name}</h3>
                                {isSelected && (
                                    <div style={{
                                        background: 'var(--color-primary)',
                                        borderRadius: '50%',
                                        width: '24px',
                                        height: '24px',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                                    }}>
                                        <Check size={14} color="white" strokeWidth={3} />
                                    </div>
                                )}
                            </div>

                            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginBottom: '16px', lineHeight: '1.5' }}>
                                {model.description}
                            </p>

                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                {model.tags.map(tag => (
                                    <span key={tag} style={{
                                        fontSize: '0.75rem',
                                        padding: '4px 8px',
                                        borderRadius: '12px',
                                        background: 'rgba(255,255,255,0.05)',
                                        color: 'var(--color-text-muted)'
                                    }}>
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
