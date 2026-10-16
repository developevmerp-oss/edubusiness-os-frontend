'use client';

import { useState, useEffect } from 'react';
import SidebarLayout from '../../components/SidebarLayout';
import ModalPortal from '../../components/ModalPortal';
import { apiRequest } from '../../utils/api';
import { 
    ClipboardList, 
    Plus, 
    CheckCircle2, 
    Clock, 
    FileText, 
    Award, 
    Upload, 
    Calendar,
    Check,
    Send,
    Users
} from 'lucide-react';

export default function AssignmentsPage() {
    const [assignments, setAssignments] = useState<any[]>([]);
    const [courses, setCourses] = useState<any[]>([]);
    const [batches, setBatches] = useState<any[]>([]);
    const [userRole, setUserRole] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Modals
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [activeAssignmentForSubmit, setActiveAssignmentForSubmit] = useState<any>(null);
    const [activeAssignmentForGrading, setActiveAssignmentForGrading] = useState<any>(null);
    const [submissionsList, setSubmissionsList] = useState<any[]>([]);

    // Form: Create Assignment
    const [createCourseId, setCreateCourseId] = useState('');
    const [createBatchId, setCreateBatchId] = useState('');
    const [createTitle, setCreateTitle] = useState('');
    const [createDescription, setCreateDescription] = useState('');
    const [createDueDate, setCreateDueDate] = useState('');
    const [createTotalMarks, setCreateTotalMarks] = useState(100);
    const [createAttachment, setCreateAttachment] = useState('');
    const [isCreating, setIsCreating] = useState(false);

    // Form: Student Submit
    const [submissionContent, setSubmissionContent] = useState('');
    const [submissionAttachment, setSubmissionAttachment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form: Teacher Grade
    const [gradingSubmissionId, setGradingSubmissionId] = useState<string | null>(null);
    const [marksInput, setMarksInput] = useState<number>(0);
    const [feedbackInput, setFeedbackInput] = useState('');
    const [isGrading, setIsGrading] = useState(false);

    useEffect(() => {
        const storedUser = localStorage.getItem('user_profile');
        if (storedUser) {
            try {
                setUserRole(JSON.parse(storedUser).role);
            } catch (e) {}
        }
        fetchAssignmentsAndMeta();
    }, []);

    const fetchAssignmentsAndMeta = async () => {
        setLoading(true);
        setError('');
        try {
            const [assignData, coursesData, batchesData] = await Promise.all([
                apiRequest('/api/assignments'),
                apiRequest('/api/courses'),
                apiRequest('/api/batches')
            ]);
            setAssignments(assignData.assignments || []);
            setCourses(coursesData.courses || []);
            setBatches(batchesData.batches || []);
            if (coursesData.courses?.length > 0) setCreateCourseId(coursesData.courses[0].id);
            if (batchesData.batches?.length > 0) setCreateBatchId(batchesData.batches[0].id);
        } catch (err: any) {
            setError(err.message || 'Failed to load assignments.');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateAssignment = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsCreating(true);
        try {
            await apiRequest('/api/assignments', {
                method: 'POST',
                body: JSON.stringify({
                    courseId: createCourseId,
                    batchId: createBatchId,
                    title: createTitle,
                    description: createDescription,
                    dueDate: new Date(createDueDate).toISOString(),
                    totalMarks: Number(createTotalMarks),
                    attachmentUrl: createAttachment || undefined
                })
            });

            setCreateTitle('');
            setCreateDescription('');
            setCreateDueDate('');
            setCreateAttachment('');
            setIsCreateModalOpen(false);
            fetchAssignmentsAndMeta();
            alert('Homework assignment published successfully!');
        } catch (err: any) {
            alert(err.message || 'Failed to create assignment.');
        } finally {
            setIsCreating(false);
        }
    };

    const handleSubmitHomework = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!activeAssignmentForSubmit) return;
        setIsSubmitting(true);
        try {
            await apiRequest(`/api/assignments/${activeAssignmentForSubmit.id}/submit`, {
                method: 'POST',
                body: JSON.stringify({
                    submissionContent,
                    attachmentUrl: submissionAttachment || undefined
                })
            });

            setSubmissionContent('');
            setSubmissionAttachment('');
            setActiveAssignmentForSubmit(null);
            fetchAssignmentsAndMeta();
            alert('Homework submitted successfully to your faculty!');
        } catch (err: any) {
            alert(err.message || 'Failed to submit assignment.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const openGradingModal = async (assignment: any) => {
        setActiveAssignmentForGrading(assignment);
        try {
            const data = await apiRequest(`/api/assignments/${assignment.id}/submissions`);
            setSubmissionsList(data.submissions || []);
        } catch (err) {
            alert('Failed to load submissions.');
        }
    };

    const handleGradeSubmission = async (submissionId: string) => {
        setIsGrading(true);
        try {
            await apiRequest(`/api/assignments/submissions/${submissionId}/grade`, {
                method: 'PATCH',
                body: JSON.stringify({
                    marksObtained: Number(marksInput),
                    feedback: feedbackInput
                })
            });

            setGradingSubmissionId(null);
            setFeedbackInput('');
            // Refresh submissions
            const data = await apiRequest(`/api/assignments/${activeAssignmentForGrading.id}/submissions`);
            setSubmissionsList(data.submissions || []);
            fetchAssignmentsAndMeta();
            alert('Submission graded successfully!');
        } catch (err: any) {
            alert(err.message || 'Failed to save grade.');
        } finally {
            setIsGrading(false);
        }
    };

    return (
        <SidebarLayout>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
                
                {/* Header Banner */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h1 style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '8px' }}>
                            Homework & Assignments
                        </h1>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
                            Publish coursework worksheets, review student submissions, and grade with personalized feedback remarks.
                        </p>
                    </div>

                    {userRole !== 'student' && (
                        <button 
                            onClick={() => setIsCreateModalOpen(true)}
                            className="btn-primary"
                            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px', fontWeight: '700' }}
                        >
                            <Plus size={18} />
                            Publish Assignment
                        </button>
                    )}
                </div>

                {/* Assignments Grid */}
                {loading ? (
                    <div style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '60px' }}>
                        Loading coursework assignments...
                    </div>
                ) : assignments.length === 0 ? (
                    <div className="glass-panel" style={{ padding: '60px', textAlign: 'center', borderRadius: '16px' }}>
                        <ClipboardList size={48} style={{ color: 'var(--primary)', margin: '0 auto 16px auto', opacity: 0.6 }} />
                        <h3 style={{ fontSize: '1.2rem', fontWeight: '700', marginBottom: '8px' }}>No active assignments</h3>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                            There are currently no homework tasks assigned to this cohort.
                        </p>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(420px, 1fr))', gap: '20px' }}>
                        {assignments.map((assign) => {
                            const isSubmitted = assign.submission_status === 'submitted' || assign.submission_status === 'graded';
                            const isGraded = assign.submission_status === 'graded';

                            return (
                                <div 
                                    key={assign.id}
                                    className="glass-panel"
                                    style={{
                                        padding: '24px',
                                        borderRadius: '16px',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        justifyContent: 'space-between',
                                        gap: '16px',
                                        borderTop: isGraded ? '4px solid #10b981' : isSubmitted ? '4px solid #6366f1' : '4px solid #f59e0b'
                                    }}
                                >
                                    <div>
                                        {/* Meta Pills */}
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                            <span style={{
                                                fontSize: '0.75rem',
                                                padding: '3px 10px',
                                                borderRadius: '20px',
                                                background: 'rgba(99, 102, 241, 0.15)',
                                                border: '1px solid rgba(99, 102, 241, 0.3)',
                                                color: '#a5b4fc',
                                                fontWeight: '700'
                                            }}>
                                                {assign.batch_name || 'Batch Assignment'}
                                            </span>

                                            <span style={{ fontSize: '0.8rem', color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '600' }}>
                                                <Calendar size={13} />
                                                Due: {new Date(assign.due_date).toLocaleDateString()}
                                            </span>
                                        </div>

                                        <h3 style={{ fontSize: '1.2rem', fontWeight: '700', marginBottom: '8px', color: '#f8fafc' }}>
                                            {assign.title}
                                        </h3>

                                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: '1.5', marginBottom: '14px' }}>
                                            {assign.description}
                                        </p>

                                        <div style={{ display: 'flex', gap: '16px', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                <Award size={14} style={{ color: '#10b981' }} />
                                                Total Marks: {parseFloat(assign.total_marks)}
                                            </span>
                                            <span>Course: {assign.course_title}</span>
                                        </div>
                                    </div>

                                    {/* Action & Status Row */}
                                    <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '16px' }}>
                                        {userRole === 'student' ? (
                                            <div>
                                                {isGraded ? (
                                                    <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '10px', padding: '12px' }}>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                                                            <span style={{ fontSize: '0.8rem', fontWeight: '700', color: '#34d399', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                                <CheckCircle2 size={14} /> Graded
                                                            </span>
                                                            <strong style={{ fontSize: '1rem', color: '#10b981' }}>
                                                                {parseFloat(assign.marks_obtained)} / {parseFloat(assign.total_marks)}
                                                            </strong>
                                                        </div>
                                                        {assign.feedback && (
                                                            <p style={{ fontSize: '0.8rem', color: '#e2e8f0', margin: 0 }}>
                                                                Remark: "{assign.feedback}"
                                                            </p>
                                                        )}
                                                    </div>
                                                ) : isSubmitted ? (
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(99, 102, 241, 0.1)', border: '1px solid rgba(99, 102, 241, 0.3)', borderRadius: '10px', padding: '10px 14px' }}>
                                                        <span style={{ fontSize: '0.85rem', color: '#a5b4fc', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                            <Check size={15} /> Submitted (Awaiting Grade)
                                                        </span>
                                                        <button 
                                                            onClick={() => setActiveAssignmentForSubmit(assign)}
                                                            className="btn-secondary"
                                                            style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                                                        >
                                                            Re-submit
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <button 
                                                        onClick={() => setActiveAssignmentForSubmit(assign)}
                                                        className="btn-primary"
                                                        style={{ width: '100%', padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                                                    >
                                                        <Upload size={15} />
                                                        Submit Homework
                                                    </button>
                                                )}
                                            </div>
                                        ) : (
                                            /* Teacher / Admin View */
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                    <Users size={14} />
                                                    {assign.submission_count || 0} Submissions
                                                </span>
                                                <button 
                                                    onClick={() => openGradingModal(assign)}
                                                    className="btn-primary"
                                                    style={{ padding: '8px 16px', fontSize: '0.82rem' }}
                                                >
                                                    Review & Grade
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Modal: Publish Assignment (Teacher/Admin) */}
            {isCreateModalOpen && (
                <ModalPortal onClose={() => setIsCreateModalOpen(false)}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#f8fafc', marginBottom: '4px' }}>
                                Publish Homework Assignment
                            </h3>
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                Assign coursework with submission deadlines and maximum grading points.
                            </p>
                        </div>

                        <form onSubmit={handleCreateAssignment} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Course</label>
                                    <select 
                                        className="glass-input"
                                        value={createCourseId}
                                        onChange={(e) => setCreateCourseId(e.target.value)}
                                        required
                                    >
                                        {courses.map(c => (
                                            <option key={c.id} value={c.id}>{c.title}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Target Batch</label>
                                    <select 
                                        className="glass-input"
                                        value={createBatchId}
                                        onChange={(e) => setCreateBatchId(e.target.value)}
                                        required
                                    >
                                        {batches.map(b => (
                                            <option key={b.id} value={b.id}>{b.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Assignment Title</label>
                                <input 
                                    type="text"
                                    className="glass-input"
                                    required
                                    placeholder="e.g. Worksheet 3: Rotational Motion Numerical Practice"
                                    value={createTitle}
                                    onChange={(e) => setCreateTitle(e.target.value)}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Instructions & Task Details</label>
                                <textarea 
                                    className="glass-input"
                                    rows={4}
                                    required
                                    placeholder="List the problems, expected format, and submission instructions..."
                                    value={createDescription}
                                    onChange={(e) => setCreateDescription(e.target.value)}
                                />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Due Date</label>
                                    <input 
                                        type="datetime-local"
                                        className="glass-input"
                                        required
                                        value={createDueDate}
                                        onChange={(e) => setCreateDueDate(e.target.value)}
                                    />
                                </div>

                                <div>
                                    <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Total Marks</label>
                                    <input 
                                        type="number"
                                        className="glass-input"
                                        required
                                        min={1}
                                        value={createTotalMarks}
                                        onChange={(e) => setCreateTotalMarks(Number(e.target.value))}
                                    />
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                                <button type="submit" className="btn-primary" style={{ flex: 1, padding: '12px' }} disabled={isCreating}>
                                    {isCreating ? 'Publishing...' : 'Publish to Students'}
                                </button>
                                <button type="button" onClick={() => setIsCreateModalOpen(false)} className="btn-secondary" style={{ flex: 1, padding: '12px' }}>
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </ModalPortal>
            )}

            {/* Modal: Student Submit Homework */}
            {activeAssignmentForSubmit && (
                <ModalPortal onClose={() => setActiveAssignmentForSubmit(null)}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#f8fafc', marginBottom: '4px' }}>
                                Submit Homework Response
                            </h3>
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                Submitting for: <strong>{activeAssignmentForSubmit.title}</strong>
                            </p>
                        </div>

                        <form onSubmit={handleSubmitHomework} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                                    Written Solution / Notes
                                </label>
                                <textarea 
                                    className="glass-input"
                                    rows={5}
                                    required
                                    placeholder="Write your solution, answers, or summary of steps completed..."
                                    value={submissionContent}
                                    onChange={(e) => setSubmissionContent(e.target.value)}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                                    Google Drive / PDF / Photo URL (Optional)
                                </label>
                                <input 
                                    type="url"
                                    className="glass-input"
                                    placeholder="https://drive.google.com/file/d/your-homework.pdf"
                                    value={submissionAttachment}
                                    onChange={(e) => setSubmissionAttachment(e.target.value)}
                                />
                            </div>

                            <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                                <button type="submit" className="btn-primary" style={{ flex: 1, padding: '12px' }} disabled={isSubmitting}>
                                    {isSubmitting ? 'Uploading...' : 'Submit to Faculty'}
                                </button>
                                <button type="button" onClick={() => setActiveAssignmentForSubmit(null)} className="btn-secondary" style={{ flex: 1, padding: '12px' }}>
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </ModalPortal>
            )}

            {/* Modal: Teacher Review Submissions & Grade */}
            {activeAssignmentForGrading && (
                <ModalPortal onClose={() => setActiveAssignmentForGrading(null)}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxHeight: '80vh', overflowY: 'auto' }}>
                        <div>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#f8fafc', marginBottom: '4px' }}>
                                Submissions Gradebook
                            </h3>
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                Reviewing: <strong>{activeAssignmentForGrading.title}</strong> (Total Marks: {activeAssignmentForGrading.total_marks})
                            </p>
                        </div>

                        {submissionsList.length === 0 ? (
                            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                                No submissions received from students yet.
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                {submissionsList.map((sub) => {
                                    const isEditing = gradingSubmissionId === sub.id;

                                    return (
                                        <div key={sub.id} className="glass-panel" style={{ padding: '16px 20px', borderRadius: '12px' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                                <strong>{sub.first_name} {sub.last_name} ({sub.email})</strong>
                                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                                    {new Date(sub.submitted_at).toLocaleString()}
                                                </span>
                                            </div>

                                            <p style={{ fontSize: '0.85rem', color: '#e2e8f0', background: 'rgba(0,0,0,0.2)', padding: '10px', borderRadius: '8px', marginBottom: '10px' }}>
                                                {sub.submission_content}
                                            </p>

                                            {sub.attachment_url && (
                                                <div style={{ marginBottom: '10px' }}>
                                                    <a href={sub.attachment_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.8rem', color: '#38bdf8', textDecoration: 'underline' }}>
                                                        View Student Attachment
                                                    </a>
                                                </div>
                                            )}

                                            {isEditing ? (
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '8px' }}>
                                                    <div style={{ display: 'flex', gap: '10px' }}>
                                                        <input 
                                                            type="number"
                                                            className="glass-input"
                                                            placeholder="Score"
                                                            value={marksInput}
                                                            max={activeAssignmentForGrading.total_marks}
                                                            min={0}
                                                            onChange={(e) => setMarksInput(Number(e.target.value))}
                                                            style={{ width: '100px' }}
                                                        />
                                                        <input 
                                                            type="text"
                                                            className="glass-input"
                                                            placeholder="Feedback remark..."
                                                            value={feedbackInput}
                                                            onChange={(e) => setFeedbackInput(e.target.value)}
                                                            style={{ flex: 1 }}
                                                        />
                                                    </div>
                                                    <div style={{ display: 'flex', gap: '8px' }}>
                                                        <button onClick={() => handleGradeSubmission(sub.id)} className="btn-primary" style={{ padding: '6px 14px', fontSize: '0.8rem' }} disabled={isGrading}>
                                                            Save Score
                                                        </button>
                                                        <button onClick={() => setGradingSubmissionId(null)} className="btn-secondary" style={{ padding: '6px 14px', fontSize: '0.8rem' }}>
                                                            Cancel
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    {sub.status === 'graded' ? (
                                                        <div style={{ fontSize: '0.85rem', color: '#10b981' }}>
                                                            Score: <strong>{parseFloat(sub.marks_obtained)} / {parseFloat(activeAssignmentForGrading.total_marks)}</strong> 
                                                            {sub.feedback && <span style={{ color: 'var(--text-secondary)', marginLeft: '8px' }}>("{sub.feedback}")</span>}
                                                        </div>
                                                    ) : (
                                                        <span style={{ fontSize: '0.8rem', color: '#f59e0b' }}>Awaiting Grading</span>
                                                    )}
                                                    <button 
                                                        onClick={() => {
                                                            setGradingSubmissionId(sub.id);
                                                            setMarksInput(sub.marks_obtained ? parseFloat(sub.marks_obtained) : 0);
                                                            setFeedbackInput(sub.feedback || '');
                                                        }}
                                                        className="btn-secondary"
                                                        style={{ padding: '4px 12px', fontSize: '0.78rem' }}
                                                    >
                                                        {sub.status === 'graded' ? 'Edit Grade' : 'Award Grade'}
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </ModalPortal>
            )}
        </SidebarLayout>
    );
}
