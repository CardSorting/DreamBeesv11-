import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';

const SEO = ({ title, description, keywords, image, type = 'website', structuredData, noindex = false, canonical }) => {
    const location = useLocation();
    const siteUrl = 'https://dreambeesai.com'; // Replace with actual domain

    // Improved URL handling: includes search params for canonical if they are important (like 'view')
    const searchParams = new URLSearchParams(location.search);
    const viewId = searchParams.get('view');

    // Base canonical URL
    let currentUrl = `${siteUrl}${location.pathname}`;

    // If a specific canonical is provided, use it
    if (canonical) {
        currentUrl = canonical.startsWith('http') ? canonical : `${siteUrl}${canonical}`;
    } else if (viewId) {
        // Automatically include viewId in canonical if present
        currentUrl = `${currentUrl}?view=${viewId}`;
    }

    const defaultTitle = 'AI Image Generator - Text to Image Online (No Discord Required)';
    const defaultDescription = 'Generate high-quality AI art directly on the web. No Discord servers, no complex prompts. Fast, private, and simple text-to-image creation. Start for free.';
    const defaultKeywords = 'AI image generator, text to image without discord, simple ai art tool, ai art generator, stable diffusion online, flux ai';
    const defaultImage = `${siteUrl}/dreambees_icon.png`;

    const metaTitle = title ? `${title} | DreamBeesAI` : defaultTitle;
    const metaDescription = description || defaultDescription;
    const metaKeywords = keywords || defaultKeywords;

    // Ensure image is absolute for OG/Twitter tags
    let metaImage = image || defaultImage;
    if (metaImage && !metaImage.startsWith('http')) {
        metaImage = `${siteUrl}${metaImage.startsWith('/') ? '' : '/'}${metaImage}`;
    }

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
            {structuredData && (
                <script type="application/ld+json">
                    {JSON.stringify(structuredData)}
                </script>
            )}
        </Helmet>
    );
};

export default SEO;
