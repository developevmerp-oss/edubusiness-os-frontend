'use client';

import { useState, useEffect } from 'react';
import SidebarLayout from '../../components/SidebarLayout';
import ModalPortal from '../../components/ModalPortal';
import { apiRequest } from '../../utils/api';
import { 
    CreditCard, DollarSign, Clock, CheckCircle2, AlertCircle, 
    Plus, Search, Filter, Printer, Trash2, ArrowUpRight,
    Receipt, Calendar, User, BookOpen, X, FileText
} from 'lucide-react';

interface FeeRecord {
    id: string;
    student_id: string;
    batch_id: string | null;
    amount_due: string | number;
    amount_paid: string | number;
    due_date: string;
    status: 'pending' | 'partially_paid' | 'paid' | 'overdue';
    created_at: string;
    student_first_name: string;
    student_last_name: string;
    student_email: string;
    batch_name: string | null;
}

interface PaymentTransaction {
    id: string;
    fee_id: string;
    amount: string | number;
    payment_date: string;
    payment_method: string;
    transaction_reference: string | null;
    notes: string | null;
    student_first_name: string;
    student_last_name: string;
    batch_name: string | null;
}

interface Installment {
    id: string;
    student_id: string;
    course_id: string | null;
    installment_number: number;
    amount: string | number;
    due_date: string;
    status: string;
    paid_at: string | null;
    student_first_name: string;
    student_last_name: string;
    student_email: string;
    course_title: string | null;
}

export default function FeesManagementPage() {
    const [fees, setFees] = useState<FeeRecord[]>([]);
    const [payments, setPayments] = useState<PaymentTransaction[]>([]);
    const [installments, setInstallments] = useState<Installment[]>([]);
    const [students, setStudents] = useState<any[]>([]);
    const [batches, setBatches] = useState<any[]>([]);

    const [loading, setLoading] = useState(true);
    const [userRole, setUserRole] = useState('');
    const [activeTab, setActiveTab] = useState<'invoices' | 'payments' | 'installments'>('invoices');
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');

    // Create Invoice Modal State
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newStudentId, setNewStudentId] = useState('');
    const [newBatchId, setNewBatchId] = useState('');
    const [newAmountDue, setNewAmountDue] = useState('');
    const [newDueDate, setNewDueDate] = useState('');
    const [creatingInvoice, setCreatingInvoice] = useState(false);

    // Record Payment Modal State
    const [activeFeeForPayment, setActiveFeeForPayment] = useState<FeeRecord | null>(null);
    const [payAmount, setPayAmount] = useState('');
    const [payMethod, setPayMethod] = useState<'cash' | 'card' | 'upi' | 'bank_transfer'>('upi');
    const [payRef, setPayRef] = useState('');
    const [payNotes, setPayNotes] = useState('');
    const [recordingPayment, setRecordingPayment] = useState(false);

    // Print Receipt Modal
    const [receiptFee, setReceiptFee] = useState<FeeRecord | null>(null);

    useEffect(() => {
        const storedUser = localStorage.getItem('user_profile');
        if (storedUser) {
            const parsed = JSON.parse(storedUser);
            setUserRole(parsed.role);
        }
        fetchAllData();
    }, [statusFilter]);

    const fetchAllData = async () => {
        setLoading(true);
        try {
            const feeUrl = statusFilter ? `/api/fees?status=${statusFilter}` : '/api/fees';
            const feeRes = await apiRequest(feeUrl);
            setFees(feeRes.fees || []);

            // Fetch payments ledger & installments
            const storedUser = localStorage.getItem('user_profile');
            const role = storedUser ? JSON.parse(storedUser).role : '';
            if (role === 'admin') {
                const payRes = await apiRequest('/api/fees/payments').catch(() => ({ payments: [] }));
                setPayments(payRes.payments || []);

                const studentRes = await apiRequest('/api/auth/users?role=student').catch(() => ({ users: [] }));
                setStudents(studentRes.users || []);

                const batchRes = await apiRequest('/api/batches').catch(() => ({ batches: [] }));
                setBatches(batchRes.batches || []);
            }

            const instRes = await apiRequest('/api/fees/installments').catch(() => ({ installments: [] }));
            setInstallments(instRes.installments || []);
        } catch (err: any) {
            console.error('Failed to load fees data:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateInvoice = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreatingInvoice(true);
        try {
            await apiRequest('/api/fees', {
                method: 'POST',
                body: JSON.stringify({
                    studentId: newStudentId,
                    batchId: newBatchId || null,
                    amountDue: parseFloat(newAmountDue),
                    dueDate: newDueDate
                })
            });
            alert('Fee invoice generated successfully!');
            setShowCreateModal(false);
            setNewStudentId('');
            setNewBatchId('');
            setNewAmountDue('');
            setNewDueDate('');
            fetchAllData();
        } catch (err: any) {
            alert(err.message || 'Failed to create fee invoice.');
        } finally {
            setCreatingInvoice(false);
        }
    };

    const openRecordPaymentModal = (fee: FeeRecord) => {
        setActiveFeeForPayment(fee);
        const pending = Math.max(0, parseFloat(String(fee.amount_due)) - parseFloat(String(fee.amount_paid)));
        setPayAmount(String(pending));
        setPayMethod('upi');
        setPayRef('');
        setPayNotes('');
    };

    const handleRecordPayment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!activeFeeForPayment) return;
        setRecordingPayment(true);
        try {
            await apiRequest('/api/fees/payments', {
                method: 'POST',
                body: JSON.stringify({
                    feeId: activeFeeForPayment.id,
                    amount: parseFloat(payAmount),
                    paymentMethod: payMethod,
                    transactionReference: payRef.trim() || undefined,
                    notes: payNotes.trim() || undefined
                })
            });
            alert('Payment recorded and invoice updated successfully!');
            setActiveFeeForPayment(null);
            fetchAllData();
        } catch (err: any) {
            alert(err.message || 'Failed to record payment.');
        } finally {
            setRecordingPayment(false);
        }
    };

    const handleDeleteInvoice = async (fee: FeeRecord) => {
        if (!confirm(`Are you sure you want to delete invoice #${fee.id.substring(0, 8)} for ${fee.student_first_name} ${fee.student_last_name}? Any logged payments will also be removed.`)) return;
        try {
            await apiRequest(`/api/fees/${fee.id}`, { method: 'DELETE' });
            alert('Fee invoice deleted successfully.');
            fetchAllData();
        } catch (err: any) {
            alert(err.message || 'Failed to delete fee invoice.');
        }
    };

    const handlePayInstallment = async (instId: string) => {
        if (!confirm('Mark this installment as paid?')) return;
        try {
            await apiRequest(`/api/fees/installments/${instId}/pay`, { method: 'POST' });
            alert('Installment paid successfully!');
            fetchAllData();
        } catch (err: any) {
            alert(err.message || 'Failed to process installment payment.');
        }
    };

    // Metrics calculations
    const totalInvoiced = fees.reduce((sum, f) => sum + parseFloat(String(f.amount_due || 0)), 0);
    const totalCollected = fees.reduce((sum, f) => sum + parseFloat(String(f.amount_paid || 0)), 0);
    const totalPending = Math.max(0, totalInvoiced - totalCollected);
    const overdueCount = fees.filter(f => f.status === 'overdue' || (f.status !== 'paid' && new Date(f.due_date) < new Date())).length;

    // Filter invoices by search
    const filteredFees = fees.filter(f => {
        const q = search.toLowerCase();
        const fullName = `${f.student_first_name || ''} ${f.student_last_name || ''}`.toLowerCase();
        const email = (f.student_email || '').toLowerCase();
        const batch = (f.batch_name || '').toLowerCase();
        return fullName.includes(q) || email.includes(q) || batch.includes(q);
    });

    const getStatusBadge = (status: string, dueDate: string) => {
        const isOverdue = status !== 'paid' && new Date(dueDate) < new Date();
        if (isOverdue || status === 'overdue') {
            return <span style={{ padding: '3px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: '700', background: 'rgba(239, 68, 68, 0.15)', color: '#f87171' }}>OVERDUE</span>;
        }
        switch (status) {
            case 'paid':
                return <span style={{ padding: '3px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: '700', background: 'rgba(52, 211, 153, 0.15)', color: '#34d399' }}>PAID</span>;
            case 'partially_paid':
                return <span style={{ padding: '3px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: '700', background: 'rgba(251, 191, 36, 0.15)', color: '#fbbf24' }}>PARTIAL</span>;
            default:
                return <span style={{ padding: '3px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: '700', background: 'rgba(96, 165, 250, 0.15)', color: '#60a5fa' }}>PENDING</span>;
        }
    };

    return (
        <SidebarLayout>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>

                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
                    <div>
                        <h1 className="gradient-text" style={{ fontSize: '2.2rem', fontWeight: '800' }}>Fee Management & Billing</h1>
                        <p style={{ color: 'var(--text-secondary)' }}>
                            {userRole === 'admin' 
                                ? 'Track student fee invoices, log payments, monitor overdue dues, and view complete transaction ledger.'
                                : 'View your course fee dues, payment schedules, and download fee receipts.'}
                        </p>
                    </div>
                    {userRole === 'admin' && (
                        <button 
                            onClick={() => setShowCreateModal(true)} 
                            className="btn-primary" 
                            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 22px' }}
                        >
                            <Plus size={18} /> Generate Fee Invoice
                        </button>
                    )}
                </div>

                {/* KPI Metrics */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                    <div className="glass-panel" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{ background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8', borderRadius: '12px', padding: '12px' }}>
                            <FileText size={24} />
                        </div>
                        <div>
                            <div style={{ fontSize: '1.6rem', fontWeight: '800' }}>₹{totalInvoiced.toLocaleString('en-IN')}</div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Total Invoiced</div>
                        </div>
                    </div>

                    <div className="glass-panel" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{ background: 'rgba(52, 211, 153, 0.15)', color: '#34d399', borderRadius: '12px', padding: '12px' }}>
                            <CheckCircle2 size={24} />
                        </div>
                        <div>
                            <div style={{ fontSize: '1.6rem', fontWeight: '800' }}>₹{totalCollected.toLocaleString('en-IN')}</div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Total Collected</div>
                        </div>
                    </div>

                    <div className="glass-panel" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{ background: 'rgba(251, 191, 36, 0.15)', color: '#fbbf24', borderRadius: '12px', padding: '12px' }}>
                            <Clock size={24} />
                        </div>
                        <div>
                            <div style={{ fontSize: '1.6rem', fontWeight: '800' }}>₹{totalPending.toLocaleString('en-IN')}</div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Pending Balance</div>
                        </div>
                    </div>

                    <div className="glass-panel" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#f87171', borderRadius: '12px', padding: '12px' }}>
                            <AlertCircle size={24} />
                        </div>
                        <div>
                            <div style={{ fontSize: '1.6rem', fontWeight: '800' }}>{overdueCount}</div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Overdue Invoices</div>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div style={{ display: 'flex', gap: '10px', borderBottom: '1px solid var(--border-glass)', paddingBottom: '10px' }}>
                    <button
                        onClick={() => setActiveTab('invoices')}
                        style={{
                            padding: '10px 18px',
                            borderRadius: '8px',
                            border: 'none',
                            background: activeTab === 'invoices' ? 'var(--primary)' : 'transparent',
                            color: activeTab === 'invoices' ? '#fff' : 'var(--text-secondary)',
                            fontWeight: '600',
                            fontSize: '0.9rem',
                            cursor: 'pointer'
                        }}
                    >
                        Invoices & Dues ({fees.length})
                    </button>
                    {userRole === 'admin' && (
                        <button
                            onClick={() => setActiveTab('payments')}
                            style={{
                                padding: '10px 18px',
                                borderRadius: '8px',
                                border: 'none',
                                background: activeTab === 'payments' ? 'var(--primary)' : 'transparent',
                                color: activeTab === 'payments' ? '#fff' : 'var(--text-secondary)',
                                fontWeight: '600',
                                fontSize: '0.9rem',
                                cursor: 'pointer'
                            }}
                        >
                            Payment Ledger ({payments.length})
                        </button>
                    )}
                    <button
                        onClick={() => setActiveTab('installments')}
                        style={{
                            padding: '10px 18px',
                            borderRadius: '8px',
                            border: 'none',
                            background: activeTab === 'installments' ? 'var(--primary)' : 'transparent',
                            color: activeTab === 'installments' ? '#fff' : 'var(--text-secondary)',
                            fontWeight: '600',
                            fontSize: '0.9rem',
                            cursor: 'pointer'
                        }}
                    >
                        Installment Plans ({installments.length})
                    </button>
                </div>

                {/* TAB 1: Invoices */}
                {activeTab === 'invoices' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {/* Search & Filter */}
                        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                            <div style={{ flex: 1, minWidth: '220px', position: 'relative' }}>
                                <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                <input
                                    className="glass-input"
                                    placeholder="Search by student name, email, or batch..."
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                    style={{ paddingLeft: '36px' }}
                                />
                            </div>
                            <select
                                className="glass-input"
                                value={statusFilter}
                                onChange={e => setStatusFilter(e.target.value)}
                                style={{ minWidth: '160px' }}
                            >
                                <option value="">All Statuses</option>
                                <option value="pending">Pending</option>
                                <option value="partially_paid">Partially Paid</option>
                                <option value="paid">Paid</option>
                                <option value="overdue">Overdue</option>
                            </select>
                        </div>

                        {/* Invoices Table */}
                        <div className="glass-panel" style={{ padding: 0, overflow: 'hidden', borderRadius: '14px' }}>
                            {loading ? (
                                <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading fee invoices...</div>
                            ) : filteredFees.length === 0 ? (
                                <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
                                    <Receipt size={40} style={{ marginBottom: '12px', opacity: 0.3 }} />
                                    <p>{search ? 'No fee records match your search query.' : 'No fee records found.'}</p>
                                </div>
                            ) : (
                                <div style={{ overflowX: 'auto' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
                                        <thead>
                                            <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--border-glass)' }}>
                                                {['Invoice #', 'Student', 'Batch / Detail', 'Due Date', 'Amount Due', 'Paid', 'Balance', 'Status', 'Actions'].map(h => (
                                                    <th key={h} style={{ padding: '14px 20px', textAlign: h === 'Actions' ? 'right' : 'left', color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredFees.map(f => {
                                                const due = parseFloat(String(f.amount_due || 0));
                                                const paid = parseFloat(String(f.amount_paid || 0));
                                                const balance = Math.max(0, due - paid);
                                                return (
                                                    <tr key={f.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                                                        <td style={{ padding: '14px 20px', fontWeight: '600', color: 'var(--primary)' }}>
                                                            #{f.id.substring(0, 8)}
                                                        </td>
                                                        <td style={{ padding: '14px 20px' }}>
                                                            <div style={{ fontWeight: '600' }}>{f.student_first_name} {f.student_last_name}</div>
                                                            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{f.student_email}</div>
                                                        </td>
                                                        <td style={{ padding: '14px 20px', color: 'var(--text-secondary)' }}>
                                                            {f.batch_name || 'General Tuition Fee'}
                                                        </td>
                                                        <td style={{ padding: '14px 20px', color: 'var(--text-muted)' }}>
                                                            {new Date(f.due_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                        </td>
                                                        <td style={{ padding: '14px 20px', fontWeight: '600' }}>
                                                            ₹{due.toLocaleString('en-IN')}
                                                        </td>
                                                        <td style={{ padding: '14px 20px', color: '#34d399', fontWeight: '600' }}>
                                                            ₹{paid.toLocaleString('en-IN')}
                                                        </td>
                                                        <td style={{ padding: '14px 20px', color: balance > 0 ? '#f87171' : 'var(--text-muted)', fontWeight: '600' }}>
                                                            ₹{balance.toLocaleString('en-IN')}
                                                        </td>
                                                        <td style={{ padding: '14px 20px' }}>
                                                            {getStatusBadge(f.status, f.due_date)}
                                                        </td>
                                                        <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                                                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', alignItems: 'center' }}>
                                                                <button
                                                                    onClick={() => setReceiptFee(f)}
                                                                    title="View / Print Receipt"
                                                                    className="btn-secondary"
                                                                    style={{ padding: '6px 10px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                                                                >
                                                                    <Printer size={13} /> Slip
                                                                </button>
                                                                {userRole === 'admin' && balance > 0 && (
                                                                    <button
                                                                        onClick={() => openRecordPaymentModal(f)}
                                                                        title="Record Payment"
                                                                        className="btn-primary"
                                                                        style={{ padding: '6px 10px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                                                                    >
                                                                        <DollarSign size={13} /> Collect
                                                                    </button>
                                                                )}
                                                                {userRole === 'admin' && (
                                                                    <button
                                                                        onClick={() => handleDeleteInvoice(f)}
                                                                        title="Delete Invoice"
                                                                        className="btn-secondary"
                                                                        style={{ padding: '6px 10px', fontSize: '0.75rem', color: 'var(--danger)', borderColor: 'rgba(239, 68, 68, 0.3)' }}
                                                                    >
                                                                        <Trash2 size={13} />
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* TAB 2: Payment Ledger (Admin Only) */}
                {activeTab === 'payments' && userRole === 'admin' && (
                    <div className="glass-panel" style={{ padding: 0, overflow: 'hidden', borderRadius: '14px' }}>
                        {payments.length === 0 ? (
                            <div style={{ padding: '50px', textAlign: 'center', color: 'var(--text-muted)' }}>
                                <CreditCard size={40} style={{ opacity: 0.3, marginBottom: '10px' }} />
                                <p>No fee transactions recorded yet.</p>
                            </div>
                        ) : (
                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
                                    <thead>
                                        <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--border-glass)' }}>
                                            {['Date', 'Student', 'Batch', 'Amount', 'Method', 'Ref #', 'Notes'].map(h => (
                                                <th key={h} style={{ padding: '14px 20px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.8rem', textTransform: 'uppercase' }}>{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {payments.map(p => (
                                            <tr key={p.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                                                <td style={{ padding: '14px 20px', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                                                    {new Date(p.payment_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                </td>
                                                <td style={{ padding: '14px 20px', fontWeight: '600' }}>
                                                    {p.student_first_name} {p.student_last_name}
                                                </td>
                                                <td style={{ padding: '14px 20px', color: 'var(--text-secondary)' }}>
                                                    {p.batch_name || 'Tuition'}
                                                </td>
                                                <td style={{ padding: '14px 20px', color: '#34d399', fontWeight: '700' }}>
                                                    ₹{parseFloat(String(p.amount)).toLocaleString('en-IN')}
                                                </td>
                                                <td style={{ padding: '14px 20px' }}>
                                                    <span style={{ textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: '700', padding: '3px 8px', borderRadius: '4px', background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8' }}>
                                                        {p.payment_method}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '14px 20px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                                                    {p.transaction_reference || '—'}
                                                </td>
                                                <td style={{ padding: '14px 20px', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                                                    {p.notes || '—'}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}

                {/* TAB 3: Installments */}
                {activeTab === 'installments' && (
                    <div className="glass-panel" style={{ padding: 0, overflow: 'hidden', borderRadius: '14px' }}>
                        {installments.length === 0 ? (
                            <div style={{ padding: '50px', textAlign: 'center', color: 'var(--text-muted)' }}>
                                <Calendar size={40} style={{ opacity: 0.3, marginBottom: '10px' }} />
                                <p>No installment schedules configured.</p>
                            </div>
                        ) : (
                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
                                    <thead>
                                        <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--border-glass)' }}>
                                            {['Installment #', 'Student', 'Course', 'Amount', 'Due Date', 'Status', 'Action'].map(h => (
                                                <th key={h} style={{ padding: '14px 20px', textAlign: h === 'Action' ? 'right' : 'left', color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.8rem', textTransform: 'uppercase' }}>{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {installments.map(inst => (
                                            <tr key={inst.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                                                <td style={{ padding: '14px 20px', fontWeight: '600', color: 'var(--primary)' }}>
                                                    Inst. #{inst.installment_number}
                                                </td>
                                                <td style={{ padding: '14px 20px', fontWeight: '600' }}>
                                                    {inst.student_first_name} {inst.student_last_name}
                                                </td>
                                                <td style={{ padding: '14px 20px', color: 'var(--text-secondary)' }}>
                                                    {inst.course_title || 'Enrolled Course'}
                                                </td>
                                                <td style={{ padding: '14px 20px', fontWeight: '700' }}>
                                                    ₹{parseFloat(String(inst.amount)).toLocaleString('en-IN')}
                                                </td>
                                                <td style={{ padding: '14px 20px', color: 'var(--text-muted)' }}>
                                                    {new Date(inst.due_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                </td>
                                                <td style={{ padding: '14px 20px' }}>
                                                    <span style={{ 
                                                        padding: '3px 8px', 
                                                        borderRadius: '4px', 
                                                        fontSize: '0.75rem', 
                                                        fontWeight: '700', 
                                                        background: inst.status === 'paid' ? 'rgba(52, 211, 153, 0.15)' : 'rgba(251, 191, 36, 0.15)', 
                                                        color: inst.status === 'paid' ? '#34d399' : '#fbbf24' 
                                                    }}>
                                                        {inst.status?.toUpperCase()}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                                                    {inst.status !== 'paid' && (
                                                        <button 
                                                            onClick={() => handlePayInstallment(inst.id)} 
                                                            className="btn-primary" 
                                                            style={{ padding: '5px 12px', fontSize: '0.75rem' }}
                                                        >
                                                            Pay Installment
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Create Fee Invoice Modal */}
            {showCreateModal && (
                <ModalPortal onClose={() => setShowCreateModal(false)}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <h2 style={{ fontWeight: '800', fontSize: '1.3rem', color: 'var(--text-primary)' }}>Generate Fee Invoice</h2>
                        <button onClick={() => setShowCreateModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                            <X size={20} />
                        </button>
                    </div>

                    <form onSubmit={handleCreateInvoice} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '5px' }}>Student *</label>
                            <select 
                                className="glass-input" 
                                required 
                                value={newStudentId} 
                                onChange={e => setNewStudentId(e.target.value)}
                            >
                                <option value="">-- Select Student --</option>
                                {students.map(s => (
                                    <option key={s.id} value={s.id}>{s.first_name} {s.last_name} ({s.email})</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '5px' }}>Batch (Optional)</label>
                            <select 
                                className="glass-input" 
                                value={newBatchId} 
                                onChange={e => setNewBatchId(e.target.value)}
                            >
                                <option value="">-- General / No Batch --</option>
                                {batches.map(b => (
                                    <option key={b.id} value={b.id}>{b.name} (₹{b.fees || 0})</option>
                                ))}
                            </select>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '5px' }}>Amount Due (₹) *</label>
                                <input 
                                    className="glass-input" 
                                    type="number" 
                                    step="0.01" 
                                    required 
                                    placeholder="e.g. 5000" 
                                    value={newAmountDue} 
                                    onChange={e => setNewAmountDue(e.target.value)} 
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '5px' }}>Due Date *</label>
                                <input 
                                    className="glass-input" 
                                    type="date" 
                                    required 
                                    value={newDueDate} 
                                    onChange={e => setNewDueDate(e.target.value)} 
                                />
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                            <button type="button" onClick={() => setShowCreateModal(false)} className="btn-secondary" style={{ flex: 1, padding: '12px' }}>Cancel</button>
                            <button type="submit" className="btn-primary" style={{ flex: 2, padding: '12px' }} disabled={creatingInvoice}>
                                {creatingInvoice ? 'Generating...' : 'Create Invoice'}
                            </button>
                        </div>
                    </form>
                </ModalPortal>
            )}

            {/* Record Payment Modal */}
            {activeFeeForPayment && (
                <ModalPortal onClose={() => setActiveFeeForPayment(null)}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <div>
                            <h2 style={{ fontWeight: '800', fontSize: '1.25rem', color: 'var(--text-primary)' }}>Record Fee Payment</h2>
                            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                                For {activeFeeForPayment.student_first_name} {activeFeeForPayment.student_last_name} (Invoice #{activeFeeForPayment.id.substring(0, 8)})
                            </span>
                        </div>
                        <button onClick={() => setActiveFeeForPayment(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                            <X size={20} />
                        </button>
                    </div>

                    <form onSubmit={handleRecordPayment} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '5px' }}>Amount to Collect (₹) *</label>
                                <input 
                                    className="glass-input" 
                                    type="number" 
                                    step="0.01" 
                                    required 
                                    value={payAmount} 
                                    onChange={e => setPayAmount(e.target.value)} 
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '5px' }}>Payment Method *</label>
                                <select 
                                    className="glass-input" 
                                    value={payMethod} 
                                    onChange={e => setPayMethod(e.target.value as any)}
                                >
                                    <option value="upi">UPI (GPay / PhonePe / Paytm)</option>
                                    <option value="cash">Cash in Hand</option>
                                    <option value="card">Debit / Credit Card</option>
                                    <option value="bank_transfer">Direct Bank Transfer / NEFT</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '5px' }}>Transaction Reference / UTR # (Optional)</label>
                            <input 
                                className="glass-input" 
                                placeholder="e.g. UPI-9283748281" 
                                value={payRef} 
                                onChange={e => setPayRef(e.target.value)} 
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '5px' }}>Remarks / Receipt Note (Optional)</label>
                            <input 
                                className="glass-input" 
                                placeholder="e.g. Part payment received at front desk" 
                                value={payNotes} 
                                onChange={e => setPayNotes(e.target.value)} 
                            />
                        </div>

                        <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                            <button type="button" onClick={() => setActiveFeeForPayment(null)} className="btn-secondary" style={{ flex: 1, padding: '12px' }}>Cancel</button>
                            <button type="submit" className="btn-primary" style={{ flex: 2, padding: '12px' }} disabled={recordingPayment}>
                                {recordingPayment ? 'Recording...' : 'Confirm & Log Payment'}
                            </button>
                        </div>
                    </form>
                </ModalPortal>
            )}

            {/* Printable Fee Slip Modal */}
            {receiptFee && (
                <ModalPortal onClose={() => setReceiptFee(null)}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <h2 style={{ fontWeight: '800', fontSize: '1.25rem', color: 'var(--text-primary)' }}>Fee Invoice Slip</h2>
                        <button onClick={() => setReceiptFee(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                            <X size={20} />
                        </button>
                    </div>

                    <div id="printable-receipt" style={{ 
                        background: '#ffffff', 
                        color: '#111827', 
                        padding: '28px', 
                        borderRadius: '12px',
                        fontFamily: 'Inter, sans-serif'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #e5e7eb', paddingBottom: '16px', marginBottom: '16px' }}>
                            <div>
                                <h3 style={{ fontSize: '1.3rem', fontWeight: '800', color: '#4f46e5' }}>OFFICIAL FEE RECEIPT</h3>
                                <p style={{ fontSize: '0.82rem', color: '#6b7280' }}>Invoice #{receiptFee.id}</p>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <span style={{ 
                                    padding: '4px 10px', 
                                    borderRadius: '6px', 
                                    fontWeight: '700', 
                                    fontSize: '0.78rem',
                                    background: receiptFee.status === 'paid' ? '#dcfce7' : '#fef3c7',
                                    color: receiptFee.status === 'paid' ? '#166534' : '#92400e'
                                }}>
                                    {receiptFee.status.toUpperCase()}
                                </span>
                                <div style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: '4px' }}>
                                    Date: {new Date(receiptFee.created_at).toLocaleDateString('en-IN')}
                                </div>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px', fontSize: '0.88rem' }}>
                            <div>
                                <div style={{ color: '#6b7280', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: '600' }}>Billed To</div>
                                <div style={{ fontWeight: '700', fontSize: '1rem', color: '#111827' }}>{receiptFee.student_first_name} {receiptFee.student_last_name}</div>
                                <div style={{ color: '#4b5563' }}>{receiptFee.student_email}</div>
                            </div>
                            <div>
                                <div style={{ color: '#6b7280', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: '600' }}>Program / Batch</div>
                                <div style={{ fontWeight: '700', color: '#111827' }}>{receiptFee.batch_name || 'Standard Tuition'}</div>
                                <div style={{ color: '#4b5563' }}>Due Date: {new Date(receiptFee.due_date).toLocaleDateString('en-IN')}</div>
                            </div>
                        </div>

                        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px', fontSize: '0.88rem' }}>
                            <thead>
                                <tr style={{ background: '#f3f4f6', borderBottom: '1px solid #e5e7eb' }}>
                                    <th style={{ padding: '8px 12px', textAlign: 'left', color: '#374151' }}>Description</th>
                                    <th style={{ padding: '8px 12px', textAlign: 'right', color: '#374151' }}>Total Due</th>
                                    <th style={{ padding: '8px 12px', textAlign: 'right', color: '#374151' }}>Amount Paid</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                                    <td style={{ padding: '10px 12px' }}>Course Enrollment & Coaching Fee</td>
                                    <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: '600' }}>₹{parseFloat(String(receiptFee.amount_due)).toLocaleString('en-IN')}</td>
                                    <td style={{ padding: '10px 12px', textAlign: 'right', color: '#16a34a', fontWeight: '700' }}>₹{parseFloat(String(receiptFee.amount_paid)).toLocaleString('en-IN')}</td>
                                </tr>
                            </tbody>
                        </table>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
                            <div style={{ width: '220px', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.9rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#4b5563' }}>
                                    <span>Total Invoiced:</span>
                                    <span>₹{parseFloat(String(receiptFee.amount_due)).toLocaleString('en-IN')}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#16a34a', fontWeight: '600' }}>
                                    <span>Total Paid:</span>
                                    <span>₹{parseFloat(String(receiptFee.amount_paid)).toLocaleString('en-IN')}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '800', color: '#111827', borderTop: '1px solid #e5e7eb', paddingTop: '6px' }}>
                                    <span>Remaining Balance:</span>
                                    <span>₹{Math.max(0, parseFloat(String(receiptFee.amount_due)) - parseFloat(String(receiptFee.amount_paid))).toLocaleString('en-IN')}</span>
                                </div>
                            </div>
                        </div>

                        <div style={{ textAlign: 'center', fontSize: '0.75rem', color: '#9ca3af', borderTop: '1px solid #e5e7eb', paddingTop: '12px' }}>
                            This is an automated system-generated invoice receipt. Thank you for your payment.
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
                        <button type="button" onClick={() => setReceiptFee(null)} className="btn-secondary" style={{ flex: 1, padding: '10px' }}>Close</button>
                        <button type="button" onClick={() => window.print()} className="btn-primary" style={{ flex: 2, padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                            <Printer size={16} /> Print Receipt Slip
                        </button>
                    </div>
                </ModalPortal>
            )}
        </SidebarLayout>
    );
}
