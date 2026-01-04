import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';

const SEO = ({ title, description, keywords, image, type = 'website' }) => {
    const location = useLocation();
    const siteUrl = 'https://dreambeesai.com'; // Replace with actual domain
    const currentUrl = `${siteUrl}${location.pathname}`;
    const defaultTitle = 'DreamBeesAI - Advanced AI Image Generator';
    const defaultDescription = 'Create stunning AI-generated images with DreamBeesAI. Use advanced models like Flux, SDXL, and more to bring your imagination to life.';
    const defaultKeywords = 'AI image generator, text to image, stable diffusion, flux, midjourney alternative, AI art';
    const defaultImage = `${siteUrl}/dreambees_icon.png`;

    const metaTitle = title ? `${title} | DreamBeesAI` : defaultTitle;
    const metaDescription = description || defaultDescription;
    const metaKeywords = keywords || defaultKeywords;
    const metaImage = image || defaultImage;

    return (
        <Helmet>
            {/* Standard Metadata */}
            <title>{metaTitle}</title>
            <meta name="description" content={metaDescription} />
            <meta name="keywords" content={metaKeywords} />
            <link rel="canonical" href={currentUrl} />

            {/* Open Graph / Facebook */}
            <meta property="og:type" content={type} />
            <meta property="og:url" content={currentUrl} />
            <meta property="og:title" content={metaTitle} />
            <meta property="og:description" content={metaDescription} />
            <meta property="og:image" content={metaImage} />
            <meta property="og:site_name" content="DreamBeesAI" />

            {/* Twitter */}
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:url" content={currentUrl} />
            <meta name="twitter:title" content={metaTitle} />
            <meta name="twitter:description" content={metaDescription} />
            <meta name="twitter:image" content={metaImage} />
        </Helmet>
    );
};

export default SEO;
