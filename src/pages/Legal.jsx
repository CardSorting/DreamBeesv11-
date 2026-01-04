import React from 'react';
import SEO from '../components/SEO';

export function Privacy() {
    return (
        <div className="container" style={{ padding: '120px 20px 60px', maxWidth: '800px' }}>
            <SEO title="Privacy Policy" description="DreamBeesAI Privacy Policy." />
            <h1 style={{ color: 'white', marginBottom: '30px' }}>Privacy Policy</h1>
            <div className="glass-panel" style={{ padding: '40px', color: 'var(--color-text-muted)', lineHeight: '1.8' }}>
                <p>Last updated: January 2026</p>
                <br />
                <p>At DreamBees, we take your privacy seriously. This Privacy Policy describes how we collect, use, and protect your personal information.</p>
                <br />
                <h3>1. Information We Collect</h3>
                <p>We collect information you provide directly to us, such as when you create an account, generate images, or contact support.</p>
                <br />
                <h3>2. How We Use Your Information</h3>
                <p>We use your information to provide, maintain, and improve our services, including generating images based on your prompts.</p>
            </div>
        </div>
    );
}

export function Terms() {
    return (
        <div className="container" style={{ padding: '120px 20px 60px', maxWidth: '800px' }}>
            <SEO title="Terms of Service" description="DreamBeesAI Terms of Service." />
            <h1 style={{ color: 'white', marginBottom: '30px' }}>Terms of Service</h1>
            <div className="glass-panel" style={{ padding: '40px', color: 'var(--color-text-muted)', lineHeight: '1.8' }}>
                <p>Last updated: January 2026</p>
                <br />
                <p>By accessing or using DreamBees ("the Service"), you agree to be bound by these Terms of Service. If you disagree with any part of the terms, you may not access the Service.</p>
                <br />

                <h3 style={{ color: 'white', marginBottom: '10px' }}>1. Account Registration</h3>
                <p>To use certain features of the Service, you must register for an account. You agree to provide accurate, current, and complete information during the registration process and to update such information to keep it accurate, current, and complete.</p>
                <p>You are responsible for safeguarding your password and for all activities that occur under your account.</p>
                <br />

                <h3 style={{ color: 'white', marginBottom: '10px' }}>2. Usage & Credits</h3>
                <p>DreamBees operates on a credit-based system. Credits are required to generate images.</p>
                <ul style={{ paddingLeft: '20px', margin: '10px 0' }}>
                    <li>Free accounts receive a limited number of daily credits.</li>
                    <li>Paid subscriptions receive a monthly allocation of credits.</li>
                    <li>Unused credits may or may not roll over depending on your specific plan terms.</li>
                </ul>
                <br />

                <h3 style={{ color: 'white', marginBottom: '10px' }}>3. Intellectual Property Rights</h3>
                <p><strong>Your Generations:</strong> Subject to your compliance with these Terms, you own all rights, title, and interest in and to the images you generate using the Service ("Generations"). This includes the right to use the Generations for commercial purposes, provided you have a paid subscription plan that includes commercial rights.</p>
                <p><strong>Service Content:</strong> The Service, including its underlying models, code, design, and infrastructure, remains the exclusive property of DreamBees and its licensors.</p>
                <br />

                <h3 style={{ color: 'white', marginBottom: '10px' }}>4. Prohibited Uses</h3>
                <p>You agree not to use the Service to generate content that:</p>
                <ul style={{ paddingLeft: '20px', margin: '10px 0' }}>
                    <li>Violates any applicable laws or regulations.</li>
                    <li>Is sexually explicit, pornographic, or obscene (NSFW).</li>
                    <li>Depicts excessive violence, gore, or self-harm.</li>
                    <li>Promotes hate speech, discrimination, or harassment.</li>
                    <li>Infringes upon the intellectual property rights of others.</li>
                </ul>
                <p>We reserve the right to suspend or ban users who violate these guidelines.</p>
                <br />

                <h3 style={{ color: 'white', marginBottom: '10px' }}>5. Payment & Subscription</h3>
                <p>Payments for subscriptions are non-refundable except as required by law. You may cancel your subscription at any time, and your access will continue until the end of the user billing period.</p>
                <br />

                <h3 style={{ color: 'white', marginBottom: '10px' }}>6. Disclaimers</h3>
                <p>The Service is provided on an "AS IS" and "AS AVAILABLE" basis. Due to the nature of AI, we do not guarantee that the Generations will be perfect, error-free, or meet your specific expectations.</p>
                <br />

                <h3 style={{ color: 'white', marginBottom: '10px' }}>7. Limitation of Liability</h3>
                <p>In no event shall DreamBees be liable for any indirect, incidental, special, consequential, or punitive damages arising out of or related to your use of the Service.</p>
                <br />

                <h3 style={{ color: 'white', marginBottom: '10px' }}>8. Changes to Terms</h3>
                <p>We reserve the right to modify these Terms at any time. We will provide notice of significant changes by posting the new Terms on this page.</p>
            </div>
        </div>
    );
}

export function Cookies() {
    return (
        <div className="container" style={{ padding: '120px 20px 60px', maxWidth: '800px' }}>
            <SEO title="Cookie Policy" description="DreamBeesAI Cookie Policy." />
            <h1 style={{ color: 'white', marginBottom: '30px' }}>Cookie Policy</h1>
            <div className="glass-panel" style={{ padding: '40px', color: 'var(--color-text-muted)', lineHeight: '1.8' }}>
                <p>We use cookies to enhance your experience on DreamBees.</p>
                <br />
                <p>This policy explains what cookies are, how we use them, and your choices regarding cookies.</p>
            </div>
        </div>
    );
}
