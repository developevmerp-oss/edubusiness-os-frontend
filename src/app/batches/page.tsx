'use client';

import { useState, useEffect } from 'react';
import SidebarLayout from '../../components/SidebarLayout';
import ModalPortal from '../../components/ModalPortal';
import { apiRequest } from '../../utils/api';
import { Calendar, Plus, Users, UserPlus, FileText, X, Video, Edit2, Trash2, CheckCircle, Clock } from 'lucide-react';

export default function BatchesPage() {
    const [batches, setBatches] = useState<any[]>([]);
    const [courses, setCourses] = useState<any[]>([]);
    const [teachers, setTeachers] = useState<any[]>([]);
    const [students, setStudents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [userRole, setUserRole] = useState('');

    // Batch creation fields
    const [isCreating, setIsCreating] = useState(false);
    const [name, setName] = useState('');
    const [courseId, setCourseId] = useState('');
    const [teacherId, setTeacherId] = useState('');
    const [fees, setFees] = useState('');
    const [capacity, setCapacity] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [scheduleSlots, setScheduleSlots] = useState<any[]>([
        { day: 'Monday', startTime: '09:00', endTime: '10:00' }
    ]);

    // Batch Edit fields
    const [editingBatch, setEditingBatch] = useState<any>(null);
    const [editName, setEditName] = useState('');
    const [editCourseId, setEditCourseId] = useState('');
    const [editTeacherId, setEditTeacherId] = useState('');
    const [editFees, setEditFees] = useState('');
    const [editCapacity, setEditCapacity] = useState('');
    const [editStartDate, setEditStartDate] = useState('');
    const [editEndDate, setEditEndDate] = useState('');
    const [editScheduleSlots, setEditScheduleSlots] = useState<any[]>([]);

    // Batch Attendance state
    const [activeBatchForAttendance, setActiveBatchForAttendance] = useState<any>(null);
    const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
    const [attendanceRecords, setAttendanceRecords] = useState<any[]>([]);
    const [savingAttendance, setSavingAttendance] = useState(false);

    // Batch Student enrollment state
    const [activeBatchForEnroll, setActiveBatchForEnroll] = useState<any>(null);
    const [enrollStudentId, setEnrollStudentId] = useState('');
    const [batchStudents, setBatchStudents] = useState<any[]>([]);

    // Live Class state
    const [activeBatchForLive, setActiveBatchForLive] = useState<any>(null);
    const [liveClasses, setLiveClasses] = useState<any[]>([]);
    const [liveTitle, setLiveTitle] = useState('');
    const [liveTopic, setLiveTopic] = useState('');
    const [liveLink, setLiveLink] = useState('');
    const [liveProvider, setLiveProvider] = useState<'zoom' | 'google_meet' | 'jitsi' | 'custom'>('jitsi');
    const [liveTime, setLiveTime] = useState('');
    const [liveDuration, setLiveDuration] = useState('60');

    useEffect(() => {
        fetchBatchesAndDropdowns();
        const storedUser = localStorage.getItem('user_profile');
        if (storedUser) {
            setUserRole(JSON.parse(storedUser).role);
        }
    }, []);

    const fetchBatchesAndDropdowns = async () => {
        setLoading(true);
        setError('');
        try {
            const batchData = await apiRequest('/api/batches');
            setBatches(batchData.batches);

            const storedUser = localStorage.getItem('user_profile');
            const role = storedUser ? JSON.parse(storedUser).role : '';

            if (role === 'admin') {
                const courseData = await apiRequest('/api/courses');
                setCourses(courseData.courses);

                const teacherData = await apiRequest('/api/auth/users?role=teacher');
                setTeachers(teacherData.users);

                const studentData = await apiRequest('/api/auth/users?role=student');
                setStudents(studentData.users);
            }
        } catch (err: any) {
            setError(err.message || 'Failed to load batch records.');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateBatch = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        try {
            await apiRequest('/api/batches', {
                method: 'POST',
                body: JSON.stringify({
                    courseId,
                    teacherId: teacherId || null,
                    name,
                    schedule: scheduleSlots,
                    startDate: startDate || null,
                    endDate: endDate || null,
                    capacity: parseInt(capacity) || null,
                    fees: parseFloat(fees) || 0
                })
            });

            // Reset
            setName('');
            setCourseId('');
            setTeacherId('');
            setFees('');
            setCapacity('');
            setStartDate('');
            setEndDate('');
            setScheduleSlots([{ day: 'Monday', startTime: '09:00', endTime: '10:00' }]);
            setIsCreating(false);
            fetchBatchesAndDropdowns();
        } catch (err: any) {
            setError(err.message || 'Failed to create batch.');
        }
    };

    const openEditBatch = (batch: any) => {
        setEditingBatch(batch);
        setEditName(batch.name);
        setEditCourseId(batch.course_id);
        setEditTeacherId(batch.teacher_id || '');
        setEditFees(String(batch.fees || ''));
        setEditCapacity(batch.capacity ? String(batch.capacity) : '');
        setEditStartDate(batch.start_date ? batch.start_date.split('T')[0] : '');
        setEditEndDate(batch.end_date ? batch.end_date.split('T')[0] : '');
        const scheduleList = typeof batch.schedule === 'string' ? JSON.parse(batch.schedule) : batch.schedule;
        setEditScheduleSlots(Array.isArray(scheduleList) && scheduleList.length > 0 ? scheduleList : [{ day: 'Monday', startTime: '09:00', endTime: '10:00' }]);
    };

    const handleUpdateBatch = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await apiRequest(`/api/batches/${editingBatch.id}`, {
                method: 'PUT',
                body: JSON.stringify({
                    name: editName,
                    courseId: editCourseId,
                    teacherId: editTeacherId || null,
                    fees: parseFloat(editFees) || 0,
                    capacity: editCapacity ? parseInt(editCapacity) : null,
                    startDate: editStartDate || null,
                    endDate: editEndDate || null,
                    schedule: editScheduleSlots
                })
            });
            setEditingBatch(null);
            fetchBatchesAndDropdowns();
        } catch (err: any) {
            alert(err.message || 'Failed to update batch.');
        }
    };

    const handleDeleteBatch = async (batchId: string, batchName: string) => {
        if (!confirm(`Are you sure you want to delete batch "${batchName}"? All schedules, classes, and enrollments in it will be removed.`)) return;
        try {
            await apiRequest(`/api/batches/${batchId}`, { method: 'DELETE' });
            fetchBatchesAndDropdowns();
        } catch (err: any) {
            alert(err.message || 'Failed to delete batch.');
        }
    };

    const handleOpenAttendance = async (batch: any) => {
        try {
            setActiveBatchForAttendance(batch);
            const data = await apiRequest(`/api/attendance/batch/${batch.id}?date=${attendanceDate}`);
            setAttendanceRecords(data.attendance.map((att: any) => ({
                studentId: att.student_id,
                name: `${att.first_name} ${att.last_name}`,
                status: att.status || 'present',
                remarks: att.remarks || ''
            })));
        } catch (err: any) {
            alert(err.message || 'Failed to load attendance list.');
        }
    };

    const handleDateChangeAttendance = async (newDate: string) => {
        setAttendanceDate(newDate);
        if (!activeBatchForAttendance) return;
        try {
            const data = await apiRequest(`/api/attendance/batch/${activeBatchForAttendance.id}?date=${newDate}`);
            setAttendanceRecords(data.attendance.map((att: any) => ({
                studentId: att.student_id,
                name: `${att.first_name} ${att.last_name}`,
                status: att.status || 'present',
                remarks: att.remarks || ''
            })));
        } catch (err: any) {}
    };

    const handleSaveAttendance = async () => {
        if (!activeBatchForAttendance) return;
        setSavingAttendance(true);
        try {
            await apiRequest('/api/attendance', {
                method: 'POST',
                body: JSON.stringify({
                    batchId: activeBatchForAttendance.id,
                    date: attendanceDate,
                    records: attendanceRecords
                })
            });
            alert('Attendance records saved successfully.');
            setActiveBatchForAttendance(null);
        } catch (err: any) {
            alert(err.message || 'Failed to submit attendance.');
        } finally {
            setSavingAttendance(false);
        }
    };

    const handleLoadEnrollments = async (batch: any) => {
        try {
            const data = await apiRequest(`/api/batches/${batch.id}/students`);
            setActiveBatchForEnroll(batch);
            setBatchStudents(data.students);
        } catch (err: any) {
            alert(err.message || 'Failed to load enrolled student list.');
        }
    };

    const handleEnrollStudent = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!enrollStudentId) {
            alert('Please select a student to enroll.');
            return;
        }
        try {
            await apiRequest(`/api/batches/${activeBatchForEnroll.id}/students`, {
                method: 'POST',
                body: JSON.stringify({ studentId: enrollStudentId })
            });
            setEnrollStudentId('');
            
            // Reload students list for active batch
            const data = await apiRequest(`/api/batches/${activeBatchForEnroll.id}/students`);
            setBatchStudents(data.students);
        } catch (err: any) {
            alert(err.message || 'Failed to enroll student.');
        }
    };

    const handleRemoveStudent = async (studentId: string) => {
        if (!confirm('Are you sure you want to remove this student from the batch?')) return;
        try {
            await apiRequest(`/api/batches/${activeBatchForEnroll.id}/students/${studentId}`, {
                method: 'DELETE'
            });

            // Reload students list
            const data = await apiRequest(`/api/batches/${activeBatchForEnroll.id}/students`);
            setBatchStudents(data.students);
        } catch (err: any) {
            alert(err.message || 'Failed to remove student.');
        }
    };

    const handleLoadLiveClasses = async (batch: any) => {
        try {
            const data = await apiRequest(`/api/live-classes/batch/${batch.id}`);
            setActiveBatchForLive(batch);
            setLiveClasses(data.liveClasses);
        } catch (err: any) {
            alert(err.message || 'Failed to load live classes.');
        }
    };

    const handleCreateLiveClass = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await apiRequest('/api/live-classes', {
                method: 'POST',
                body: JSON.stringify({
                    batchId: activeBatchForLive.id,
                    title: liveTitle,
                    topic: liveTopic || undefined,
                    meetingLink: liveLink || undefined,
                    provider: liveProvider,
                    scheduledAt: new Date(liveTime).toISOString(),
                    durationMinutes: parseInt(liveDuration, 10) || 60
                })
            });
            setLiveTitle('');
            setLiveTopic('');
            setLiveLink('');
            setLiveTime('');
            // reload
            const data = await apiRequest(`/api/live-classes/batch/${activeBatchForLive.id}`);
            setLiveClasses(data.liveClasses);
        } catch (err: any) {
            alert(err.message || 'Failed to schedule live class.');
        }
    };

    const handleCancelLiveClass = async (classId: string) => {
        if (!confirm('Are you sure you want to cancel this live lecture?')) return;
        try {
            await apiRequest(`/api/live-classes/${classId}`, { method: 'DELETE' });
            // reload
            const data = await apiRequest(`/api/live-classes/batch/${activeBatchForLive.id}`);
            setLiveClasses(data.liveClasses);
        } catch (err: any) {
            alert(err.message || 'Failed to cancel live class.');
        }
    };

    if (loading) {
        return (
            <SidebarLayout>
                <div style={{ color: 'var(--text-secondary)' }}>Loading batches dashboard...</div>
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
                            Batch Schedules
                        </h1>
                        <p style={{ color: 'var(--text-secondary)' }}>
                            Coordinate class assignments, timetables, and enrollments.
                        </p>
                    </div>

                    {userRole === 'admin' && (
                        <button onClick={() => setIsCreating(true)} className="btn-primary">
                            <Plus size={18} />
                            Create Batch
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

                {/* Batch list cards */}
                {batches.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
                        <Calendar size={48} style={{ marginBottom: '16px', opacity: 0.3 }} />
                        <p>No batches scheduled.</p>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
                        {batches.map((batch) => {
                            const scheduleList = typeof batch.schedule === 'string' ? JSON.parse(batch.schedule) : batch.schedule;
                            return (
                                <div key={batch.id} className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '260px' }}>
                                    <div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                                            <h3 style={{ fontSize: '1.25rem', fontWeight: '700' }}>{batch.name}</h3>
                                            {userRole === 'admin' && (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                    <button 
                                                        onClick={() => openEditBatch(batch)}
                                                        style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
                                                        title="Edit Batch"
                                                    >
                                                        <Edit2 size={15} />
                                                    </button>
                                                    <button 
                                                        onClick={() => handleDeleteBatch(batch.id, batch.name)}
                                                        style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', padding: '4px' }}
                                                        title="Delete Batch"
                                                    >
                                                        <Trash2 size={15} />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                        <span style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: '600', display: 'block', marginBottom: '16px' }}>
                                            {batch.course_title}
                                        </span>
                                        
                                        {/* Schedule slots */}
                                        <div style={{ marginBottom: '16px' }}>
                                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '6px' }}>
                                                Lecture Timetable
                                            </span>
                                            {Array.isArray(scheduleList) && scheduleList.map((slot: any, idx: number) => (
                                                <div key={idx} style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', gap: '8px', marginBottom: '4px' }}>
                                                    <strong>{slot.day}:</strong> {slot.startTime} - {slot.endTime}
                                                </div>
                                            ))}
                                        </div>

                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                                            <div>
                                                <span style={{ color: 'var(--text-muted)' }}>Teacher:</span>
                                                <div style={{ fontWeight: '500', color: 'var(--text-primary)' }}>
                                                    {batch.teacher_first_name ? `${batch.teacher_first_name} ${batch.teacher_last_name}` : 'Unassigned'}
                                                </div>
                                            </div>
                                            <div>
                                                <span style={{ color: 'var(--text-muted)' }}>Fees:</span>
                                                <div style={{ fontWeight: '500', color: 'var(--text-primary)' }}>
                                                    ₹{parseFloat(batch.fees).toLocaleString()}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action footer */}
                                    <div style={{ borderTop: '1px solid rgba(255,255,255,0.03)', paddingTop: '16px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                        {(userRole === 'admin' || userRole === 'teacher') && (
                                            <button 
                                                onClick={() => handleOpenAttendance(batch)}
                                                className="btn-secondary" 
                                                style={{ flex: 1, padding: '8px 10px', fontSize: '0.8rem', minWidth: '95px' }}
                                                title="Mark Batch Attendance"
                                            >
                                                <CheckCircle size={13} />
                                                Attendance
                                            </button>
                                        )}
                                        {userRole === 'admin' && (
                                            <button 
                                                onClick={() => handleLoadEnrollments(batch)}
                                                className="btn-secondary" 
                                                style={{ flex: 1, padding: '8px 10px', fontSize: '0.8rem', minWidth: '95px' }}
                                            >
                                                <UserPlus size={13} />
                                                Enroll
                                            </button>
                                        )}
                                        <button 
                                            onClick={() => handleLoadLiveClasses(batch)}
                                            className="btn-primary" 
                                            style={{ flex: 1, padding: '8px 10px', fontSize: '0.8rem', minWidth: '95px' }}
                                        >
                                            <Video size={13} />
                                            Live
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Batch creation Modal */}
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
                        <div className="glass-panel" style={{ width: '500px', padding: '30px', borderRadius: '16px', maxHeight: '90vh', overflowY: 'auto' }}>
                            <h3 style={{ marginBottom: '20px' }}>Create Class Batch</h3>
                            <form onSubmit={handleCreateBatch} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Batch Name</label>
                                    <input 
                                        type="text" 
                                        className="glass-input" 
                                        required 
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="e.g. Batch A (Morning)"
                                    />
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Select Course</label>
                                        <select 
                                            className="glass-input" 
                                            required 
                                            value={courseId}
                                            onChange={(e) => setCourseId(e.target.value)}
                                        >
                                            <option value="">-- Choose Course --</option>
                                            {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Assign Teacher</label>
                                        <select 
                                            className="glass-input" 
                                            value={teacherId}
                                            onChange={(e) => setTeacherId(e.target.value)}
                                        >
                                            <option value="">-- Choose Teacher --</option>
                                            {teachers.map(t => <option key={t.id} value={t.id}>{t.first_name} {t.last_name}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Batch Fees (₹)</label>
                                        <input 
                                            type="number" 
                                            className="glass-input" 
                                            required 
                                            value={fees}
                                            onChange={(e) => setFees(e.target.value)}
                                            placeholder="5000"
                                        />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Max Capacity</label>
                                        <input 
                                            type="number" 
                                            className="glass-input" 
                                            value={capacity}
                                            onChange={(e) => setCapacity(e.target.value)}
                                            placeholder="50"
                                        />
                                    </div>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Start Date</label>
                                        <input 
                                            type="date" 
                                            className="glass-input" 
                                            value={startDate}
                                            onChange={(e) => setStartDate(e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>End Date</label>
                                        <input 
                                            type="date" 
                                            className="glass-input" 
                                            value={endDate}
                                            onChange={(e) => setEndDate(e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                                    <button type="submit" className="btn-primary" style={{ flex: 1 }}>Submit</button>
                                    <button 
                                        type="button" 
                                        className="btn-secondary" 
                                        style={{ flex: 1 }} 
                                        onClick={() => setIsCreating(false)}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Enrollment Modal */}
                {activeBatchForEnroll && (
                    <div style={{
                        position: 'fixed',
                        top: 0, left: 0, right: 0, bottom: 0,
                        background: 'rgba(0,0,0,0.6)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 100
                    }}>
                        <div className="glass-panel" style={{ width: '500px', padding: '30px', borderRadius: '16px', maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                <h3>Batch Student Enrollments</h3>
                                <button style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }} onClick={() => setActiveBatchForEnroll(null)}>
                                    <X size={20} />
                                </button>
                            </div>

                            <form onSubmit={handleEnrollStudent} style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
                                <select 
                                    className="glass-input" 
                                    required 
                                    value={enrollStudentId}
                                    onChange={(e) => setEnrollStudentId(e.target.value)}
                                    style={{ flex: 1 }}
                                >
                                    <option value="">-- Select Student to Enroll --</option>
                                    {students.map(s => <option key={s.id} value={s.id}>{s.first_name} {s.last_name} ({s.email})</option>)}
                                </select>
                                <button type="submit" className="btn-primary" style={{ padding: '12px 18px' }} disabled={!enrollStudentId}>Enroll</button>
                            </form>

                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>
                                Currently Enrolled Students ({batchStudents.length})
                            </span>

                            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {batchStudents.length === 0 ? (
                                    <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.88rem', padding: '20px' }}>
                                        No students enrolled in this batch yet.
                                    </div>
                                ) : (
                                    batchStudents.map(student => (
                                        <div key={student.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-glass)', borderRadius: '8px', padding: '10px 14px' }}>
                                            <div>
                                                <h4 style={{ fontSize: '0.9rem', fontWeight: '600' }}>{student.first_name} {student.last_name}</h4>
                                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{student.email}</span>
                                            </div>
                                            <button 
                                                onClick={() => handleRemoveStudent(student.id)}
                                                style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', fontSize: '0.8rem', fontWeight: '600' }}
                                            >
                                                Remove
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Live Classes Modal */}
                {activeBatchForLive && (
                    <div style={{
                        position: 'fixed',
                        top: 0, left: 0, right: 0, bottom: 0,
                        background: 'rgba(0,0,0,0.6)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 100
                    }}>
                        <div className="glass-panel" style={{ width: '550px', padding: '30px', borderRadius: '16px', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid var(--border-glass)', paddingBottom: '10px' }}>
                                <div>
                                    <h3 style={{ fontSize: '1.2rem', fontWeight: '700' }}>Live Class Scheduler & Join Portal</h3>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Batch: {activeBatchForLive.name}</span>
                                </div>
                                <button style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }} onClick={() => setActiveBatchForLive(null)}>
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Schedule form for Admins & Teachers */}
                            {(userRole === 'admin' || userRole === 'teacher') && (
                                <form onSubmit={handleCreateLiveClass} style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '12px',
                                    padding: '16px',
                                    background: 'rgba(255,255,255,0.01)',
                                    border: '1px dashed var(--border-glass)',
                                    borderRadius: '10px',
                                    marginBottom: '20px'
                                }}>
                                    <h4 style={{ fontSize: '0.9rem', fontWeight: '600' }}>Schedule a Live Lecture</h4>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                        <input 
                                            type="text" 
                                            className="glass-input" 
                                            placeholder="Lecture Title" 
                                            required 
                                            value={liveTitle} 
                                            onChange={(e) => setLiveTitle(e.target.value)} 
                                        />
                                        <input 
                                            type="text" 
                                            className="glass-input" 
                                            placeholder="Topic (Optional)" 
                                            value={liveTopic} 
                                            onChange={(e) => setLiveTopic(e.target.value)} 
                                        />
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                        <select 
                                            className="glass-input" 
                                            value={liveProvider} 
                                            onChange={(e) => setLiveProvider(e.target.value as any)}
                                        >
                                            <option value="jitsi">Jitsi Meet (Auto Link)</option>
                                            <option value="zoom">Zoom Link</option>
                                            <option value="google_meet">Google Meet Link</option>
                                            <option value="custom">Custom URL</option>
                                        </select>
                                        {liveProvider !== 'jitsi' && (
                                            <input 
                                                type="url" 
                                                className="glass-input" 
                                                placeholder="https://meeting-link..." 
                                                required 
                                                value={liveLink} 
                                                onChange={(e) => setLiveLink(e.target.value)} 
                                            />
                                        )}
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '10px' }}>
                                        <input 
                                            type="datetime-local" 
                                            className="glass-input" 
                                            required 
                                            value={liveTime} 
                                            onChange={(e) => setLiveTime(e.target.value)} 
                                        />
                                        <input 
                                            type="number" 
                                            className="glass-input" 
                                            placeholder="Min duration" 
                                            required 
                                            value={liveDuration} 
                                            onChange={(e) => setLiveDuration(e.target.value)} 
                                        />
                                    </div>
                                    <button type="submit" className="btn-primary" style={{ padding: '10px 16px', fontSize: '0.85rem' }}>
                                        Schedule
                                    </button>
                                </form>
                            )}

                            {/* Scheduled classes list */}
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>
                                Scheduled Lectures
                            </span>

                            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {liveClasses.length === 0 ? (
                                    <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.88rem', padding: '20px' }}>
                                        No live lectures scheduled.
                                    </div>
                                ) : (
                                    liveClasses.map((cls) => (
                                        <div key={cls.id} style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            background: 'rgba(255,255,255,0.01)',
                                            border: '1px solid var(--border-glass)',
                                            borderRadius: '8px',
                                            padding: '12px 16px'
                                        }}>
                                            <div>
                                                <h4 style={{ fontSize: '0.92rem', fontWeight: '600' }}>{cls.title}</h4>
                                                {cls.topic && <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'block' }}>Topic: {cls.topic}</span>}
                                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                                    {new Date(cls.scheduled_at).toLocaleString()} • {cls.duration_minutes} mins
                                                </span>
                                            </div>
                                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                                <a 
                                                    href={cls.meeting_link} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer" 
                                                    className="btn-primary" 
                                                    style={{ padding: '6px 12px', fontSize: '0.8rem', textDecoration: 'none' }}
                                                >
                                                    Join
                                                </a>
                                                {(userRole === 'admin' || userRole === 'teacher') && (
                                                    <button 
                                                        onClick={() => handleCancelLiveClass(cls.id)}
                                                        style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', fontSize: '0.8rem', fontWeight: '600' }}
                                                    >
                                                        Cancel
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Edit Batch Modal */}
                {editingBatch && (
                    <ModalPortal onClose={() => setEditingBatch(null)}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <h3 style={{ fontSize: '1.25rem', fontWeight: '700' }}>Edit Batch Details</h3>
                                <button style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }} onClick={() => setEditingBatch(null)}>
                                    <X size={20} />
                                </button>
                            </div>
                            
                            <form onSubmit={handleUpdateBatch} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Batch Name</label>
                                    <input 
                                        type="text" 
                                        className="glass-input" 
                                        required 
                                        value={editName}
                                        onChange={(e) => setEditName(e.target.value)}
                                        placeholder="Batch Name"
                                    />
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Course</label>
                                        <select 
                                            className="glass-input" 
                                            required 
                                            value={editCourseId}
                                            onChange={(e) => setEditCourseId(e.target.value)}
                                        >
                                            <option value="">Select Course</option>
                                            {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Teacher</label>
                                        <select 
                                            className="glass-input" 
                                            value={editTeacherId}
                                            onChange={(e) => setEditTeacherId(e.target.value)}
                                        >
                                            <option value="">Unassigned</option>
                                            {teachers.map(t => <option key={t.id} value={t.id}>{t.first_name} {t.last_name}</option>)}
                                        </select>
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Fees (₹)</label>
                                        <input 
                                            type="number" 
                                            className="glass-input" 
                                            required 
                                            value={editFees}
                                            onChange={(e) => setEditFees(e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Capacity</label>
                                        <input 
                                            type="number" 
                                            className="glass-input" 
                                            value={editCapacity}
                                            onChange={(e) => setEditCapacity(e.target.value)}
                                            placeholder="Max students"
                                        />
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Start Date</label>
                                        <input 
                                            type="date" 
                                            className="glass-input" 
                                            value={editStartDate}
                                            onChange={(e) => setEditStartDate(e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>End Date</label>
                                        <input 
                                            type="date" 
                                            className="glass-input" 
                                            value={editEndDate}
                                            onChange={(e) => setEditEndDate(e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                                    <button type="submit" className="btn-primary" style={{ flex: 1, padding: '12px' }}>Save Changes</button>
                                    <button type="button" className="btn-secondary" style={{ flex: 1, padding: '12px' }} onClick={() => setEditingBatch(null)}>Cancel</button>
                                </div>
                            </form>
                        </div>
                    </ModalPortal>
                )}

                {/* Quick Attendance Modal */}
                {activeBatchForAttendance && (
                    <ModalPortal onClose={() => setActiveBatchForAttendance(null)}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <h3 style={{ fontSize: '1.25rem', fontWeight: '700' }}>Mark Batch Attendance</h3>
                                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Batch: {activeBatchForAttendance.name}</span>
                                </div>
                                <button style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }} onClick={() => setActiveBatchForAttendance(null)}>
                                    <X size={20} />
                                </button>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Attendance Date:</label>
                                <input 
                                    type="date" 
                                    className="glass-input" 
                                    style={{ width: 'auto' }}
                                    value={attendanceDate}
                                    onChange={(e) => handleDateChangeAttendance(e.target.value)}
                                />
                            </div>

                            {/* Student attendance list */}
                            <div style={{ maxHeight: '350px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {attendanceRecords.length === 0 ? (
                                    <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px' }}>
                                        No students enrolled in this batch yet.
                                    </div>
                                ) : (
                                    attendanceRecords.map((rec, idx) => (
                                        <div key={rec.studentId} style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            padding: '10px 14px',
                                            background: 'rgba(255,255,255,0.02)',
                                            border: '1px solid var(--border-glass)',
                                            borderRadius: '8px'
                                        }}>
                                            <span style={{ fontSize: '0.9rem', fontWeight: '600' }}>{rec.name}</span>
                                            <div style={{ display: 'flex', gap: '6px' }}>
                                                {(['present', 'absent', 'late'] as const).map(statusOpt => (
                                                    <button
                                                        key={statusOpt}
                                                        type="button"
                                                        onClick={() => {
                                                            const copy = [...attendanceRecords];
                                                            copy[idx].status = statusOpt;
                                                            setAttendanceRecords(copy);
                                                        }}
                                                        style={{
                                                            padding: '4px 10px',
                                                            borderRadius: '6px',
                                                            border: 'none',
                                                            fontSize: '0.78rem',
                                                            fontWeight: '600',
                                                            cursor: 'pointer',
                                                            textTransform: 'capitalize',
                                                            background: rec.status === statusOpt
                                                                ? statusOpt === 'present' ? 'rgba(16, 185, 129, 0.25)' : statusOpt === 'absent' ? 'rgba(239, 68, 68, 0.25)' : 'rgba(245, 158, 11, 0.25)'
                                                                : 'rgba(255,255,255,0.05)',
                                                            color: rec.status === statusOpt
                                                                ? statusOpt === 'present' ? '#34d399' : statusOpt === 'absent' ? '#f87171' : '#fbbf24'
                                                                : 'var(--text-muted)'
                                                        }}
                                                    >
                                                        {statusOpt}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>

                            <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                                <button 
                                    type="button" 
                                    className="btn-primary" 
                                    style={{ flex: 1, padding: '12px' }} 
                                    disabled={savingAttendance || attendanceRecords.length === 0}
                                    onClick={handleSaveAttendance}
                                >
                                    {savingAttendance ? 'Saving...' : 'Save Attendance Records'}
                                </button>
                                <button 
                                    type="button" 
                                    className="btn-secondary" 
                                    style={{ flex: 1, padding: '12px' }} 
                                    onClick={() => setActiveBatchForAttendance(null)}
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </ModalPortal>
                )}
            </div>
        </SidebarLayout>
    );
}
