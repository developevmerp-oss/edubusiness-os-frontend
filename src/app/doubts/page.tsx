'use client';

import { useState, useEffect } from 'react';
import SidebarLayout from '../../components/SidebarLayout';
import ModalPortal from '../../components/ModalPortal';
import { apiRequest } from '../../utils/api';
import { 
    HelpCircle, 
    Plus, 
    CheckCircle2, 
    Clock, 
    MessageSquare, 
    FileText, 
    Search,
    BookOpen,
    Send,
    Sparkles,
    Check,
    Filter
} from 'lucide-react';

export default function DoubtsPage() {
    const [doubts, setDoubts] = useState<any[]>([]);
    const [courses, setCourses] = useState<any[]>([]);
    const [userRole, setUserRole] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Filters
    const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'resolved'>('all');
    const [subjectFilter, setSubjectFilter] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');

    // Modals
    const [isAskModalOpen, setIsAskModalOpen] = useState(false);
    const [activeDoubtForResolve, setActiveDoubtForResolve] = useState<any>(null);

    // Form: Ask Doubt
    const [doubtSubject, setDoubtSubject] = useState('Physics');
    const [doubtTitle, setDoubtTitle] = useState('');
    const [doubtDescription, setDoubtDescription] = useState('');
    const [doubtCourseId, setDoubtCourseId] = useState('');
    const [doubtAttachment, setDoubtAttachment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form: Resolve Doubt
    const [resolutionNotes, setResolutionNotes] = useState('');
    const [isPublicFaq, setIsPublicFaq] = useState(true);
    const [isResolving, setIsResolving] = useState(false);

    useEffect(() => {
        const storedUser = localStorage.getItem('user_profile');
        if (storedUser) {
            try {
                setUserRole(JSON.parse(storedUser).role);
            } catch (e) {}
        }
        fetchDoubtsAndCourses();
    }, []);

    const fetchDoubtsAndCourses = async () => {
        setLoading(true);
        setError('');
        try {
            const [doubtsData, coursesData] = await Promise.all([
                apiRequest('/api/doubts'),
                apiRequest('/api/courses')
            ]);
            setDoubts(doubtsData.doubts || []);
            setCourses(coursesData.courses || []);
            if (coursesData.courses?.length > 0) {
                setDoubtCourseId(coursesData.courses[0].id);
            }
        } catch (err: any) {
            setError(err.message || 'Failed to load doubt desk records.');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateDoubt = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await apiRequest('/api/doubts', {
                method: 'POST',
                body: JSON.stringify({
                    subject: doubtSubject,
                    title: doubtTitle,
                    description: doubtDescription,
                    courseId: doubtCourseId,
                    attachmentUrl: doubtAttachment || undefined
                })
            });

            setDoubtTitle('');
            setDoubtDescription('');
            setDoubtAttachment('');
            setIsAskModalOpen(false);
            fetchDoubtsAndCourses();
            alert('Your doubt question has been posted to faculty desk.');
        } catch (err: any) {
            alert(err.message || 'Failed to submit doubt.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleResolveDoubt = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!activeDoubtForResolve) return;
        setIsResolving(true);
        try {
            await apiRequest(`/api/doubts/${activeDoubtForResolve.id}/resolve`, {
                method: 'PATCH',
                body: JSON.stringify({
                    resolutionNotes,
                    isPublicFaq
                })
            });

            setResolutionNotes('');
            setActiveDoubtForResolve(null);
            fetchDoubtsAndCourses();
            alert('Doubt marked as resolved and solution published.');
        } catch (err: any) {
            alert(err.message || 'Failed to resolve doubt.');
        } finally {
            setIsResolving(false);
        }
    };

    // Filtered Doubts
    const filteredDoubts = doubts.filter(d => {
        if (statusFilter !== 'all' && d.status !== statusFilter) return false;
        if (subjectFilter !== 'All' && d.subject !== subjectFilter) return false;
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            return (
                d.title.toLowerCase().includes(q) ||
                d.description.toLowerCase().includes(q) ||
                (d.subject && d.subject.toLowerCase().includes(q))
            );
        }
        return true;
    });

    const subjects = ['All', 'Physics', 'Chemistry', 'Mathematics', 'Biology', 'General'];

    return (
        <SidebarLayout>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
                
                {/* Header Banner */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h1 style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '8px' }}>
                            Doubt Resolution Desk
                        </h1>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
                            Direct academic query resolution, step-by-step teacher explanations, and academy FAQ solution library.
                        </p>
                    </div>

                    <button 
                        onClick={() => setIsAskModalOpen(true)}
                        className="btn-primary"
                        style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px', fontWeight: '700' }}
                    >
                        <Plus size={18} />
                        Ask a Doubt
                    </button>
                </div>

                {/* Filter and Search Bar */}
                <div className="glass-panel" style={{ padding: '16px 24px', borderRadius: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                    {/* Status Tabs */}
                    <div style={{ display: 'flex', gap: '8px' }}>
                        {[
                            { label: 'All Queries', value: 'all' },
                            { label: 'Pending / Open', value: 'open' },
                            { label: 'Resolved & FAQs', value: 'resolved' }
                        ].map(tab => (
                            <button
                                key={tab.value}
                                onClick={() => setStatusFilter(tab.value as any)}
                                style={{
                                    padding: '8px 16px',
                                    borderRadius: '8px',
                                    fontSize: '0.85rem',
                                    fontWeight: '600',
                                    border: '1px solid',
                                    borderColor: statusFilter === tab.value ? '#6366f1' : 'var(--border-glass)',
                                    background: statusFilter === tab.value ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
                                    color: statusFilter === tab.value ? '#ffffff' : 'var(--text-secondary)',
                                    cursor: 'pointer'
                                }}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Subject Pills */}
                    <div style={{ display: 'flex', gap: '6px', overflowX: 'auto' }}>
                        {subjects.map(sub => (
                            <button
                                key={sub}
                                onClick={() => setSubjectFilter(sub)}
                                style={{
                                    padding: '6px 12px',
                                    borderRadius: '20px',
                                    fontSize: '0.8rem',
                                    fontWeight: '600',
                                    border: '1px solid',
                                    borderColor: subjectFilter === sub ? '#10b981' : 'rgba(255,255,255,0.06)',
                                    background: subjectFilter === sub ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255,255,255,0.02)',
                                    color: subjectFilter === sub ? '#34d399' : 'var(--text-muted)',
                                    cursor: 'pointer'
                                }}
                            >
                                {sub}
                            </button>
                        ))}
                    </div>

                    {/* Search Input */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(0,0,0,0.2)', padding: '6px 12px', borderRadius: '8px', border: '1px solid var(--border-glass)' }}>
                        <Search size={16} style={{ color: 'var(--text-muted)' }} />
                        <input 
                            type="text"
                            placeholder="Search questions or topics..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: '0.85rem', outline: 'none', width: '200px' }}
                        />
                    </div>
                </div>

                {/* Doubts List */}
                {loading ? (
                    <div style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '60px' }}>
                        Loading doubts and queries...
                    </div>
                ) : filteredDoubts.length === 0 ? (
                    <div className="glass-panel" style={{ padding: '60px', textAlign: 'center', borderRadius: '16px' }}>
                        <HelpCircle size={48} style={{ color: 'var(--primary)', margin: '0 auto 16px auto', opacity: 0.6 }} />
                        <h3 style={{ fontSize: '1.2rem', fontWeight: '700', marginBottom: '8px' }}>No doubts found</h3>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                            {statusFilter === 'open' ? 'All student doubts have been answered! Great job!' : 'No questions matching your current filter.'}
                        </p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                        {filteredDoubts.map((doubt) => {
                            const isResolved = doubt.status === 'resolved';
                            return (
                                <div 
                                    key={doubt.id}
                                    className="glass-panel"
                                    style={{
                                        padding: '24px 28px',
                                        borderRadius: '16px',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '16px',
                                        borderLeft: isResolved ? '4px solid #10b981' : '4px solid #f59e0b'
                                    }}
                                >
                                    {/* Top Row: Subject, Course & Status */}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <span style={{
                                                fontSize: '0.75rem',
                                                padding: '3px 10px',
                                                borderRadius: '20px',
                                                background: 'rgba(99, 102, 241, 0.15)',
                                                border: '1px solid rgba(99, 102, 241, 0.3)',
                                                color: '#a5b4fc',
                                                fontWeight: '700'
                                            }}>
                                                {doubt.subject}
                                            </span>
                                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                                {doubt.course_title}
                                            </span>
                                            {doubt.is_public_faq && (
                                                <span style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', fontWeight: 'bold' }}>
                                                    ⭐ Batch FAQ
                                                </span>
                                            )}
                                        </div>

                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <span style={{
                                                fontSize: '0.75rem',
                                                padding: '4px 12px',
                                                borderRadius: '6px',
                                                fontWeight: '700',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '6px',
                                                background: isResolved ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                                                color: isResolved ? '#34d399' : '#fbbf24',
                                                border: '1px solid',
                                                borderColor: isResolved ? 'rgba(16, 185, 129, 0.3)' : 'rgba(245, 158, 11, 0.3)'
                                            }}>
                                                {isResolved ? <CheckCircle2 size={13} /> : <Clock size={13} />}
                                                {isResolved ? 'Resolved' : 'Waiting for Faculty'}
                                            </span>

                                            {userRole !== 'student' && !isResolved && (
                                                <button 
                                                    onClick={() => {
                                                        setActiveDoubtForResolve(doubt);
                                                        setResolutionNotes('');
                                                    }}
                                                    className="btn-primary"
                                                    style={{ padding: '6px 14px', fontSize: '0.8rem' }}
                                                >
                                                    Resolve & Answer
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {/* Question Title & Description */}
                                    <div>
                                        <h3 style={{ fontSize: '1.15rem', fontWeight: '700', marginBottom: '8px', color: '#f8fafc' }}>
                                            {doubt.title}
                                        </h3>
                                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.6' }}>
                                            {doubt.description}
                                        </p>

                                        {doubt.attachment_url && (
                                            <div style={{ marginTop: '10px' }}>
                                                <a 
                                                    href={doubt.attachment_url} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer"
                                                    style={{ fontSize: '0.8rem', color: '#38bdf8', textDecoration: 'underline' }}
                                                >
                                                    View Attached Diagram / Equation Sheet
                                                </a>
                                            </div>
                                        )}
                                    </div>

                                    {/* Faculty Resolution Section */}
                                    {isResolved && doubt.resolution_notes && (
                                        <div style={{
                                            background: 'rgba(16, 185, 129, 0.06)',
                                            border: '1px solid rgba(16, 185, 129, 0.25)',
                                            borderRadius: '12px',
                                            padding: '16px 20px',
                                            marginTop: '6px'
                                        }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }} />
                                                <span style={{ fontSize: '0.8rem', fontWeight: '700', color: '#34d399' }}>
                                                    Faculty Explanation {doubt.teacher_first_name ? `by ${doubt.teacher_first_name} ${doubt.teacher_last_name}` : ''}:
                                                </span>
                                            </div>
                                            <p style={{ color: '#e2e8f0', fontSize: '0.88rem', lineHeight: '1.6', margin: 0 }}>
                                                {doubt.resolution_notes}
                                            </p>
                                        </div>
                                    )}

                                    {/* Footer Info */}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: '12px' }}>
                                        <span>Asked by: {doubt.student_first_name} {doubt.student_last_name}</span>
                                        <span>Submitted: {new Date(doubt.created_at).toLocaleDateString()}</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Modal: Ask a Doubt */}
            {isAskModalOpen && (
                <ModalPortal onClose={() => setIsAskModalOpen(false)}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#f8fafc', marginBottom: '4px' }}>
                                Submit a Doubt to Faculty
                            </h3>
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                Describe your academic question with full details. Our subject mentors will respond directly.
                            </p>
                        </div>

                        <form onSubmit={handleCreateDoubt} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Subject</label>
                                    <select 
                                        className="glass-input"
                                        value={doubtSubject}
                                        onChange={(e) => setDoubtSubject(e.target.value)}
                                    >
                                        <option value="Physics">Physics</option>
                                        <option value="Chemistry">Chemistry</option>
                                        <option value="Mathematics">Mathematics</option>
                                        <option value="Biology">Biology</option>
                                        <option value="General">General Doubt</option>
                                    </select>
                                </div>

                                <div>
                                    <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Related Course</label>
                                    <select 
                                        className="glass-input"
                                        value={doubtCourseId}
                                        onChange={(e) => setDoubtCourseId(e.target.value)}
                                        required
                                    >
                                        {courses.map(c => (
                                            <option key={c.id} value={c.id}>{c.title}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Question Title</label>
                                <input 
                                    type="text"
                                    className="glass-input"
                                    required
                                    placeholder="e.g. Trouble understanding Gauss Law cylinder integration"
                                    value={doubtTitle}
                                    onChange={(e) => setDoubtTitle(e.target.value)}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Question Details / Steps Tried</label>
                                <textarea 
                                    className="glass-input"
                                    rows={4}
                                    required
                                    placeholder="Explain where you are stuck or what formulas you used..."
                                    value={doubtDescription}
                                    onChange={(e) => setDoubtDescription(e.target.value)}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Attachment / Diagram URL (Optional)</label>
                                <input 
                                    type="url"
                                    className="glass-input"
                                    placeholder="https://example.com/question-screenshot.jpg"
                                    value={doubtAttachment}
                                    onChange={(e) => setDoubtAttachment(e.target.value)}
                                />
                            </div>

                            <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                                <button type="submit" className="btn-primary" style={{ flex: 1, padding: '12px' }} disabled={isSubmitting}>
                                    {isSubmitting ? 'Submitting...' : 'Post Question to Mentor'}
                                </button>
                                <button type="button" onClick={() => setIsAskModalOpen(false)} className="btn-secondary" style={{ flex: 1, padding: '12px' }}>
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </ModalPortal>
            )}

            {/* Modal: Teacher Resolve Doubt */}
            {activeDoubtForResolve && (
                <ModalPortal onClose={() => setActiveDoubtForResolve(null)}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#f8fafc', marginBottom: '4px' }}>
                                Provide Faculty Solution
                            </h3>
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                Answering: <strong>{activeDoubtForResolve.title}</strong>
                            </p>
                        </div>

                        <form onSubmit={handleResolveDoubt} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                                    Step-by-Step Solution & Remarks
                                </label>
                                <textarea 
                                    className="glass-input"
                                    rows={6}
                                    required
                                    placeholder="Write your explanation, intermediate formula derivations, or final answer..."
                                    value={resolutionNotes}
                                    onChange={(e) => setResolutionNotes(e.target.value)}
                                />
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <input 
                                    type="checkbox"
                                    id="publicFaqCheck"
                                    checked={isPublicFaq}
                                    onChange={(e) => setIsPublicFaq(e.target.checked)}
                                    style={{ accentColor: '#10b981', width: '16px', height: '16px' }}
                                />
                                <label htmlFor="publicFaqCheck" style={{ fontSize: '0.85rem', color: '#f8fafc', cursor: 'pointer' }}>
                                    Publish this solution to Academy FAQ Library (visible to all students)
                                </label>
                            </div>

                            <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                                <button type="submit" className="btn-primary" style={{ flex: 1, padding: '12px', background: 'linear-gradient(135deg, #10b981, #059669)' }} disabled={isResolving}>
                                    {isResolving ? 'Resolving...' : 'Publish Solution'}
                                </button>
                                <button type="button" onClick={() => setActiveDoubtForResolve(null)} className="btn-secondary" style={{ flex: 1, padding: '12px' }}>
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </ModalPortal>
            )}
        </SidebarLayout>
    );
}
