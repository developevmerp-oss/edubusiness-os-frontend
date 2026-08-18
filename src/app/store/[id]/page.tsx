'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import SidebarLayout from '../../../components/SidebarLayout';
import ModalPortal from '../../../components/ModalPortal';
import { apiRequest } from '../../../utils/api';
import { 
    Clock, 
    BookOpen, 
    Check, 
    CreditCard, 
    Tag, 
    ShoppingBag, 
    X,
    FileText,
    Video,
    Award
} from 'lucide-react';

interface StoreCourseDetailPageProps {
    params: Promise<{ id: string }>;
}

export default function StoreCourseDetailPage({ params }: StoreCourseDetailPageProps) {
    const { id: courseId } = use(params);
    const router = useRouter();

    const [course, setCourse] = useState<any>(null);
    const [sections, setSections] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Checkout modal states
    const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
    const [couponCode, setCouponCode] = useState('');
    const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
    const [couponError, setCouponError] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    useEffect(() => {
        fetchCourseAndSyllabus();
    }, [courseId]);

    const fetchCourseAndSyllabus = async () => {
        setLoading(true);
        setError('');
        try {
            const courseData = await apiRequest(`/api/courses/${courseId}`);
            setCourse(courseData.course);

            const sectionsData = await apiRequest(`/api/lms/courses/${courseId}/sections`);
            setSections(sectionsData.sections);
        } catch (err: any) {
            setError(err.message || 'Failed to load course store details.');
        } finally {
            setLoading(false);
        }
    };

    const handleApplyCoupon = async () => {
        setCouponError('');
        setAppliedCoupon(null);
        if (!couponCode) return;

        try {
            const data = await apiRequest('/api/store/coupons/validate', {
                method: 'POST',
                body: JSON.stringify({ code: couponCode })
            });
            setAppliedCoupon(data.coupon);
        } catch (err: any) {
            setCouponError(err.message || 'Invalid coupon code.');
        }
    };

    const handleCheckout = async () => {
        setIsProcessing(true);
        try {
            // 1. Create Checkout Order
            const checkoutData = await apiRequest('/api/store/checkout', {
                method: 'POST',
                body: JSON.stringify({
                    courseId,
                    couponCode: appliedCoupon ? appliedCoupon.code : undefined,
                    gateway: 'sandbox'
                })
            });

            const orderId = checkoutData.order.id;

            // 2. Automatically Verify Sandbox Payment
            await apiRequest(`/api/store/checkout/${orderId}/verify`, {
                method: 'POST'
            });

            alert('Checkout transaction complete! You are now enrolled.');
            router.push(`/courses/${courseId}`);
        } catch (err: any) {
            alert(err.message || 'Checkout transaction failed.');
        } finally {
            setIsProcessing(false);
        }
    };

    if (loading) {
        return (
            <SidebarLayout>
                <div style={{ color: 'var(--text-secondary)' }}>Loading landing page...</div>
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

    // Dynamic calculations
    const basePrice = parseFloat(course.price);
    let discountAmount = 0.00;
    if (appliedCoupon) {
        if (appliedCoupon.discount_type === 'percentage') {
            discountAmount = (basePrice * parseFloat(appliedCoupon.discount_value)) / 100;
        } else {
            discountAmount = Math.min(basePrice, parseFloat(appliedCoupon.discount_value));
        }
    }
    const taxedSubtotal = Math.max(0, basePrice - discountAmount);
    const gstTax = taxedSubtotal * 0.18; // 18% GST standard
    const finalAmount = taxedSubtotal + gstTax;

    return (
        <SidebarLayout>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '40px' }}>
                
                {/* 1. LEFT COLUMN - Landing Page details */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                    {/* Hero area */}
                    <div className="glass-panel" style={{
                        padding: '40px',
                        borderRadius: '20px',
                        background: 'linear-gradient(135deg, rgba(255,255,255,0.01) 0%, rgba(255,255,255,0.04) 100%)'
                    }}>
                        <span style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: '700', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>
                            Interactive LMS Course
                        </span>
                        <h1 style={{ fontSize: '2.5rem', fontWeight: '800', marginBottom: '16px' }}>{course.title}</h1>
                        <p style={{ fontSize: '1.05rem', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                            {course.description || 'Gain expertise with a complete syllabus, custom videos, quizzes, and live classes.'}
                        </p>
                    </div>

                    {/* What you'll learn benefits */}
                    <div>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '16px' }}>Course Key Benefits</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                            {[
                                'Lifetime syllabus access',
                                'Real-time Jitsi/Zoom classes',
                                'Interactive Exams with auto-grading',
                                'Self-paced video learning',
                                'Lecturer solutions explanations',
                                'Printable billing invoice receipts'
                            ].map((b, i) => (
                                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                                    <Check size={16} style={{ color: 'var(--success)', flexShrink: 0 }} />
                                    <span>{b}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Curriculum Outline Preview */}
                    <div>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '16px' }}>Curriculum outline ({sections.length} chapters)</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {sections.map((sec, idx) => (
                                <div key={sec.id} className="glass-panel" style={{ padding: '16px 20px', borderRadius: '10px' }}>
                                    <h4 style={{ fontSize: '0.95rem', fontWeight: '600', marginBottom: '10px' }}>
                                        Chapter {idx + 1}: {sec.title}
                                    </h4>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                        {sec.materials.map((mat: any, mIdx: number) => (
                                            <div key={mat.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                                {mat.type === 'video' ? <Video size={12} /> : <FileText size={12} />}
                                                <span>{mat.title}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* 2. RIGHT COLUMN - Sticky Billing Card */}
                <div>
                    <div className="glass-panel" style={{ padding: '24px', borderRadius: '16px', position: 'sticky', top: '100px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Course Tuition Fee</span>
                            <div style={{ fontSize: '2rem', fontWeight: '800', margin: '4px 0 12px 0' }}>
                                ₹{basePrice.toLocaleString()}
                            </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span>Includes chapters</span>
                                <strong style={{ color: 'var(--text-primary)' }}>Yes</strong>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span>Includes exams</span>
                                <strong style={{ color: 'var(--text-primary)' }}>Yes</strong>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span>Batch schedules</span>
                                <strong style={{ color: 'var(--text-primary)' }}>Yes</strong>
                            </div>
                        </div>

                        <button 
                            onClick={() => setIsCheckoutOpen(true)}
                            className="btn-primary" 
                            style={{ width: '100%', padding: '12px' }}
                        >
                            Enroll Now
                        </button>
                    </div>
                </div>
            </div>

            {/* Checkout Billing Modal */}
            {isCheckoutOpen && (
                <ModalPortal onClose={() => setIsCheckoutOpen(false)}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: '700' }}>Checkout Billing Summary</h3>
                            <button style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }} onClick={() => setIsCheckoutOpen(false)}>
                                <X size={20} />
                            </button>
                        </div>

                        {/* Coupon codes form */}
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <input 
                                type="text" 
                                className="glass-input" 
                                placeholder="Coupon Code (e.g. SAVE10)" 
                                value={couponCode}
                                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                                style={{ flex: 1 }}
                            />
                            <button type="button" onClick={handleApplyCoupon} className="btn-secondary" style={{ padding: '0 16px' }}>
                                Apply
                            </button>
                        </div>

                        {couponError && <div style={{ fontSize: '0.8rem', color: 'var(--danger)' }}>⚠️ {couponError}</div>}
                        {appliedCoupon && (
                            <div style={{ fontSize: '0.8rem', color: 'var(--success)' }}>
                                ✓ Coupon applied: {appliedCoupon.code} ({appliedCoupon.discount_type === 'percentage' ? `${appliedCoupon.discount_value}%` : `₹${appliedCoupon.discount_value}`} off)
                            </div>
                        )}

                        {/* Pricing details table */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-glass)', borderRadius: '10px', padding: '16px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                <span>Base Price:</span>
                                <span>₹{basePrice.toLocaleString()}</span>
                            </div>
                            {discountAmount > 0 && (
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--success)' }}>
                                    <span>Discount:</span>
                                    <span>-₹{discountAmount.toLocaleString()}</span>
                                </div>
                            )}
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                <span>Tax (18% GST):</span>
                                <span>+₹{gstTax.toLocaleString()}</span>
                            </div>
                            <hr style={{ border: 'none', borderTop: '1px solid var(--border-glass)' }} />
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.1rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                                <span>Total Payable:</span>
                                <span>₹{finalAmount.toLocaleString()}</span>
                            </div>
                        </div>

                        <button 
                            onClick={handleCheckout} 
                            className="btn-primary" 
                            style={{ width: '100%', padding: '12px' }}
                            disabled={isProcessing}
                        >
                            {isProcessing ? 'Verifying payment...' : 'Pay Sandbox'}
                        </button>
                    </div>
                </ModalPortal>
            )}
        </SidebarLayout>
    );
}
