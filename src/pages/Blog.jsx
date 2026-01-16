import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { blogPosts } from '../data/blogPosts';
import { Search, ArrowRight, Calendar, User, Clock } from 'lucide-react';
import SEO from '../components/SEO';

export default function Blog() {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');

    const filteredPosts = useMemo(() => {
        return blogPosts.filter(post =>
            post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            post.excerpt.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [searchQuery]);

    return (
        <div className="container" style={{ paddingTop: '140px', paddingBottom: '120px' }}>
            <SEO
                title="Research & Insights"
                description="Read the latest news, research, and insights from the DreamBeesAI team. Deep dives into generative AI, prompt engineering, and synthetic media."
                keywords="AI art blog, generative AI research, prompt engineering tips, AI image generation tutorials, synthetic media"
                structuredData={{
                    "@context": "https://schema.org",
                    "@graph": [
                        {
                            "@type": "Blog",
                            "name": "DreamBeesAI Research & Insights",
                            "description": "Deep dives into generative AI, behavioral drift, and the future of synthetic media.",
                            "url": "https://dreambeesai.com/blog"
                        },
                        {
                            "@type": "BreadcrumbList",
                            "itemListElement": [
                                { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://dreambeesai.com" },
                                { "@type": "ListItem", "position": 2, "name": "Blog", "item": "https://dreambeesai.com/blog" }
                            ]
                        }
                    ]
                }}
            />
            {/* Header */}
            <header style={{ marginBottom: '60px', textAlign: 'center', maxWidth: '800px', margin: '0 auto 80px' }}>
                <h1 style={{
                    fontSize: 'clamp(3rem, 6vw, 4.5rem)',
                    fontWeight: '800',
                    letterSpacing: '-0.03em',
                    lineHeight: '1',
                    color: 'white',
                    marginBottom: '24px'
                }}>
                    Research & <br />
                    <span className="text-gradient">Insights</span>
                </h1>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '1.25rem', lineHeight: 1.5, maxWidth: '600px', margin: '0 auto' }}>
                    Deep dives into generative AI, behavioral drift, and the future of synthetic media.
                </p>
            </header>

            {/* Search */}
            <div className="flex-center" style={{ marginBottom: '80px' }}>
                <div style={{
                    position: 'relative',
                    width: '100%',
                    maxWidth: '500px'
                }}>
                    <Search
                        size={20}
                        color="var(--color-text-muted)"
                        style={{ position: 'absolute', left: '20px', top: '50%', transform: 'translateY(-50%)' }}
                    />
                    <input
                        type="text"
                        placeholder="Search articles..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="input-field"
                        style={{
                            paddingLeft: '50px',
                            borderRadius: '99px',
                            background: 'var(--color-surface)',
                            border: '1px solid var(--color-border)',
                            height: '56px'
                        }}
                    />
                </div>
            </div>

            {/* Grid */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))',
                gap: '40px'
            }}>
                {filteredPosts.map((post, i) => (
                    <Link
                        to={`/blog/${post.slug || post.id}`}
                        key={post.id}
                        className="group"
                        style={{ textDecoration: 'none' }}
                    >
                        <article
                            className="glass-panel card-hoverable"
                            style={{
                                height: '100%',
                                display: 'flex',
                                flexDirection: 'column',
                                overflow: 'hidden',
                                padding: '32px'
                            }}
                        >
                            <div style={{ marginBottom: '24px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                                <span className="status-badge">{post.category || 'Research'}</span>
                                <span className="status-badge" style={{ background: 'transparent', border: 'none', paddingLeft: 0 }}>
                                    <Clock size={14} style={{ marginRight: '6px' }} />
                                    {post.readTime}
                                </span>
                            </div>

                            {post.image && (
                                <div style={{ marginBottom: '20px', borderRadius: '8px', overflow: 'hidden' }}>
                                    <img
                                        src={post.image}
                                        alt={post.title}
                                        style={{
                                            width: '100%',
                                            height: '200px',
                                            objectFit: 'cover'
                                        }}
                                    />
                                </div>
                            )}

                            <h3 style={{
                                fontSize: '1.75rem',
                                fontWeight: '700',
                                color: 'white',
                                lineHeight: 1.2,
                                marginBottom: '16px',
                                minHeight: '3.6em' // Align heights roughly
                            }}>
                                {post.title}
                            </h3>

                            <p style={{
                                color: 'var(--color-text-muted)',
                                lineHeight: 1.6,
                                marginBottom: '32px',
                                flex: 1,
                                display: '-webkit-box',
                                WebkitLineClamp: 3,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden'
                            }}>
                                {post.excerpt}
                            </p>

                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                borderTop: '1px solid var(--color-border)',
                                paddingTop: '24px',
                                marginTop: 'auto'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div style={{
                                        width: '32px', height: '32px', borderRadius: '50%',
                                        background: 'var(--color-zinc-800)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                                    }}>
                                        <User size={16} color="var(--color-text-muted)" />
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                        <span style={{ fontSize: '0.85rem', color: 'white', fontWeight: '500' }}>{post.author}</span>
                                        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-dim)' }}>{post.date}</span>
                                    </div>
                                </div>

                                <div className="btn-ghost" style={{ paddingRight: 0, color: 'var(--color-accent-primary)' }}>
                                    Read Article <ArrowRight size={16} style={{ marginLeft: '8px' }} />
                                </div>
                            </div>
                        </article>
                    </Link>
                ))}
            </div>

            {filteredPosts.length === 0 && (
                <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--color-text-muted)' }}>
                    <p>No articles found matching "{searchQuery}"</p>
                </div>
            )}
        </div>
    );
}

