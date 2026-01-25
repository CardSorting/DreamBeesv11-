import React from 'react';
import { Palette, PlusSquare } from 'lucide-react';

const Header = ({ onImportClick }) => {
    return (
        <header className="cc-header">
            <div className="cc-header-content">
                <div className="flex items-center gap-2">
                    <div style={{ backgroundColor: '#4f46e5', padding: '0.5rem', borderRadius: '0.5rem' }}>
                        <Palette style={{ width: '1.5rem', height: '1.5rem', color: 'white' }} />
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <button
                        onClick={onImportClick}
                        className="cc-btn cc-btn-white"
                        style={{ padding: '0.5rem' }}
                        title="Batch Create"
                    >
                        <PlusSquare style={{ width: '1.25rem', height: '1.25rem' }} />
                    </button>
                </div>
            </div>
        </header>
    );
};

export default Header;
