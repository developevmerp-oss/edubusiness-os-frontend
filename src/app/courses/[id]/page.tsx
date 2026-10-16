'use client';

import { useState, useEffect, use } from 'react';
import SidebarLayout from '../../../components/SidebarLayout';
import { apiRequest } from '../../../utils/api';
import { 
    Folder, 
    Video, 
    FileText, 
    Link as LinkIcon, 
    Plus, 
    Trash, 
    ChevronDown, 
    ChevronRight,
    PlayCircle,
    Sparkles,
    Award,
    ShieldCheck,
    Lock,
    EyeOff
} from 'lucide-react';
import Link from 'next/link';

interface CourseDetailPageProps {
    params: Promise<{ id: string }>;
}

export default function CourseDetailPage({ params }: CourseDetailPageProps) {
    const { id: courseId } = use(params);

    const [course, setCourse] = useState<any>(null);
    const [sections, setSections] = useState<any[]>([]);
    const [userRole, setUserRole] = useState('');
    const [userProfile, setUserProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [antiPiracyAlert, setAntiPiracyAlert] = useState('');

    // Toggle Section state
    const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

    // Active material selected for viewing/playback
    const [activeMaterial, setActiveMaterial] = useState<any>(null);

    // Form inputs
    const [isCreatingSection, setIsCreatingSection] = useState(false);
    const [sectionTitle, setSectionTitle] = useState('');

    const [activeSectionForMaterial, setActiveSectionForMaterial] = useState<string | null>(null);
    const [materialTitle, setMaterialTitle] = useState('');
    const [materialType, setMaterialType] = useState<'video' | 'pdf' | 'notes' | 'link'>('video');
    const [materialUrl, setMaterialUrl] = useState('');

    // Dynamic DRM Watermark positions
    const [watermarkPos, setWatermarkPos] = useState({ top: '25%', left: '25%' });
    const [currentTimeStamp, setCurrentTimeStamp] = useState('');

    useEffect(() => {
        const moveInterval = setInterval(() => {
            const topVal = Math.floor(Math.random() * 65) + 12;
            const leftVal = Math.floor(Math.random() * 55) + 12;
            setWatermarkPos({ top: `${topVal}%`, left: `${leftVal}%` });
            setCurrentTimeStamp(new Date().toLocaleTimeString('en-US', { hour12: false }));
        }, 4000);

        setCurrentTimeStamp(new Date().toLocaleTimeString('en-US', { hour12: false }));

        return () => clearInterval(moveInterval);
    }, []);

    useEffect(() => {
        const storedUser = localStorage.getItem('user_profile');
        if (storedUser) {
            try {
                const parsed = JSON.parse(storedUser);
                setUserRole(parsed.role);
                setUserProfile(parsed);
            } catch (e) {}
        }
        fetchCourseAndSyllabus();

        // Anti-screen capture / DevTools deterrence listener
        const handleKeyDown = (e: KeyboardEvent) => {
            if (
                e.key === 'PrintScreen' ||
                (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'C' || e.key === 'J')) ||
                (e.ctrlKey && e.key === 'u')
            ) {
                setAntiPiracyAlert('Screen capture and inspection are prohibited by DRM security protection.');
                setTimeout(() => setAntiPiracyAlert(''), 4500);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [courseId]);

    const fetchCourseAndSyllabus = async () => {
        setLoading(true);
        setError('');
        try {
            const courseData = await apiRequest(`/api/courses/${courseId}`);
            setCourse(courseData.course);

            const sectionsData = await apiRequest(`/api/lms/courses/${courseId}/sections`);
            setSections(sectionsData.sections);

            // Expand all sections by default
            const initialExpanded: Record<string, boolean> = {};
            sectionsData.sections.forEach((sec: any) => {
                initialExpanded[sec.id] = true;
            });
            setExpandedSections(initialExpanded);

            // Auto-select first video or material if exists
            if (sectionsData.sections.length > 0 && sectionsData.sections[0].materials.length > 0) {
                setActiveMaterial(sectionsData.sections[0].materials[0]);
            }
        } catch (err: any) {
            setError(err.message || 'Failed to load course details.');
        } finally {
            setLoading(false);
        }
    };

    const toggleSection = (sectionId: string) => {
        setExpandedSections(prev => ({
            ...prev,
            [sectionId]: !prev[sectionId]
        }));
    };

    const handleCreateSection = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await apiRequest(`/api/lms/courses/${courseId}/sections`, {
                method: 'POST',
                body: JSON.stringify({ title: sectionTitle })
            });
            setSectionTitle('');
            setIsCreatingSection(false);
            fetchCourseAndSyllabus();
        } catch (err: any) {
            alert(err.message || 'Failed to create section.');
        }
    };

    const handleAddMaterial = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await apiRequest(`/api/lms/courses/sections/${activeSectionForMaterial}/materials`, {
                method: 'POST',
                body: JSON.stringify({
                    title: materialTitle,
                    type: materialType,
                    url: materialUrl
                })
            });
            setMaterialTitle('');
            setMaterialUrl('');
            setActiveSectionForMaterial(null);
            fetchCourseAndSyllabus();
        } catch (err: any) {
            alert(err.message || 'Failed to add material.');
        }
    };

    const handleDeleteMaterial = async (materialId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm('Are you sure you want to delete this content item?')) return;
        try {
            await apiRequest(`/api/lms/courses/sections/materials/${materialId}`, {
                method: 'DELETE'
            });
            if (activeMaterial?.id === materialId) {
                setActiveMaterial(null);
            }
            fetchCourseAndSyllabus();
        } catch (err: any) {
            alert(err.message || 'Failed to delete material.');
        }
    };

    const getMaterialIcon = (type: string) => {
        switch (type) {
            case 'video': return <Video size={16} />;
            case 'pdf': return <FileText size={16} />;
            case 'notes': return <FileText size={16} />;
            default: return <LinkIcon size={16} />;
        }
    };

    if (loading) {
        return (
            <SidebarLayout>
                <div style={{ color: 'var(--text-secondary)' }}>Loading syllabus syllabus tree...</div>
            </SidebarLayout>
        );
    }

    if (error || !course) {
        return (
            <SidebarLayout>
                <div style={{ color: 'var(--danger)' }}>Error: {error || 'Course not found'}</div>
            </SidebarLayout>
        );
    }

    return (
        <SidebarLayout>
            <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '30px', height: 'calc(100vh - 80px)' }}>
                
                {/* 1. SIDEBAR - Syllabus Outline Tree */}
                <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
                    <div style={{ borderBottom: '1px solid var(--border-glass)', paddingBottom: '16px', marginBottom: '20px' }}>
                        <h2 className="brand-gradient" style={{ fontSize: '1.25rem', fontWeight: '700' }}>
                            {course.title}
                        </h2>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                            Course Outline & Syllabus
                        </span>
                        {userRole === 'student' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
                                <Link 
                                    href={`/courses/${courseId}/tutor`}
                                    className="btn-secondary"
                                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '8px', fontSize: '0.82rem', textDecoration: 'none' }}
                                >
                                    <Sparkles size={14} style={{ color: 'var(--primary)' }} />
                                    Ask AI Tutor
                                </Link>
                                <Link 
                                    href={`/courses/${courseId}/certificate`}
                                    className="btn-secondary"
                                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '8px', fontSize: '0.82rem', textDecoration: 'none' }}
                                >
                                    <Award size={14} style={{ color: 'var(--warning)' }} />
                                    Claim Certificate
                                </Link>
                            </div>
                        )}
                    </div>

                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {sections.map((section) => (
                            <div key={section.id}>
                                {/* Section Header */}
                                <div 
                                    onClick={() => toggleSection(section.id)}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        padding: '8px 12px',
                                        borderRadius: '8px',
                                        background: 'rgba(255,255,255,0.02)',
                                        border: '1px solid var(--border-glass)',
                                        cursor: 'pointer',
                                        marginBottom: '6px'
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                                        {expandedSections[section.id] ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                                        <span style={{ fontSize: '0.9rem', fontWeight: '600', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                                            {section.title}
                                        </span>
                                    </div>
                                    {userRole === 'admin' && (
                                        <button 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setActiveSectionForMaterial(section.id);
                                            }}
                                            style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', display: 'flex' }}
                                        >
                                            <Plus size={14} />
                                        </button>
                                    )}
                                </div>

                                {/* Section Materials */}
                                {expandedSections[section.id] && (
                                    <div style={{ paddingLeft: '16px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                        {section.materials.map((mat: any) => (
                                            <div 
                                                key={mat.id}
                                                onClick={() => setActiveMaterial(mat)}
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'space-between',
                                                    padding: '8px 12px',
                                                    borderRadius: '6px',
                                                    cursor: 'pointer',
                                                    fontSize: '0.85rem',
                                                    background: activeMaterial?.id === mat.id ? 'rgba(var(--primary-rgb), 0.1)' : 'transparent',
                                                    color: activeMaterial?.id === mat.id ? 'var(--text-primary)' : 'var(--text-secondary)'
                                                }}
                                            >
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                                                    {getMaterialIcon(mat.type)}
                                                    <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{mat.title}</span>
                                                </div>
                                                {userRole === 'admin' && (
                                                    <button 
                                                        onClick={(e) => handleDeleteMaterial(mat.id, e)}
                                                        style={{ background: 'none', border: 'none', color: 'rgba(239, 68, 68, 0.6)', cursor: 'pointer' }}
                                                    >
                                                        <Trash size={12} />
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    {userRole === 'admin' && (
                        <button 
                            onClick={() => setIsCreatingSection(true)}
                            className="btn-secondary" 
                            style={{ width: '100%', padding: '10px', fontSize: '0.85rem', marginTop: '20px' }}
                        >
                            <Plus size={16} />
                            Add Chapter
                        </button>
                    )}
                </div>

                {/* 2. MAIN WORKSPACE - Material Media Display Player */}
                <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                    {activeMaterial ? (
                        <div className="glass-panel" style={{ flex: 1, padding: '32px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-glass)', paddingBottom: '16px' }}>
                                <div>
                                    <span style={{ textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: '700', color: 'var(--primary)', display: 'block', marginBottom: '4px' }}>
                                        TYPE: {activeMaterial.type.toUpperCase()}
                                    </span>
                                    <h2 style={{ fontSize: '1.5rem', fontWeight: '700' }}>{activeMaterial.title}</h2>
                                </div>
                                
                                {activeMaterial.type === 'video' && (
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        padding: '6px 12px',
                                        background: 'rgba(99, 102, 241, 0.12)',
                                        border: '1px solid rgba(99, 102, 241, 0.3)',
                                        borderRadius: '20px',
                                        fontSize: '0.75rem',
                                        fontWeight: '600',
                                        color: '#818cf8'
                                    }}>
                                        <ShieldCheck size={14} style={{ color: '#6366f1' }} />
                                        <span>DRM Security Active • Dynamic Watermark</span>
                                    </div>
                                )}
                            </div>

                            {/* Anti-piracy alert banner */}
                            {antiPiracyAlert && (
                                <div style={{
                                    padding: '10px 16px',
                                    borderRadius: '8px',
                                    background: 'rgba(239, 68, 68, 0.15)',
                                    border: '1px solid rgba(239, 68, 68, 0.4)',
                                    color: '#f87171',
                                    fontSize: '0.85rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    animation: 'pulse 1.5s infinite'
                                }}>
                                    <Lock size={15} />
                                    <span>{antiPiracyAlert}</span>
                                </div>
                            )}

                            {/* Dynamic Player Element */}
                            <div 
                                onContextMenu={(e) => {
                                    e.preventDefault();
                                    setAntiPiracyAlert('Right click is disabled by DRM security protection.');
                                    setTimeout(() => setAntiPiracyAlert(''), 3000);
                                }}
                                style={{ 
                                    flex: 1, 
                                    background: '#090a10', 
                                    border: '1px solid var(--border-glass)', 
                                    borderRadius: '12px', 
                                    overflow: 'hidden', 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    justifyContent: 'center', 
                                    position: 'relative',
                                    userSelect: 'none'
                                }}
                            >
                                {activeMaterial.type === 'video' ? (
                                    <>
                                        <video 
                                            key={activeMaterial.id}
                                            controls 
                                            controlsList="nodownload"
                                            disablePictureInPicture
                                            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                                            src={activeMaterial.url}
                                        />

                                        {/* 1. Subtle Multi-point Background DRM Grid (Prevents Cropping) */}
                                        <div style={{
                                            position: 'absolute',
                                            top: 0, left: 0, right: 0, bottom: 0,
                                            display: 'grid',
                                            gridTemplateColumns: 'repeat(3, 1fr)',
                                            gridTemplateRows: 'repeat(3, 1fr)',
                                            pointerEvents: 'none',
                                            opacity: 0.05,
                                            zIndex: 8,
                                            padding: '20px'
                                        }}>
                                            {[...Array(9)].map((_, i) => (
                                                <div key={i} style={{ fontSize: '0.7rem', transform: 'rotate(-20deg)', color: '#ffffff' }}>
                                                    {userProfile?.email || 'student@abc.com'} • {userProfile?.phone || '+91 98765 43210'}
                                                </div>
                                            ))}
                                        </div>

                                        {/* 2. Primary Bouncing Dynamic Watermark (Classplus Standard) */}
                                        <div style={{
                                            position: 'absolute',
                                            top: watermarkPos.top,
                                            left: watermarkPos.left,
                                            pointerEvents: 'none',
                                            background: 'rgba(15, 23, 42, 0.45)',
                                            backdropFilter: 'blur(3px)',
                                            border: '1px solid rgba(255, 255, 255, 0.1)',
                                            borderRadius: '6px',
                                            padding: '4px 10px',
                                            color: 'rgba(255, 255, 255, 0.35)',
                                            fontSize: '0.8rem',
                                            fontWeight: '600',
                                            fontFamily: 'monospace',
                                            zIndex: 10,
                                            whiteSpace: 'nowrap',
                                            userSelect: 'none',
                                            transition: 'all 1.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                            boxShadow: '0 2px 10px rgba(0,0,0,0.3)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px'
                                        }}>
                                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }} />
                                            <span>
                                                {userProfile ? `${userProfile.first_name || 'Student'} • ${userProfile.phone || userProfile.email}` : 'Amit Sharma • +91 98765 43210'} 
                                            </span>
                                            <span style={{ opacity: 0.6 }}>[{currentTimeStamp}]</span>
                                        </div>
                                    </>
                                ) : activeMaterial.type === 'pdf' ? (
                                    <iframe 
                                        src={activeMaterial.url}
                                        style={{ width: '100%', height: '100%', border: 'none' }}
                                    />
                                ) : (
                                    <div style={{ textAlign: 'center', padding: '40px' }}>
                                        <PlayCircle size={64} style={{ color: 'var(--primary)', marginBottom: '16px', opacity: 0.8 }} />
                                        <h4 style={{ marginBottom: '8px' }}>External Syllabus Resource</h4>
                                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '24px' }}>
                                            This content item is hosted externally.
                                        </p>
                                        <a href={activeMaterial.url} target="_blank" rel="noopener noreferrer" className="btn-primary">
                                            Open Resource
                                        </a>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="glass-panel" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                            Select a material unit from the syllabus list to begin learning.
                        </div>
                    )}
                </div>
            </div>

            {/* Create Section Modal */}
            {isCreatingSection && (
                <div style={{
                    position: 'fixed',
                    top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.6)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 100
                }}>
                    <div className="glass-panel" style={{ width: '400px', padding: '30px', borderRadius: '16px' }}>
                        <h3>Add Syllabus Chapter</h3>
                        <form onSubmit={handleCreateSection} style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Chapter Title</label>
                                <input 
                                    type="text" 
                                    className="glass-input" 
                                    required 
                                    value={sectionTitle}
                                    onChange={(e) => setSectionTitle(e.target.value)}
                                    placeholder="e.g. Chapter 1: Introduction"
                                />
                            </div>
                            <div style={{ display: 'flex', gap: '12px' }}>
                                <button type="submit" className="btn-primary" style={{ flex: 1 }}>Submit</button>
                                <button type="button" className="btn-secondary" style={{ flex: 1 }} onClick={() => setIsCreatingSection(false)}>Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Add Material Modal */}
            {activeSectionForMaterial && (
                <div style={{
                    position: 'fixed',
                    top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.6)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 100
                }}>
                    <div className="glass-panel" style={{ width: '400px', padding: '30px', borderRadius: '16px' }}>
                        <h3>Add Syllabus Content Material</h3>
                        <form onSubmit={handleAddMaterial} style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Title</label>
                                <input 
                                    type="text" 
                                    className="glass-input" 
                                    required 
                                    value={materialTitle}
                                    onChange={(e) => setMaterialTitle(e.target.value)}
                                    placeholder="e.g. Coulomb's Law Lecture Video"
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Content Type</label>
                                <select 
                                    className="glass-input" 
                                    value={materialType} 
                                    onChange={(e) => setMaterialType(e.target.value as any)}
                                >
                                    <option value="video">Lecture Video URL</option>
                                    <option value="pdf">PDF File Link</option>
                                    <option value="notes">Notes / Document Link</option>
                                    <option value="link">External Website Link</option>
                                </select>
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Resource URL</label>
                                <input 
                                    type="url" 
                                    className="glass-input" 
                                    required 
                                    value={materialUrl}
                                    onChange={(e) => setMaterialUrl(e.target.value)}
                                    placeholder="https://..."
                                />
                            </div>
                            <div style={{ display: 'flex', gap: '12px' }}>
                                <button type="submit" className="btn-primary" style={{ flex: 1 }}>Submit</button>
                                <button type="button" className="btn-secondary" style={{ flex: 1 }} onClick={() => setActiveSectionForMaterial(null)}>Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </SidebarLayout>
    );
}
