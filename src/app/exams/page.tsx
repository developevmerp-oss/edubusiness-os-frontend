'use client';

import { useState, useEffect } from 'react';
import SidebarLayout from '../../components/SidebarLayout';
import { apiRequest } from '../../utils/api';
import Link from 'next/link';
import { FileText, Plus, Clock, Award, CheckCircle, Play, Eye, Sparkles, X } from 'lucide-react';

export default function ExamsListPage() {
    const [exams, setExams] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [userRole, setUserRole] = useState('');

    // Exam Creation fields
    const [isCreating, setIsCreating] = useState(false);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [duration, setDuration] = useState('');
    const [totalMarks, setTotalMarks] = useState('');
    const [negativeMarks, setNegativeMarks] = useState('0');
    const [isPublished, setIsPublished] = useState(false);

    // Questions manager modal state
    const [activeExamForQuestions, setActiveExamForQuestions] = useState<any>(null);
    const [examQuestions, setExamQuestions] = useState<any[]>([]);
    const [questionText, setQuestionText] = useState('');
    const [questionType, setQuestionType] = useState<'mcq' | 'true_false' | 'fill_blank' | 'descriptive'>('mcq');
    const [correctAnswer, setCorrectAnswer] = useState('');
    const [explanation, setExplanation] = useState('');
    const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
    const [optionsString, setOptionsString] = useState(''); // comma separated for MCQ

    useEffect(() => {
        fetchExams();
        const storedUser = localStorage.getItem('user_profile');
        if (storedUser) {
            setUserRole(JSON.parse(storedUser).role);
        }
    }, []);

    const fetchExams = async () => {
        setLoading(true);
        setError('');
        try {
            const data = await apiRequest('/api/exams');
            setExams(data.exams);
        } catch (err: any) {
            setError(err.message || 'Failed to load exams list.');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateExam = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await apiRequest('/api/exams', {
                method: 'POST',
                body: JSON.stringify({
                    title,
                    description,
                    durationMinutes: parseInt(duration) || 30,
                    totalMarks: parseFloat(totalMarks) || 100,
                    negativeMarks: parseFloat(negativeMarks) || 0,
                    isPublished
                })
            });
            setTitle('');
            setDescription('');
            setDuration('');
            setTotalMarks('');
            setNegativeMarks('0');
            setIsPublished(false);
            setIsCreating(false);
            fetchExams();
        } catch (err: any) {
            alert(err.message || 'Failed to create exam.');
        }
    };

    const handleLoadQuestions = async (exam: any) => {
        try {
            const data = await apiRequest(`/api/exams/${exam.id}/questions`);
            setActiveExamForQuestions(exam);
            setExamQuestions(data.questions);
        } catch (err: any) {
            alert(err.message || 'Failed to load questions.');
        }
    };

    const handleAddQuestion = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            let finalOptions = undefined;
            if (questionType === 'mcq') {
                finalOptions = optionsString.split(',').map(o => o.trim()).filter(o => o.length > 0);
                if (finalOptions.length < 2) {
                    alert('Please enter at least 2 options for MCQs.');
                    return;
                }
            } else if (questionType === 'true_false') {
                finalOptions = ['true', 'false'];
            }

            await apiRequest(`/api/exams/${activeExamForQuestions.id}/questions`, {
                method: 'POST',
                body: JSON.stringify({
                    type: questionType,
                    questionText,
                    options: finalOptions,
                    correctAnswer: correctAnswer.trim(),
                    difficulty,
                    explanation: explanation || undefined
                })
            });

            setQuestionText('');
            setCorrectAnswer('');
            setExplanation('');
            setOptionsString('');

            // reload questions
            const data = await apiRequest(`/api/exams/${activeExamForQuestions.id}/questions`);
            setExamQuestions(data.questions);
        } catch (err: any) {
            alert(err.message || 'Failed to add question.');
        }
    };

    if (loading) {
        return (
            <SidebarLayout>
                <div style={{ color: 'var(--text-secondary)' }}>Loading examinations catalog...</div>
            </SidebarLayout>
        );
    }

    return (
        <SidebarLayout>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h1 className="gradient-text" style={{ fontSize: '2.2rem', fontWeight: '800' }}>
                            Online Examinations
                        </h1>
                        <p style={{ color: 'var(--text-secondary)' }}>
                            Assess student performance with secure, timed tests.
                        </p>
                    </div>

                    {(userRole === 'admin' || userRole === 'teacher') && (
                        <button onClick={() => setIsCreating(true)} className="btn-primary">
                            <Plus size={18} />
                            Create Exam
                        </button>
                    )}
                </div>

                {error && (
                    <div style={{
                        padding: '12px 16px',
                        background: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid rgba(239, 68, 68, 0.2)',
                        color: '#fca5a5',
                        borderRadius: '8px',
                        fontSize: '0.9rem'
                    }}>
                        ⚠️ {error}
                    </div>
                )}

                {/* Exams cards grid */}
                {exams.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
                        <FileText size={48} style={{ marginBottom: '16px', opacity: 0.3 }} />
                        <p>No examinations scheduled yet.</p>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
                        {exams.map((exam) => (
                            <div key={exam.id} className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '220px' }}>
                                <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                                        <h3 style={{ fontSize: '1.2rem', fontWeight: '700' }}>{exam.title}</h3>
                                        <span style={{
                                            padding: '4px 8px',
                                            borderRadius: '6px',
                                            fontSize: '0.7rem',
                                            fontWeight: '600',
                                            background: exam.is_published ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255,255,255,0.05)',
                                            color: exam.is_published ? '#34d399' : 'var(--text-muted)'
                                        }}>
                                            {exam.is_published ? 'PUBLISHED' : 'DRAFT'}
                                        </span>
                                    </div>
                                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '16px', lineHeight: '1.5' }}>
                                        {exam.description || 'No description provided.'}
                                    </p>
                                    <div style={{ display: 'flex', gap: '16px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <Clock size={14} /> {exam.duration_minutes} mins
                                        </span>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <Award size={14} /> {parseFloat(exam.total_marks)} Marks
                                        </span>
                                    </div>
                                </div>

                                <div style={{ borderTop: '1px solid rgba(255,255,255,0.03)', paddingTop: '16px', marginTop: '16px', display: 'flex', gap: '12px' }}>
                                    {userRole === 'student' ? (
                                        <Link 
                                            href={`/exams/${exam.id}/take`}
                                            className="btn-primary" 
                                            style={{ flex: 1, textDecoration: 'none', padding: '8px 12px', fontSize: '0.82rem' }}
                                        >
                                            <Play size={14} />
                                            Take Exam
                                        </Link>
                                    ) : (
                                        <>
                                            <button 
                                                onClick={() => handleLoadQuestions(exam)}
                                                className="btn-secondary" 
                                                style={{ flex: 1, padding: '8px 12px', fontSize: '0.82rem' }}
                                            >
                                                Questions
                                            </button>
                                            <Link 
                                                href={`/exams/${exam.id}/generate`}
                                                className="btn-secondary"
                                                style={{ padding: '8px 12px', fontSize: '0.82rem', display: 'inline-flex', alignItems: 'center', gap: '4px', textDecoration: 'none' }}
                                            >
                                                <Sparkles size={12} style={{ color: 'var(--primary)' }} />
                                                AI Gen
                                            </Link>
                                            <Link 
                                                href={`/exams/${exam.id}/take`} // Allow teachers to preview
                                                className="btn-primary"
                                                style={{ flex: 1, textDecoration: 'none', padding: '8px 12px', fontSize: '0.82rem' }}
                                            >
                                                <Eye size={14} />
                                                Preview
                                            </Link>
                                        </>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Create Exam Modal */}
            {isCreating && (
                <div style={{
                    position: 'fixed',
                    top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.6)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 100
                }}>
                    <div className="glass-panel" style={{ width: '450px', padding: '30px', borderRadius: '16px' }}>
                        <h3>Create Online Examination</h3>
                        <form onSubmit={handleCreateExam} style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Exam Title</label>
                                <input 
                                    type="text" 
                                    className="glass-input" 
                                    required 
                                    value={title} 
                                    onChange={(e) => setTitle(e.target.value)} 
                                    placeholder="e.g. Unit Test 1" 
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Description</label>
                                <textarea 
                                    className="glass-input" 
                                    value={description} 
                                    onChange={(e) => setDescription(e.target.value)} 
                                    placeholder="e.g. Syllabus coverage, instructions..." 
                                    style={{ resize: 'vertical', fontFamily: 'inherit' }}
                                />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Duration (mins)</label>
                                    <input 
                                        type="number" 
                                        className="glass-input" 
                                        required 
                                        value={duration} 
                                        onChange={(e) => setDuration(e.target.value)} 
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Total Marks</label>
                                    <input 
                                        type="number" 
                                        className="glass-input" 
                                        required 
                                        value={totalMarks} 
                                        onChange={(e) => setTotalMarks(e.target.value)} 
                                    />
                                </div>
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Negative Marks per wrong answer</label>
                                <input 
                                    type="number" 
                                    step="0.05"
                                    className="glass-input" 
                                    value={negativeMarks} 
                                    onChange={(e) => setNegativeMarks(e.target.value)} 
                                />
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <input 
                                    type="checkbox" 
                                    id="pubExam" 
                                    checked={isPublished} 
                                    onChange={(e) => setIsPublished(e.target.checked)} 
                                />
                                <label htmlFor="pubExam" style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                                    Publish exam immediately
                                </label>
                            </div>
                            <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                                <button type="submit" className="btn-primary" style={{ flex: 1 }}>Submit</button>
                                <button type="button" className="btn-secondary" style={{ flex: 1 }} onClick={() => setIsCreating(false)}>Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Manage Questions Modal */}
            {activeExamForQuestions && (
                <div style={{
                    position: 'fixed',
                    top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.6)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 100
                }}>
                    <div className="glass-panel" style={{ width: '650px', padding: '30px', borderRadius: '16px', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid var(--border-glass)', paddingBottom: '10px' }}>
                            <div>
                                <h3 style={{ fontSize: '1.2rem', fontWeight: '700' }}>Question Bank Manager</h3>
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Exam: {activeExamForQuestions.title}</span>
                            </div>
                            <button style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }} onClick={() => setActiveExamForQuestions(null)}>
                                <X size={20} />
                            </button>
                        </div>

                        {/* Add question form */}
                        <form onSubmit={handleAddQuestion} style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '12px',
                            padding: '16px',
                            background: 'rgba(255,255,255,0.01)',
                            border: '1px dashed var(--border-glass)',
                            borderRadius: '10px',
                            marginBottom: '20px',
                            overflowY: 'auto'
                        }}>
                            <h4 style={{ fontSize: '0.9rem', fontWeight: '600' }}>Add a Question</h4>
                            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '10px' }}>
                                <input 
                                    type="text" 
                                    className="glass-input" 
                                    placeholder="Question Text" 
                                    required 
                                    value={questionText} 
                                    onChange={(e) => setQuestionText(e.target.value)} 
                                />
                                <select 
                                    className="glass-input" 
                                    value={questionType} 
                                    onChange={(e) => setQuestionType(e.target.value as any)}
                                >
                                    <option value="mcq">Multiple Choice (MCQ)</option>
                                    <option value="true_false">True / False</option>
                                    <option value="fill_blank">Fill in the Blanks</option>
                                    <option value="descriptive">Descriptive (Essay)</option>
                                </select>
                            </div>

                            {questionType === 'mcq' && (
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>MCQ Options (comma separated)</label>
                                    <input 
                                        type="text" 
                                        className="glass-input" 
                                        placeholder="e.g. Option A, Option B, Option C, Option D" 
                                        required={questionType === 'mcq'} 
                                        value={optionsString} 
                                        onChange={(e) => setOptionsString(e.target.value)} 
                                    />
                                </div>
                            )}

                            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '10px' }}>
                                <input 
                                    type="text" 
                                    className="glass-input" 
                                    placeholder="Correct Answer (e.g. true, or exact MCQ option)" 
                                    required 
                                    value={correctAnswer} 
                                    onChange={(e) => setCorrectAnswer(e.target.value)} 
                                />
                                <select 
                                    className="glass-input" 
                                    value={difficulty} 
                                    onChange={(e) => setDifficulty(e.target.value as any)}
                                >
                                    <option value="easy">Easy</option>
                                    <option value="medium">Medium</option>
                                    <option value="hard">Hard</option>
                                </select>
                            </div>

                            <input 
                                type="text" 
                                className="glass-input" 
                                placeholder="Explanation details (optional)" 
                                value={explanation} 
                                onChange={(e) => setExplanation(e.target.value)} 
                            />

                            <button type="submit" className="btn-primary" style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
                                Add to Exam
                            </button>
                        </form>

                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>
                            Current Questions ({examQuestions.length})
                        </span>

                        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {examQuestions.length === 0 ? (
                                <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.88rem', padding: '20px' }}>
                                    No questions added to this exam yet.
                                </div>
                            ) : (
                                examQuestions.map((q, idx) => (
                                    <div key={q.id} style={{
                                        border: '1px solid var(--border-glass)',
                                        borderRadius: '8px',
                                        padding: '12px 16px',
                                        background: 'rgba(255,255,255,0.01)',
                                        fontSize: '0.88rem'
                                    }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                            <strong>Q{idx + 1}. ({q.type.toUpperCase()})</strong>
                                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Difficulty: {q.difficulty}</span>
                                        </div>
                                        <p style={{ color: 'var(--text-primary)', marginBottom: '8px' }}>{q.question_text}</p>
                                        {q.options && (
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '8px' }}>
                                                {q.options.map((opt: string, oIdx: number) => (
                                                    <span key={oIdx} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-glass)', borderRadius: '4px', padding: '2px 8px', fontSize: '0.78rem' }}>
                                                        {opt}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                        <div style={{ color: 'var(--success)', fontSize: '0.82rem', fontWeight: '600' }}>
                                            Correct: {q.correct_answer}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}
        </SidebarLayout>
    );
}
