'use client';

import { useState, useEffect } from 'react';
import SidebarLayout from '../../components/SidebarLayout';
import { apiRequest } from '../../utils/api';
import { MessageSquare, Heart, Send, Users, ShieldAlert } from 'lucide-react';

export default function CommunityFeedPage() {
    const [posts, setPosts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [postContent, setPostContent] = useState('');
    const [currentUser, setCurrentUser] = useState<any>(null);

    // Comments map: postId -> list of comments
    const [commentsMap, setCommentsMap] = useState<Record<string, any[]>>({});
    const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});
    const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});

    useEffect(() => {
        const storedUser = localStorage.getItem('user_profile');
        if (storedUser) {
            setCurrentUser(JSON.parse(storedUser));
        }
        fetchPosts();
    }, []);

    const fetchPosts = async () => {
        setLoading(true);
        setError('');
        try {
            const data = await apiRequest('/api/community/posts');
            setPosts(data.posts);
        } catch (err: any) {
            setError(err.message || 'Failed to load community discussion feed.');
        } finally {
            setLoading(false);
        }
    };

    const handleCreatePost = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!postContent.trim()) return;

        try {
            await apiRequest('/api/community/posts', {
                method: 'POST',
                body: JSON.stringify({ content: postContent })
            });
            setPostContent('');
            fetchPosts();
            alert('Discussion post created successfully! (Earped XP if student)');
        } catch (err: any) {
            alert(err.message || 'Failed to publish post.');
        }
    };

    const handleToggleLike = async (postId: string) => {
        try {
            const data = await apiRequest(`/api/community/posts/${postId}/like`, { method: 'POST' });
            setPosts(prevPosts => 
                prevPosts.map(p => {
                    if (p.id === postId) {
                        return {
                            ...p,
                            has_liked: data.liked,
                            likes_count: data.liked ? p.likes_count + 1 : p.likes_count - 1
                        };
                    }
                    return p;
                })
            );
        } catch (err: any) {
            console.error('Failed to toggle like:', err);
        }
    };

    const handleToggleComments = async (postId: string) => {
        const isCurrentlyExpanded = !!expandedComments[postId];
        setExpandedComments(prev => ({ ...prev, [postId]: !isCurrentlyExpanded }));

        if (!isCurrentlyExpanded && !commentsMap[postId]) {
            // Load comments from API
            try {
                const data = await apiRequest(`/api/community/posts/${postId}/comments`);
                setCommentsMap(prev => ({ ...prev, [postId]: data.comments }));
            } catch (err: any) {
                console.error('Failed to load comments:', err);
            }
        }
    };

    const handleCommentInputChange = (postId: string, val: string) => {
        setCommentInputs(prev => ({ ...prev, [postId]: val }));
    };

    const handleCreateComment = async (postId: string, e: React.FormEvent) => {
        e.preventDefault();
        const content = commentInputs[postId] || '';
        if (!content.trim()) return;

        try {
            await apiRequest(`/api/community/posts/${postId}/comments`, {
                method: 'POST',
                body: JSON.stringify({ content })
            });

            // Reset input
            setCommentInputs(prev => ({ ...prev, [postId]: '' }));

            // Reload comments
            const data = await apiRequest(`/api/community/posts/${postId}/comments`);
            setCommentsMap(prev => ({ ...prev, [postId]: data.comments }));

            // Update comment count on post card
            setPosts(prevPosts => 
                prevPosts.map(p => {
                    if (p.id === postId) {
                        return { ...p, comments_count: p.comments_count + 1 };
                    }
                    return p;
                })
            );
        } catch (err: any) {
            alert(err.message || 'Failed to submit comment.');
        }
    };

    if (loading) {
        return (
            <SidebarLayout>
                <div style={{ color: 'var(--text-secondary)' }}>Loading discussion board...</div>
            </SidebarLayout>
        );
    }

    return (
        <SidebarLayout>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '30px' }}>
                
                {/* 1. LEFT COLUMN - Discussion Feed */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    {/* Header */}
                    <div>
                        <h1 className="brand-gradient" style={{ fontSize: '2.2rem', fontWeight: '800' }}>
                            Community Discussion
                        </h1>
                        <p style={{ color: 'var(--text-secondary)' }}>
                            Connect with educators, query subject concepts, and support classmates.
                        </p>
                    </div>

                    {error && (
                        <div style={{
                            padding: '12px 16px',
                            background: 'rgba(239, 68, 68, 0.1)',
                            border: '1px solid rgba(239, 68, 68, 0.2)',
                            color: '#fca5a5',
                            borderRadius: '8px',
                            fontSize: '0.9rem'
                        }}>
                            ⚠️ {error}
                        </div>
                    )}

                    {/* Compose Post */}
                    <div className="glass-panel" style={{ padding: '24px', borderRadius: '16px' }}>
                        <form onSubmit={handleCreatePost} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <textarea 
                                className="glass-input" 
                                rows={3} 
                                placeholder="Ask a question or share learning materials with ABC Academy peers..."
                                required
                                value={postContent}
                                onChange={(e) => setPostContent(e.target.value)}
                                style={{ fontFamily: 'inherit', resize: 'vertical' }}
                            />
                            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                <button type="submit" className="btn-primary" style={{ padding: '10px 20px', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                                    <Send size={16} /> Publish Post
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Feed Posts List */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        {posts.length === 0 ? (
                            <div className="glass-panel" style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
                                <Users size={48} style={{ marginBottom: '16px', opacity: 0.3 }} />
                                <p>The discussion board is quiet. Start the conversation!</p>
                            </div>
                        ) : (
                            posts.map((post) => (
                                <div key={post.id} className="glass-panel" style={{ padding: '24px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    
                                    {/* Author detail header */}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div>
                                            <h4 style={{ fontSize: '0.95rem', fontWeight: '700' }}>
                                                {post.first_name} {post.last_name}
                                            </h4>
                                            <span style={{
                                                fontSize: '0.72rem',
                                                padding: '2px 6px',
                                                borderRadius: '4px',
                                                fontWeight: '700',
                                                background: post.role === 'teacher' ? 'rgba(var(--primary-rgb), 0.15)' : 'rgba(255,255,255,0.05)',
                                                color: post.role === 'teacher' ? 'var(--primary)' : 'var(--text-secondary)',
                                                marginRight: '8px'
                                            }}>
                                                {post.role.toUpperCase()}
                                            </span>
                                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                                {new Date(post.created_at).toLocaleString()}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Content */}
                                    <p style={{ fontSize: '0.98rem', color: 'var(--text-primary)', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
                                        {post.content}
                                    </p>

                                    {/* Actions bar (Like/Comment count triggers) */}
                                    <div style={{ display: 'flex', gap: '20px', borderTop: '1px solid rgba(255,255,255,0.03)', paddingTop: '12px', fontSize: '0.85rem' }}>
                                        <button 
                                            onClick={() => handleToggleLike(post.id)}
                                            style={{
                                                background: 'none', border: 'none',
                                                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
                                                color: post.has_liked ? 'var(--primary)' : 'var(--text-secondary)',
                                                fontWeight: post.has_liked ? '700' : 'normal'
                                            }}
                                        >
                                            <Heart size={16} fill={post.has_liked ? 'currentColor' : 'none'} />
                                            <span>{post.likes_count} Likes</span>
                                        </button>

                                        <button 
                                            onClick={() => handleToggleComments(post.id)}
                                            style={{
                                                background: 'none', border: 'none',
                                                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
                                                color: expandedComments[post.id] ? 'var(--text-primary)' : 'var(--text-secondary)'
                                            }}
                                        >
                                            <MessageSquare size={16} />
                                            <span>{post.comments_count} Comments</span>
                                        </button>
                                    </div>

                                    {/* Comments thread panel */}
                                    {expandedComments[post.id] && (
                                        <div style={{
                                            borderTop: '1px dashed var(--border-glass)',
                                            paddingTop: '16px',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: '12px'
                                        }}>
                                            {/* comment write form */}
                                            <form onSubmit={(e) => handleCreateComment(post.id, e)} style={{ display: 'flex', gap: '10px' }}>
                                                <input 
                                                    type="text" 
                                                    className="glass-input" 
                                                    placeholder="Write a comment..." 
                                                    required
                                                    value={commentInputs[post.id] || ''}
                                                    onChange={(e) => handleCommentInputChange(post.id, e.target.value)}
                                                    style={{ flex: 1, padding: '10px 14px' }}
                                                />
                                                <button type="submit" className="btn-primary" style={{ padding: '0 16px' }}>Reply</button>
                                            </form>

                                            {/* comments list */}
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                {(commentsMap[post.id] || []).length === 0 ? (
                                                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>No replies yet. Be the first to comment!</span>
                                                ) : (
                                                    commentsMap[post.id].map(comment => (
                                                        <div key={comment.id} style={{
                                                            background: 'rgba(255,255,255,0.01)',
                                                            border: '1px solid var(--border-glass)',
                                                            borderRadius: '8px',
                                                            padding: '10px 14px',
                                                            fontSize: '0.85rem'
                                                        }}>
                                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                                                <strong>{comment.first_name} {comment.last_name} ({comment.role})</strong>
                                                                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                                                    {new Date(comment.created_at).toLocaleDateString()}
                                                                </span>
                                                            </div>
                                                            <span style={{ color: 'var(--text-secondary)' }}>{comment.content}</span>
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* 2. RIGHT COLUMN - Community Rules Info */}
                <div>
                    <div className="glass-panel" style={{ padding: '24px', borderRadius: '16px', position: 'sticky', top: '100px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '1px solid var(--border-glass)', paddingBottom: '12px' }}>
                            <ShieldAlert size={20} style={{ color: 'var(--primary)' }} />
                            <h3 style={{ fontSize: '1.05rem', fontWeight: '700' }}>Study Feed Guidelines</h3>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                            <p><strong>1. Maintain Academic Honesty:</strong> Ask details about derivations, concepts, and assignments without copying solutions.</p>
                            <p><strong>2. Earn Gamification XP:</strong> Students earn <strong>+10 XP</strong> points on publishing discussion queries to the community board!</p>
                            <p><strong>3. Keep it Professional:</strong> Show support for classmates. Offensive commentary results in suspension.</p>
                        </div>
                    </div>
                </div>
            </div>
        </SidebarLayout>
    );
}
