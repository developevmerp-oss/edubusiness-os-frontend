'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
    BookOpen, 
    Calendar, 
    Award, 
    Bot, 
    ShoppingBag, 
    Users, 
    Sparkles, 
    CheckCircle2, 
    ArrowRight, 
    ShieldCheck, 
    MessageSquare, 
    Trophy, 
    Mail, 
    Palette, 
    ChevronDown, 
    Menu, 
    X,
    Star,
    Layers,
    DollarSign,
    Lock
} from 'lucide-react';

export default function LandingPage() {
    const [scrolled, setScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [annualBilling, setAnnualBilling] = useState(false);
    const [activeRoleTab, setActiveRoleTab] = useState<'admin' | 'teacher' | 'student' | 'parent'>('admin');
    const [openFaq, setOpenFaq] = useState<number | null>(0);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [currentUser, setCurrentUser] = useState<any>(null);

    useEffect(() => {
        const handleScroll = () => {
            if (window.scrollY > 40) {
                setScrolled(true);
            } else {
                setScrolled(false);
            }
        };
        window.addEventListener('scroll', handleScroll);

        // Check if user is logged in
        try {
            const stored = localStorage.getItem('user_profile');
            if (stored) {
                const parsed = JSON.parse(stored);
                if (parsed && parsed.email) {
                    setIsLoggedIn(true);
                    setCurrentUser(parsed);
                }
            }
        } catch (e) {
            // ignore
        }

        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const toggleFaq = (index: number) => {
        setOpenFaq(openFaq === index ? null : index);
    };

    const modules = [
        {
            icon: <BookOpen size={24} color="#818cf8" />,
            title: "Course Builder",
            desc: "Create sections, video lessons, and downloadable notes. AI Tutor available in every lesson.",
            badge: "Core ERP"
        },
        {
            icon: <Calendar size={24} color="#34d399" />,
            title: "Batches & Timetable",
            desc: "Group students, assign teachers, set weekly schedules, and conduct live classes.",
            badge: "Scheduling"
        },
        {
            icon: <Bot size={24} color="#f59e0b" />,
            title: "AI Exam Generator",
            desc: "Powered by Gemini AI. Generate MCQs by topic and difficulty with instant auto-grading.",
            badge: "AI Powered"
        },
        {
            icon: <CheckCircle2 size={24} color="#f472b6" />,
            title: "Attendance & Fees",
            desc: "1-click daily attendance marking with automated pending fee balance alerts for parents.",
            badge: "Finance"
        },
        {
            icon: <ShoppingBag size={24} color="#22d3ee" />,
            title: "Storefront & Invoices",
            desc: "Sell courses online with Razorpay/Stripe, coupon discounts, and instant GST invoices.",
            badge: "E-Commerce"
        },
        {
            icon: <Award size={24} color="#ec4899" />,
            title: "Certificates & DRM",
            desc: "Auto-issue QR-watermarked certificates. Secure video streaming with signed URL tokens.",
            badge: "Security"
        },
        {
            icon: <Users size={24} color="#818cf8" />,
            title: "User Management",
            desc: "Manage Admins, Teachers, Students, and Parents with designated role-based permissions.",
            badge: "Admin"
        },
        {
            icon: <MessageSquare size={24} color="#34d399" />,
            title: "Community Feed",
            desc: "Engage students with academy-wide discussions, announcements, and peer interactions.",
            badge: "Social"
        },
        {
            icon: <Trophy size={24} color="#f59e0b" />,
            title: "Live Leaderboard",
            desc: "Gamified ranking based on exam performance to motivate students to excel.",
            badge: "Gamification"
        },
        {
            icon: <Mail size={24} color="#f472b6" />,
            title: "Marketing & CRM",
            desc: "Create promo codes and send targeted email campaigns to filtered student segments.",
            badge: "Growth"
        },
        {
            icon: <Sparkles size={24} color="#22d3ee" />,
            title: "AI Tutor 24/7",
            desc: "Students get instantaneous contextual explanations for any lesson topic from Gemini AI.",
            badge: "AI Tutor"
        },
        {
            icon: <Palette size={24} color="#818cf8" />,
            title: "White-Label Branding",
            desc: "Upload custom logo, choose color accents, and serve your academy on custom subdomains.",
            badge: "Branding"
        }
    ];

    const roleSteps = {
        admin: [
            { title: "1. Register & Subdomain", desc: "Claim your dedicated academy subdomain in under 60 seconds." },
            { title: "2. Upload Logo & Branding", desc: "Add your logo and brand colors to personalize all portals." },
            { title: "3. Onboard Teachers & Staff", desc: "Create staff and student logins with role-based permissions." },
            { title: "4. Collect Fees & Track Growth", desc: "Monitor live analytics, batch revenues, and student attendance." }
        ],
        teacher: [
            { title: "1. Upload Lessons & Content", desc: "Organize chapters, videos, notes, and study material." },
            { title: "2. Generate AI Exams in 10s", desc: "Type a prompt to create automated multiple-choice tests." },
            { title: "3. Mark Daily Attendance", desc: "1-click attendance marking per batch with parent notifications." },
            { title: "4. Offer Paid Mentorship", desc: "Schedule 1-on-1 consultation sessions and monetize your time." }
        ],
        student: [
            { title: "1. Browse & Buy Courses", desc: "Enroll into batches with secure instant gateway checkout." },
            { title: "2. Learn with AI Tutor", desc: "Watch DRM-protected video lessons and ask questions 24/7." },
            { title: "3. Take Exams & Rank Up", desc: "Receive immediate scores and climb the academy leaderboard." },
            { title: "4. Earn Verified Certificate", desc: "Download tamper-proof certificates with QR validation." }
        ],
        parent: [
            { title: "1. Access Parent Portal", desc: "Log in to track linked children without seeing complex configs." },
            { title: "2. Live Attendance Insight", desc: "See daily presence logs and attendance percentages." },
            { title: "3. Clear Fee Dues", desc: "Review itemized fee structures and upcoming due dates." },
            { title: "4. Track Academic Progress", desc: "Monitor child's performance across all completed tests." }
        ]
    };

    const faqs = [
        {
            q: "How fast can I launch my academy?",
            a: "You can register, customize your branding, add your first course, and invite students in less than 15 minutes."
        },
        {
            q: "Is there a free trial available?",
            a: "Yes! You can register your academy immediately and test all core features without any upfront credit card."
        },
        {
            q: "How does the AI Tutor and Exam Generator work?",
            a: "We integrate directly with Google Gemini AI models to understand your exact course content and formulate high-quality explanations and test questions."
        },
        {
            q: "Can I collect payments in Indian Rupees (INR) and other currencies?",
            a: "Yes! EduBusiness OS supports Razorpay for domestic UPI/Cards/Netbanking and Stripe for global international transactions, with automated GST invoicing."
        },
        {
            q: "Can each academy have its own distinct branding?",
            a: "Yes! Every tenant gets their own dedicated subdomain, custom logo upload, personalized colors, and custom email notifications."
        }
    ];

    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg-base)', color: 'var(--text-primary)', overflowX: 'hidden' }}>
            
            {/* ── Fixed Navbar ── */}
            <header className={`landing-navbar ${scrolled ? 'scrolled' : ''}`}>
                <div className="landing-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    
                    {/* Brand */}
                    <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
                        <div style={{ 
                            width: '38px', 
                            height: '38px', 
                            borderRadius: '10px', 
                            background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: '900',
                            fontSize: '1.2rem',
                            color: '#fff',
                            boxShadow: '0 4px 16px rgba(99, 102, 241, 0.4)'
                        }}>
                            E
                        </div>
                        <span style={{ fontWeight: '800', fontSize: '1.3rem', letterSpacing: '-0.02em', color: '#fff' }}>
                            EduBusiness <span className="grad-text">OS</span>
                        </span>
                    </Link>

                    {/* Desktop Navigation */}
                    <nav style={{ display: 'flex', alignItems: 'center', gap: '32px' }} className="desktop-nav">
                        <a href="#features" style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', fontWeight: '500', transition: 'color 0.2s' }}>Features</a>
                        <a href="#how-it-works" style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', fontWeight: '500', transition: 'color 0.2s' }}>How It Works</a>
                        <a href="#pricing" style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', fontWeight: '500', transition: 'color 0.2s' }}>Pricing</a>
                        <a href="#faq" style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', fontWeight: '500', transition: 'color 0.2s' }}>FAQ</a>
                    </nav>

                    {/* Action CTAs */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                        {isLoggedIn ? (
                            <Link 
                                href="/dashboard" 
                                className="btn-primary"
                                style={{ 
                                    padding: '10px 22px', 
                                    fontSize: '0.9rem', 
                                    borderRadius: '10px',
                                    textDecoration: 'none',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px'
                                }}
                            >
                                <span>Go to Dashboard</span>
                                <ArrowRight size={16} />
                            </Link>
                        ) : (
                            <>
                                <Link 
                                    href="/login" 
                                    className="btn-secondary"
                                    style={{ 
                                        padding: '10px 20px', 
                                        fontSize: '0.9rem', 
                                        borderRadius: '10px',
                                        textDecoration: 'none'
                                    }}
                                >
                                    Login
                                </Link>
                                <Link 
                                    href="/login?register=true" 
                                    className="btn-primary"
                                    style={{ 
                                        padding: '10px 22px', 
                                        fontSize: '0.9rem', 
                                        borderRadius: '10px',
                                        textDecoration: 'none',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px'
                                    }}
                                >
                                    <span>Start Free</span>
                                    <ArrowRight size={16} />
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </header>

            {/* ── Hero Section ── */}
            <section style={{ 
                paddingTop: '160px', 
                paddingBottom: '90px', 
                position: 'relative', 
                overflow: 'hidden',
                background: 'radial-gradient(ellipse 70% 50% at 50% 0%, rgba(99, 102, 241, 0.16) 0%, transparent 70%)'
            }}>
                <div className="landing-container">
                    <div style={{ textAlign: 'center', maxWidth: '840px', margin: '0 auto' }}>
                        
                        <div className="landing-badge">
                            <Sparkles size={14} color="#818cf8" />
                            <span>Next-Gen Operating System for Academies</span>
                        </div>

                        <h1 style={{ 
                            fontSize: 'clamp(2.5rem, 5.5vw, 4.2rem)', 
                            fontWeight: '900', 
                            lineHeight: '1.1', 
                            letterSpacing: '-0.03em',
                            marginBottom: '24px'
                        }}>
                            Run Your Entire Academy on <br />
                            <span className="grad-text">One Unified OS</span>
                        </h1>

                        <p style={{ 
                            fontSize: '1.2rem', 
                            color: 'var(--text-secondary)', 
                            lineHeight: '1.7', 
                            marginBottom: '40px' 
                        }}>
                            Everything you need to launch, teach, monetize, and scale your coaching institute — from AI tutoring and exams to live batches, attendance, and instant payment collections.
                        </p>

                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', flexWrap: 'wrap', marginBottom: '48px' }}>
                            <Link 
                                href={isLoggedIn ? "/dashboard" : "/login?register=true"} 
                                className="btn-primary"
                                style={{ 
                                    padding: '15px 32px', 
                                    fontSize: '1.05rem', 
                                    borderRadius: '12px',
                                    textDecoration: 'none',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px'
                                }}
                            >
                                <span>{isLoggedIn ? "🚀 Open Your Dashboard" : "🚀 Launch Your Academy"}</span>
                                <ArrowRight size={18} />
                            </Link>

                            <a 
                                href="#features" 
                                className="btn-secondary"
                                style={{ 
                                    padding: '15px 28px', 
                                    fontSize: '1.05rem', 
                                    borderRadius: '12px',
                                    textDecoration: 'none'
                                }}
                            >
                                Explore All 12 Modules
                            </a>
                        </div>

                        {/* Live Stat Badges */}
                        <div style={{ 
                            display: 'grid', 
                            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', 
                            gap: '20px',
                            maxWidth: '700px',
                            margin: '0 auto 56px auto'
                        }}>
                            <div className="landing-card" style={{ padding: '16px' }}>
                                <div style={{ fontSize: '1.8rem', fontWeight: '800', color: 'var(--primary)' }}>500+</div>
                                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Academies Online</div>
                            </div>
                            <div className="landing-card" style={{ padding: '16px' }}>
                                <div style={{ fontSize: '1.8rem', fontWeight: '800', color: 'var(--secondary)' }}>50K+</div>
                                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Active Students</div>
                            </div>
                            <div className="landing-card" style={{ padding: '16px' }}>
                                <div style={{ fontSize: '1.8rem', fontWeight: '800', color: 'var(--success)' }}>99.9%</div>
                                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Uptime SLA</div>
                            </div>
                            <div className="landing-card" style={{ padding: '16px' }}>
                                <div style={{ fontSize: '1.8rem', fontWeight: '800', color: 'var(--accent)' }}>12-in-1</div>
                                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Modules Integrated</div>
                            </div>
                        </div>

                        {/* Live Dashboard Mockup Graphic */}
                        <div className="landing-card" style={{ 
                            padding: '24px', 
                            borderRadius: '24px',
                            boxShadow: '0 24px 64px rgba(0,0,0,0.6), 0 0 80px rgba(99,102,241,0.15)',
                            textAlign: 'left'
                        }}>
                            {/* Browser Bar */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '12px' }}>
                                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ef4444' }} />
                                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#f59e0b' }} />
                                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10b981' }} />
                                <div style={{ 
                                    background: 'rgba(255,255,255,0.04)', 
                                    padding: '4px 16px', 
                                    borderRadius: '6px', 
                                    fontSize: '0.8rem', 
                                    color: 'var(--text-muted)',
                                    marginLeft: '12px',
                                    fontFamily: 'monospace'
                                }}>
                                    https://orbit.edubusiness.app/dashboard
                                </div>
                            </div>

                            {/* Mini Mockup Content */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '20px' }}>
                                <div style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', padding: '16px', borderRadius: '14px' }}>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Total Revenue</div>
                                    <div style={{ fontSize: '1.6rem', fontWeight: '800', color: '#fff', marginTop: '4px' }}>₹3,48,500</div>
                                </div>
                                <div style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', padding: '16px', borderRadius: '14px' }}>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Avg Attendance</div>
                                    <div style={{ fontSize: '1.6rem', fontWeight: '800', color: 'var(--success)', marginTop: '4px' }}>96.4%</div>
                                </div>
                                <div style={{ background: 'rgba(236,72,153,0.08)', border: '1px solid rgba(236,72,153,0.2)', padding: '16px', borderRadius: '14px' }}>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Active Batches</div>
                                    <div style={{ fontSize: '1.6rem', fontWeight: '800', color: 'var(--secondary)', marginTop: '4px' }}>8 Batches</div>
                                </div>
                            </div>

                            <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: '12px', padding: '16px', border: '1px solid rgba(255,255,255,0.04)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                    <span style={{ fontSize: '0.85rem', fontWeight: '600' }}>Recent Student Submissions & Live Batches</span>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--success)' }}>● Realtime Active</span>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', padding: '8px 12px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
                                        <span>Rahul Kumar • JEE Physics (Electrostatics)</span>
                                        <span style={{ color: 'var(--success)', fontWeight: '700' }}>Score: 95%</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', padding: '8px 12px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
                                        <span>Priya Patel • NEET Biology Mock 3</span>
                                        <span style={{ color: 'var(--primary)', fontWeight: '700' }}>Score: 91%</span>
                                    </div>
                                </div>
                            </div>

                        </div>

                    </div>
                </div>
            </section>

            {/* ── 12 Modules Feature Grid ── */}
            <section id="features" className="landing-section">
                <div className="landing-container">
                    <div style={{ textAlign: 'center', maxWidth: '680px', margin: '0 auto 64px auto' }}>
                        <div className="landing-badge">
                            <Layers size={14} color="#818cf8" />
                            <span>Comprehensive Module Suite</span>
                        </div>
                        <h2 style={{ fontSize: '2.5rem', fontWeight: '800', marginBottom: '16px' }}>
                            12 Modules. <span className="grad-text">Zero Compromises.</span>
                        </h2>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>
                            Replace 6 disconnected software tools with one harmonized, high-speed ecosystem.
                        </p>
                    </div>

                    <div style={{ 
                        display: 'grid', 
                        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', 
                        gap: '24px' 
                    }}>
                        {modules.map((m, idx) => (
                            <div key={idx} className="landing-card" style={{ padding: '28px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                                    <div style={{ 
                                        width: '48px', 
                                        height: '48px', 
                                        borderRadius: '12px', 
                                        background: 'rgba(255,255,255,0.04)', 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        justifyContent: 'center',
                                        border: '1px solid rgba(255,255,255,0.08)'
                                    }}>
                                        {m.icon}
                                    </div>
                                    <span style={{ 
                                        fontSize: '0.75rem', 
                                        padding: '4px 10px', 
                                        borderRadius: '12px', 
                                        background: 'rgba(99,102,241,0.1)', 
                                        color: '#818cf8',
                                        fontWeight: '600'
                                    }}>
                                        {m.badge}
                                    </span>
                                </div>
                                <h3 style={{ fontSize: '1.2rem', fontWeight: '700', marginBottom: '8px' }}>{m.title}</h3>
                                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.6' }}>{m.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── How It Works / Role Journeys ── */}
            <section id="how-it-works" className="landing-section" style={{ background: 'rgba(255,255,255,0.01)', borderTop: '1px solid var(--border-glass)', borderBottom: '1px solid var(--border-glass)' }}>
                <div className="landing-container">
                    <div style={{ textAlign: 'center', maxWidth: '680px', margin: '0 auto 48px auto' }}>
                        <div className="landing-badge">
                            <Users size={14} color="#818cf8" />
                            <span>Role-Tailored Experience</span>
                        </div>
                        <h2 style={{ fontSize: '2.5rem', fontWeight: '800', marginBottom: '16px' }}>
                            Designed for <span className="grad-text">Every Member</span>
                        </h2>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>
                            Click a role to see how EduBusiness OS transforms daily workflows.
                        </p>

                        {/* Role Tabs */}
                        <div style={{ 
                            display: 'inline-flex', 
                            background: 'rgba(255,255,255,0.04)', 
                            padding: '6px', 
                            borderRadius: '14px', 
                            border: '1px solid var(--border-glass)',
                            marginTop: '28px',
                            gap: '6px',
                            flexWrap: 'wrap',
                            justifyContent: 'center'
                        }}>
                            {(['admin', 'teacher', 'student', 'parent'] as const).map(role => (
                                <button
                                    key={role}
                                    onClick={() => setActiveRoleTab(role)}
                                    style={{
                                        padding: '10px 20px',
                                        borderRadius: '10px',
                                        border: 'none',
                                        cursor: 'pointer',
                                        fontSize: '0.9rem',
                                        fontWeight: '600',
                                        textTransform: 'capitalize',
                                        background: activeRoleTab === role ? 'linear-gradient(135deg, var(--primary), var(--secondary))' : 'transparent',
                                        color: activeRoleTab === role ? '#fff' : 'var(--text-secondary)',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    {role === 'admin' ? '👑 Admin' : role === 'teacher' ? '📖 Teacher' : role === 'student' ? '🎓 Student' : '👪 Parent'}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Step Cards for Active Role */}
                    <div style={{ 
                        display: 'grid', 
                        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', 
                        gap: '20px' 
                    }}>
                        {roleSteps[activeRoleTab].map((step, idx) => (
                            <div key={idx} className="landing-card" style={{ padding: '28px' }}>
                                <div style={{ 
                                    width: '36px', 
                                    height: '36px', 
                                    borderRadius: '50%', 
                                    background: 'rgba(99,102,241,0.15)', 
                                    color: '#818cf8', 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    justifyContent: 'center',
                                    fontWeight: '800',
                                    marginBottom: '16px'
                                }}>
                                    {idx + 1}
                                </div>
                                <h4 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '8px' }}>{step.title}</h4>
                                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.6' }}>{step.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── Pricing Section ── */}
            <section id="pricing" className="landing-section">
                <div className="landing-container">
                    <div style={{ textAlign: 'center', maxWidth: '680px', margin: '0 auto 48px auto' }}>
                        <div className="landing-badge">
                            <DollarSign size={14} color="#818cf8" />
                            <span>Transparent Pricing</span>
                        </div>
                        <h2 style={{ fontSize: '2.5rem', fontWeight: '800', marginBottom: '16px' }}>
                            Simple Plans. <span className="grad-text">Scale Without Limits.</span>
                        </h2>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', marginBottom: '28px' }}>
                            Choose monthly or get 2 months free with annual billing.
                        </p>

                        {/* Toggle */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
                            <span style={{ fontSize: '0.9rem', color: !annualBilling ? '#fff' : 'var(--text-muted)', fontWeight: '600' }}>Monthly</span>
                            <button 
                                onClick={() => setAnnualBilling(!annualBilling)}
                                className={`pricing-toggle-btn ${annualBilling ? 'annual' : ''}`}
                                aria-label="Toggle billing"
                            />
                            <span style={{ fontSize: '0.9rem', color: annualBilling ? '#fff' : 'var(--text-muted)', fontWeight: '600' }}>
                                Annual <span style={{ background: 'rgba(16,185,129,0.15)', color: 'var(--success)', padding: '2px 8px', borderRadius: '10px', fontSize: '0.75rem', marginLeft: '4px' }}>Save 30%</span>
                            </span>
                        </div>
                    </div>

                    {/* Cards */}
                    <div style={{ 
                        display: 'grid', 
                        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
                        gap: '24px',
                        alignItems: 'stretch'
                    }}>
                        {/* Starter */}
                        <div className="landing-card" style={{ padding: '36px', display: 'flex', flexDirection: 'column' }}>
                            <div style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--text-secondary)' }}>Starter</div>
                            <div style={{ fontSize: '2.8rem', fontWeight: '900', margin: '12px 0 6px 0' }}>
                                {annualBilling ? '₹699' : '₹999'}
                                <span style={{ fontSize: '1rem', color: 'var(--text-muted)', fontWeight: '500' }}>/mo</span>
                            </div>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '24px' }}>For individual educators and small classes starting out.</p>

                            <Link 
                                href="/login?register=true" 
                                className="btn-secondary"
                                style={{ width: '100%', padding: '12px', textAlign: 'center', borderRadius: '10px', marginBottom: '28px', textDecoration: 'none' }}
                            >
                                Start Free Trial
                            </Link>

                            <ul style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: 'auto' }}>
                                <li style={{ display: 'flex', gap: '8px' }}><CheckCircle2 size={18} color="var(--success)" /> Up to 100 Students</li>
                                <li style={{ display: 'flex', gap: '8px' }}><CheckCircle2 size={18} color="var(--success)" /> 5 Published Courses</li>
                                <li style={{ display: 'flex', gap: '8px' }}><CheckCircle2 size={18} color="var(--success)" /> AI Tutor (100 queries/day)</li>
                                <li style={{ display: 'flex', gap: '8px' }}><CheckCircle2 size={18} color="var(--success)" /> Daily Attendance & Fees</li>
                                <li style={{ display: 'flex', gap: '8px' }}><CheckCircle2 size={18} color="var(--success)" /> Community & Leaderboard</li>
                            </ul>
                        </div>

                        {/* Growth (Featured) */}
                        <div className="landing-card" style={{ 
                            padding: '36px', 
                            display: 'flex', 
                            flexDirection: 'column',
                            borderColor: 'var(--primary)',
                            background: 'rgba(99,102,241,0.04)',
                            position: 'relative'
                        }}>
                            <div style={{ 
                                position: 'absolute', 
                                top: '-12px', 
                                left: '50%', 
                                transform: 'translateX(-50%)',
                                background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
                                padding: '4px 16px',
                                borderRadius: '12px',
                                fontSize: '0.75rem',
                                fontWeight: '800',
                                color: '#fff',
                                letterSpacing: '0.05em'
                            }}>
                                ⭐ MOST POPULAR
                            </div>

                            <div style={{ fontSize: '1.1rem', fontWeight: '700', color: '#818cf8' }}>Growth</div>
                            <div style={{ fontSize: '2.8rem', fontWeight: '900', margin: '12px 0 6px 0' }} className="grad-text">
                                {annualBilling ? '₹1,749' : '₹2,499'}
                                <span style={{ fontSize: '1rem', color: 'var(--text-muted)', fontWeight: '500' }}>/mo</span>
                            </div>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '24px' }}>For scaling institutes needing white-label branding and full ERP.</p>

                            <Link 
                                href="/login?register=true" 
                                className="btn-primary"
                                style={{ width: '100%', padding: '12px', textAlign: 'center', borderRadius: '10px', marginBottom: '28px', textDecoration: 'none' }}
                            >
                                Start 14-Day Free Trial
                            </Link>

                            <ul style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: 'auto' }}>
                                <li style={{ display: 'flex', gap: '8px' }}><CheckCircle2 size={18} color="var(--success)" /> Up to 1,000 Students</li>
                                <li style={{ display: 'flex', gap: '8px' }}><CheckCircle2 size={18} color="var(--success)" /> Unlimited Courses & Batches</li>
                                <li style={{ display: 'flex', gap: '8px' }}><CheckCircle2 size={18} color="var(--success)" /> Unlimited AI Tutor & Exams</li>
                                <li style={{ display: 'flex', gap: '8px' }}><CheckCircle2 size={18} color="var(--success)" /> Full White-Label (Logo + Colors)</li>
                                <li style={{ display: 'flex', gap: '8px' }}><CheckCircle2 size={18} color="var(--success)" /> Razorpay/Stripe + GST Invoicing</li>
                                <li style={{ display: 'flex', gap: '8px' }}><CheckCircle2 size={18} color="var(--success)" /> Paid Consultations & CRM</li>
                            </ul>
                        </div>

                        {/* Enterprise */}
                        <div className="landing-card" style={{ padding: '36px', display: 'flex', flexDirection: 'column' }}>
                            <div style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--text-secondary)' }}>Enterprise</div>
                            <div style={{ fontSize: '2.8rem', fontWeight: '900', margin: '12px 0 6px 0' }}>Custom</div>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '24px' }}>For multi-branch institutions needing dedicated cloud and SLAs.</p>

                            <Link 
                                href="/login?register=true" 
                                className="btn-secondary"
                                style={{ width: '100%', padding: '12px', textAlign: 'center', borderRadius: '10px', marginBottom: '28px', textDecoration: 'none' }}
                            >
                                Contact Sales
                            </Link>

                            <ul style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: 'auto' }}>
                                <li style={{ display: 'flex', gap: '8px' }}><CheckCircle2 size={18} color="var(--success)" /> Unlimited Students & Staff</li>
                                <li style={{ display: 'flex', gap: '8px' }}><CheckCircle2 size={18} color="var(--success)" /> Custom Root Domain Mapping</li>
                                <li style={{ display: 'flex', gap: '8px' }}><CheckCircle2 size={18} color="var(--success)" /> Dedicated High-Speed Node</li>
                                <li style={{ display: 'flex', gap: '8px' }}><CheckCircle2 size={18} color="var(--success)" /> 99.9% Guaranteed Uptime SLA</li>
                                <li style={{ display: 'flex', gap: '8px' }}><CheckCircle2 size={18} color="var(--success)" /> Dedicated Account Manager</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── Testimonials ── */}
            <section className="landing-section" style={{ background: 'rgba(255,255,255,0.01)', borderTop: '1px solid var(--border-glass)', borderBottom: '1px solid var(--border-glass)' }}>
                <div className="landing-container">
                    <div style={{ textAlign: 'center', maxWidth: '680px', margin: '0 auto 48px auto' }}>
                        <div className="landing-badge">
                            <Star size={14} color="#f59e0b" />
                            <span>Loved by Top Educators</span>
                        </div>
                        <h2 style={{ fontSize: '2.5rem', fontWeight: '800', marginBottom: '16px' }}>
                            Trusted by <span className="grad-text">500+ Institutes</span>
                        </h2>
                    </div>

                    <div style={{ 
                        display: 'grid', 
                        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
                        gap: '24px' 
                    }}>
                        <div className="landing-card" style={{ padding: '32px' }}>
                            <p style={{ fontStyle: 'italic', color: 'var(--text-secondary)', lineHeight: '1.7', marginBottom: '24px' }}>
                                "We migrated from 3 different apps to EduBusiness OS. The AI Exam generator alone saves our faculty over 15 hours every single week."
                            </p>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1, #ec4899)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700' }}>VK</div>
                                <div>
                                    <div style={{ fontWeight: '700', fontSize: '0.95rem' }}>Vikram Kapur</div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Founder, Orbit Physics Classes (420+ Students)</div>
                                </div>
                            </div>
                        </div>

                        <div className="landing-card" style={{ padding: '32px' }}>
                            <p style={{ fontStyle: 'italic', color: 'var(--text-secondary)', lineHeight: '1.7', marginBottom: '24px' }}>
                                "Parents love the transparent attendance logs and fee reminders. No more manual calls or payment reconciliation headaches."
                            </p>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(135deg, #ec4899, #f472b6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700' }}>PS</div>
                                <div>
                                    <div style={{ fontWeight: '700', fontSize: '0.95rem' }}>Priya Sharma</div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Director, Spark Commerce Academy (280+ Students)</div>
                                </div>
                            </div>
                        </div>

                        <div className="landing-card" style={{ padding: '32px' }}>
                            <p style={{ fontStyle: 'italic', color: 'var(--text-secondary)', lineHeight: '1.7', marginBottom: '24px' }}>
                                "Having our own custom logo and branding on certificates and the portal gave our brand massive credibility among students."
                            </p>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(135deg, #06b6d4, #0891b2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700' }}>AM</div>
                                <div>
                                    <div style={{ fontWeight: '700', fontSize: '0.95rem' }}>Arun Mehta</div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Head, BrightPath NEET Prep (650+ Students)</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── FAQ Section ── */}
            <section id="faq" className="landing-section">
                <div className="landing-container" style={{ maxWidth: '780px' }}>
                    <div style={{ textAlign: 'center', marginBottom: '48px' }}>
                        <div className="landing-badge">
                            <span>Answers to Common Questions</span>
                        </div>
                        <h2 style={{ fontSize: '2.5rem', fontWeight: '800' }}>
                            Frequently Asked Questions
                        </h2>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {faqs.map((faq, idx) => (
                            <div 
                                key={idx}
                                className="landing-card" 
                                style={{ 
                                    padding: '20px 24px', 
                                    cursor: 'pointer' 
                                }}
                                onClick={() => toggleFaq(idx)}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: '600', fontSize: '1.05rem' }}>
                                    <span>{faq.q}</span>
                                    <ChevronDown 
                                        size={20} 
                                        color="var(--text-muted)" 
                                        style={{ 
                                            transform: openFaq === idx ? 'rotate(180deg)' : 'rotate(0deg)',
                                            transition: 'transform 0.2s'
                                        }} 
                                    />
                                </div>
                                {openFaq === idx && (
                                    <p style={{ marginTop: '14px', color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: '1.6' }}>
                                        {faq.a}
                                    </p>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── Final Call to Action ── */}
            <section className="landing-section" style={{ paddingTop: '20px', paddingBottom: '90px' }}>
                <div className="landing-container">
                    <div className="landing-card" style={{ 
                        padding: '64px 32px', 
                        textAlign: 'center',
                        background: 'linear-gradient(135deg, rgba(99,102,241,0.15) 0%, rgba(236,72,153,0.12) 100%)',
                        borderColor: 'rgba(99,102,241,0.3)',
                        borderRadius: '28px'
                    }}>
                        <h2 style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: '900', marginBottom: '16px' }}>
                            Ready to Transform Your Academy?
                        </h2>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '1.15rem', maxWidth: '580px', margin: '0 auto 36px auto' }}>
                            Join 500+ academies building their future on EduBusiness OS. Instant setup, no credit card required.
                        </p>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', flexWrap: 'wrap' }}>
                            <Link 
                                href="/login?register=true" 
                                className="btn-primary"
                                style={{ padding: '15px 36px', fontSize: '1.05rem', borderRadius: '12px', textDecoration: 'none' }}
                            >
                                🚀 Start Free Trial Now
                            </Link>
                            <Link 
                                href="/login" 
                                className="btn-secondary"
                                style={{ padding: '15px 28px', fontSize: '1.05rem', borderRadius: '12px', textDecoration: 'none' }}
                            >
                                Existing User Login
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── Footer ── */}
            <footer style={{ borderTop: '1px solid var(--border-glass)', padding: '48px 0 28px 0', background: 'rgba(0,0,0,0.4)' }}>
                <div className="landing-container">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px', marginBottom: '32px' }}>
                        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
                            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'linear-gradient(135deg, var(--primary), var(--secondary))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', color: '#fff' }}>
                                E
                            </div>
                            <span style={{ fontWeight: '800', fontSize: '1.15rem', color: '#fff' }}>
                                EduBusiness <span className="grad-text">OS</span>
                            </span>
                        </Link>
                        
                        <div style={{ display: 'flex', gap: '24px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                            <a href="#features">Features</a>
                            <a href="#how-it-works">How It Works</a>
                            <a href="#pricing">Pricing</a>
                            <Link href="/login">Portal Login</Link>
                            <Link href="/login?register=true">Register</Link>
                        </div>
                    </div>
                    
                    <div style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-muted)', borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: '24px' }}>
                        © 2026 EduBusiness OS. All rights reserved. Built for educators, tutors, and coaching academies worldwide.
                    </div>
                </div>
            </footer>

        </div>
    );
}
