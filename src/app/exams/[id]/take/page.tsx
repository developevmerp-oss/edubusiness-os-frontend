'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { apiRequest } from '../../../../utils/api';
import { 
    Clock, 
    ChevronLeft, 
    ChevronRight, 
    AlertCircle, 
    CheckCircle2, 
    Bookmark, 
    RotateCcw,
    Send,
    HelpCircle,
    Layers
} from 'lucide-react';

interface TakeExamPageProps {
    params: Promise<{ id: string }>;
}

type QuestionStatus = 'not_visited' | 'not_answered' | 'answered' | 'marked_for_review' | 'answered_marked_for_review';

export default function TakeExamPage({ params }: TakeExamPageProps) {
    const { id: examId } = use(params);
    const router = useRouter();

    const [exam, setExam] = useState<any>(null);
    const [questions, setQuestions] = useState<any[]>([]);
    const [attemptId, setAttemptId] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [currentIndex, setCurrentIndex] = useState(0);
    const [answers, setAnswers] = useState<Record<string, string>>({}); // questionId -> selectedAnswer
    const [statuses, setStatuses] = useState<Record<string, QuestionStatus>>({}); // questionId -> NTA status
    const [timeLeft, setTimeLeft] = useState(0); // in seconds
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);

    // Section filtering
    const [selectedSection, setSelectedSection] = useState<string>('All');

    useEffect(() => {
        initializeExamAttempt();
    }, [examId]);

    // Timer countdown loop
    useEffect(() => {
        if (timeLeft <= 0 || isSubmitting) return;

        const interval = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(interval);
                    autoSubmitExam();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [timeLeft, isSubmitting]);

    const initializeExamAttempt = async () => {
        setLoading(true);
        setError('');
        try {
            // 1. Fetch Exam Details
            const examData = await apiRequest(`/api/exams/${examId}`);
            setExam(examData.exam);

            // 2. Fetch Questions (anti-cheat: doesn't contain correct answers)
            const questionsData = await apiRequest(`/api/exams/${examId}/questions`);
            const fetchedQuestions = questionsData.questions || [];
            setQuestions(fetchedQuestions);

            // Initialize question status map (NTA pattern)
            const initialStatuses: Record<string, QuestionStatus> = {};
            fetchedQuestions.forEach((q: any, idx: number) => {
                initialStatuses[q.id] = idx === 0 ? 'not_answered' : 'not_visited';
            });
            setStatuses(initialStatuses);

            // 3. Initialize or Resume Attempt
            const attemptData = await apiRequest(`/api/exams/${examId}/attempt`, { method: 'POST' });
            setAttemptId(attemptData.attemptId);

            // 4. Calculate Time Left
            const startTimestamp = new Date(attemptData.startedAt).getTime();
            const elapsedSeconds = Math.floor((Date.now() - startTimestamp) / 1000);
            const totalDurationSeconds = examData.exam.duration_minutes * 60;
            const remaining = totalDurationSeconds - elapsedSeconds;

            if (remaining <= 0) {
                setError('The examination period has expired.');
                await apiRequest(`/api/exams/attempts/${attemptData.attemptId}/submit`, { method: 'POST' }).catch(() => {});
                return;
            }

            setTimeLeft(remaining);
        } catch (err: any) {
            setError(err.message || 'Failed to initialize exam session.');
        } finally {
            setLoading(false);
        }
    };

    // When student navigates to a question, mark as not_answered if it was not_visited
    const navigateToQuestion = (idx: number) => {
        const targetQ = questions[idx];
        if (!targetQ) return;

        setStatuses(prev => {
            if (prev[targetQ.id] === 'not_visited') {
                return { ...prev, [targetQ.id]: 'not_answered' };
            }
            return prev;
        });
        setCurrentIndex(idx);
    };

    const handleSelectOption = (option: string) => {
        const question = questions[currentIndex];
        setAnswers(prev => ({ ...prev, [question.id]: option }));
    };

    // NTA Action: Save & Next
    const handleSaveAndNext = async () => {
        const currentQ = questions[currentIndex];
        const selected = answers[currentQ.id];

        // Update status
        setStatuses(prev => ({
            ...prev,
            [currentQ.id]: selected ? 'answered' : 'not_answered'
        }));

        // Persist answer to server if selected
        if (selected) {
            try {
                await apiRequest(`/api/exams/attempts/${attemptId}/save`, {
                    method: 'POST',
                    body: JSON.stringify({ questionId: currentQ.id, selectedAnswer: selected })
                });
            } catch (err) {
                console.error('Failed to auto-save answer:', err);
            }
        }

        if (currentIndex < questions.length - 1) {
            navigateToQuestion(currentIndex + 1);
        }
    };

    // NTA Action: Mark for Review & Next
    const handleMarkForReviewAndNext = async () => {
        const currentQ = questions[currentIndex];
        const selected = answers[currentQ.id];

        setStatuses(prev => ({
            ...prev,
            [currentQ.id]: selected ? 'answered_marked_for_review' : 'marked_for_review'
        }));

        if (selected) {
            try {
                await apiRequest(`/api/exams/attempts/${attemptId}/save`, {
                    method: 'POST',
                    body: JSON.stringify({ questionId: currentQ.id, selectedAnswer: selected })
                });
            } catch (err) {
                console.error('Failed to auto-save answer:', err);
            }
        }

        if (currentIndex < questions.length - 1) {
            navigateToQuestion(currentIndex + 1);
        }
    };

    // NTA Action: Clear Response
    const handleClearResponse = () => {
        const currentQ = questions[currentIndex];
        setAnswers(prev => {
            const copy = { ...prev };
            delete copy[currentQ.id];
            return copy;
        });
        setStatuses(prev => ({
            ...prev,
            [currentQ.id]: 'not_answered'
        }));
    };

    const autoSubmitExam = async () => {
        setIsSubmitting(true);
        try {
            await apiRequest(`/api/exams/attempts/${attemptId}/submit`, { method: 'POST' });
            alert('Time limit reached! Your examination has been automatically submitted.');
            router.push(`/exams/${attemptId}/grade`);
        } catch (err: any) {
            alert('Failed to submit exam: ' + err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleConfirmFinalSubmit = async () => {
        setIsSubmitting(true);
        try {
            await apiRequest(`/api/exams/attempts/${attemptId}/submit`, { method: 'POST' });
            router.push(`/exams/${attemptId}/grade`);
        } catch (err: any) {
            alert(err.message || 'Submission failed.');
            setIsSubmitting(false);
        }
    };

    const formatTime = (seconds: number) => {
        const hours = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        if (hours > 0) {
            return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    // Compute NTA Palette Counters
    const counts = {
        answered: 0,
        not_answered: 0,
        not_visited: 0,
        marked_for_review: 0,
        answered_marked_for_review: 0,
    };

    questions.forEach(q => {
        const st = statuses[q.id] || 'not_visited';
        counts[st] = (counts[st] || 0) + 1;
    });

    if (loading) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#0a0b10', color: 'var(--text-secondary)' }}>
                Preparing examination environment...
            </div>
        );
    }

    if (error) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#0a0b10', gap: '20px' }}>
                <AlertCircle size={48} style={{ color: 'var(--danger)' }} />
                <div style={{ color: 'var(--text-primary)', fontSize: '1.2rem' }}>{error}</div>
                <button onClick={() => router.push('/exams')} className="btn-primary">Back to Exams</button>
            </div>
        );
    }

    if (!loading && (!questions || questions.length === 0)) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#0a0b10', gap: '20px', padding: '20px', textAlign: 'center' }}>
                <HelpCircle size={48} style={{ color: '#6366f1' }} />
                <div style={{ color: 'var(--text-primary)', fontSize: '1.3rem', fontWeight: 'bold' }}>No Questions Found in Exam</div>
                <p style={{ color: 'var(--text-secondary)', maxWidth: '420px', fontSize: '0.9rem', lineHeight: '1.5' }}>
                    This examination ("{exam?.title || 'Exam'}") does not have any questions added yet. Please add questions or generate them with AI from the Exam Management dashboard.
                </p>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <button onClick={() => router.push(`/exams/${examId}/generate`)} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        Generate with AI
                    </button>
                    <button onClick={() => router.push('/exams')} className="btn-secondary">
                        Back to Exams
                    </button>
                </div>
            </div>
        );
    }

    const currentQuestion = questions[currentIndex];
    const selectedAnswer = answers[currentQuestion?.id] || '';

    // Style helper for question palette buttons
    const getPaletteBtnStyle = (qId: string, idx: number) => {
        const st = statuses[qId] || 'not_visited';
        const isCurrent = currentIndex === idx;

        let bg = 'rgba(255,255,255,0.05)';
        let border = '1px solid rgba(255,255,255,0.1)';
        let color = '#cbd5e1';

        if (st === 'answered') {
            bg = '#10b981';
            border = '1px solid #059669';
            color = '#ffffff';
        } else if (st === 'not_answered') {
            bg = '#ef4444';
            border = '1px solid #dc2626';
            color = '#ffffff';
        } else if (st === 'marked_for_review') {
            bg = '#8b5cf6';
            border = '1px solid #7c3aed';
            color = '#ffffff';
        } else if (st === 'answered_marked_for_review') {
            bg = '#8b5cf6';
            border = '2px solid #10b981';
            color = '#ffffff';
        } else if (st === 'not_visited') {
            bg = '#334155';
            border = '1px solid #475569';
            color = '#cbd5e1';
        }

        return {
            background: bg,
            border: isCurrent ? '2px solid #facc15' : border,
            color,
            boxShadow: isCurrent ? '0 0 10px rgba(250, 204, 21, 0.5)' : 'none'
        };
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#090a10', color: 'var(--text-primary)', userSelect: 'none' }}>
            
            {/* Top Bar: Title, Subject Section Tabs & Real-Time NTA Countdown */}
            <header style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '14px 30px',
                borderBottom: '1px solid var(--border-glass)',
                background: 'rgba(15, 23, 42, 0.95)',
                backdropFilter: 'blur(10px)',
                zIndex: 20
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: '4px', background: 'rgba(99, 102, 241, 0.2)', border: '1px solid #6366f1', color: '#a5b4fc', fontWeight: 'bold' }}>
                                EXAM SIMULATOR (NTA PATTERN)
                            </span>
                            <h2 style={{ fontSize: '1.15rem', fontWeight: '700', color: '#f8fafc' }}>{exam.title}</h2>
                        </div>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                            Negative Marking: -{exam.negative_marks || '0.00'} | Total Marks: {exam.total_marks}
                        </span>
                    </div>

                    {/* Section Selector Tabs */}
                    <div style={{ display: 'flex', gap: '8px', marginLeft: '20px' }}>
                        {['All', 'Section 1 (Core)', 'Section 2 (Applied)'].map((sec) => (
                            <button
                                key={sec}
                                onClick={() => setSelectedSection(sec)}
                                style={{
                                    padding: '6px 12px',
                                    borderRadius: '6px',
                                    fontSize: '0.8rem',
                                    fontWeight: '600',
                                    border: '1px solid',
                                    borderColor: selectedSection === sec ? '#6366f1' : 'var(--border-glass)',
                                    background: selectedSection === sec ? 'rgba(99, 102, 241, 0.25)' : 'transparent',
                                    color: selectedSection === sec ? '#ffffff' : 'var(--text-secondary)',
                                    cursor: 'pointer'
                                }}
                            >
                                {sec}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Live Countdown Timer & Submit Trigger */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        background: timeLeft < 300 ? 'rgba(239, 68, 68, 0.2)' : 'rgba(15, 23, 42, 0.6)',
                        border: '1px solid',
                        borderColor: timeLeft < 300 ? '#ef4444' : 'rgba(255, 255, 255, 0.15)',
                        padding: '8px 18px',
                        borderRadius: '10px',
                        color: timeLeft < 300 ? '#f87171' : '#38bdf8',
                        fontWeight: '700',
                        fontSize: '1.05rem',
                        fontFamily: 'monospace'
                    }}>
                        <Clock size={18} />
                        <span>{formatTime(timeLeft)}</span>
                    </div>

                    <button 
                        onClick={() => setIsSubmitModalOpen(true)}
                        className="btn-primary"
                        style={{
                            background: 'linear-gradient(135deg, #10b981, #059669)',
                            boxShadow: '0 4px 15px rgba(16, 185, 129, 0.3)',
                            padding: '8px 20px',
                            fontSize: '0.9rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                        }}
                    >
                        <Send size={15} />
                        Submit Test
                    </button>
                </div>
            </header>

            {/* Main Test Arena: Left Workspace & Right NTA Palette Drawer */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', flex: 1, overflow: 'hidden' }}>
                
                {/* 1. Left Question Workspace */}
                <main style={{ padding: '30px 40px', overflowY: 'auto', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div className="glass-panel" style={{ padding: '32px', borderRadius: '16px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', background: 'rgba(15, 23, 42, 0.5)' }}>
                        <div>
                            {/* Question Header & Points */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-glass)', paddingBottom: '14px', marginBottom: '24px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <span style={{ fontSize: '1.1rem', fontWeight: '800', color: '#f8fafc' }}>
                                        Question {currentIndex + 1}
                                    </span>
                                    <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', padding: '3px 8px', borderRadius: '4px', background: 'rgba(255,255,255,0.06)', color: 'var(--text-secondary)' }}>
                                        {currentQuestion.type === 'mcq' ? 'Single Choice (MCQ)' : currentQuestion.type.replace('_', ' ').toUpperCase()}
                                    </span>
                                </div>
                                <div style={{ display: 'flex', gap: '12px', fontSize: '0.85rem' }}>
                                    <span style={{ color: '#10b981', fontWeight: '600' }}>+4.00 Marks</span>
                                    <span style={{ color: '#ef4444', fontWeight: '600' }}>-{exam.negative_marks || '1.00'} Penalty</span>
                                </div>
                            </div>

                            {/* Question Text */}
                            <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '32px', lineHeight: '1.6', color: '#f1f5f9' }}>
                                {currentQuestion.question_text}
                            </h3>

                            {/* Option Choices */}
                            {currentQuestion.type === 'mcq' && currentQuestion.options && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                                    {currentQuestion.options.map((option: string, oIdx: number) => {
                                        const isSelected = selectedAnswer === option;
                                        return (
                                            <div 
                                                key={oIdx}
                                                onClick={() => handleSelectOption(option)}
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '14px',
                                                    padding: '16px 20px',
                                                    borderRadius: '10px',
                                                    border: '1px solid',
                                                    borderColor: isSelected ? '#6366f1' : 'rgba(255, 255, 255, 0.08)',
                                                    background: isSelected ? 'rgba(99, 102, 241, 0.15)' : 'rgba(255, 255, 255, 0.02)',
                                                    cursor: 'pointer',
                                                    transition: 'all 0.15s ease'
                                                }}
                                            >
                                                <div style={{
                                                    width: '24px', height: '24px',
                                                    borderRadius: '50%',
                                                    border: '2px solid',
                                                    borderColor: isSelected ? '#6366f1' : '#64748b',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    fontSize: '0.8rem',
                                                    fontWeight: '700',
                                                    color: isSelected ? '#ffffff' : '#94a3b8',
                                                    background: isSelected ? '#6366f1' : 'transparent'
                                                }}>
                                                    {String.fromCharCode(65 + oIdx)}
                                                </div>
                                                <span style={{ fontSize: '1rem', color: isSelected ? '#ffffff' : '#cbd5e1' }}>{option}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {currentQuestion.type === 'true_false' && (
                                <div style={{ display: 'flex', gap: '20px' }}>
                                    {['true', 'false'].map((option) => {
                                        const isSelected = selectedAnswer === option;
                                        return (
                                            <button
                                                key={option}
                                                type="button"
                                                onClick={() => handleSelectOption(option)}
                                                className={isSelected ? 'btn-primary' : 'btn-secondary'}
                                                style={{ flex: 1, padding: '18px', textTransform: 'uppercase', fontWeight: '700', fontSize: '1rem' }}
                                            >
                                                {option}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}

                            {(currentQuestion.type === 'fill_blank' || currentQuestion.type === 'descriptive') && (
                                <div>
                                    <textarea
                                        className="glass-input"
                                        rows={currentQuestion.type === 'descriptive' ? 6 : 2}
                                        value={selectedAnswer}
                                        onChange={(e) => handleSelectOption(e.target.value)}
                                        placeholder="Type your structured solution response here..."
                                        style={{ fontFamily: 'inherit', resize: 'vertical', fontSize: '0.95rem' }}
                                    />
                                </div>
                            )}
                        </div>

                        {/* NTA Operational Action Bar */}
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginTop: '40px',
                            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                            paddingTop: '20px'
                        }}>
                            <div style={{ display: 'flex', gap: '12px' }}>
                                <button 
                                    onClick={handleMarkForReviewAndNext}
                                    style={{
                                        padding: '10px 18px',
                                        borderRadius: '8px',
                                        background: 'rgba(139, 92, 246, 0.15)',
                                        border: '1px solid #8b5cf6',
                                        color: '#c4b5fd',
                                        fontWeight: '600',
                                        fontSize: '0.85rem',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px'
                                    }}
                                >
                                    <Bookmark size={15} />
                                    Mark for Review & Next
                                </button>

                                <button 
                                    onClick={handleClearResponse}
                                    style={{
                                        padding: '10px 16px',
                                        borderRadius: '8px',
                                        background: 'rgba(255, 255, 255, 0.04)',
                                        border: '1px solid rgba(255, 255, 255, 0.1)',
                                        color: '#cbd5e1',
                                        fontWeight: '600',
                                        fontSize: '0.85rem',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px'
                                    }}
                                >
                                    <RotateCcw size={15} />
                                    Clear Response
                                </button>
                            </div>

                            <div style={{ display: 'flex', gap: '12px' }}>
                                <button 
                                    onClick={() => currentIndex > 0 && navigateToQuestion(currentIndex - 1)}
                                    className="btn-secondary"
                                    disabled={currentIndex === 0}
                                    style={{ padding: '10px 20px', display: 'flex', alignItems: 'center', gap: '6px' }}
                                >
                                    <ChevronLeft size={16} /> Previous
                                </button>

                                <button 
                                    onClick={handleSaveAndNext}
                                    className="btn-primary"
                                    style={{ padding: '10px 24px', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '700' }}
                                >
                                    Save & Next <ChevronRight size={16} />
                                </button>
                            </div>
                        </div>
                    </div>
                </main>

                {/* 2. Right NTA Question Palette & Real-Time Legend */}
                <aside style={{
                    background: 'rgba(15, 23, 42, 0.7)',
                    borderLeft: '1px solid var(--border-glass)',
                    padding: '24px 20px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    overflowY: 'auto'
                }}>
                    <div>
                        {/* Legend Grid with Authentic NTA 5-States */}
                        <div style={{ marginBottom: '24px' }}>
                            <h4 style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '14px' }}>
                                Question Palette Legend
                            </h4>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '0.78rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span style={{ width: '22px', height: '22px', borderRadius: '4px', background: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: '#fff' }}>
                                        {counts.answered}
                                    </span>
                                    <span>Answered</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span style={{ width: '22px', height: '22px', borderRadius: '4px', background: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: '#fff' }}>
                                        {counts.not_answered}
                                    </span>
                                    <span>Not Answered</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span style={{ width: '22px', height: '22px', borderRadius: '4px', background: '#334155', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: '#cbd5e1' }}>
                                        {counts.not_visited}
                                    </span>
                                    <span>Not Visited</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span style={{ width: '22px', height: '22px', borderRadius: '4px', background: '#8b5cf6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: '#fff' }}>
                                        {counts.marked_for_review}
                                    </span>
                                    <span>Marked for Review</span>
                                </div>
                                <div style={{ gridColumn: 'span 2', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span style={{ width: '22px', height: '22px', borderRadius: '4px', background: '#8b5cf6', border: '2px solid #10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: '#fff' }}>
                                        {counts.answered_marked_for_review}
                                    </span>
                                    <span>Ans & Marked (Evaluated)</span>
                                </div>
                            </div>
                        </div>

                        <hr style={{ border: 'none', borderTop: '1px solid var(--border-glass)', marginBottom: '20px' }} />

                        {/* Question Number Tiles */}
                        <h4 style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '14px' }}>
                            Choose a Question:
                        </h4>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
                            {questions.map((q, idx) => {
                                const btnStyle = getPaletteBtnStyle(q.id, idx);
                                return (
                                    <button
                                        key={q.id}
                                        onClick={() => navigateToQuestion(idx)}
                                        style={{
                                            height: '42px',
                                            borderRadius: '6px',
                                            cursor: 'pointer',
                                            fontWeight: '700',
                                            fontSize: '0.9rem',
                                            transition: 'all 0.15s ease',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            position: 'relative',
                                            ...btnStyle
                                        }}
                                    >
                                        {idx + 1}
                                        {statuses[q.id] === 'answered_marked_for_review' && (
                                            <span style={{
                                                position: 'absolute',
                                                bottom: '3px',
                                                right: '3px',
                                                width: '6px',
                                                height: '6px',
                                                borderRadius: '50%',
                                                background: '#10b981'
                                            }} />
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Bottom Student Profile Card */}
                    <div style={{
                        marginTop: '20px',
                        padding: '14px',
                        borderRadius: '10px',
                        background: 'rgba(255, 255, 255, 0.03)',
                        border: '1px solid var(--border-glass)',
                        fontSize: '0.8rem',
                        color: 'var(--text-secondary)'
                    }}>
                        <div style={{ fontWeight: '600', color: '#f8fafc', marginBottom: '4px' }}>Candidate: Student Demo</div>
                        <div>Roll: 2026-NTA-JEE-0842</div>
                    </div>
                </aside>
            </div>

            {/* Pre-Submission NTA Summary Dialog Modal */}
            {isSubmitModalOpen && (
                <div style={{
                    position: 'fixed',
                    top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0, 0, 0, 0.75)',
                    backdropFilter: 'blur(6px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 100
                }}>
                    <div className="glass-panel" style={{ width: '480px', padding: '32px', borderRadius: '16px', background: '#0f172a' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                            <CheckCircle2 size={24} style={{ color: '#10b981' }} />
                            <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#f8fafc' }}>Confirm Test Submission</h3>
                        </div>

                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginBottom: '20px' }}>
                            Please review your examination status breakdown below before final submission:
                        </p>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', background: 'rgba(0,0,0,0.3)', padding: '16px', borderRadius: '10px', marginBottom: '24px', fontSize: '0.85rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span>Total Questions:</span>
                                <strong>{questions.length}</strong>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#34d399' }}>
                                <span>Answered:</span>
                                <strong>{counts.answered}</strong>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#f87171' }}>
                                <span>Not Answered:</span>
                                <strong>{counts.not_answered}</strong>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#c4b5fd' }}>
                                <span>Marked for Review:</span>
                                <strong>{counts.marked_for_review}</strong>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#818cf8' }}>
                                <span>Answered & Marked (Evaluated):</span>
                                <strong>{counts.answered_marked_for_review}</strong>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8' }}>
                                <span>Not Visited:</span>
                                <strong>{counts.not_visited}</strong>
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button 
                                onClick={handleConfirmFinalSubmit}
                                className="btn-primary"
                                style={{ flex: 1, padding: '12px', background: 'linear-gradient(135deg, #10b981, #059669)', fontWeight: '700' }}
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? 'Evaluating Score...' : 'Yes, Submit Test'}
                            </button>
                            <button 
                                onClick={() => setIsSubmitModalOpen(false)}
                                className="btn-secondary"
                                style={{ flex: 1, padding: '12px' }}
                                disabled={isSubmitting}
                            >
                                Resume Test
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
