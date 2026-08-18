'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { apiRequest } from '../../../../utils/api';
import { Clock, ChevronLeft, ChevronRight, CheckSquare, AlertCircle } from 'lucide-react';

interface TakeExamPageProps {
    params: Promise<{ id: string }>;
}

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
    const [timeLeft, setTimeLeft] = useState(0); // in seconds
    const [isSubmitting, setIsSubmitting] = useState(false);

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
            setQuestions(questionsData.questions);

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
                // Auto submit if ongoing
                await apiRequest(`/api/exams/attempts/${attemptData.attemptId}/submit`, { method: 'POST' }).catch(() => {});
                return;
            }

            setTimeLeft(remaining);

            // If resuming, fetch already saved answers from scorecard API (optional stub, or start clean)
            // For now, start with empty answer state
        } catch (err: any) {
            setError(err.message || 'Failed to initialize exam session.');
        } finally {
            setLoading(false);
        }
    };

    const handleSelectAnswer = async (answer: string) => {
        const question = questions[currentIndex];
        const newAnswers = { ...answers, [question.id]: answer };
        setAnswers(newAnswers);

        // Save intermediate state to server
        try {
            await apiRequest(`/api/exams/attempts/${attemptId}/save`, {
                method: 'POST',
                body: JSON.stringify({ questionId: question.id, selectedAnswer: answer })
            });
        } catch (err) {
            console.error('Failed to auto-save answer on server:', err);
        }
    };

    const handleNext = () => {
        if (currentIndex < questions.length - 1) {
            setCurrentIndex(prev => prev + 1);
        }
    };

    const handlePrev = () => {
        if (currentIndex > 0) {
            setCurrentIndex(prev => prev - 1);
        }
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

    const handleSubmit = async () => {
        const answeredCount = Object.keys(answers).length;
        const totalCount = questions.length;
        if (!confirm(`You have answered ${answeredCount} out of ${totalCount} questions. Are you sure you want to submit?`)) return;

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
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

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

    const currentQuestion = questions[currentIndex];
    const selectedAnswer = answers[currentQuestion.id] || '';

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#0a0b10', color: 'var(--text-primary)' }}>
            {/* Header Timer Bar */}
            <header style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '20px 40px',
                borderBottom: '1px solid var(--border-glass)',
                background: 'rgba(15, 23, 42, 0.8)',
                backdropFilter: 'var(--blur-glass)'
            }}>
                <div>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: '700' }}>{exam.title}</h2>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Question {currentIndex + 1} of {questions.length}</span>
                </div>

                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    background: timeLeft < 60 ? 'rgba(239, 68, 68, 0.15)' : 'rgba(255,255,255,0.03)',
                    border: '1px solid',
                    borderColor: timeLeft < 60 ? 'var(--danger)' : 'var(--border-glass)',
                    padding: '10px 20px',
                    borderRadius: '12px',
                    color: timeLeft < 60 ? '#f87171' : 'var(--text-primary)',
                    fontWeight: '700',
                    fontSize: '1.1rem'
                }}>
                    <Clock size={18} />
                    <span>{formatTime(timeLeft)}</span>
                </div>
            </header>

            {/* Test Arena Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', flex: 1, overflow: 'hidden' }}>
                {/* Left Area - Active Question Card */}
                <main style={{ padding: '40px', overflowY: 'auto', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div className="glass-panel" style={{ padding: '40px', borderRadius: '16px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                        <div>
                            <span style={{
                                textTransform: 'uppercase',
                                fontSize: '0.75rem',
                                color: 'var(--primary)',
                                fontWeight: '700',
                                display: 'block',
                                marginBottom: '12px'
                            }}>
                                Type: {currentQuestion.type === 'mcq' ? 'Multiple Choice' : currentQuestion.type.replace('_', ' ').toUpperCase()}
                            </span>
                            <h3 style={{ fontSize: '1.35rem', fontWeight: '600', marginBottom: '32px', lineHeight: '1.6' }}>
                                {currentQuestion.question_text}
                            </h3>

                            {/* Render answer inputs dynamically */}
                            {currentQuestion.type === 'mcq' && currentQuestion.options && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                                    {currentQuestion.options.map((option: string, oIdx: number) => {
                                        const isSelected = selectedAnswer === option;
                                        return (
                                            <div 
                                                key={oIdx}
                                                onClick={() => handleSelectAnswer(option)}
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '12px',
                                                    padding: '16px 20px',
                                                    borderRadius: '10px',
                                                    border: '1px solid',
                                                    borderColor: isSelected ? 'var(--primary)' : 'var(--border-glass)',
                                                    background: isSelected ? 'rgba(var(--primary-rgb), 0.05)' : 'rgba(255,255,255,0.01)',
                                                    cursor: 'pointer',
                                                    transition: 'all 0.2s ease'
                                                }}
                                            >
                                                <div style={{
                                                    width: '20px', height: '20px',
                                                    borderRadius: '50%',
                                                    border: '2px solid',
                                                    borderColor: isSelected ? 'var(--primary)' : 'var(--text-muted)',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                                                }}>
                                                    {isSelected && <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--primary)' }} />}
                                                </div>
                                                <span style={{ fontSize: '0.95rem' }}>{option}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {currentQuestion.type === 'true_false' && (
                                <div style={{ display: 'flex', gap: '16px' }}>
                                    {['true', 'false'].map((option) => {
                                        const isSelected = selectedAnswer === option;
                                        return (
                                            <button
                                                key={option}
                                                type="button"
                                                onClick={() => handleSelectAnswer(option)}
                                                className={isSelected ? 'btn-primary' : 'btn-secondary'}
                                                style={{ flex: 1, padding: '16px', textTransform: 'uppercase', fontWeight: '600' }}
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
                                        onChange={(e) => handleSelectAnswer(e.target.value)}
                                        placeholder="Type your response here..."
                                        style={{ fontFamily: 'inherit', resize: 'vertical' }}
                                    />
                                </div>
                            )}
                        </div>

                        {/* Navigation controls */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '40px', borderTop: '1px solid rgba(255,255,255,0.03)', paddingTop: '24px' }}>
                            <button onClick={handlePrev} className="btn-secondary" disabled={currentIndex === 0}>
                                <ChevronLeft size={16} /> Prev
                            </button>
                            {currentIndex < questions.length - 1 ? (
                                <button onClick={handleNext} className="btn-primary">
                                    Next <ChevronRight size={16} />
                                </button>
                            ) : (
                                <button onClick={handleSubmit} className="btn-primary" style={{ background: 'linear-gradient(135deg, #10b981, #059669)', boxShadow: '0 4px 15px rgba(16, 185, 129, 0.3)' }} disabled={isSubmitting}>
                                    Submit Exam
                                </button>
                            )}
                        </div>
                    </div>
                </main>

                {/* Right Area - Question Navigation grid */}
                <aside style={{
                    background: 'rgba(15, 23, 42, 0.4)',
                    borderLeft: '1px solid var(--border-glass)',
                    padding: '30px 20px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between'
                }}>
                    <div>
                        <h4 style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '20px' }}>
                            Questions Map
                        </h4>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
                            {questions.map((q, idx) => {
                                const isAnswered = !!answers[q.id];
                                const isActive = currentIndex === idx;
                                return (
                                    <button
                                        key={q.id}
                                        onClick={() => setCurrentIndex(idx)}
                                        style={{
                                            height: '42px',
                                            borderRadius: '8px',
                                            border: '1px solid',
                                            cursor: 'pointer',
                                            fontWeight: '600',
                                            fontSize: '0.9rem',
                                            background: isActive ? 'var(--primary)' : isAnswered ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255,255,255,0.02)',
                                            borderColor: isActive ? 'var(--primary)' : isAnswered ? 'var(--success)' : 'var(--border-glass)',
                                            color: isActive ? '#ffffff' : isAnswered ? '#34d399' : 'var(--text-secondary)'
                                        }}
                                    >
                                        {idx + 1}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                            <div style={{ width: '12px', height: '12px', borderRadius: '4px', background: 'var(--primary)' }} /> Active Question
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                            <div style={{ width: '12px', height: '12px', borderRadius: '4px', background: 'rgba(16, 185, 129, 0.2)', border: '1px solid var(--success)' }} /> Answered
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                            <div style={{ width: '12px', height: '12px', borderRadius: '4px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-glass)' }} /> Unanswered
                        </div>
                    </div>
                </aside>
            </div>
        </div>
    );
}
