import React from 'react';
import { Github, Twitter, Heart } from 'lucide-react';

export default function Footer() {
    return (
        <footer style={{
            borderTop: '1px solid var(--color-border)',
            background: 'rgba(9, 9, 11, 0.8)',
            padding: '40px 0',
            marginTop: 'auto', // Pushes footer to bottom if content is short
            backdropFilter: 'blur(10px)'
        }}>
            <div className="container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600', color: 'white' }}>
                    <span style={{
                        width: '24px', height: '24px', borderRadius: '6px', background: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px'
                    }}>DB</span>
                    DreamBees
                </div>

                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    Built with <Heart size={14} color="#ec4899" fill="#ec4899" /> by the DreamBees Team
                </p>

                <div style={{ display: 'flex', gap: '24px' }}>
                    <a href="#" style={{ color: 'var(--color-text-muted)', transition: 'color 0.2s' }} className="hover:text-white">
                        <Twitter size={20} />
                    </a>
                    <a href="#" style={{ color: 'var(--color-text-muted)', transition: 'color 0.2s' }} className="hover:text-white">
                        <Github size={20} />
                    </a>
                </div>

                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem', marginTop: '10px' }}>
                    © {new Date().getFullYear()} DreamBees Inc. All rights reserved.
                </p>
            </div>
        </footer>
    );
}
