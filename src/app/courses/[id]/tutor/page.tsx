'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import SidebarLayout from '../../../../components/SidebarLayout';
import { apiRequest } from '../../../../utils/api';
import { Send, ArrowLeft, Bot, User, Sparkles } from 'lucide-react';
import Link from 'next/link';

interface TutorPageProps {
    params: Promise<{ id: string }>; // courseId
}

export default function StudentTutorPage({ params }: TutorPageProps) {
    const { id: courseId } = use(params);
    const router = useRouter();

    const [course, setCourse] = useState<any>(null);
    const [messages, setMessages] = useState<any[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(true);
    const [isSending, setIsSending] = useState(false);

    const suggestPills = [
        "Explain Coulomb's Law",
        "Explain Gauss's Law",
        "Explain First Law of Thermodynamics"
    ];

    useEffect(() => {
        fetchCourseAndChats();
    }, [courseId]);

    const fetchCourseAndChats = async () => {
        setLoading(true);
        try {
            const courseData = await apiRequest(`/api/courses/${courseId}`);
            setCourse(courseData.course);

            const chatsData = await apiRequest(`/api/ai/tutor/chat/${courseId}`);
            setMessages(chatsData.chats);
        } catch (err) {
            console.error('Failed to load chats:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSendMessage = async (msgText: string) => {
        if (!msgText.trim() || isSending) return;

        setIsSending(true);
        // Optimistically append student message
        const studentMsg = { id: `temp-${Date.now()}`, message: msgText, response: '...', created_at: new Date().toISOString() };
        setMessages(prev => [...prev, studentMsg]);
        setInput('');

        try {
            const data = await apiRequest('/api/ai/tutor/chat', {
                method: 'POST',
                body: JSON.stringify({ courseId, message: msgText })
            });

            // Update thread with response
            setMessages(prev => 
                prev.map(m => m.id === studentMsg.id ? data.chat : m)
            );
        } catch (err: any) {
            alert(err.message || 'Failed to communicate with AI Tutor.');
            // remove temp
            setMessages(prev => prev.filter(m => m.id !== studentMsg.id));
        } finally {
            setIsSending(false);
        }
    };

    if (loading) {
        return (
            <SidebarLayout>
                <div style={{ color: 'var(--text-secondary)' }}>Preparing AI tutor instance...</div>
            </SidebarLayout>
        );
    }

    return (
        <SidebarLayout>
            <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 80px)', gap: '20px' }}>
                {/* Header Back navigation */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', borderBottom: '1px solid var(--border-glass)', paddingBottom: '16px' }}>
                    <Link href={`/courses/${courseId}`} style={{ color: 'var(--text-muted)' }}>
                        <ArrowLeft size={20} />
                    </Link>
                    <div>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: '700' }}>AI Tutor: {course?.title}</h2>
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Ask questions about Coulomb''s Law, electric field intensity, or Gauss''s Law</span>
                    </div>
                </div>

                {/* Conversation area */}
                <div className="glass-panel" style={{
                    flex: 1,
                    borderRadius: '16px',
                    padding: '24px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    overflow: 'hidden'
                }}>
                    <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px', paddingBottom: '20px' }}>
                        {messages.length === 0 ? (
                            <div style={{
                                textAlign: 'center',
                                margin: 'auto',
                                maxWidth: '360px',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: '16px',
                                color: 'var(--text-muted)'
                            }}>
                                <Bot size={48} style={{ color: 'var(--primary)', opacity: 0.8 }} />
                                <h4 style={{ color: 'var(--text-primary)' }}>Personal AI Learning Assistant</h4>
                                <p style={{ fontSize: '0.85rem', lineHeight: '1.6' }}>
                                    Ask me about formulas, laws, derivations, or course notes summaries. Let''s clear your doubts!
                                </p>
                            </div>
                        ) : (
                            messages.map((msg) => (
                                <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    {/* Student message */}
                                    <div style={{ display: 'flex', gap: '12px', alignSelf: 'flex-end', maxWidth: '80%' }}>
                                        <div style={{
                                            background: 'var(--primary)',
                                            color: '#ffffff',
                                            padding: '12px 18px',
                                            borderRadius: '16px 16px 0 16px',
                                            fontSize: '0.9rem',
                                            lineHeight: '1.5'
                                        }}>
                                            {msg.message}
                                        </div>
                                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <User size={16} />
                                        </div>
                                    </div>

                                    {/* AI Tutor response */}
                                    <div style={{ display: 'flex', gap: '12px', alignSelf: 'flex-start', maxWidth: '80%' }}>
                                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(var(--primary-rgb), 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
                                            <Bot size={16} />
                                        </div>
                                        <div style={{
                                            background: 'rgba(255,255,255,0.02)',
                                            border: '1px solid var(--border-glass)',
                                            padding: '12px 18px',
                                            borderRadius: '16px 16px 16px 0',
                                            fontSize: '0.9rem',
                                            lineHeight: '1.5',
                                            color: 'var(--text-primary)'
                                        }}>
                                            {msg.response}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Pre-made pills + textbox inputs */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', borderTop: '1px solid var(--border-glass)', paddingTop: '16px' }}>
                        {/* Suggest pills */}
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                            {suggestPills.map((pill, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => handleSendMessage(pill)}
                                    className="btn-secondary"
                                    style={{ padding: '6px 12px', fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                                    disabled={isSending}
                                >
                                    <Sparkles size={12} style={{ color: 'var(--primary)' }} />
                                    {pill}
                                </button>
                            ))}
                        </div>

                        {/* Text form inputs */}
                        <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(input); }} style={{ display: 'flex', gap: '10px' }}>
                            <input 
                                type="text" 
                                className="glass-input" 
                                placeholder="Ask AI tutor anything..." 
                                required
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                style={{ flex: 1, padding: '12px 16px' }}
                                disabled={isSending}
                            />
                            <button type="submit" className="btn-primary" style={{ padding: '0 20px' }} disabled={isSending}>
                                <Send size={16} />
                            </button>
                        </form>
                    </div>

                </div>
            </div>
        </SidebarLayout>
    );
}
