'use client';

import { useState, useEffect } from 'react';
import SidebarLayout from '../../components/SidebarLayout';
import { apiRequest } from '../../utils/api';
import Link from 'next/link';
import { ShoppingBag, BookOpen, Search, Sparkles } from 'lucide-react';

export default function StoreCatalogPage() {
    const [courses, setCourses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchStoreCourses();
    }, []);

    const fetchStoreCourses = async () => {
        setLoading(true);
        setError('');
        try {
            const data = await apiRequest('/api/store/courses');
            setCourses(data.courses);
        } catch (err: any) {
            setError(err.message || 'Failed to load course store catalog.');
        } finally {
            setLoading(false);
        }
    };

    const filteredCourses = courses.filter(c => 
        c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.description && c.description.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    if (loading) {
        return (
            <SidebarLayout>
                <div style={{ color: 'var(--text-secondary)' }}>Loading marketplace catalog...</div>
            </SidebarLayout>
        );
    }

    return (
        <SidebarLayout>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                    <div>
                        <h1 className="brand-gradient" style={{ fontSize: '2.2rem', fontWeight: '800' }}>
                            Creator Storefront
                        </h1>
                        <p style={{ color: 'var(--text-secondary)' }}>
                            Monetize expertise with courses, workshops, and memberships.
                        </p>
                    </div>

                    {/* Search Field */}
                    <div style={{ position: 'relative', width: '280px' }}>
                        <Search size={16} style={{ position: 'absolute', left: '14px', top: '15px', color: 'var(--text-muted)' }} />
                        <input 
                            type="text" 
                            className="glass-input" 
                            placeholder="Search courses..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={{ paddingLeft: '40px' }}
                        />
                    </div>
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

                {/* Courses Listing */}
                {filteredCourses.length === 0 ? (
                    <div className="glass-panel" style={{ textAlign: 'center', padding: '80px 0', color: 'var(--text-muted)' }}>
                        <ShoppingBag size={48} style={{ marginBottom: '16px', opacity: 0.3 }} />
                        <p style={{ fontSize: '1.05rem', fontWeight: '600' }}>No courses available for purchase.</p>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>You might have purchased all available courses!</p>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '30px' }}>
                        {filteredCourses.map((course) => (
                            <div key={course.id} className="glass-panel" style={{
                                padding: '24px',
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'space-between',
                                minHeight: '280px',
                                position: 'relative',
                                background: 'linear-gradient(135deg, rgba(255,255,255,0.01) 0%, rgba(255,255,255,0.03) 100%)'
                            }}>
                                <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                                        <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-primary)' }}>{course.title}</h3>
                                        <span style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '4px',
                                            fontSize: '0.75rem',
                                            color: 'var(--primary)',
                                            fontWeight: '700'
                                        }}>
                                            <Sparkles size={12} /> Best Seller
                                        </span>
                                    </div>
                                    
                                    <p style={{
                                        fontSize: '0.88rem',
                                        color: 'var(--text-secondary)',
                                        lineHeight: '1.5',
                                        marginBottom: '20px',
                                        display: '-webkit-box',
                                        WebkitLineClamp: 3,
                                        WebkitBoxOrient: 'vertical',
                                        overflow: 'hidden'
                                    }}>
                                        {course.description || 'No description provided.'}
                                    </p>

                                    <div style={{ display: 'flex', gap: '16px', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <BookOpen size={14} /> {course.chapters_count} Chapters
                                        </span>
                                    </div>
                                </div>

                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    borderTop: '1px solid rgba(255,255,255,0.03)',
                                    paddingTop: '16px'
                                }}>
                                    <span style={{ fontSize: '1.35rem', fontWeight: '800', color: 'var(--text-primary)' }}>
                                        {parseFloat(course.price) > 0 ? `₹${parseFloat(course.price).toLocaleString()}` : 'Free'}
                                    </span>
                                    
                                    <Link 
                                        href={`/store/${course.id}`}
                                        className="btn-primary"
                                        style={{ padding: '8px 16px', fontSize: '0.85rem', textDecoration: 'none' }}
                                    >
                                        Learn More
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </SidebarLayout>
    );
}
