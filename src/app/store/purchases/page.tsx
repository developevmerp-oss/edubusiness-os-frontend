'use client';

import { useState, useEffect } from 'react';
import SidebarLayout from '../../../components/SidebarLayout';
import { apiRequest } from '../../../utils/api';
import { FileText, Download, ShoppingBag, DollarSign, Calendar } from 'lucide-react';

export default function PurchasesHistoryPage() {
    const [invoices, setInvoices] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeInvoice, setActiveInvoice] = useState<any>(null);

    useEffect(() => {
        fetchInvoices();
    }, []);

    const fetchInvoices = async () => {
        setLoading(true);
        setError('');
        try {
            const data = await apiRequest('/api/store/invoices');
            setInvoices(data.invoices);
        } catch (err: any) {
            setError(err.message || 'Failed to load purchase receipts.');
        } finally {
            setLoading(false);
        }
    };

    const handlePrintInvoice = (inv: any) => {
        setActiveInvoice(inv);
    };

    if (loading) {
        return (
            <SidebarLayout>
                <div style={{ color: 'var(--text-secondary)' }}>Loading billing invoices...</div>
            </SidebarLayout>
        );
    }

    return (
        <SidebarLayout>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                {/* Header */}
                <div>
                    <h1 className="brand-gradient" style={{ fontSize: '2.2rem', fontWeight: '800' }}>
                        Purchase Receipts
                    </h1>
                    <p style={{ color: 'var(--text-secondary)' }}>
                        Track your billing logs, subscription histories, and course receipts.
                    </p>
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

                {/* Receipts table listing */}
                {invoices.length === 0 ? (
                    <div className="glass-panel" style={{ textAlign: 'center', padding: '80px 0', color: 'var(--text-muted)' }}>
                        <FileText size={48} style={{ marginBottom: '16px', opacity: 0.3 }} />
                        <p style={{ fontSize: '1.05rem', fontWeight: '600' }}>No invoice logs found.</p>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Purchase a course from the Storefront marketplace to get started.</p>
                    </div>
                ) : (
                    <div className="glass-panel" style={{ padding: '0', overflow: 'hidden' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                            <thead>
                                <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--border-glass)' }}>
                                    <th style={{ padding: '16px 24px', color: 'var(--text-muted)', fontWeight: '600' }}>Invoice Number</th>
                                    <th style={{ padding: '16px 24px', color: 'var(--text-muted)', fontWeight: '600' }}>Course Purchased</th>
                                    <th style={{ padding: '16px 24px', color: 'var(--text-muted)', fontWeight: '600' }}>Paid Date</th>
                                    <th style={{ padding: '16px 24px', color: 'var(--text-muted)', fontWeight: '600' }}>Payment Mode</th>
                                    <th style={{ padding: '16px 24px', color: 'var(--text-muted)', fontWeight: '600' }}>Final Amount</th>
                                    <th style={{ padding: '16px 24px', color: 'var(--text-muted)', fontWeight: '600', textAlign: 'center' }}>Receipt</th>
                                </tr>
                            </thead>
                            <tbody>
                                {invoices.map((inv) => (
                                    <tr key={inv.id} style={{ borderBottom: '1px solid var(--border-glass)' }}>
                                        <td style={{ padding: '16px 24px', fontWeight: '600', color: 'var(--text-primary)' }}>{inv.invoice_number}</td>
                                        <td style={{ padding: '16px 24px', color: 'var(--text-primary)' }}>{inv.course_title}</td>
                                        <td style={{ padding: '16px 24px', color: 'var(--text-secondary)' }}>
                                            {new Date(inv.issued_at).toLocaleDateString()}
                                        </td>
                                        <td style={{ padding: '16px 24px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                                            {inv.payment_gateway}
                                        </td>
                                        <td style={{ padding: '16px 24px', fontWeight: '700', color: 'var(--text-primary)' }}>
                                            ₹{parseFloat(inv.final_amount).toLocaleString()}
                                        </td>
                                        <td style={{ padding: '16px 24px', textAlign: 'center' }}>
                                            <button 
                                                onClick={() => handlePrintInvoice(inv)}
                                                className="btn-secondary" 
                                                style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                                            >
                                                View Receipt
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Print Receipt Modal view */}
            {activeInvoice && (
                <div style={{
                    position: 'fixed',
                    top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.6)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 100
                }}>
                    <div className="glass-panel" style={{ width: '450px', padding: '30px', borderRadius: '16px', background: '#ffffff', color: '#1e293b' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #e2e8f0', paddingBottom: '12px', marginBottom: '20px' }}>
                            <div>
                                <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#0f172a' }}>OFFICIAL RECEIPT</h3>
                                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{activeInvoice.invoice_number}</span>
                            </div>
                            <button 
                                onClick={() => setActiveInvoice(null)}
                                style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '1.1rem', fontWeight: 'bold' }}
                            >
                                Close
                            </button>
                        </div>

                        {/* Bill values details */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.9rem', marginBottom: '20px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: '#64748b' }}>Date Issued:</span>
                                <span style={{ fontWeight: '600' }}>{new Date(activeInvoice.issued_at).toLocaleString()}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: '#64748b' }}>Payment Method:</span>
                                <span style={{ fontWeight: '600', textTransform: 'uppercase' }}>{activeInvoice.payment_gateway} (Sandbox)</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: '#64748b' }}>Reference ID:</span>
                                <span style={{ fontWeight: '600', fontFamily: 'monospace' }}>{activeInvoice.gateway_payment_id || '—'}</span>
                            </div>
                            <hr style={{ border: 'none', borderTop: '1px solid #e2e8f0' }} />
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: '#0f172a', fontWeight: '600' }}>Item Purchased:</span>
                                <span style={{ fontWeight: '600' }}>{activeInvoice.course_title}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#64748b' }}>
                                <span>Base Amount:</span>
                                <span>₹{parseFloat(activeInvoice.amount).toLocaleString()}</span>
                            </div>
                            {parseFloat(activeInvoice.discount_amount) > 0 && (
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#059669' }}>
                                    <span>Applied Discount:</span>
                                    <span>-₹{parseFloat(activeInvoice.discount_amount).toLocaleString()}</span>
                                </div>
                            )}
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#64748b' }}>
                                <span>GST Tax (18% inclusive):</span>
                                <span>₹{Math.round(parseFloat(activeInvoice.final_amount) * 0.18).toLocaleString()}</span>
                            </div>
                            <hr style={{ border: 'none', borderTop: '2px solid #e2e8f0' }} />
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.25rem', fontWeight: '800', color: '#0f172a' }}>
                                <span>Total Paid:</span>
                                <span>₹{parseFloat(activeInvoice.final_amount).toLocaleString()}</span>
                            </div>
                        </div>

                        <button 
                            onClick={() => window.print()}
                            className="btn-primary" 
                            style={{ width: '100%', padding: '12px', background: '#0f172a', color: '#ffffff' }}
                        >
                            Print Receipt
                        </button>
                    </div>
                </div>
            )}
        </SidebarLayout>
    );
}
