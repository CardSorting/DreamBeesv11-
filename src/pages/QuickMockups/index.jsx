import React from 'react';
import { Link } from 'react-router-dom';
import { Shirt, Smartphone, Coffee, Image, User, ArrowRight, CreditCard, Shapes } from 'lucide-react';
import SEO from '../../components/SEO';
import './QuickMockups.css';

const POPULAR_MOCKUPS = [
    {
        id: 'apparel-t-shirt',
        label: 'Classic T-Shirt',
        description: 'The standard for apparel mockups. Clean, modern, and versatile.',
        icon: Shirt,
        category: 'Apparel'
    },
    {
        id: 'apparel-hoodie',
        label: 'Premium Hoodie',
        description: 'Cozy and high-quality. Perfect for streetwear and lifestyle designs.',
        icon: User,
        category: 'Apparel'
    },
    {
        id: 'kitchen-mug',
        label: 'Coffee Mug',
        description: 'Essential for home and office. High-res ceramic finish.',
        icon: Coffee,
        category: 'Home & Living'
    },
    {
        id: 'electronics-phone-case',
        label: 'Phone Case',
        description: 'Sleek tech protection. Show off your mobile designs.',
        icon: Smartphone,
        category: 'Tech'
    },
    {
        id: 'anime-poster',
        label: 'Canvas Poster',
        description: 'Vertical wall art. High-impact visual for any design.',
        icon: Image,
        category: 'Print'
    },
    {
        id: 'reskin_credit_card',
        label: 'Credit Card',
        description: 'Premium titanium card. Reskin it with your unique design.',
        icon: CreditCard,
        category: 'Reskin'
    },
    {
        id: 'reskin_blank_toy',
        label: 'Designer Toy',
        description: 'Smooth vinyl figure. Apply custom styles and patterns.',
        icon: Shapes,
        category: 'Reskin'
    }
];

const QuickMockups = () => {
    return (
        <div className="qm-container animate-in">
            <SEO
                title="Mockup Maker"
                description="The fastest way to create premium mockups for your designs. Choose from our most popular items."
            />

            <header className="qm-header">
                <h1>Mockup Maker</h1>
                <p>Select one of our most popular mockups to start generating your product visuals in seconds.</p>
            </header>

            <div className="qm-grid">
                {POPULAR_MOCKUPS.map((mockup) => (
                    <Link key={mockup.id} to={`/quick-mockups/${mockup.id}`} className="qm-card">
                        <div className="qm-card-badge">{mockup.category}</div>
                        <div className="qm-icon-wrapper">
                            <mockup.icon size={40} />
                        </div>
                        <h3>{mockup.label}</h3>
                        <p>{mockup.description}</p>
                    </Link>
                ))}
            </div>

            <div style={{ textAlign: 'center', marginTop: '4rem' }}>
                <Link to="/mockup-catalog" className="qm-back-link" style={{ fontSize: '1.1rem' }}>
                    View Full Catalog <ArrowRight size={20} />
                </Link>
            </div>
        </div>
    );
};

export default QuickMockups;
