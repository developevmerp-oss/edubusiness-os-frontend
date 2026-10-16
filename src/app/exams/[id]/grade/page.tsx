'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import SidebarLayout from '../../../../components/SidebarLayout';
import { apiRequest } from '../../../../utils/api';
import { Award, CheckCircle, XCircle, Clock, AlertCircle, ArrowLeft, ShieldCheck, ShieldAlert } from 'lucide-react';
import Link from 'next/link';

interface GradePageProps {
    params: Promise<{ id: string }>; // parameter is the attemptId
}

export default function GradePage({ params }: GradePageProps) {
    const { id: attemptId } = use(params);
    const router = useRouter();

    const [scorecard, setScorecard] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchScorecard();
    }, [attemptId]);

    const fetchScorecard = async () => {
        setLoading(true);
        setError('');
        try {
            const data = await apiRequest(`/api/exams/attempts/${attemptId}/scorecard`);
            setScorecard(data);
        } catch (err: any) {
            setError(err.message || 'Failed to load scorecard results.');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <SidebarLayout>
                <div style={{ color: 'var(--text-secondary)' }}>Retrieving examination scorecard...</div>
            </SidebarLayout>
        );
    }

    if (error || !scorecard) {
        return (
            <SidebarLayout>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 0', gap: '16px' }}>
                    <AlertCircle size={48} style={{ color: 'var(--danger)' }} />
                    <h3 style={{ color: 'var(--text-primary)' }}>Failed to load scorecard</h3>
                    <p style={{ color: 'var(--text-muted)' }}>{error}</p>
                    <Link href="/exams" className="btn-primary">Back to Exams</Link>
                </div>
            </SidebarLayout>
        );
    }

    const { attempt, answers } = scorecard;
    const isDescriptivePending = attempt.status === 'completed'; // descriptive requires teacher review

    return (
        <SidebarLayout>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                {/* Header back navigation */}
                <div>
                    <Link href="/exams" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'var(--primary)', textDecoration: 'none', fontSize: '0.9rem', marginBottom: '16px' }}>
                        <ArrowLeft size={16} /> Back to Examinations List
                    </Link>
                    <h1 className="gradient-text" style={{ fontSize: '2.2rem', fontWeight: '800' }}>
                        Examination Results
                    </h1>
                    <p style={{ color: 'var(--text-secondary)' }}>
                        Performance scorecard evaluation.
                    </p>
                </div>

                {/* Scorecard Summary Board */}
                <div className="glass-panel" style={{
                    padding: '40px',
                    borderRadius: '20px',
                    background: 'linear-gradient(135deg, rgba(var(--primary-rgb), 0.05) 0%, rgba(var(--secondary-rgb), 0.03) 100%)',
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '30px',
                    alignItems: 'center'
                }}>
                    <div>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Exam Title</span>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginTop: '6px' }}>{attempt.exam_title}</h2>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Attempted by {attempt.first_name} {attempt.last_name}</span>
                    </div>

                    <div style={{ textAlign: 'center' }}>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</span>
                        <div style={{ marginTop: '8px' }}>
                            <span style={{
                                padding: '6px 12px',
                                borderRadius: '8px',
                                fontSize: '0.8rem',
                                fontWeight: '700',
                                background: attempt.status === 'graded' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                                color: attempt.status === 'graded' ? '#34d399' : '#fbbf24'
                            }}>
                                {attempt.status === 'graded' ? 'GRADED' : 'PENDING GRADING'}
                            </span>
                        </div>
                    </div>

                    <div style={{ textAlign: 'center' }}>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Final Score</span>
                        <h3 style={{ fontSize: '2.5rem', fontWeight: '800', marginTop: '4px', color: attempt.status === 'graded' ? 'var(--text-primary)' : 'var(--warning)' }}>
                            {attempt.status === 'graded' ? `${attempt.score} / ${attempt.total_marks}` : '—'}
                        </h3>
                        {attempt.status === 'graded' && (
                            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                                Percentage: {Math.round((parseFloat(attempt.score) / parseFloat(attempt.total_marks)) * 100)}%
                            </span>
                        )}
                    </div>
                </div>

                {/* Proctoring & Session Integrity Audit Card */}
                <div className="glass-panel" style={{
                    padding: '24px 30px',
                    borderRadius: '16px',
                    border: '1px solid',
                    borderColor: attempt.submission_reason === 'terminated_tab_switch_limit' 
                        ? 'rgba(239, 68, 68, 0.4)' 
                        : (attempt.tab_switch_count || 0) > 0 
                            ? 'rgba(245, 158, 11, 0.4)' 
                            : 'rgba(16, 185, 129, 0.4)',
                    background: attempt.submission_reason === 'terminated_tab_switch_limit'
                        ? 'rgba(239, 68, 68, 0.05)'
                        : (attempt.tab_switch_count || 0) > 0
                            ? 'rgba(245, 158, 11, 0.05)'
                            : 'rgba(16, 185, 129, 0.05)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '16px'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                            <div style={{
                                width: '44px',
                                height: '44px',
                                borderRadius: '12px',
                                background: attempt.submission_reason === 'terminated_tab_switch_limit'
                                    ? 'rgba(239, 68, 68, 0.2)'
                                    : (attempt.tab_switch_count || 0) > 0
                                        ? 'rgba(245, 158, 11, 0.2)'
                                        : 'rgba(16, 185, 129, 0.2)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                {attempt.submission_reason === 'terminated_tab_switch_limit' ? (
                                    <ShieldAlert size={24} style={{ color: '#ef4444' }} />
                                ) : (attempt.tab_switch_count || 0) > 0 ? (
                                    <ShieldAlert size={24} style={{ color: '#f59e0b' }} />
                                ) : (
                                    <ShieldCheck size={24} style={{ color: '#10b981' }} />
                                )}
                            </div>
                            <div>
                                <h4 style={{ fontSize: '1.05rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                                    Session Integrity & Proctoring Audit
                                </h4>
                                <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                                    {attempt.submission_reason === 'terminated_tab_switch_limit'
                                        ? 'Test Auto-Terminated due to multiple unauthorized tab navigation events.'
                                        : (attempt.tab_switch_count || 0) > 0
                                            ? `${attempt.tab_switch_count} tab switch warning(s) logged during examination.`
                                            : 'High Integrity: 0 tab violations recorded. Clean session.'}
                                </span>
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                            <div style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Tab Strikes</div>
                                <div style={{
                                    fontSize: '1.1rem',
                                    fontWeight: '800',
                                    color: (attempt.tab_switch_count || 0) >= 3 ? '#ef4444' : (attempt.tab_switch_count || 0) > 0 ? '#f59e0b' : '#10b981'
                                }}>
                                    {attempt.tab_switch_count || 0} / {attempt.max_tab_switches || 3}
                                </div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Submission Type</div>
                                <span style={{
                                    fontSize: '0.75rem',
                                    padding: '4px 10px',
                                    borderRadius: '6px',
                                    fontWeight: '700',
                                    background: attempt.submission_reason === 'terminated_tab_switch_limit' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                                    color: attempt.submission_reason === 'terminated_tab_switch_limit' ? '#f87171' : '#34d399'
                                }}>
                                    {attempt.submission_reason === 'terminated_tab_switch_limit' ? 'DISQUALIFIED / AUTO-SUBMITTED' : attempt.submission_reason === 'timer_expired' ? 'TIMER AUTO-SUBMIT' : 'MANUAL SUBMIT'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Detailed Flags Trail if any */}
                    {Array.isArray(attempt.proctoring_flags) && attempt.proctoring_flags.length > 0 && (
                        <div style={{ borderTop: '1px solid var(--border-glass)', paddingTop: '12px', marginTop: '4px' }}>
                            <span style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-secondary)' }}>Security Violation Timeline:</span>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px' }}>
                                {attempt.proctoring_flags.map((flag: any, fIdx: number) => (
                                    <div key={fIdx} style={{
                                        fontSize: '0.75rem',
                                        padding: '4px 10px',
                                        borderRadius: '6px',
                                        background: 'rgba(0,0,0,0.3)',
                                        border: '1px solid rgba(255,255,255,0.08)',
                                        color: '#cbd5e1'
                                    }}>
                                        <strong style={{ color: '#fbbf24' }}>Strike #{flag.strikeNumber || (fIdx + 1)}:</strong> {flag.details || flag.reason} ({new Date(flag.timestamp).toLocaleTimeString()})
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {isDescriptivePending && (
                    <div style={{
                        padding: '16px 20px',
                        background: 'rgba(245, 158, 11, 0.1)',
                        border: '1px solid rgba(245, 158, 11, 0.2)',
                        color: '#fde047',
                        borderRadius: '10px',
                        fontSize: '0.9rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px'
                    }}>
                        <AlertCircle size={20} />
                        <div>
                            <strong>Descriptive Questions require review:</strong> The exam contains subjective questions that require manual evaluation. Total score will update once graded by the lecturer.
                        </div>
                    </div>
                )}

                {/* Questions Answers Details list */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: '700' }}>Question Reviews</h3>
                    
                    {answers.map((ans: any, idx: number) => {
                        const isMCQorTF = ans.type === 'mcq' || ans.type === 'true_false';
                        const isAnswered = ans.selected_answer !== null && ans.selected_answer !== undefined;
                        const isGraded = ans.is_correct !== null;

                        return (
                            <div 
                                key={ans.question_id}
                                className="glass-panel"
                                style={{
                                    padding: '24px',
                                    borderRadius: '12px',
                                    borderLeft: '4px solid',
                                    borderColor: !isGraded ? 'var(--warning)' : 
                                                 ans.is_correct ? 'var(--success)' : 'var(--danger)',
                                    background: 'rgba(255,255,255,0.01)'
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                    <span style={{ fontWeight: '600' }}>Question {idx + 1} ({ans.type.toUpperCase()})</span>
                                    {isGraded && (
                                        <span style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '6px',
                                            fontWeight: '700',
                                            color: ans.is_correct ? '#34d399' : '#f87171'
                                        }}>
                                            {ans.is_correct ? <CheckCircle size={16} /> : <XCircle size={16} />}
                                            {ans.is_correct ? 'Correct' : 'Incorrect'}
                                        </span>
                                    )}
                                </div>

                                <p style={{ fontSize: '0.95rem', color: 'var(--text-primary)', marginBottom: '16px', lineHeight: '1.5' }}>
                                    {ans.question_text}
                                </p>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.9rem', marginBottom: '16px' }}>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <span style={{ color: 'var(--text-muted)', width: '120px', flexShrink: 0 }}>Your Answer:</span>
                                        <span style={{ fontWeight: '500', color: isAnswered ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                                            {isAnswered ? ans.selected_answer : 'Skipped / Unanswered'}
                                        </span>
                                    </div>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <span style={{ color: 'var(--text-muted)', width: '120px', flexShrink: 0 }}>Correct Answer:</span>
                                        <span style={{ fontWeight: '600', color: '#34d399' }}>{ans.correct_answer}</span>
                                    </div>
                                </div>

                                {ans.explanation && (
                                    <div style={{
                                        padding: '12px 16px',
                                        background: 'rgba(255,255,255,0.02)',
                                        border: '1px solid var(--border-glass)',
                                        borderRadius: '8px',
                                        fontSize: '0.85rem'
                                    }}>
                                        <strong style={{ color: 'var(--primary)', display: 'block', marginBottom: '4px' }}>Solution Explanation:</strong>
                                        <span style={{ color: 'var(--text-secondary)', lineHeight: '1.5' }}>{ans.explanation}</span>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </SidebarLayout>
    );
}
