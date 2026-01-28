import React from 'react';
import SEO from '../components/SEO';

export default function Contact() {
    return (
        <div className="container" style={{ padding: '120px 20px 60px', maxWidth: '600px' }}>
            <SEO
                title="Contact Support"
                description="Get in touch with the DreamBeesAI support team. We're here to help with any questions or issues."
                keywords="contact DreamBeesAI, AI art support, customer service, help"
                structuredData={{
                    "@context": "https://schema.org",
                    "@graph": [
                        {
                            "@type": "ContactPage",
                            "name": "Contact DreamBeesAI Support",
                            "description": "Get in touch with the DreamBeesAI support team for technical help, billing inquiries, and feedback.",
                            "mainEntity": {
                                "@type": "Organization",
                                "name": "DreamBeesAI",
                                "contactPoint": {
                                    "@type": "ContactPoint",
                                    "contactType": "customer support",
                                    "email": "support@dreambeesai.com",
                                    "url": "https://dreambeesai.com/contact"
                                }
                            }
                        },
                        {
                            "@type": "BreadcrumbList",
                            "itemListElement": [
                                { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://dreambeesai.com" },
                                { "@type": "ListItem", "position": 2, "name": "Contact", "item": "https://dreambeesai.com/contact" }
                            ]
                        }
                    ]
                }}
            />
            <h1 style={{
                fontSize: '3rem',
                fontWeight: '800',
                marginBottom: '40px',
                textAlign: 'center',
                color: 'white'
            }}>
                Contact Support
            </h1>

            <div className="glass-panel" style={{ padding: '40px' }}>
                <form onSubmit={(e) => e.preventDefault()}>
                    <div style={{ marginBottom: '20px' }}>
                        <label style={{ display: 'block', color: 'var(--color-text-muted)', marginBottom: '8px' }}>Name</label>
                        <input type="text" className="search-input" style={{ width: '100%', paddingLeft: '16px' }} placeholder="Your name" />
                    </div>

                    <div style={{ marginBottom: '20px' }}>
                        <label style={{ display: 'block', color: 'var(--color-text-muted)', marginBottom: '8px' }}>Email</label>
                        <input type="email" className="search-input" style={{ width: '100%', paddingLeft: '16px' }} placeholder="your@email.com" />
                    </div>

                    <div style={{ marginBottom: '30px' }}>
                        <label style={{ display: 'block', color: 'var(--color-text-muted)', marginBottom: '8px' }}>Message</label>
                        <textarea
                            className="search-input"
                            style={{ width: '100%', paddingLeft: '16px', minHeight: '150px', resize: 'vertical' }}
                            placeholder="How can we help you?"
                        ></textarea>
                    </div>

                    <button className="btn btn-primary" style={{ width: '100%' }}>
                        Send Message
                    </button>
                </form>
            </div>
        </div>
    );
}
