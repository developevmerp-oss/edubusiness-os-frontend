'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import SidebarLayout from '../../../../components/SidebarLayout';
import { apiRequest } from '../../../../utils/api';
import { ArrowLeft, Sparkles, Plus, Loader, CheckCircle } from 'lucide-react';
import Link from 'next/link';

interface GeneratePageProps {
    params: Promise<{ id: string }>;
}

export default function AIQuestionGeneratorPage({ params }: GeneratePageProps) {
    const { id: examId } = use(params);
    const router = useRouter();

    const [exam, setExam] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [topic, setTopic] = useState('');
    const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
    const [count, setCount] = useState(3);
    
    const [generating, setGenerating] = useState(false);
    const [generatedQuestions, setGeneratedQuestions] = useState<any[]>([]);
    const [selectedIndexes, setSelectedIndexes] = useState<Record<number, boolean>>({});
    const [importing, setImporting] = useState(false);

    useEffect(() => {
        fetchExamDetails();
    }, [examId]);

    const fetchExamDetails = async () => {
        setLoading(true);
        try {
            const data = await apiRequest(`/api/exams/${examId}`);
            setExam(data.exam);
        } catch (err) {
            console.error('Failed to load exam details:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleGenerate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!topic.trim()) return;

        setGenerating(true);
        setGeneratedQuestions([]);
        setSelectedIndexes({});
        try {
            const data = await apiRequest('/api/ai/exams/generate', {
                method: 'POST',
                body: JSON.stringify({
                    topic,
                    difficulty,
                    questionCount: count
                })
            });
            setGeneratedQuestions(data.questions);
            // Default select all
            const initialSelected: Record<number, boolean> = {};
            data.questions.forEach((_: any, idx: number) => {
                initialSelected[idx] = true;
            });
            setSelectedIndexes(initialSelected);
        } catch (err: any) {
            alert(err.message || 'Failed to generate questions.');
        } finally {
            setGenerating(false);
        }
    };

    const toggleSelectQuestion = (idx: number) => {
        setSelectedIndexes(prev => ({ ...prev, [idx]: !prev[idx] }));
    };

    const handleImportSelected = async () => {
        const toImport = generatedQuestions.filter((_, idx) => selectedIndexes[idx]);
        if (toImport.length === 0) {
            alert('Please select at least one question to import.');
            return;
        }

        setImporting(true);
        try {
            for (const q of toImport) {
                await apiRequest(`/api/exams/${examId}/questions`, {
                    method: 'POST',
                    body: JSON.stringify({
                        type: q.type,
                        questionText: q.questionText,
                        options: q.options,
                        correctAnswer: q.correctAnswer,
                        difficulty: q.difficulty,
                        explanation: q.explanation
                    })
                });
            }
            alert(`Successfully imported ${toImport.length} questions to exam!`);
            router.push('/exams');
        } catch (err: any) {
            alert(err.message || 'Failed to import questions.');
        } finally {
            setImporting(false);
        }
    };

    if (loading) {
        return (
            <SidebarLayout>
                <div style={{ color: 'var(--text-secondary)' }}>Loading exam details...</div>
            </SidebarLayout>
        );
    }

    return (
        <SidebarLayout>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
                
                {/* Back Link Header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', borderBottom: '1px solid var(--border-glass)', paddingBottom: '16px' }}>
                    <Link href="/exams" style={{ color: 'var(--text-muted)' }}>
                        <ArrowLeft size={20} />
                    </Link>
                    <div>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: '700' }}>AI Question Generator</h2>
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Exam: {exam?.title}</span>
                    </div>
                </div>

                {/* Input generation panel */}
                <div className="glass-panel" style={{ padding: '24px', borderRadius: '16px' }}>
                    <form onSubmit={handleGenerate} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 150px', gap: '16px', alignItems: 'flex-end' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>Chapter Topic / Concept</label>
                            <input 
                                type="text" 
                                className="glass-input" 
                                placeholder="e.g. Electrostatics Coulomb Force" 
                                required
                                value={topic}
                                onChange={(e) => setTopic(e.target.value)}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>Difficulty</label>
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
                        <div>
                            <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>Question Count</label>
                            <input 
                                type="number" 
                                className="glass-input" 
                                min={1} max={10} 
                                value={count}
                                onChange={(e) => setCount(Number(e.target.value))}
                            />
                        </div>
                        <button type="submit" className="btn-primary" style={{ padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }} disabled={generating}>
                            {generating ? <Loader size={16} className="animate-spin" /> : <Sparkles size={16} />}
                            Generate
                        </button>
                    </form>
                </div>

                {/* Generated questions list table */}
                {generatedQuestions.length > 0 && (
                    <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 style={{ fontSize: '1.05rem', fontWeight: '700' }}>Preview AI Generated Questions</h3>
                            <button 
                                onClick={handleImportSelected} 
                                className="btn-primary" 
                                style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px' }}
                                disabled={importing}
                            >
                                <Plus size={16} /> Import Selected ({generatedQuestions.filter((_, i) => selectedIndexes[i]).length})
                            </button>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {generatedQuestions.map((q, idx) => (
                                <div key={idx} style={{
                                    background: 'rgba(255,255,255,0.01)',
                                    border: '1px solid var(--border-glass)',
                                    borderRadius: '12px',
                                    padding: '20px',
                                    display: 'flex',
                                    gap: '16px',
                                    alignItems: 'flex-start'
                                }}>
                                    <input 
                                        type="checkbox" 
                                        checked={!!selectedIndexes[idx]} 
                                        onChange={() => toggleSelectQuestion(idx)}
                                        style={{ width: '18px', height: '18px', marginTop: '4px', cursor: 'pointer' }}
                                    />
                                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <span style={{ fontSize: '0.75rem', padding: '2px 8px', background: 'rgba(var(--primary-rgb), 0.15)', color: 'var(--primary)', borderRadius: '4px', fontWeight: '700', textTransform: 'uppercase' }}>
                                                {q.difficulty}
                                            </span>
                                        </div>
                                        <p style={{ fontWeight: '600', fontSize: '0.92rem' }}>{q.questionText}</p>
                                        
                                        {/* Options */}
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.85rem' }}>
                                            {q.options.map((opt: string, oIdx: number) => (
                                                <div key={oIdx} style={{
                                                    padding: '8px 12px',
                                                    background: opt === q.correctAnswer ? 'rgba(16, 185, 129, 0.05)' : 'rgba(255,255,255,0.01)',
                                                    border: opt === q.correctAnswer ? '1px solid rgba(16, 185, 129, 0.2)' : '1px solid var(--border-glass)',
                                                    borderRadius: '6px',
                                                    color: opt === q.correctAnswer ? 'var(--success)' : 'var(--text-secondary)'
                                                }}>
                                                    {opt === q.correctAnswer ? '✓ ' : ''}{opt}
                                                </div>
                                            ))}
                                        </div>
                                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                                            Explanation: {q.explanation}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

            </div>
        </SidebarLayout>
    );
}
