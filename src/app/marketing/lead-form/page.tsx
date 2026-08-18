'use client';

import { useState, useEffect } from 'react';
import { apiRequest } from '../../../utils/api';
import { ArrowLeft, Send, Sparkles, CheckCircle } from 'lucide-react';
import Link from 'next/link';

export default function PublicLeadFormPage() {
    const [courses, setCourses] = useState<any[]>([]);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [courseId, setCourseId] = useState('');
    const [loading, setLoading] = useState(true);
    const [successMessage, setSuccessMessage] = useState('');

    useEffect(() => {
        fetchPublicCourses();
    }, []);

    const fetchPublicCourses = async () => {
        setLoading(true);
        try {
            // Load courses list for dropdown
            const data = await apiRequest('/api/store/courses');
            setCourses(data.courses);
        } catch (err) {
            console.error('Failed to load courses for inquiry form:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmitInquiry = async (e: React.FormEvent) => {
        e.preventDefault();
        setSuccessMessage('');
        try {
            const data = await apiRequest('/api/marketing/leads', {
                method: 'POST',
                body: JSON.stringify({
                    name,
                    email,
                    phone: phone || undefined,
                    courseId: courseId || undefined
                })
            });

            setSuccessMessage(data.message || 'Inquiry registered successfully!');
            setName('');
            setEmail('');
            setPhone('');
            setCourseId('');
        } catch (err: any) {
            alert(err.message || 'Failed to submit inquiry.');
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            background: '#0a0b10',
            color: 'var(--text-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
        }}>
            <div className="glass-panel" style={{ width: '480px', padding: '40px', borderRadius: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                
                {/* Header */}
                <div style={{ textAlign: 'center' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: 'var(--primary)', fontWeight: '700', textTransform: 'uppercase', marginBottom: '8px', background: 'rgba(99, 102, 241, 0.1)', padding: '4px 10px', borderRadius: '20px' }}>
                        <Sparkles size={12} /> ABC Academy Inquiry Portal
                    </div>
                    <h2 style={{ fontSize: '1.75rem', fontWeight: '800' }}>Request Information</h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '6px' }}>
                        Submit your details to receive curriculum details, schedules, and discounts.
                    </p>
                </div>

                {successMessage ? (
                    <div style={{
                        padding: '30px 20px',
                        background: 'rgba(16, 185, 129, 0.05)',
                        border: '1px solid rgba(16, 185, 129, 0.15)',
                        borderRadius: '16px',
                        textAlign: 'center',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '16px'
                    }}>
                        <CheckCircle size={48} style={{ color: 'var(--success)' }} />
                        <h4 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--success)' }}>Submission Successful!</h4>
                        <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                            {successMessage}
                        </p>
                        <button onClick={() => setSuccessMessage('')} className="btn-secondary" style={{ width: '100%', marginTop: '10px' }}>
                            Submit Another Inquiry
                        </button>
                    </div>
                ) : (
                    <form onSubmit={handleSubmitInquiry} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>Full Name</label>
                            <input 
                                type="text" 
                                className="glass-input" 
                                placeholder="Enter your name" 
                                required 
                                value={name} 
                                onChange={(e) => setName(e.target.value)} 
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>Email Address</label>
                            <input 
                                type="email" 
                                className="glass-input" 
                                placeholder="name@example.com" 
                                required 
                                value={email} 
                                onChange={(e) => setEmail(e.target.value)} 
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>Phone Number (Optional)</label>
                            <input 
                                type="tel" 
                                className="glass-input" 
                                placeholder="+91 98765 43210" 
                                value={phone} 
                                onChange={(e) => setPhone(e.target.value)} 
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>Course of Interest (Optional)</label>
                            <select 
                                className="glass-input" 
                                value={courseId} 
                                onChange={(e) => setCourseId(e.target.value)}
                            >
                                <option value="">-- Select Course --</option>
                                {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                            </select>
                        </div>
                        
                        <button type="submit" className="btn-primary" style={{ width: '100%', padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '10px' }}>
                            <Send size={16} /> Submit Request
                        </button>
                    </form>
                )}

                <div style={{ textAlign: 'center', borderTop: '1px solid var(--border-glass)', paddingTop: '16px' }}>
                    <Link href="/login" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'var(--primary)', textDecoration: 'none', fontSize: '0.85rem' }}>
                        <ArrowLeft size={14} /> Back to Sign In
                    </Link>
                </div>

            </div>
        </div>
    );
}
