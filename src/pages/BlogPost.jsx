import React, { useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { blogPosts } from '../data/blogPosts';
import { ArrowLeft, Calendar, Clock, User, Share2 } from 'lucide-react';
import SEO from '../components/SEO';

export default function BlogPost() {
    const { id } = useParams(); // 'id' here captures the slug from the route parameter
    const navigate = useNavigate();

    const post = blogPosts.find(p => p.id === id || p.slug === id);

    useEffect(() => {
        if (!post) {
            // Optional: redirect or show 404
        }
        window.scrollTo(0, 0);
    }, [post]);

    if (!post) {
        return (
            <div className="container" style={{ paddingTop: '160px', textAlign: 'center' }}>
                <h2 style={{ color: 'white', fontSize: '2rem' }}>Article not found</h2>
                <Link to="/blog" className="btn btn-primary" style={{ marginTop: '24px' }}>
                    <ArrowLeft size={18} style={{ marginRight: '8px' }} /> Back to Blog
                </Link>
            </div>
        );
    }

    return (
        <article style={{ paddingTop: '140px', paddingBottom: '120px' }}>
            <SEO
                title={post.title}
                description={post.excerpt}
                type="article"
            />
            {/* Hero / Header */}
            <div className="container" style={{ maxWidth: '900px', marginBottom: '60px' }}>
                <Link to="/blog" style={{
                    display: 'inline-flex', alignItems: 'center', color: 'var(--color-text-muted)',
                    marginBottom: '32px', fontSize: '0.9rem', fontWeight: '500'
                }}>
                    <ArrowLeft size={16} style={{ marginRight: '8px' }} /> Return to Insights
                </Link>

                <div style={{ marginBottom: '24px', display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <span className="status-badge" style={{ background: 'var(--color-accent-dim)', color: 'var(--color-accent-primary)', borderColor: 'transparent' }}>
                        {post.category || 'Research'}
                    </span>
                    <span style={{ color: 'var(--color-text-dim)', fontSize: '0.9rem' }}>•</span>
                    <span style={{ color: 'var(--color-text-dim)', fontSize: '0.9rem' }}>{post.date}</span>
                </div>

                <h1 style={{
                    fontSize: 'clamp(2.5rem, 5vw, 4rem)',
                    fontWeight: '800',
                    letterSpacing: '-0.02em',
                    lineHeight: '1.1',
                    color: 'white',
                    marginBottom: '32px'
                }}>
                    {post.title}
                </h1>

                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '24px 0',
                    borderTop: '1px solid var(--color-border)',
                    borderBottom: '1px solid var(--color-border)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{
                            width: '48px', height: '48px', borderRadius: '50%',
                            background: 'var(--color-zinc-800)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '1.2rem', color: 'var(--color-text-muted)'
                        }}>
                            <User size={24} />
                        </div>
                        <div>
                            <div style={{ color: 'white', fontWeight: '600', fontSize: '1rem' }}>{post.author}</div>
                            <div style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>{post.readTime}</div>
                        </div>
                    </div>

                    <button className="btn btn-outline" style={{ borderRadius: '50%', width: '40px', height: '40px', padding: 0 }}>
                        <Share2 size={18} />
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="container" style={{ maxWidth: '800px' }}>
                <div style={{
                    fontSize: '1.15rem',
                    lineHeight: '1.8',
                    color: 'var(--color-zinc-400)'
                }}>
                    {post.content}
                </div>
            </div>

            {/* Footer / CTA */}
            <div className="container" style={{ maxWidth: '800px', marginTop: '80px', paddingTop: '40px', borderTop: '1px solid var(--color-border)' }}>
                <p style={{ fontStyle: 'italic', color: 'var(--color-text-dim)', textAlign: 'center', marginBottom: '40px' }}>
                    End of article.
                </p>
                <div style={{ textAlign: 'center' }}>
                    <Link to="/blog" className="btn btn-outline">
                        Read more articles
                    </Link>
                </div>
            </div>
        </article>
    );
}
