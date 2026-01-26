import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { blogPosts } from '../data/blogPosts';
import { ArrowLeft, Calendar, Clock, User, Share2, Play, Pause, Square, Volume2 } from 'lucide-react';
import SEO from '../components/SEO';
import { trackEvent } from '../utils/analytics';

export default function BlogPost() {
    const { id } = useParams(); // 'id' here captures the slug from the route parameter

    const post = blogPosts.find(p => p.id === id || p.slug === id);

    // TTS State
    const [isPlaying, setIsPlaying] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const contentRef = useRef(null);
    const textNodesRef = useRef([]);

    useEffect(() => {
        if (!post) {
            // Optional: redirect or show 404
        }
        window.scrollTo(0, 0);

        // Map text nodes on mount/update
        if (contentRef.current) {
            const nodes = [];
            const walk = document.createTreeWalker(contentRef.current, NodeFilter.SHOW_TEXT, null, false);
            let node;
            let offset = 0;
            while ((node = walk.nextNode())) {
                const length = node.textContent.length;
                nodes.push({ node, start: offset, end: offset + length });
                offset += length;
            }
            textNodesRef.current = nodes;
        }

        // cleanup TTS on unmount
        return () => {
            window.speechSynthesis.cancel();
            if (CSS.highlights) CSS.highlights.clear();
        }
    }, [post]);

    const highlightWord = (charIndex, charLength) => {
        if (!CSS.highlights) return;

        CSS.highlights.clear();

        const nodes = textNodesRef.current;
        if (nodes.length === 0) return;

        const range = new Range();
        const startGlobal = charIndex;
        const endGlobal = charIndex + charLength;

        // Find start node
        let startNodeObj = nodes.find(n => startGlobal >= n.start && startGlobal < n.end);
        if (!startNodeObj) return;

        // Find end node (might span multiple nodes)
        let endNodeObj = nodes.find(n => endGlobal > n.start && endGlobal <= n.end);
        if (!endNodeObj) endNodeObj = startNodeObj;

        try {
            range.setStart(startNodeObj.node, startGlobal - startNodeObj.start);
            range.setEnd(endNodeObj.node, endGlobal - endNodeObj.start);
            const highlight = new Highlight(range);
            CSS.highlights.set("tts-word", highlight);
        } catch (e) {
            // Index out of bounds can happen with standard voices sometimes
            console.warn("TTS Highlight error", e);
        }
    }

    const handlePlay = () => {
        const synth = window.speechSynthesis;

        if (isPaused) {
            synth.resume();
            setIsPlaying(true);
            setIsPaused(false);
        } else {
            // New utterance
            const textToRead = contentRef.current ? contentRef.current.innerText : '';
            const newUtterance = new SpeechSynthesisUtterance(textToRead);

            newUtterance.onboundary = (event) => {
                if (event.name === 'word') {
                    highlightWord(event.charIndex, event.charLength);
                }
            };

            newUtterance.onend = () => {
                setIsPlaying(false);
                setIsPaused(false);
                if (CSS.highlights) CSS.highlights.clear();
            };


            synth.cancel(); // cancel any previous
            synth.speak(newUtterance);
            setIsPlaying(true);
            setIsPaused(false);
            trackEvent('blog_tts_play', { article_id: post.id });
        }
    };

    const handlePause = () => {
        const synth = window.speechSynthesis;
        if (synth.speaking && !synth.paused) {
            synth.pause();
            setIsPaused(true);
            setIsPlaying(false);
            trackEvent('blog_tts_pause', { article_id: post.id });
        }
    };

    const handleStop = () => {
        const synth = window.speechSynthesis;
        synth.cancel();
        setIsPlaying(false);
        setIsPaused(false);
        if (CSS.highlights) CSS.highlights.clear();
        trackEvent('blog_tts_stop', { article_id: post.id });
    };


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
                keywords={post.keywords}
                image={post.image}
                type="article"
                structuredData={{
                    "@context": "https://schema.org",
                    "@type": "BlogPosting",
                    "headline": post.title,
                    "description": post.excerpt,
                    "author": {
                        "@type": "Person",
                        "name": post.author
                    },
                    "datePublished": post.date,
                    "image": post.image ? `https://dreambeesai.com${post.image}` : "https://dreambeesai.com/og-image.jpg"
                }}
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

                    {/* TTS & Share Actions */}
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        {/* TTS Controls */}
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            background: 'var(--color-zinc-900)',
                            borderRadius: '99px',
                            padding: '4px',
                            border: '1px solid var(--color-border)'
                        }}>
                            {!isPlaying ? (
                                <button
                                    onClick={handlePlay}
                                    className="btn-ghost"
                                    aria-label="Listen to article"
                                    title="Listen to article"
                                    style={{ width: '36px', height: '36px', padding: 0, borderRadius: '50%', color: 'var(--color-text-main)' }}
                                >
                                    <Play size={16} fill="currentColor" />
                                </button>
                            ) : (
                                <button
                                    onClick={handlePause}
                                    className="btn-ghost"
                                    aria-label="Pause audio"
                                    title="Pause audio"
                                    style={{ width: '36px', height: '36px', padding: 0, borderRadius: '50%', color: 'var(--color-accent-primary)' }}
                                >
                                    <Pause size={16} fill="currentColor" />
                                </button>
                            )}

                            {(isPlaying || isPaused) && (
                                <button
                                    onClick={handleStop}
                                    className="btn-ghost"
                                    aria-label="Stop audio"
                                    title="Stop audio"
                                    style={{ width: '36px', height: '36px', padding: 0, borderRadius: '50%', color: 'var(--color-text-muted)' }}
                                >
                                    <Square size={14} fill="currentColor" />
                                </button>
                            )}

                            <div style={{ padding: '0 12px 0 4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <Volume2 size={14} color="var(--color-text-muted)" />
                                <span style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    {isPlaying ? 'Playing' : (isPaused ? 'Paused' : 'Listen')}
                                </span>
                            </div>
                        </div>

                        <button
                            className="btn btn-outline"
                            aria-label="Share article"
                            style={{ borderRadius: '50%', width: '40px', height: '40px', padding: 0 }}
                            onClick={() => trackEvent('blog_article_share', { article_id: post.id })}
                        >
                            <Share2 size={18} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Feature Image */}
            {post.image && (
                <div className="container" style={{ maxWidth: '900px', marginBottom: '60px' }}>
                    <img
                        src={post.image}
                        alt={post.title}
                        style={{
                            width: '100%',
                            height: 'auto',
                            maxHeight: '500px',
                            objectFit: 'cover',
                            borderRadius: '12px',
                            border: '1px solid var(--color-border)'
                        }}
                    />
                </div>
            )}

            {/* Content */}
            <div className="container" style={{ maxWidth: '800px' }}>

                <div ref={contentRef} style={{
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
            <style>{`
                ::highlight(tts-word) {
                    background-color: transparent;
                    color: var(--color-accent-primary);
                    text-shadow: 0 0 8px var(--color-accent-primary);
                    text-decoration: underline;
                }
            `}</style>
        </article>
    );
}
