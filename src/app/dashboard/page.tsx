'use client';

import { useState, useEffect } from 'react';
import SidebarLayout from '../../components/SidebarLayout';
import { apiRequest } from '../../utils/api';
import { 
    Users, 
    BookOpen, 
    TrendingUp, 
    Calendar, 
    DollarSign, 
    Award,
    CheckCircle,
    XCircle,
    Clock,
    AlertCircle
} from 'lucide-react';

export default function DashboardPage() {
    const [role, setRole] = useState('');
    const [metrics, setMetrics] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Admin recording fee payment state
    const [selectedFee, setSelectedFee] = useState<any>(null);
    const [paymentAmount, setPaymentAmount] = useState('');
    const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'upi' | 'bank_transfer'>('upi');
    const [txnRef, setTxnRef] = useState('');
    const [feesList, setFeesList] = useState<any[]>([]);
    const [installmentsList, setInstallmentsList] = useState<any[]>([]);
    const [riskList, setRiskList] = useState<any[]>([]);

    // Teacher marking attendance state
    const [selectedBatch, setSelectedBatch] = useState<any>(null);
    const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
    const [attendanceRecords, setAttendanceRecords] = useState<any[]>([]);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        setLoading(true);
        setError('');
        try {
            const data = await apiRequest('/api/dashboard/metrics');
            setRole(data.role);
            setMetrics(data.metrics);

            // If admin, fetch all fees for table
            if (data.role === 'admin') {
                const feesData = await apiRequest('/api/fees');
                setFeesList(feesData.fees);
            }

            // Fetch AI Risk Analysis list
            if (data.role === 'admin' || data.role === 'teacher') {
                const riskData = await apiRequest('/api/ai/risk/analysis');
                setRiskList(riskData.riskAnalysis);
            }

            // Fetch Fee Installments Schedule
            try {
                const instData = await apiRequest('/api/fees/installments');
                setInstallmentsList(instData.installments || []);
            } catch (e) {}
        } catch (err: any) {
            setError(err.message || 'Failed to load metrics.');
        } finally {
            setLoading(false);
        }
    };


    // Admin: Record Fee Payment
    const handleRecordPayment = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await apiRequest('/api/fees/payments', {
                method: 'POST',
                body: JSON.stringify({
                    feeId: selectedFee.id,
                    amount: parseFloat(paymentAmount),
                    paymentMethod,
                    transactionReference: txnRef || null
                })
            });
            setSelectedFee(null);
            setPaymentAmount('');
            setTxnRef('');
            fetchDashboardData(); // Refresh metrics
        } catch (err: any) {
            alert(err.message || 'Payment submission failed.');
        }
    };

    // Pay Fee Installment
    const handlePayInstallment = async (installmentId: string) => {
        if (!confirm('Proceed to record payment for this fee installment?')) return;
        try {
            await apiRequest(`/api/fees/installments/${installmentId}/pay`, { method: 'POST' });
            alert('Fee installment payment confirmed successfully!');
            fetchDashboardData();
        } catch (err: any) {
            alert(err.message || 'Payment processing failed.');
        }
    };

    // Teacher: Load Batch students for marking attendance
    const handleLoadAttendance = async (batchId: string) => {
        try {
            const data = await apiRequest(`/api/attendance/batch/${batchId}?date=${attendanceDate}`);
            setSelectedBatch(batchId);
            setAttendanceRecords(data.attendance.map((att: any) => ({
                studentId: att.student_id,
                name: `${att.first_name} ${att.last_name}`,
                status: att.status || 'present', // Default to present if not marked
                remarks: att.remarks || ''
            })));
        } catch (err: any) {
            alert(err.message || 'Failed to load attendance list.');
        }
    };

    // Teacher: Submit marked attendance
    const handleSubmitAttendance = async () => {
        try {
            await apiRequest('/api/attendance', {
                method: 'POST',
                body: JSON.stringify({
                    batchId: selectedBatch,
                    date: attendanceDate,
                    records: attendanceRecords
                })
            });
            setSelectedBatch(null);
            alert('Attendance records logged successfully.');
            fetchDashboardData();
        } catch (err: any) {
            alert(err.message || 'Failed to submit attendance.');
        }
    };

    if (loading) {
        return (
            <SidebarLayout>
                <div style={{ color: 'var(--text-secondary)' }}>Loading dashboard metrics...</div>
            </SidebarLayout>
        );
    }

    if (error) {
        return (
            <SidebarLayout>
                <div style={{ color: 'var(--danger)' }}>Error: {error}</div>
            </SidebarLayout>
        );
    }

    return (
        <SidebarLayout>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                {/* Header Welcome banner */}
                <div>
                    <h1 className="gradient-text" style={{ fontSize: '2.2rem', fontWeight: '800' }}>
                        Dashboard Hub
                    </h1>
                    <p style={{ color: 'var(--text-secondary)' }}>
                        Overview of your academy operations and metrics.
                    </p>
                </div>

                {/* 1. ADMIN DASHBOARD */}
                {role === 'admin' && metrics && (
                    <>
                        {/* Summary Metrics Cards Grid */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
                            <div className="glass-panel" style={{ padding: '24px', display: 'flex', gap: '20px', alignItems: 'center' }}>
                                <div style={{ background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8', borderRadius: '12px', padding: '16px' }}>
                                    <Users size={28} />
                                </div>
                                <div>
                                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Total Students</span>
                                    <h3 style={{ fontSize: '1.8rem', fontWeight: '700', marginTop: '4px' }}>{metrics.totalStudents}</h3>
                                </div>
                            </div>
                            <div className="glass-panel" style={{ padding: '24px', display: 'flex', gap: '20px', alignItems: 'center' }}>
                                <div style={{ background: 'rgba(236, 72, 153, 0.15)', color: '#f472b6', borderRadius: '12px', padding: '16px' }}>
                                    <BookOpen size={28} />
                                </div>
                                <div>
                                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Active Batches</span>
                                    <h3 style={{ fontSize: '1.8rem', fontWeight: '700', marginTop: '4px' }}>{metrics.activeBatches}</h3>
                                </div>
                            </div>
                            <div className="glass-panel" style={{ padding: '24px', display: 'flex', gap: '20px', alignItems: 'center' }}>
                                <div style={{ background: 'rgba(6, 182, 212, 0.15)', color: '#22d3ee', borderRadius: '12px', padding: '16px' }}>
                                    <TrendingUp size={28} />
                                </div>
                                <div>
                                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Attendance Rate</span>
                                    <h3 style={{ fontSize: '1.8rem', fontWeight: '700', marginTop: '4px' }}>{metrics.attendanceRate}%</h3>
                                </div>
                            </div>
                            <div className="glass-panel" style={{ padding: '24px', display: 'flex', gap: '20px', alignItems: 'center' }}>
                                <div style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', borderRadius: '12px', padding: '16px' }}>
                                    <DollarSign size={28} />
                                </div>
                                <div>
                                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Collected Revenue</span>
                                    <h3 style={{ fontSize: '1.8rem', fontWeight: '700', marginTop: '4px' }}>₹{metrics.revenue.collected.toLocaleString()}</h3>
                                </div>
                            </div>
                        </div>

                        {/* Middle grid - Revenue collection progress and Today's schedule */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '24px' }}>
                            {/* Revenue collected breakdown bar */}
                            <div className="glass-panel" style={{ padding: '30px' }}>
                                <h3 style={{ fontSize: '1.2rem', fontWeight: '700', marginBottom: '20px' }}>Fee Collection Progress</h3>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.9rem' }}>
                                    <span style={{ color: 'var(--text-secondary)' }}>Collected: ₹{metrics.revenue.collected.toLocaleString()}</span>
                                    <span style={{ color: 'var(--text-secondary)' }}>Pending: ₹{metrics.revenue.pending.toLocaleString()}</span>
                                </div>
                                {/* Stacked Progress Bar */}
                                <div style={{
                                    height: '16px',
                                    background: 'rgba(255,255,255,0.05)',
                                    borderRadius: '8px',
                                    overflow: 'hidden',
                                    display: 'flex',
                                    marginBottom: '24px'
                                }}>
                                    <div style={{
                                        width: `${(metrics.revenue.collected / (metrics.revenue.collected + metrics.revenue.pending || 1)) * 100}%`,
                                        background: 'linear-gradient(90deg, var(--primary), var(--secondary))'
                                    }} />
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                    <div style={{ borderLeft: '3px solid var(--success)', paddingLeft: '12px' }}>
                                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Overdue Balance</span>
                                        <h4 style={{ color: '#fca5a5', fontSize: '1.2rem', marginTop: '2px' }}>₹{metrics.revenue.overdue.toLocaleString()}</h4>
                                    </div>
                                    <div style={{ borderLeft: '3px solid var(--primary)', paddingLeft: '12px' }}>
                                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Total Receivables</span>
                                        <h4 style={{ color: 'var(--text-primary)', fontSize: '1.2rem', marginTop: '2px' }}>₹{(metrics.revenue.collected + metrics.revenue.pending).toLocaleString()}</h4>
                                    </div>
                                </div>
                            </div>

                            {/* Today's Schedule */}
                            <div className="glass-panel" style={{ padding: '30px' }}>
                                <h3 style={{ fontSize: '1.2rem', fontWeight: '700', marginBottom: '20px' }}>Today's Classes</h3>
                                {metrics.todayClasses.length === 0 ? (
                                    <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>No lectures scheduled for today.</p>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                        {metrics.todayClasses.map((cls: any, i: number) => (
                                            <div key={i} style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                                borderBottom: i < metrics.todayClasses.length - 1 ? '1px solid rgba(255,255,255,0.03)' : 'none',
                                                paddingBottom: '12px'
                                            }}>
                                                <div>
                                                    <h4 style={{ fontSize: '0.95rem', fontWeight: '600' }}>{cls.batchName}</h4>
                                                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{cls.courseTitle} • {cls.teacherName}</span>
                                                </div>
                                                <div style={{
                                                    background: 'rgba(99, 102, 241, 0.1)',
                                                    color: 'var(--primary)',
                                                    padding: '6px 12px',
                                                    borderRadius: '8px',
                                                    fontSize: '0.8rem',
                                                    fontWeight: '600'
                                                }}>
                                                    {cls.time}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Fee invoices list & transaction recorder */}
                        <div className="glass-panel" style={{ padding: '30px' }}>
                            <h3 style={{ fontSize: '1.2rem', fontWeight: '700', marginBottom: '20px' }}>Fee Collections Ledger</h3>
                            <div style={{ overflowX: 'auto' }}>
                                <table className="glass-table">
                                    <thead>
                                        <tr>
                                            <th>Student</th>
                                            <th>Batch</th>
                                            <th>Amount Due</th>
                                            <th>Paid</th>
                                            <th>Due Date</th>
                                            <th>Status</th>
                                            <th>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {feesList.map((fee: any) => (
                                            <tr key={fee.id}>
                                                <td>{fee.student_first_name} {fee.student_last_name}</td>
                                                <td>{fee.batch_name || 'N/A'}</td>
                                                <td>₹{parseFloat(fee.amount_due).toLocaleString()}</td>
                                                <td>₹{parseFloat(fee.amount_paid).toLocaleString()}</td>
                                                <td>{new Date(fee.due_date).toLocaleDateString()}</td>
                                                <td>
                                                    <span style={{
                                                        padding: '4px 8px',
                                                        borderRadius: '6px',
                                                        fontSize: '0.75rem',
                                                        fontWeight: '600',
                                                        background: fee.status === 'paid' ? 'rgba(16, 185, 129, 0.15)' : 
                                                                    fee.status === 'partially_paid' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                                                        color: fee.status === 'paid' ? '#34d399' : 
                                                               fee.status === 'partially_paid' ? '#fbbf24' : '#f87171'
                                                    }}>
                                                        {fee.status.toUpperCase()}
                                                    </span>
                                                </td>
                                                <td>
                                                    {fee.status !== 'paid' ? (
                                                        <button 
                                                            onClick={() => setSelectedFee(fee)}
                                                            className="btn-primary" 
                                                            style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                                                        >
                                                            Collect
                                                        </button>
                                                    ) : (
                                                        <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Settled</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Record Payment Modal Dialog */}
                        {selectedFee && (
                            <div style={{
                                position: 'fixed',
                                top: 0, left: 0, right: 0, bottom: 0,
                                background: 'rgba(0,0,0,0.6)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                zIndex: 100
                            }}>
                                <div className="glass-panel" style={{ width: '400px', padding: '30px', borderRadius: '16px' }}>
                                    <h3 style={{ marginBottom: '16px' }}>Record Fee Payment</h3>
                                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '20px' }}>
                                        Recording payment for <strong>{selectedFee.student_first_name} {selectedFee.student_last_name}</strong>.
                                        Pending amount: <strong>₹{(selectedFee.amount_due - selectedFee.amount_paid).toLocaleString()}</strong>.
                                    </p>
                                    <form onSubmit={handleRecordPayment} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Amount to Pay (₹)</label>
                                            <input 
                                                type="number" 
                                                className="glass-input" 
                                                required 
                                                value={paymentAmount}
                                                onChange={(e) => setPaymentAmount(e.target.value)}
                                                max={selectedFee.amount_due - selectedFee.amount_paid}
                                                min={1}
                                            />
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Payment Method</label>
                                            <select 
                                                className="glass-input"
                                                value={paymentMethod}
                                                onChange={(e) => setPaymentMethod(e.target.value as any)}
                                            >
                                                <option value="upi">UPI / Scanner</option>
                                                <option value="cash">Cash Payment</option>
                                                <option value="bank_transfer">Direct Bank Transfer</option>
                                                <option value="card">Debit/Credit Card</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Txn Reference ID</label>
                                            <input 
                                                type="text" 
                                                className="glass-input" 
                                                placeholder="e.g. UPI-928310398"
                                                value={txnRef}
                                                onChange={(e) => setTxnRef(e.target.value)}
                                            />
                                        </div>
                                        <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                                            <button type="submit" className="btn-primary" style={{ flex: 1 }}>Submit</button>
                                            <button 
                                                type="button" 
                                                className="btn-secondary" 
                                                style={{ flex: 1 }} 
                                                onClick={() => setSelectedFee(null)}
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        )}
                    </>
                )}

                {/* 2. TEACHER DASHBOARD */}
                {role === 'teacher' && metrics && (
                    <>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
                            <div className="glass-panel" style={{ padding: '24px', display: 'flex', gap: '20px', alignItems: 'center' }}>
                                <div style={{ background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8', borderRadius: '12px', padding: '16px' }}>
                                    <BookOpen size={28} />
                                </div>
                                <div>
                                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>My Batches</span>
                                    <h3 style={{ fontSize: '1.8rem', fontWeight: '700', marginTop: '4px' }}>{metrics.batchCount}</h3>
                                </div>
                            </div>
                            <div className="glass-panel" style={{ padding: '24px', display: 'flex', gap: '20px', alignItems: 'center' }}>
                                <div style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', borderRadius: '12px', padding: '16px' }}>
                                    <Users size={28} />
                                </div>
                                <div>
                                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Total Students Enrolled</span>
                                    <h3 style={{ fontSize: '1.8rem', fontWeight: '700', marginTop: '4px' }}>{metrics.totalStudents}</h3>
                                </div>
                            </div>
                        </div>

                        {/* Today's Schedule for Teacher with action to mark attendance */}
                        <div className="glass-panel" style={{ padding: '30px' }}>
                            <h3 style={{ fontSize: '1.2rem', fontWeight: '700', marginBottom: '20px' }}>Today's Teaching Schedule</h3>
                            {metrics.todayClasses.length === 0 ? (
                                <p style={{ color: 'var(--text-muted)' }}>No lectures scheduled for today.</p>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    {metrics.todayClasses.map((cls: any) => (
                                        <div key={cls.id} style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            borderBottom: '1px solid rgba(255,255,255,0.03)',
                                            paddingBottom: '16px'
                                        }}>
                                            <div>
                                                <h4 style={{ fontSize: '1.05rem', fontWeight: '600' }}>{cls.batchName}</h4>
                                                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                                                    <Clock size={14} /> {cls.time}
                                                </span>
                                            </div>
                                            <button 
                                                onClick={() => handleLoadAttendance(cls.id)}
                                                className="btn-primary" 
                                                style={{ padding: '8px 16px', fontSize: '0.85rem' }}
                                            >
                                                Mark Attendance
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Mark Attendance Modal */}
                        {selectedBatch && (
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
                                    <h3 style={{ marginBottom: '10px' }}>Mark Daily Attendance</h3>
                                    
                                    <div style={{ marginBottom: '20px' }}>
                                        <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Date</label>
                                        <input 
                                            type="date" 
                                            className="glass-input" 
                                            value={attendanceDate}
                                            onChange={(e) => setAttendanceDate(e.target.value)}
                                        />
                                    </div>

                                    <div style={{ flex: 1, overflowY: 'auto', marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '12px', paddingRight: '4px' }}>
                                        {attendanceRecords.map((rec, i) => (
                                            <div key={rec.studentId} style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                                background: 'rgba(255,255,255,0.01)',
                                                border: '1px solid var(--border-glass)',
                                                borderRadius: '8px',
                                                padding: '8px 12px'
                                            }}>
                                                <span style={{ fontSize: '0.9rem', fontWeight: '500' }}>{rec.name}</span>
                                                <div style={{ display: 'flex', gap: '6px' }}>
                                                    {['present', 'absent', 'late'].map(status => (
                                                        <button
                                                            key={status}
                                                            type="button"
                                                            onClick={() => {
                                                                const updated = [...attendanceRecords];
                                                                updated[i].status = status;
                                                                setAttendanceRecords(updated);
                                                            }}
                                                            style={{
                                                                padding: '4px 8px',
                                                                fontSize: '0.75rem',
                                                                borderRadius: '4px',
                                                                border: 'none',
                                                                cursor: 'pointer',
                                                                fontWeight: '600',
                                                                background: rec.status === status ? 
                                                                            (status === 'present' ? 'rgba(16, 185, 129, 0.2)' : status === 'absent' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(245, 158, 11, 0.2)') : 'rgba(255,255,255,0.03)',
                                                                color: rec.status === status ? 
                                                                       (status === 'present' ? '#34d399' : status === 'absent' ? '#f87171' : '#fbbf24') : 'var(--text-secondary)'
                                                            }}
                                                        >
                                                            {status.toUpperCase()}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <div style={{ display: 'flex', gap: '12px' }}>
                                        <button onClick={handleSubmitAttendance} className="btn-primary" style={{ flex: 1 }}>Save Records</button>
                                        <button onClick={() => setSelectedBatch(null)} className="btn-secondary" style={{ flex: 1 }}>Cancel</button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                )}

                {/* 3. STUDENT DASHBOARD */}
                {role === 'student' && metrics && (
                    <>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
                            <div className="glass-panel" style={{ padding: '24px', display: 'flex', gap: '20px', alignItems: 'center' }}>
                                <div style={{ background: 'rgba(6, 182, 212, 0.15)', color: '#22d3ee', borderRadius: '12px', padding: '16px' }}>
                                    <Award size={28} />
                                </div>
                                <div>
                                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Attendance Score</span>
                                    <h3 style={{ fontSize: '1.8rem', fontWeight: '700', marginTop: '4px' }}>{metrics.attendanceRate}%</h3>
                                </div>
                            </div>
                            <div className="glass-panel" style={{ padding: '24px', display: 'flex', gap: '20px', alignItems: 'center' }}>
                                <div style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', borderRadius: '12px', padding: '16px' }}>
                                    <DollarSign size={28} />
                                </div>
                                <div>
                                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Pending Fees</span>
                                    <h3 style={{ fontSize: '1.8rem', fontWeight: '700', marginTop: '4px' }}>₹{metrics.pendingFees.toLocaleString()}</h3>
                                    {metrics.nextDueDate && (
                                        <span style={{ fontSize: '0.7rem', color: '#fca5a5' }}>Due on {new Date(metrics.nextDueDate).toLocaleDateString()}</span>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
                            {/* Today's Schedule */}
                            <div className="glass-panel" style={{ padding: '30px' }}>
                                <h3 style={{ fontSize: '1.2rem', fontWeight: '700', marginBottom: '20px' }}>Today's Lectures</h3>
                                {metrics.todayClasses.length === 0 ? (
                                    <p style={{ color: 'var(--text-muted)' }}>No classes scheduled for today.</p>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                        {metrics.todayClasses.map((cls: any, i: number) => (
                                            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <div>
                                                    <h4 style={{ fontSize: '0.95rem', fontWeight: '600' }}>{cls.batchName}</h4>
                                                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{cls.courseTitle}</span>
                                                </div>
                                                <div style={{ background: 'rgba(99, 102, 241, 0.1)', color: 'var(--primary)', padding: '4px 10px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: '600' }}>
                                                    {cls.time}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* My Enrolled Batches */}
                            <div className="glass-panel" style={{ padding: '30px' }}>
                                <h3 style={{ fontSize: '1.2rem', fontWeight: '700', marginBottom: '20px' }}>My Enrolled Batches</h3>
                                {metrics.enrolledBatches.length === 0 ? (
                                    <p style={{ color: 'var(--text-muted)' }}>You are not enrolled in any batches yet.</p>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                        {metrics.enrolledBatches.map((b: any) => (
                                            <div key={b.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-glass)', borderRadius: '8px', padding: '12px 16px' }}>
                                                <BookOpen size={18} style={{ color: 'var(--primary)' }} />
                                                <div>
                                                    <h4 style={{ fontSize: '0.9rem', fontWeight: '600' }}>{b.batchName}</h4>
                                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{b.courseTitle}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Fee Installment Schedules Table */}
                        {installmentsList.length > 0 && (
                            <div className="glass-panel" style={{ padding: '30px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                    <div>
                                        <h3 style={{ fontSize: '1.2rem', fontWeight: '700' }}>Fee Installment Schedule</h3>
                                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Scheduled fee payments for your enrolled courses</span>
                                    </div>
                                </div>
                                <div style={{ overflowX: 'auto' }}>
                                    <table className="glass-table">
                                        <thead>
                                            <tr>
                                                <th>Installment</th>
                                                <th>Course</th>
                                                <th>Amount</th>
                                                <th>Due Date</th>
                                                <th>Status</th>
                                                <th>Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {installmentsList.map((inst: any) => (
                                                <tr key={inst.id}>
                                                    <td><strong>Installment #{inst.installment_number}</strong></td>
                                                    <td>{inst.course_title || 'Enrolled Course'}</td>
                                                    <td>₹{parseFloat(inst.amount).toLocaleString()}</td>
                                                    <td>{new Date(inst.due_date).toLocaleDateString()}</td>
                                                    <td>
                                                        <span style={{
                                                            padding: '4px 8px',
                                                            borderRadius: '6px',
                                                            fontSize: '0.75rem',
                                                            fontWeight: '600',
                                                            background: inst.status === 'paid' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                                                            color: inst.status === 'paid' ? '#34d399' : '#fbbf24'
                                                        }}>
                                                            {inst.status.toUpperCase()}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        {inst.status !== 'paid' ? (
                                                            <button 
                                                                onClick={() => handlePayInstallment(inst.id)}
                                                                className="btn-primary"
                                                                style={{ padding: '6px 14px', fontSize: '0.78rem' }}
                                                            >
                                                                Pay Now
                                                            </button>
                                                        ) : (
                                                            <span style={{ color: '#10b981', fontSize: '0.8rem', fontWeight: '600' }}>
                                                                ✓ Paid on {new Date(inst.paid_at || inst.created_at).toLocaleDateString()}
                                                            </span>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </>
                )}

                {/* 4. PARENT DASHBOARD */}
                {role === 'parent' && metrics && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        <h3 style={{ fontSize: '1.2rem', fontWeight: '700' }}>Children's Performance & Invoices</h3>
                        {metrics.children.length === 0 ? (
                            <p style={{ color: 'var(--text-muted)' }}>No children associated with your profile.</p>
                        ) : (
                            metrics.children.map((child: any) => (
                                <div key={child.id} className="glass-panel" style={{ padding: '30px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-glass)', paddingBottom: '16px' }}>
                                        <div>
                                            <h4 style={{ fontSize: '1.2rem', fontWeight: '700' }}>{child.name}</h4>
                                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{child.email}</span>
                                        </div>
                                        <div style={{ display: 'flex', gap: '24px' }}>
                                            <div style={{ textAlign: 'right' }}>
                                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Attendance</span>
                                                <h5 style={{ color: child.attendanceRate >= 80 ? '#34d399' : '#fbbf24', fontSize: '1.1rem', fontWeight: '700' }}>
                                                    {child.attendanceRate}%
                                                </h5>
                                            </div>
                                            <div style={{ textAlign: 'right' }}>
                                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Due Fees</span>
                                                <h5 style={{ color: child.pendingFees > 0 ? '#f87171' : '#34d399', fontSize: '1.1rem', fontWeight: '700' }}>
                                                    ₹{child.pendingFees.toLocaleString()}
                                                </h5>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Child's classes */}
                                    <div>
                                        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>Enrolled Batches</span>
                                        {child.enrolledBatches.length === 0 ? (
                                            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Not enrolled in any active classes.</span>
                                        ) : (
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                                                {child.enrolledBatches.map((b: any, index: number) => (
                                                    <span key={index} style={{
                                                        background: 'rgba(255,255,255,0.03)',
                                                        border: '1px solid var(--border-glass)',
                                                        borderRadius: '6px',
                                                        padding: '6px 12px',
                                                        fontSize: '0.8rem',
                                                        color: 'var(--text-secondary)'
                                                    }}>
                                                        {b.batch_name} ({b.course_title})
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
                {/* 4. AI STUDENT RISK ANALYSIS WARNINGS (Admin/Teacher only) */}
                {(role === 'admin' || role === 'teacher') && riskList.length > 0 && (
                    <div className="glass-panel" style={{ padding: '30px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '1px solid var(--border-glass)', paddingBottom: '12px' }}>
                            <AlertCircle size={20} style={{ color: '#ef4444' }} />
                            <div>
                                <h3 style={{ fontSize: '1.2rem', fontWeight: '700' }}>AI Student Learning Risk Alerts</h3>
                                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>AI-driven predictive modeling based on cohort attendance rate and quiz score averages.</span>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
                            {riskList.map((risk) => (
                                <div key={risk.id} style={{
                                    background: 'rgba(255,255,255,0.01)',
                                    border: '1px solid var(--border-glass)',
                                    borderRadius: '12px',
                                    padding: '20px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '12px'
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <h4 style={{ fontWeight: '700', fontSize: '0.95rem' }}>{risk.first_name} {risk.last_name}</h4>
                                        <span style={{
                                            padding: '2px 8px',
                                            borderRadius: '4px',
                                            fontSize: '0.72rem',
                                            fontWeight: '700',
                                            background: risk.risk_level === 'high' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                                            color: risk.risk_level === 'high' ? '#fca5a5' : '#fcd34d'
                                        }}>
                                            {risk.risk_level.toUpperCase()} RISK
                                        </span>
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                        <div>Attendance: <strong style={{ color: parseFloat(risk.attendance_percentage) < 75 ? '#fca5a5' : 'var(--text-primary)' }}>{parseFloat(risk.attendance_percentage)}%</strong></div>
                                        <div>Average Score: <strong style={{ color: parseFloat(risk.average_score) < 60 ? '#fca5a5' : 'var(--text-primary)' }}>{parseFloat(risk.average_score)}%</strong></div>
                                    </div>
                                    <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: '1.5', borderTop: '1px dashed var(--border-glass)', paddingTop: '8px', margin: 0 }}>
                                        <strong>AI Intervention recommendation:</strong> {risk.recommendation}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </SidebarLayout>
    );
}
