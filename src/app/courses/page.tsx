'use client';

import { useState, useEffect } from 'react';
import SidebarLayout from '../../components/SidebarLayout';
import ModalPortal from '../../components/ModalPortal';
import { apiRequest } from '../../utils/api';
import { BookOpen, Plus, Globe, Check, EyeOff, Sparkles, X, Edit2, Trash2 } from 'lucide-react';
import Link from 'next/link';

export default function CoursesPage() {
    const [courses, setCourses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [userRole, setUserRole] = useState('');

    // Course Creation fields
    const [isCreating, setIsCreating] = useState(false);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [price, setPrice] = useState('');
    const [isPublished, setIsPublished] = useState(true);

    // Course Edit fields
    const [editingCourse, setEditingCourse] = useState<any>(null);
    const [editTitle, setEditTitle] = useState('');
    const [editDescription, setEditDescription] = useState('');
    const [editPrice, setEditPrice] = useState('');
    const [editIsPublished, setEditIsPublished] = useState(true);

    useEffect(() => {
        fetchCourses();
        const storedUser = localStorage.getItem('user_profile');
        if (storedUser) {
            setUserRole(JSON.parse(storedUser).role);
        }
    }, []);

    const fetchCourses = async () => {
        setLoading(true);
        setError('');
        try {
            const data = await apiRequest('/api/courses');
            setCourses(data.courses);
        } catch (err: any) {
            setError(err.message || 'Failed to load courses.');
        } finally {
            setLoading(false);
        }
    };

    const handleTogglePublish = async (courseId: string) => {
        try {
            const res = await apiRequest(`/api/courses/${courseId}/toggle-publish`, {
                method: 'PATCH'
            });
            alert(res.message);
            fetchCourses();
        } catch (err: any) {
            alert(err.message || 'Failed to update course publish status.');
        }
    };

    const openEditCourse = (course: any) => {
        setEditingCourse(course);
        setEditTitle(course.title);
        setEditDescription(course.description || '');
        setEditPrice(String(course.price || ''));
        setEditIsPublished(course.is_published ?? true);
    };

    const handleUpdateCourse = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await apiRequest(`/api/courses/${editingCourse.id}`, {
                method: 'PUT',
                body: JSON.stringify({
                    title: editTitle,
                    description: editDescription,
                    price: parseFloat(editPrice) || 0,
                    isPublished: editIsPublished
                })
            });
            setEditingCourse(null);
            fetchCourses();
        } catch (err: any) {
            alert(err.message || 'Failed to update course.');
        }
    };

    const handleDeleteCourse = async (courseId: string, courseTitle: string) => {
        if (!confirm(`Are you sure you want to delete "${courseTitle}"? This cannot be undone.`)) return;
        try {
            await apiRequest(`/api/courses/${courseId}`, { method: 'DELETE' });
            fetchCourses();
        } catch (err: any) {
            alert(err.message || 'Failed to delete course.');
        }
    };

    const handleCreateCourse = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        try {
            await apiRequest('/api/courses', {
                method: 'POST',
                body: JSON.stringify({
                    title,
                    description,
                    price: parseFloat(price) || 0,
                    isPublished
                })
            });

            // Reset form
            setTitle('');
            setDescription('');
            setPrice('');
            setIsPublished(true);
            setIsCreating(false);

            // Reload list
            fetchCourses();
        } catch (err: any) {
            setError(err.message || 'Failed to create course.');
        }
    };

    if (loading) {
        return (
            <SidebarLayout>
                <div style={{ color: 'var(--text-secondary)' }}>Loading courses catalog...</div>
            </SidebarLayout>
        );
    }

    return (
        <SidebarLayout>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                {/* Header Section */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h1 className="gradient-text" style={{ fontSize: '2.2rem', fontWeight: '800' }}>
                            Course Catalog
                        </h1>
                        <p style={{ color: 'var(--text-secondary)' }}>
                            Explore and manage syllabus curricula.
                        </p>
                    </div>

                    {(userRole === 'admin' || userRole === 'teacher') && (
                        <button 
                            onClick={() => setIsCreating(true)} 
                            className="btn-primary"
                        >
                            <Plus size={18} />
                            Add Course
                        </button>
                    )}
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

                {/* Course creation modal */}
                {isCreating && (
                    <ModalPortal onClose={() => setIsCreating(false)}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <h3 style={{ fontSize: '1.25rem', fontWeight: '700' }}>Create New Course</h3>
                                <button style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }} onClick={() => setIsCreating(false)}>
                                    <X size={20} />
                                </button>
                            </div>
                            
                            <form onSubmit={handleCreateCourse} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Course Title</label>
                                    <input 
                                        type="text" 
                                        className="glass-input" 
                                        required 
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        placeholder="e.g. Organic Chemistry Masterclass"
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Description</label>
                                    <textarea 
                                        className="glass-input" 
                                        rows={3}
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        placeholder="Outline course benefits, sections..."
                                        style={{ resize: 'vertical', fontFamily: 'inherit' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Price (₹)</label>
                                    <input 
                                        type="number" 
                                        className="glass-input" 
                                        required 
                                        value={price}
                                        onChange={(e) => setPrice(e.target.value)}
                                        placeholder="e.g. 1999"
                                    />
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <input 
                                        type="checkbox" 
                                        id="publish" 
                                        checked={isPublished}
                                        onChange={(e) => setIsPublished(e.target.checked)}
                                        style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                                    />
                                    <label htmlFor="publish" style={{ fontSize: '0.9rem', color: 'var(--text-primary)', cursor: 'pointer' }}>
                                        Publish immediately to Storefront
                                    </label>
                                </div>

                                <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                                    <button type="submit" className="btn-primary" style={{ flex: 1, padding: '12px' }}>Create Course</button>
                                    <button 
                                        type="button" 
                                        className="btn-secondary" 
                                        style={{ flex: 1, padding: '12px' }} 
                                        onClick={() => setIsCreating(false)}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        </div>
                    </ModalPortal>
                )}

                {/* Course Edit modal */}
                {editingCourse && (
                    <ModalPortal onClose={() => setEditingCourse(null)}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <h3 style={{ fontSize: '1.25rem', fontWeight: '700' }}>Edit Course</h3>
                                <button style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }} onClick={() => setEditingCourse(null)}>
                                    <X size={20} />
                                </button>
                            </div>
                            
                            <form onSubmit={handleUpdateCourse} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Course Title</label>
                                    <input 
                                        type="text" 
                                        className="glass-input" 
                                        required 
                                        value={editTitle}
                                        onChange={(e) => setEditTitle(e.target.value)}
                                        placeholder="Course Title"
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Description</label>
                                    <textarea 
                                        className="glass-input" 
                                        rows={3}
                                        value={editDescription}
                                        onChange={(e) => setEditDescription(e.target.value)}
                                        placeholder="Outline course benefits, sections..."
                                        style={{ resize: 'vertical', fontFamily: 'inherit' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Price (₹)</label>
                                    <input 
                                        type="number" 
                                        className="glass-input" 
                                        required 
                                        value={editPrice}
                                        onChange={(e) => setEditPrice(e.target.value)}
                                        placeholder="e.g. 1999"
                                    />
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <input 
                                        type="checkbox" 
                                        id="editPublish" 
                                        checked={editIsPublished}
                                        onChange={(e) => setEditIsPublished(e.target.checked)}
                                        style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                                    />
                                    <label htmlFor="editPublish" style={{ fontSize: '0.9rem', color: 'var(--text-primary)', cursor: 'pointer' }}>
                                        Published on Storefront
                                    </label>
                                </div>

                                <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                                    <button type="submit" className="btn-primary" style={{ flex: 1, padding: '12px' }}>Save Changes</button>
                                    <button 
                                        type="button" 
                                        className="btn-secondary" 
                                        style={{ flex: 1, padding: '12px' }} 
                                        onClick={() => setEditingCourse(null)}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        </div>
                    </ModalPortal>
                )}

                {/* Courses Grid */}
                {courses.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
                        <BookOpen size={48} style={{ marginBottom: '16px', opacity: 0.3 }} />
                        <p>No courses found in this workspace catalog.</p>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
                        {courses.map((course) => (
                            <div key={course.id} className="glass-panel" style={{
                                padding: '24px',
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'space-between',
                                minHeight: '230px',
                                position: 'relative'
                            }}>
                                <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px', gap: '8px' }}>
                                        <h3 style={{ fontSize: '1.2rem', fontWeight: '700', wordBreak: 'break-word' }}>
                                            {course.title}
                                        </h3>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            {(userRole === 'admin' || userRole === 'teacher') && (
                                                <>
                                                    <span style={{
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        gap: '4px',
                                                        fontSize: '0.75rem',
                                                        fontWeight: '600',
                                                        padding: '3px 8px',
                                                        borderRadius: '12px',
                                                        background: course.is_published ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                                                        color: course.is_published ? 'var(--success)' : 'var(--warning)',
                                                        border: course.is_published ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(245, 158, 11, 0.3)',
                                                        whiteSpace: 'nowrap'
                                                    }}>
                                                        {course.is_published ? <Globe size={12} /> : <EyeOff size={12} />}
                                                        {course.is_published ? 'Published' : 'Draft'}
                                                    </span>
                                                    <button
                                                        onClick={() => openEditCourse(course)}
                                                        style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
                                                        title="Edit Course"
                                                    >
                                                        <Edit2 size={15} />
                                                    </button>
                                                    {userRole === 'admin' && (
                                                        <button
                                                            onClick={() => handleDeleteCourse(course.id, course.title)}
                                                            style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', padding: '4px' }}
                                                            title="Delete Course"
                                                        >
                                                            <Trash2 size={15} />
                                                        </button>
                                                    )}
                                                </>
                                            )}
                                        </div>
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
                                </div>
                                
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    borderTop: '1px solid rgba(255,255,255,0.06)',
                                    paddingTop: '16px',
                                    gap: '8px',
                                    flexWrap: 'wrap'
                                }}>
                                    <span style={{ fontSize: '1.3rem', fontWeight: '800', color: 'var(--text-primary)' }}>
                                        {course.price > 0 ? `₹${parseFloat(course.price).toLocaleString()}` : 'Free'}
                                    </span>
                                    
                                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                        {(userRole === 'admin' || userRole === 'teacher') && (
                                            <button
                                                onClick={() => handleTogglePublish(course.id)}
                                                className="btn-secondary"
                                                style={{ 
                                                    padding: '6px 12px', 
                                                    fontSize: '0.78rem',
                                                    color: course.is_published ? 'var(--warning)' : 'var(--success)',
                                                    borderColor: course.is_published ? 'rgba(245, 158, 11, 0.3)' : 'rgba(16, 185, 129, 0.3)'
                                                }}
                                                title={course.is_published ? "Hide from Storefront" : "Publish to Storefront"}
                                            >
                                                {course.is_published ? 'Unpublish' : 'Publish'}
                                            </button>
                                        )}
                                        <Link 
                                            href={`/courses/${course.id}`}
                                            className="btn-primary" 
                                            style={{ padding: '6px 14px', fontSize: '0.82rem', textDecoration: 'none' }}
                                        >
                                            Syllabus
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </SidebarLayout>
    );
}
