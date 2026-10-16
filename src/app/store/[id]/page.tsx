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
    Award,
    ShieldCheck
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
    const [includeOrderBump, setIncludeOrderBump] = useState(false);
    const [referralCode, setReferralCode] = useState('');
    const [gatewayConfig, setGatewayConfig] = useState<{
        activeGateway: 'sandbox' | 'razorpay' | 'stripe';
        isTestMode: boolean;
        razorpayKeyId: string;
        stripePublishableKey: string;
    }>({
        activeGateway: 'sandbox',
        isTestMode: true,
        razorpayKeyId: '',
        stripePublishableKey: ''
    });

    const ORDER_BUMP_PRICE = 199.00;

    useEffect(() => {
        fetchCourseAndSyllabus();
        
        // Fetch public payment gateway configuration
        apiRequest('/api/settings/payment-gateway/public')
            .then((data) => {
                if (data) {
                    setGatewayConfig({
                        activeGateway: data.activeGateway || 'sandbox',
                        isTestMode: data.isTestMode ?? true,
                        razorpayKeyId: data.razorpayKeyId || '',
                        stripePublishableKey: data.stripePublishableKey || ''
                    });
                }
            })
            .catch(() => {});

        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            const ref = params.get('ref') || localStorage.getItem('affiliate_ref');
            if (ref) {
                setReferralCode(ref.toUpperCase());
                localStorage.setItem('affiliate_ref', ref.toUpperCase());
            }
        }
    }, [courseId]);

    const loadRazorpayScript = () => {
        return new Promise<boolean>((resolve) => {
            if (typeof window === 'undefined') return resolve(false);
            if ((window as any).Razorpay) return resolve(true);
            const script = document.createElement('script');
            script.src = 'https://checkout.razorpay.com/v1/checkout.js';
            script.async = true;
            script.onload = () => resolve(true);
            script.onerror = () => resolve(false);
            document.body.appendChild(script);
        });
    };

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

    const handleOpenCheckout = () => {
        setIsCheckoutOpen(true);
        // Track cart initiation for Abandoned Cart recovery nudges
        const storedUser = localStorage.getItem('user_profile');
        if (storedUser) {
            try {
                const u = JSON.parse(storedUser);
                if (u && (u.email || u.first_name)) {
                    apiRequest('/api/marketing/abandoned-carts/record', {
                        method: 'POST',
                        body: JSON.stringify({
                            studentName: `${u.first_name || 'Student'} ${u.last_name || ''}`.trim(),
                            studentPhone: u.phone || '+919876543210',
                            studentEmail: u.email,
                            courseId: courseId,
                            courseTitle: course?.title || 'Selected Course',
                            cartValue: parseFloat(course?.price || 0)
                        })
                    }).catch(() => {});
                }
            } catch (e) {}
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
                    gateway: gatewayConfig.activeGateway || 'sandbox',
                    orderBump: includeOrderBump,
                    referralCode: referralCode || undefined
                })
            });

            const orderId = checkoutData.order.id;
            const gw = checkoutData.gatewayConfig || gatewayConfig;

            // 2. Razorpay Live / Test modal flow
            if (gw.activeGateway === 'razorpay') {
                const loaded = await loadRazorpayScript();
                if (!loaded) {
                    throw new Error('Unable to load Razorpay checkout SDK. Please verify your internet connection.');
                }

                let prefill = { name: '', email: '', contact: '' };
                try {
                    const storedUser = localStorage.getItem('user');
                    if (storedUser) {
                        const u = JSON.parse(storedUser);
                        prefill = {
                            name: `${u.first_name || ''} ${u.last_name || ''}`.trim(),
                            email: u.email || '',
                            contact: u.phone || ''
                        };
                    }
                } catch (e) {}

                const options: any = {
                    key: gw.razorpayKeyId || 'rzp_test_public_key',
                    amount: gw.amountInPaise || Math.round(finalAmount * 100),
                    currency: gw.currency || 'INR',
                    name: 'EduBusiness OS',
                    description: `Enrollment: ${course?.title || 'Course'}`,
                    order_id: gw.razorpayOrderId,
                    prefill,
                    theme: {
                        color: '#6366f1'
                    },
                    modal: {
                        ondismiss: () => {
                            setIsProcessing(false);
                        }
                    },
                    handler: async (response: any) => {
                        try {
                            setIsProcessing(true);
                            await apiRequest(`/api/store/checkout/${orderId}/verify-gateway`, {
                                method: 'POST',
                                body: JSON.stringify({
                                    razorpayPaymentId: response.razorpay_payment_id,
                                    razorpayOrderId: response.razorpay_order_id,
                                    razorpaySignature: response.razorpay_signature,
                                    referralCode: referralCode || undefined
                                })
                            });

                            const successMsg = includeOrderBump 
                                ? 'Payment successful! Course syllabus and VIP Handwritten Formula Booklet have been added to your dashboard.' 
                                : 'Payment successful! You now have full access to the course syllabus.';
                            alert(successMsg);
                            setIsCheckoutOpen(false);
                            router.push(`/courses/${courseId}`);
                        } catch (verifyErr: any) {
                            alert(verifyErr.message || 'Payment verification failed.');
                        } finally {
                            setIsProcessing(false);
                        }
                    }
                };

                const rzp = new (window as any).Razorpay(options);
                rzp.on('payment.failed', (resp: any) => {
                    alert(`Payment Failed: ${resp.error?.description || 'Transaction declined.'}`);
                    setIsProcessing(false);
                });
                rzp.open();
                return;
            }

            // 3. Sandbox Instant Verification
            await apiRequest(`/api/store/checkout/${orderId}/verify`, {
                method: 'POST',
                body: JSON.stringify({
                    referralCode: referralCode || undefined
                })
            });

            const successMsg = includeOrderBump 
                ? 'Enrollment complete! Course syllabus and VIP Handwritten Formula Booklet have been added to your dashboard.' 
                : 'Enrollment complete! You now have full access to the course syllabus.';
            alert(successMsg);
            setIsCheckoutOpen(false);
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

    // Dynamic calculations including 1-click order bump
    const baseCoursePrice = parseFloat(course.price);
    const bumpFee = includeOrderBump ? ORDER_BUMP_PRICE : 0.00;
    const basePrice = baseCoursePrice + bumpFee;
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

                        {referralCode && (
                            <div style={{
                                padding: '8px 12px',
                                background: 'rgba(99, 102, 241, 0.12)',
                                border: '1px solid rgba(99, 102, 241, 0.3)',
                                borderRadius: '8px',
                                fontSize: '0.78rem',
                                color: 'var(--primary)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between'
                            }}>
                                <span>Affiliate Referral Applied:</span>
                                <strong>{referralCode}</strong>
                            </div>
                        )}

                        <button 
                            onClick={handleOpenCheckout}
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

                        {/* 1-Click Order Bump Card */}
                        <div 
                            style={{
                                background: includeOrderBump ? 'rgba(99, 102, 241, 0.15)' : 'rgba(255, 255, 255, 0.02)',
                                border: includeOrderBump ? '1.5px solid #6366f1' : '1px dashed rgba(255, 255, 255, 0.2)',
                                borderRadius: '12px',
                                padding: '16px',
                                transition: 'all 0.2s ease',
                                cursor: 'pointer',
                                boxShadow: includeOrderBump ? '0 4px 15px rgba(99, 102, 241, 0.2)' : 'none'
                            }} 
                            onClick={() => setIncludeOrderBump(!includeOrderBump)}
                        >
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                                <input 
                                    type="checkbox"
                                    checked={includeOrderBump}
                                    onChange={(e) => setIncludeOrderBump(e.target.checked)}
                                    style={{ width: '18px', height: '18px', marginTop: '3px', accentColor: '#6366f1', cursor: 'pointer' }}
                                />
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                        <span style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: '4px', background: 'rgba(236, 72, 153, 0.2)', color: '#f472b6', fontWeight: 'bold' }}>
                                            ⚡ VIP 1-CLICK ORDER BUMP
                                        </span>
                                        <span style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 'bold' }}>Save 67%</span>
                                    </div>
                                    <div style={{ fontSize: '0.9rem', fontWeight: '700', color: '#f8fafc', marginBottom: '4px' }}>
                                        Add 2026 Handwritten Formula Booklet & 500+ Practice MCQs
                                    </div>
                                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0, lineHeight: '1.4' }}>
                                        High-yield revision cheat-sheets & exam tricks. Instant access for just <strong style={{ color: '#f8fafc' }}>₹199</strong> (Regular ₹599).
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Pricing details table */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-glass)', borderRadius: '10px', padding: '16px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                <span>Course Tuition:</span>
                                <span>₹{baseCoursePrice.toLocaleString()}</span>
                            </div>
                            {includeOrderBump && (
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#a5b4fc', fontWeight: '600' }}>
                                    <span>VIP Formula Booklet (Bump):</span>
                                    <span>+₹{ORDER_BUMP_PRICE.toFixed(2)}</span>
                                </div>
                            )}
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

                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px',
                            fontSize: '0.78rem',
                            color: 'var(--text-muted)',
                            marginTop: '-6px'
                        }}>
                            <ShieldCheck size={14} style={{ color: '#10b981' }} />
                            <span>
                                {gatewayConfig.activeGateway === 'razorpay'
                                    ? (gatewayConfig.isTestMode ? 'Razorpay Test Mode Active (256-bit SSL)' : 'Razorpay Live Payments (256-bit SSL)')
                                    : gatewayConfig.activeGateway === 'stripe'
                                    ? 'Stripe Global Card Payments (PCI-DSS Level 1)'
                                    : 'Instant Sandbox Simulator Mode'}
                            </span>
                        </div>

                        <button 
                            onClick={handleCheckout} 
                            className="btn-primary" 
                            style={{ width: '100%', padding: '12px', fontWeight: '700' }}
                            disabled={isProcessing}
                        >
                            {isProcessing 
                                ? 'Processing Payment...' 
                                : gatewayConfig.activeGateway === 'razorpay'
                                ? `Pay ₹${Math.round(finalAmount).toLocaleString()} via Razorpay`
                                : gatewayConfig.activeGateway === 'stripe'
                                ? `Pay ₹${Math.round(finalAmount).toLocaleString()} via Stripe`
                                : `Pay ₹${Math.round(finalAmount).toLocaleString()} (Instant Activation)`}
                        </button>
                    </div>
                </ModalPortal>
            )}
        </SidebarLayout>
    );
}
