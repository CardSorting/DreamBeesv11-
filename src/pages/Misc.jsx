import React from 'react';

const PlaceholderPage = ({ title, description }) => (
    <div className="container" style={{ padding: '150px 20px', textAlign: 'center' }}>
        <h1 style={{ fontSize: '3rem', fontWeight: '800', color: 'white', marginBottom: '20px' }}>{title}</h1>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '1.2rem' }}>{description}</p>
    </div>
);

export function Blog() {
    return <PlaceholderPage title="Our Blog" description="Latest news and updates coming soon." />;
}

export function Careers() {
    return <PlaceholderPage title="Join Our Team" description="We're currently not hiring, but check back later!" />;
}

export function Brand() {
    return <PlaceholderPage title="Brand Guide" description="Download our logos and brand assets." />;
}

export function Api() {
    return <PlaceholderPage title="API Access" description="Documentation for our developer API." />;
}

export function Showcase() {
    return <PlaceholderPage title="Community Showcase" description="Amazing creations by our community." />;
}
