import { db } from "../../firebaseInit.js";
import { logger, slugify } from "../../lib/utils.js";

export const handleSitemap = async (req, res) => {
    try {
        const baseUrl = 'https://dreambeesai.com';
        const now = new Date().toISOString();
        const urlMap = new Map();

        // Static pages
        const staticPages = [
            { path: '', priority: '1.0', changefreq: 'daily' },
            { path: '/discovery', priority: '0.9', changefreq: 'daily' },
            { path: '/models', priority: '0.8', changefreq: 'weekly' },
            { path: '/pricing', priority: '0.8', changefreq: 'weekly' },
            { path: '/apps', priority: '0.7', changefreq: 'weekly' },
            { path: '/blog', priority: '0.7', changefreq: 'weekly' },
            { path: '/about', priority: '0.5', changefreq: 'monthly' },
            { path: '/features', priority: '0.6', changefreq: 'monthly' },
            { path: '/contact', priority: '0.5', changefreq: 'monthly' },
            { path: '/terms', priority: '0.3', changefreq: 'monthly' },
            { path: '/privacy', priority: '0.3', changefreq: 'monthly' },
            { path: '/cookies', priority: '0.3', changefreq: 'monthly' },
            { path: '/safety', priority: '0.5', changefreq: 'monthly' },
            { path: '/brand', priority: '0.4', changefreq: 'monthly' },
            { path: '/careers', priority: '0.4', changefreq: 'monthly' },
            { path: '/api', priority: '0.4', changefreq: 'monthly' },
            { path: '/showcase', priority: '0.6', changefreq: 'weekly' },
            { path: '/generations', priority: '0.7', changefreq: 'daily' },
            { path: '/mockups', priority: '0.7', changefreq: 'daily' },
            { path: '/memes', priority: '0.7', changefreq: 'daily' },
            { path: '/slideshow', priority: '0.5', changefreq: 'weekly' },
            { path: '/landing', priority: '0.8', changefreq: 'monthly' },
        ];

        staticPages.forEach(page => {
            const loc = `${baseUrl}${page.path}`;
            urlMap.set(loc, {
                loc,
                changefreq: page.changefreq,
                priority: page.priority,
                lastmod: now
            });
        });

        // Dynamic model pages
        try {
            const modelsSnapshot = await db.collection('models').get();
            modelsSnapshot.forEach(doc => {
                const loc = `${baseUrl}/model/${doc.id}`;
                urlMap.set(loc, {
                    loc,
                    changefreq: 'weekly',
                    priority: '0.7',
                    lastmod: doc.data().updatedAt?.toDate?.()?.toISOString() || now
                });
            });
        } catch (e) { logger.warn("Sitemap: Failed to fetch models", e); }

        // Blog posts
        const blogPostsData = [
            { id: 'prompt-director-drift-evaluation', date: '2026-01-03' },
            { id: 'elon-musk-docket-case', date: '2026-01-16' }
        ];
        blogPostsData.forEach(post => {
            const loc = `${baseUrl}/blog/${post.id}`;
            urlMap.set(loc, {
                loc,
                changefreq: 'monthly',
                priority: '0.7',
                lastmod: new Date(post.date).toISOString()
            });
        });

        // Showcase images
        try {
            const showcaseSnapshot = await db.collection('model_showcase_images')
                .orderBy('createdAt', 'desc')
                .limit(200)
                .get();

            showcaseSnapshot.forEach(doc => {
                const data = doc.data();
                const slug = slugify(data.prompt?.slice(0, 40) || 'artwork');
                const loc = `${baseUrl}/discovery/${slug}-${doc.id}`;
                const imgUrl = data.thumbnailUrl || data.url || data.imageUrl;
                urlMap.set(loc, {
                    loc,
                    changefreq: 'monthly',
                    priority: '0.6',
                    lastmod: data.createdAt?.toDate?.()?.toISOString() || now,
                    image: imgUrl ? {
                        loc: imgUrl,
                        title: data.prompt?.slice(0, 100) || 'AI Artwork'
                    } : null
                });
            });
        } catch (e) { logger.warn("Sitemap: Failed to fetch showcase", e); }

        // Recent public generations
        try {
            const generationsSnapshot = await db.collection('generations')
                .where('isPublic', '==', true)
                .orderBy('createdAt', 'desc')
                .limit(300)
                .get();

            generationsSnapshot.forEach(doc => {
                const data = doc.data();
                const slug = slugify(data.prompt?.slice(0, 40) || 'artwork');
                const loc = `${baseUrl}/discovery/${slug}-${doc.id}`;
                if (!urlMap.has(loc)) {
                    const imgUrl = data.thumbnailUrl || data.url || data.imageUrl;
                    urlMap.set(loc, {
                        loc,
                        changefreq: 'monthly',
                        priority: '0.5',
                        lastmod: data.createdAt?.toDate?.()?.toISOString() || now,
                        image: imgUrl ? {
                            loc: imgUrl,
                            title: data.prompt?.slice(0, 100) || 'AI Artwork'
                        } : null
                    });
                }
            });
        } catch (e) { logger.warn("Sitemap: Failed to fetch generations", e); }

        let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">`;
        urlMap.forEach(url => {
            xml += `
  <url>
    <loc>${url.loc}</loc>
    <lastmod>${url.lastmod}</lastmod>
    <changefreq>${url.changefreq}</changefreq>
    <priority>${url.priority}</priority>${url.image ? `
    <image:image>
      <image:loc>${url.image.loc}</image:loc>
      <image:title><![CDATA[${url.image.title}]]></image:title>
    </image:image>` : ''}
  </url>`;
        });
        xml += `
</urlset>`;

        res.set('Content-Type', 'application/xml');
        res.set('Cache-Control', 'public, max-age=86400, s-maxage=86400');
        res.status(200).send(xml);
    } catch (error) {
        logger.error("Error generating sitemap", error);
        res.status(500).send("Error generating sitemap");
    }
};
