'use client';

import { useState, useEffect } from 'react';
import SidebarLayout from '../../components/SidebarLayout';
import { apiRequest } from '../../utils/api';
import Link from 'next/link';
import { 
    ShoppingBag, BookOpen, Search, Sparkles, Layers, 
    FileText, Download, CheckCircle, ArrowRight, ShieldCheck, Tag
} from 'lucide-react';

export default function StoreCatalogPage() {
    const [activeTab, setActiveTab] = useState<'courses' | 'bundles' | 'digital'>('courses');
    const [courses, setCourses] = useState<any[]>([]);
    const [bundles, setBundles] = useState<any[]>([]);
    const [digitalProducts, setDigitalProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [actionMsg, setActionMsg] = useState('');
    const [buyingId, setBuyingId] = useState<string | null>(null);
    const [userRole, setUserRole] = useState('');

    // Creation modals state
    const [isCreatingBundle, setIsCreatingBundle] = useState(false);
    const [bundleTitle, setBundleTitle] = useState('');
    const [bundleDesc, setBundleDesc] = useState('');
    const [bundlePrice, setBundlePrice] = useState(4999);
    const [bundleOrigPrice, setBundleOrigPrice] = useState(7999);

    const [isCreatingDigital, setIsCreatingDigital] = useState(false);
    const [digitalTitle, setDigitalTitle] = useState('');
    const [digitalDesc, setDigitalDesc] = useState('');
    const [digitalCategory, setDigitalCategory] = useState('Formula Notes');
    const [digitalPrice, setDigitalPrice] = useState(199);
    const [digitalFileUrl, setDigitalFileUrl] = useState('https://scaloy.com/samples/notes.pdf');

    useEffect(() => {
        const storedUser = localStorage.getItem('user_profile');
        if (storedUser) {
            try {
                setUserRole(JSON.parse(storedUser).role);
            } catch (e) {}
        }
        fetchAllCatalog();
    }, []);

    const handleCreateBundle = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const incCourses = courses.slice(0, 3).map(c => ({ id: c.id, title: c.title }));
            await apiRequest('/api/store/bundles', {
                method: 'POST',
                body: JSON.stringify({
                    title: bundleTitle,
                    description: bundleDesc,
                    bundlePrice: Number(bundlePrice),
                    originalPrice: Number(bundleOrigPrice),
                    coursesIncluded: incCourses.length > 0 ? incCourses : [{ id: 'core', title: 'Full Curriculum Bundle' }]
                })
            });
            setIsCreatingBundle(false);
            setBundleTitle('');
            setBundleDesc('');
            setActionMsg('Combo Super Pack Bundle created and published successfully!');
            fetchAllCatalog();
            setTimeout(() => setActionMsg(''), 5000);
        } catch (err: any) {
            alert(err.message || 'Failed to create bundle.');
        }
    };

    const handleCreateDigital = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await apiRequest('/api/store/digital-products', {
                method: 'POST',
                body: JSON.stringify({
                    title: digitalTitle,
                    description: digitalDesc,
                    category: digitalCategory,
                    price: Number(digitalPrice),
                    fileUrl: digitalFileUrl
                })
            });
            setIsCreatingDigital(false);
            setDigitalTitle('');
            setDigitalDesc('');
            setActionMsg('Digital Product / Notes published to store catalog successfully!');
            fetchAllCatalog();
            setTimeout(() => setActionMsg(''), 5000);
        } catch (err: any) {
            alert(err.message || 'Failed to publish digital product.');
        }
    };

    const fetchAllCatalog = async () => {
        setLoading(true);
        setError('');
        try {
            const coursesData = await apiRequest('/api/store/courses').catch(() => ({ courses: [] }));
            setCourses(coursesData.courses || []);

            const bundlesData = await apiRequest('/api/store/bundles').catch(() => ({ bundles: [] }));
            setBundles(bundlesData.bundles || []);

            const digitalData = await apiRequest('/api/store/digital-products').catch(() => ({ products: [] }));
            setDigitalProducts(digitalData.products || []);
        } catch (err: any) {
            setError(err.message || 'Failed to load store catalog.');
        } finally {
            setLoading(false);
        }
    };

    const handleBuyBundle = async (bundleId: string, title: string) => {
        if (!confirm(`Enroll into "${title}" Super Pack bundle?`)) return;
        setBuyingId(bundleId);
        try {
            const res = await apiRequest(`/api/store/bundles/${bundleId}/buy`, {
                method: 'POST'
            });
            setActionMsg(res.message || 'Super Pack Enrolled! Access added to your dashboard.');
            fetchAllCatalog();
            setTimeout(() => setActionMsg(''), 5000);
        } catch (err: any) {
            alert(err.message || 'Failed to purchase bundle.');
        } finally {
            setBuyingId(null);
        }
    };

    const handleBuyDigitalProduct = async (productId: string, title: string) => {
        setBuyingId(productId);
        try {
            const res = await apiRequest(`/api/store/digital-products/${productId}/buy`, {
                method: 'POST'
            });
            setActionMsg(res.message || `Unlocked "${title}"! Ready for instant download.`);
            fetchAllCatalog();
            setTimeout(() => setActionMsg(''), 5000);
        } catch (err: any) {
            alert(err.message || 'Failed to unlock product.');
        } finally {
            setBuyingId(null);
        }
    };

    const filteredCourses = courses.filter(c => 
        c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.description && c.description.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const filteredBundles = bundles.filter(b =>
        b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (b.description && b.description.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const filteredDigital = digitalProducts.filter(d =>
        d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (d.category && d.category.toLowerCase().includes(searchQuery.toLowerCase()))
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
                            Creator Storefront & Digital Marketplace
                        </h1>
                        <p style={{ color: 'var(--text-secondary)' }}>
                            Full-length video courses, discounted super pack bundles, and high-yield PDF formula cheat sheets.
                        </p>
                    </div>

                    {/* Search Field */}
                    <div style={{ position: 'relative', width: '280px' }}>
                        <Search size={16} style={{ position: 'absolute', left: '14px', top: '15px', color: 'var(--text-muted)' }} />
                        <input 
                            type="text" 
                            className="glass-input" 
                            placeholder="Search catalog..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={{ paddingLeft: '40px' }}
                        />
                    </div>
                </div>

                {/* Notifications */}
                {error && (
                    <div style={{ padding: '12px 16px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#fca5a5', borderRadius: '8px', fontSize: '0.9rem' }}>
                        ⚠️ {error}
                    </div>
                )}
                {actionMsg && (
                    <div style={{ padding: '12px 16px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', color: '#a7f3d0', borderRadius: '8px', fontSize: '0.9rem' }}>
                        ✓ {actionMsg}
                    </div>
                )}

                {/* Store Catalog Tabs */}
                <div style={{
                    display: 'flex',
                    background: 'rgba(255, 255, 255, 0.03)',
                    padding: '6px',
                    borderRadius: '12px',
                    border: '1px solid var(--border-glass)',
                    width: 'fit-content',
                    gap: '6px'
                }}>
                    <button
                        onClick={() => setActiveTab('courses')}
                        style={{
                            padding: '10px 18px',
                            borderRadius: '8px',
                            border: 'none',
                            fontSize: '0.88rem',
                            fontWeight: '600',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            background: activeTab === 'courses' ? 'var(--primary)' : 'transparent',
                            color: activeTab === 'courses' ? '#fff' : 'var(--text-muted)',
                            transition: 'all 0.2s ease'
                        }}
                    >
                        <BookOpen size={16} /> Individual Courses ({courses.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('bundles')}
                        style={{
                            padding: '10px 18px',
                            borderRadius: '8px',
                            border: 'none',
                            fontSize: '0.88rem',
                            fontWeight: '600',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            background: activeTab === 'bundles' ? 'var(--primary)' : 'transparent',
                            color: activeTab === 'bundles' ? '#fff' : 'var(--text-muted)',
                            transition: 'all 0.2s ease'
                        }}
                    >
                        <Layers size={16} /> Combo Super Packs ({bundles.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('digital')}
                        style={{
                            padding: '10px 18px',
                            borderRadius: '8px',
                            border: 'none',
                            fontSize: '0.88rem',
                            fontWeight: '600',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            background: activeTab === 'digital' ? 'var(--primary)' : 'transparent',
                            color: activeTab === 'digital' ? '#fff' : 'var(--text-muted)',
                            transition: 'all 0.2s ease'
                        }}
                    >
                        <FileText size={16} /> Digital Notes & PDF Booklets ({digitalProducts.length})
                    </button>
                </div>

                {/* Admin Management Action Bar */}
                {(userRole === 'admin' || userRole === 'teacher') && (
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                        {activeTab === 'bundles' && (
                            <button
                                onClick={() => setIsCreatingBundle(!isCreatingBundle)}
                                className="btn-primary"
                                style={{ padding: '8px 16px', fontSize: '0.85rem' }}
                            >
                                {isCreatingBundle ? 'Close Form' : '+ Create Combo Super Pack'}
                            </button>
                        )}
                        {activeTab === 'digital' && (
                            <button
                                onClick={() => setIsCreatingDigital(!isCreatingDigital)}
                                className="btn-primary"
                                style={{ padding: '8px 16px', fontSize: '0.85rem' }}
                            >
                                {isCreatingDigital ? 'Close Form' : '+ Publish Digital Notes / PDF'}
                            </button>
                        )}
                    </div>
                )}

                {/* Create Bundle Form */}
                {isCreatingBundle && (
                    <form onSubmit={handleCreateBundle} style={{
                        background: 'rgba(255, 255, 255, 0.02)',
                        border: '1px solid var(--border-glass)',
                        borderRadius: '16px',
                        padding: '24px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '16px'
                    }}>
                        <h3 style={{ fontSize: '1.15rem', fontWeight: '700' }}>Create New Combo Super Pack Bundle</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Bundle Title</label>
                                <input 
                                    type="text" 
                                    className="glass-input" 
                                    placeholder="e.g. PCM Entrance Super Pack 2026"
                                    required 
                                    value={bundleTitle}
                                    onChange={e => setBundleTitle(e.target.value)}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Combo Discounted Price (₹)</label>
                                <input 
                                    type="number" 
                                    className="glass-input" 
                                    required 
                                    value={bundlePrice}
                                    onChange={e => setBundlePrice(Number(e.target.value))}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Original Separate Total (₹)</label>
                                <input 
                                    type="number" 
                                    className="glass-input" 
                                    required 
                                    value={bundleOrigPrice}
                                    onChange={e => setBundleOrigPrice(Number(e.target.value))}
                                />
                            </div>
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Bundle Description</label>
                            <textarea 
                                className="glass-input" 
                                rows={2}
                                placeholder="Describe all curriculum and bonus items included in this super pack..."
                                value={bundleDesc}
                                onChange={e => setBundleDesc(e.target.value)}
                            />
                        </div>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button type="submit" className="btn-primary" style={{ padding: '8px 16px', fontSize: '0.85rem' }}>Publish Super Pack Bundle</button>
                            <button type="button" onClick={() => setIsCreatingBundle(false)} className="btn-secondary" style={{ padding: '8px 16px', fontSize: '0.85rem' }}>Cancel</button>
                        </div>
                    </form>
                )}

                {/* Create Digital Product Form */}
                {isCreatingDigital && (
                    <form onSubmit={handleCreateDigital} style={{
                        background: 'rgba(255, 255, 255, 0.02)',
                        border: '1px solid var(--border-glass)',
                        borderRadius: '16px',
                        padding: '24px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '16px'
                    }}>
                        <h3 style={{ fontSize: '1.15rem', fontWeight: '700' }}>Publish Digital Product / Formula Notes</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Product Title</label>
                                <input 
                                    type="text" 
                                    className="glass-input" 
                                    placeholder="e.g. VIP Handwritten Formula Booklet"
                                    required 
                                    value={digitalTitle}
                                    onChange={e => setDigitalTitle(e.target.value)}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Category</label>
                                <select 
                                    className="glass-input" 
                                    value={digitalCategory}
                                    onChange={e => setDigitalCategory(e.target.value)}
                                >
                                    <option value="Formula Notes">Formula Notes</option>
                                    <option value="Question Bank">Question Bank</option>
                                    <option value="Test Series PDF">Test Series PDF</option>
                                    <option value="Cheat Sheet">Cheat Sheet</option>
                                </select>
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Price (₹)</label>
                                <input 
                                    type="number" 
                                    className="glass-input" 
                                    required 
                                    value={digitalPrice}
                                    onChange={e => setDigitalPrice(Number(e.target.value))}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Downloadable PDF URL</label>
                                <input 
                                    type="url" 
                                    className="glass-input" 
                                    placeholder="https://.../notes.pdf"
                                    required 
                                    value={digitalFileUrl}
                                    onChange={e => setDigitalFileUrl(e.target.value)}
                                />
                            </div>
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Description</label>
                            <textarea 
                                className="glass-input" 
                                rows={2}
                                placeholder="Summary of what is covered in this document..."
                                value={digitalDesc}
                                onChange={e => setDigitalDesc(e.target.value)}
                            />
                        </div>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button type="submit" className="btn-primary" style={{ padding: '8px 16px', fontSize: '0.85rem' }}>Publish Digital Product</button>
                            <button type="button" onClick={() => setIsCreatingDigital(false)} className="btn-secondary" style={{ padding: '8px 16px', fontSize: '0.85rem' }}>Cancel</button>
                        </div>
                    </form>
                )}

                {/* ========================================================
                    TAB 1: INDIVIDUAL COURSES
                   ======================================================== */}
                {activeTab === 'courses' && (
                    <div>
                        {filteredCourses.length === 0 ? (
                            <div className="glass-panel" style={{ textAlign: 'center', padding: '80px 0', color: 'var(--text-muted)' }}>
                                <ShoppingBag size={48} style={{ marginBottom: '16px', opacity: 0.3 }} />
                                <p style={{ fontSize: '1.05rem', fontWeight: '600' }}>No courses matching your search.</p>
                            </div>
                        ) : (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))', gap: '26px' }}>
                                {filteredCourses.map((course) => (
                                    <div key={course.id} className="glass-panel" style={{
                                        padding: '24px',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        justifyContent: 'space-between',
                                        minHeight: '290px',
                                        borderRadius: '16px',
                                        background: 'linear-gradient(135deg, rgba(255,255,255,0.01) 0%, rgba(255,255,255,0.03) 100%)'
                                    }}>
                                        <div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                                                <h3 style={{ fontSize: '1.2rem', fontWeight: '700', color: 'var(--text-primary)' }}>{course.title}</h3>
                                                <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.72rem', color: 'var(--primary)', fontWeight: '700', background: 'rgba(99,102,241,0.1)', padding: '3px 8px', borderRadius: '6px' }}>
                                                    <Sparkles size={12} /> Best Seller
                                                </span>
                                            </div>
                                            
                                            <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', lineHeight: '1.5', marginBottom: '20px', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                                {course.description || 'Comprehensive syllabus modules, curated chapter notes, and interactive exams.'}
                                            </p>

                                            <div style={{ display: 'flex', gap: '16px', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
                                                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                    <BookOpen size={14} /> {course.chapters_count} Chapters
                                                </span>
                                            </div>
                                        </div>

                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '16px' }}>
                                            <span style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--text-primary)' }}>
                                                {parseFloat(course.price) > 0 ? `₹${parseFloat(course.price).toLocaleString()}` : 'Free'}
                                            </span>
                                            <Link 
                                                href={`/store/${course.id}`}
                                                className="btn-primary"
                                                style={{ padding: '8px 18px', fontSize: '0.85rem', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px' }}
                                            >
                                                View Course <ArrowRight size={14} />
                                            </Link>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* ========================================================
                    TAB 2: COMBO SUPER PACK BUNDLES
                   ======================================================== */}
                {activeTab === 'bundles' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        {filteredBundles.length === 0 ? (
                            <div className="glass-panel" style={{ textAlign: 'center', padding: '80px 0', color: 'var(--text-muted)' }}>
                                <Layers size={48} style={{ marginBottom: '16px', opacity: 0.3 }} />
                                <p style={{ fontSize: '1.05rem', fontWeight: '600' }}>No combo bundles published yet.</p>
                            </div>
                        ) : (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '26px' }}>
                                {filteredBundles.map((b) => {
                                    const coursesIncluded = typeof b.courses_included === 'string' ? JSON.parse(b.courses_included) : b.courses_included;
                                    const savings = parseFloat(b.original_price) - parseFloat(b.bundle_price);

                                    return (
                                        <div key={b.id} className="glass-panel" style={{
                                            padding: '28px',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            justifyContent: 'space-between',
                                            borderRadius: '20px',
                                            border: '1px solid rgba(99, 102, 241, 0.3)',
                                            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%)',
                                            position: 'relative'
                                        }}>
                                            <div style={{ position: 'absolute', top: '16px', right: '16px', background: '#10b981', color: '#000', fontSize: '0.75rem', fontWeight: '800', padding: '4px 10px', borderRadius: '12px' }}>
                                                {b.discount_percentage}% SAVINGS
                                            </div>

                                            <div>
                                                <span style={{ fontSize: '0.78rem', color: 'var(--primary)', fontWeight: '700', textTransform: 'uppercase' }}>
                                                    All-In-One Super Pack
                                                </span>
                                                <h3 style={{ fontSize: '1.35rem', fontWeight: '800', margin: '6px 0 12px 0' }}>{b.title}</h3>
                                                <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: '1.5', marginBottom: '20px' }}>
                                                    {b.description}
                                                </p>

                                                {/* Included Courses Box */}
                                                <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-glass)', borderRadius: '12px', padding: '14px', marginBottom: '20px' }}>
                                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>
                                                        Includes {coursesIncluded.length} Complete Courses:
                                                    </span>
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                                        {coursesIncluded.map((c: any, idx: number) => (
                                                            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', color: 'var(--text-primary)' }}>
                                                                <CheckCircle size={14} style={{ color: '#34d399', flexShrink: 0 }} />
                                                                <span>{c.title}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>

                                            <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '16px' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                                                    <div>
                                                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                                                            <span style={{ fontSize: '1.6rem', fontWeight: '800', color: '#34d399' }}>
                                                                ₹{parseFloat(b.bundle_price).toLocaleString()}
                                                            </span>
                                                            <span style={{ fontSize: '0.95rem', color: 'var(--text-muted)', textDecoration: 'line-through' }}>
                                                                ₹{parseFloat(b.original_price).toLocaleString()}
                                                            </span>
                                                        </div>
                                                        <span style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: '600' }}>
                                                            Save ₹{savings.toLocaleString()} with bundle
                                                        </span>
                                                    </div>
                                                </div>

                                                <button
                                                    onClick={() => handleBuyBundle(b.id, b.title)}
                                                    disabled={buyingId === b.id}
                                                    className="btn-primary"
                                                    style={{ width: '100%', padding: '12px', fontSize: '0.9rem', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                                                >
                                                    <Sparkles size={16} />
                                                    {buyingId === b.id ? 'Enrolling in All Courses...' : 'Claim Super Pack Bundle'}
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}

                {/* ========================================================
                    TAB 3: DIGITAL NOTES & PDF BOOKLETS
                   ======================================================== */}
                {activeTab === 'digital' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        {filteredDigital.length === 0 ? (
                            <div className="glass-panel" style={{ textAlign: 'center', padding: '80px 0', color: 'var(--text-muted)' }}>
                                <FileText size={48} style={{ marginBottom: '16px', opacity: 0.3 }} />
                                <p style={{ fontSize: '1.05rem', fontWeight: '600' }}>No digital notes published yet.</p>
                            </div>
                        ) : (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '26px' }}>
                                {filteredDigital.map((prod) => (
                                    <div key={prod.id} className="glass-panel" style={{
                                        padding: '24px',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        justifyContent: 'space-between',
                                        minHeight: '290px',
                                        borderRadius: '16px',
                                        background: 'linear-gradient(135deg, rgba(255,255,255,0.01) 0%, rgba(255,255,255,0.03) 100%)'
                                    }}>
                                        <div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                                                <span style={{ fontSize: '0.72rem', color: '#60a5fa', fontWeight: '700', background: 'rgba(96, 165, 250, 0.1)', padding: '3px 8px', borderRadius: '6px' }}>
                                                    {prod.category}
                                                </span>
                                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                                    {prod.downloads_count} downloads
                                                </span>
                                            </div>

                                            <h3 style={{ fontSize: '1.18rem', fontWeight: '700', margin: '8px 0 10px 0', color: 'var(--text-primary)' }}>
                                                {prod.title}
                                            </h3>

                                            <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', lineHeight: '1.5', marginBottom: '16px' }}>
                                                {prod.description}
                                            </p>

                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: '#10b981' }}>
                                                <ShieldCheck size={14} /> DRM Dynamic Student Stamp Watermark
                                            </div>
                                        </div>

                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '16px', marginTop: '16px' }}>
                                            <span style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--text-primary)' }}>
                                                ₹{parseFloat(prod.price).toLocaleString()}
                                            </span>

                                            {prod.is_purchased ? (
                                                <a
                                                    href={prod.file_url}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    style={{
                                                        background: '#10b981',
                                                        color: '#000',
                                                        textDecoration: 'none',
                                                        padding: '8px 16px',
                                                        borderRadius: '8px',
                                                        fontWeight: '700',
                                                        fontSize: '0.85rem',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '6px'
                                                    }}
                                                >
                                                    <Download size={14} /> Download PDF
                                                </a>
                                            ) : (
                                                <button
                                                    onClick={() => handleBuyDigitalProduct(prod.id, prod.title)}
                                                    disabled={buyingId === prod.id}
                                                    className="btn-primary"
                                                    style={{ padding: '8px 16px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}
                                                >
                                                    <Download size={14} /> {buyingId === prod.id ? 'Unlocking...' : 'Buy & Unlock'}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

            </div>
        </SidebarLayout>
    );
}
