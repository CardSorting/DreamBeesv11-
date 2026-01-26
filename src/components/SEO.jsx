import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';

const SEO = ({ title, description, keywords, image, type = 'website', structuredData, noindex = false, canonical, schemaType = 'SoftwareApplication' }) => {
    const location = useLocation();
    const siteUrl = 'https://dreambeesai.com';

    // Improved URL handling
    const searchParams = new URLSearchParams(location.search);
    const viewId = searchParams.get('view');

    let currentUrl = `${siteUrl}${location.pathname}`;

    if (canonical) {
        currentUrl = canonical.startsWith('http') ? canonical : `${siteUrl}${canonical}`;
    } else if (viewId) {
        currentUrl = `${currentUrl}?view=${viewId}`;
    }

    const defaultTitle = 'DreamBees AI - Pro AI Image Generator (No Discord)';
    const defaultDescription = 'Generate high-fidelity AI art directly in your browser. Stable Diffusion XL, Flux, and SDXL Turbo support. Private, fast, and royalty-free.';
    const defaultKeywords = 'AI image generator, text to image without discord, flux ai online, sd xl turbo, ai art tool, professional ai generation';
    const defaultImage = `${siteUrl}/dreambees_icon.png`;

    const metaTitle = title ? `${title} | DreamBeesAI` : defaultTitle;
    const metaDescription = (description || defaultDescription).slice(0, 160);
    const metaKeywords = keywords || defaultKeywords;

    let metaImage = image || defaultImage;
    if (metaImage && !metaImage.startsWith('http')) {
        metaImage = `${siteUrl}${metaImage.startsWith('/') ? '' : '/'}${metaImage}`;
    }

    const baseSchema = {
        "@context": "https://schema.org",
        "@type": schemaType,
        "name": metaTitle,
        "description": metaDescription,
        "url": currentUrl,
        "image": metaImage
    };

    return (
        <Helmet>
            {/* Standard Metadata */}
            <title>{metaTitle}</title>
            <meta name="description" content={metaDescription} />
            <meta name="keywords" content={metaKeywords} />
            <link rel="canonical" href={currentUrl} />
            {noindex && <meta name="robots" content="noindex" />}

            {/* Open Graph / Facebook */}
            <meta property="og:type" content={type} />
            <meta property="og:url" content={currentUrl} />
            <meta property="og:title" content={metaTitle} />
            <meta property="og:description" content={metaDescription} />
            <meta property="og:image" content={metaImage} />
            <meta property="og:site_name" content="DreamBeesAI" />

            {/* Twitter */}
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:site" content="@dreambeesai" />
            <meta name="twitter:creator" content="@dreambeesai" />
            <meta name="twitter:url" content={currentUrl} />
            <meta name="twitter:title" content={metaTitle} />
            <meta name="twitter:description" content={metaDescription} />
            <meta name="twitter:image" content={metaImage} />

            {/* Structured Data (JSON-LD) */}
            <script type="application/ld+json">
                {JSON.stringify(structuredData || baseSchema)}
            </script>
        </Helmet>
    );
};

export default SEO;
