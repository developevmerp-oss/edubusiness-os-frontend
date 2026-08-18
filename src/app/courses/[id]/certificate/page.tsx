'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import SidebarLayout from '../../../../components/SidebarLayout';
import { apiRequest } from '../../../../utils/api';
import { Award, ShieldCheck, Printer, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface CertificatePageProps {
    params: Promise<{ id: string }>; // courseId
}

export default function CourseCertificatePage({ params }: CertificatePageProps) {
    const { id: courseId } = use(params);
    const router = useRouter();

    const [course, setCourse] = useState<any>(null);
    const [certificate, setCertificate] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [claiming, setClaiming] = useState(false);
    const [studentProfile, setStudentProfile] = useState<any>(null);

    useEffect(() => {
        const storedUser = localStorage.getItem('user_profile');
        if (storedUser) {
            setStudentProfile(JSON.parse(storedUser));
        }
        fetchDetailsAndCert();
    }, [courseId]);

    const fetchDetailsAndCert = async () => {
        setLoading(true);
        try {
            const courseData = await apiRequest(`/api/courses/${courseId}`);
            setCourse(courseData.course);

            // Fetch claimed certificate if exists
            const certData = await apiRequest('/api/certificates');
            const match = certData.certificates.find((c: any) => c.course_title === courseData.course.title);
            if (match) {
                setCertificate(match);
            }
        } catch (err) {
            console.error('Failed to load certificate context:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleClaimCertificate = async () => {
        setClaiming(true);
        try {
            const data = await apiRequest('/api/certificates/claim', {
                method: 'POST',
                body: JSON.stringify({ courseId })
            });
            setCertificate(data.certificate);
            alert('Congratulations! Graduation Certificate generated successfully!');
        } catch (err: any) {
            alert(err.message || 'Failed to claim certificate. Ensure course is complete.');
        } finally {
            setClaiming(false);
        }
    };

    if (loading) {
        return (
            <SidebarLayout>
                <div style={{ color: 'var(--text-secondary)' }}>Verifying course progress...</div>
            </SidebarLayout>
        );
    }

    return (
        <SidebarLayout>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }} className="no-print-section">
                
                {/* Back navigation header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', borderBottom: '1px solid var(--border-glass)', paddingBottom: '16px' }} className="no-print">
                    <Link href={`/courses/${courseId}`} style={{ color: 'var(--text-muted)' }}>
                        <ArrowLeft size={20} />
                    </Link>
                    <div>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: '700' }}>Graduation Certificate</h2>
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Validate academic achievements</span>
                    </div>
                </div>

                {!certificate ? (
                    <div className="glass-panel animate-glow" style={{ padding: '40px', borderRadius: '16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', maxWidth: '580px', margin: 'auto' }}>
                        <Award size={64} style={{ color: 'var(--primary)', filter: 'drop-shadow(0 0 10px var(--primary))' }} />
                        <h3>Course Completion Award</h3>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.6' }}>
                            You have completed the syllabus study chapters for <strong>{course?.title}</strong>. Click below to claim and print your official Graduation Certificate.
                        </p>
                        <button onClick={handleClaimCertificate} className="btn-primary" style={{ padding: '12px 24px' }} disabled={claiming}>
                            {claiming ? 'Generating...' : 'Claim Graduation Certificate'}
                        </button>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', alignItems: 'center' }}>
                        
                        {/* Certificate Graphic Card */}
                        <div style={{
                            width: '800px',
                            height: '560px',
                            background: '#11131e',
                            border: '16px double #c5a880',
                            borderRadius: '8px',
                            padding: '40px',
                            boxSizing: 'border-box',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            textAlign: 'center',
                            position: 'relative',
                            boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
                            fontFamily: 'serif',
                            color: '#e5e7eb'
                        }} id="printable-certificate-card">
                            
                            {/* Inner Border decoration */}
                            <div style={{
                                position: 'absolute',
                                top: '10px', left: '10px', right: '10px', bottom: '10px',
                                border: '1px solid rgba(197, 168, 128, 0.3)',
                                pointerEvents: 'none'
                            }} />

                            {/* Top emblem */}
                            <div style={{ color: '#c5a880', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                                <Award size={48} />
                                <span style={{ fontSize: '1.25rem', letterSpacing: '0.15em', fontWeight: '700' }}>CERTIFICATE OF COMPLETION</span>
                            </div>

                            {/* Middle statements */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <span style={{ fontStyle: 'italic', fontSize: '1.1rem', color: '#9ca3af' }}>This is officially awarded to</span>
                                <h2 style={{ fontSize: '2.5rem', fontWeight: '800', color: '#ffffff', borderBottom: '2px solid rgba(197,168,128,0.5)', paddingBottom: '8px', display: 'inline-block', margin: 'auto', minWidth: '320px' }}>
                                    {studentProfile?.first_name} {studentProfile?.last_name}
                                </h2>
                                <span style={{ fontStyle: 'italic', fontSize: '1rem', color: '#9ca3af' }}>for successfully finishing the curriculum program of</span>
                                <h3 style={{ fontSize: '1.65rem', fontWeight: '700', color: '#c5a880' }}>
                                    {course?.title}
                                </h3>
                            </div>

                            {/* Footer stamps / code verification */}
                            <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderTop: '1px solid rgba(197,168,128,0.2)', paddingTop: '20px' }}>
                                <div style={{ textAlign: 'left', fontSize: '0.8rem', color: '#9ca3af', fontFamily: 'sans-serif' }}>
                                    <div>Date Issued: <strong>{new Date(certificate.created_at || Date.now()).toLocaleDateString()}</strong></div>
                                    <div style={{ marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <ShieldCheck size={14} style={{ color: 'var(--success)' }} />
                                        Verification Code: <strong>{certificate.verification_code}</strong>
                                    </div>
                                </div>
                                <div style={{ textAlign: 'right', fontFamily: 'sans-serif' }}>
                                    <div style={{ borderBottom: '1px solid rgba(255,255,255,0.2)', width: '180px', paddingBottom: '4px', fontStyle: 'italic', color: '#ffffff' }}>
                                        ABC Academy Owner
                                    </div>
                                    <span style={{ fontSize: '0.75rem', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Authorized Signatory</span>
                                </div>
                            </div>

                        </div>

                        {/* Print Trigger Button */}
                        <div className="no-print">
                            <button onClick={() => window.print()} className="btn-primary" style={{ padding: '12px 24px', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                                <Printer size={16} /> Print Certificate
                            </button>
                        </div>
                    </div>
                )}

            </div>
            
            {/* Embedded styles for printing layout overlays */}
            <style jsx global>{`
                @media print {
                    body * {
                        visibility: hidden;
                    }
                    #printable-certificate-card, #printable-certificate-card * {
                        visibility: visible;
                    }
                    #printable-certificate-card {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                        height: 100%;
                        border: 10px double #c5a880 !important;
                        box-shadow: none !important;
                    }
                    .no-print-section {
                        background: none !important;
                        padding: 0 !important;
                    }
                }
            `}</style>
        </SidebarLayout>
    );
}
