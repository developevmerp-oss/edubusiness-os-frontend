'use client';

import { useState, useEffect } from 'react';
import SidebarLayout from '../../components/SidebarLayout';
import { apiRequest } from '../../utils/api';
import { 
    Users, AlertCircle, PlayCircle, ShieldCheck, Share2, 
    DollarSign, ShoppingCart, CheckCircle, Smartphone, 
    ExternalLink, Plus, RefreshCw, Send, Sparkles, MessageCircle
} from 'lucide-react';

export default function MarketingCRMPage() {
    const [activeTab, setActiveTab] = useState<'crm' | 'affiliates' | 'abandoned'>('crm');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [userRole, setUserRole] = useState('');

    // CRM Leads & Campaigns
    const [leads, setLeads] = useState<any[]>([]);
    const [campaigns, setCampaigns] = useState<any[]>([]);
    const [logs, setLogs] = useState<any[]>([]);
    const [isCreatingCampaign, setIsCreatingCampaign] = useState(false);
    const [campTitle, setCampTitle] = useState('');
    const [campTrigger, setCampTrigger] = useState<'inactive_7_days' | 'course_completed' | 'manual'>('manual');
    const [campChannel, setCampChannel] = useState<'email' | 'whatsapp' | 'both'>('whatsapp');
    const [campTemplate, setCampTemplate] = useState('');

    // Affiliates & Partner Engine
    const [affiliates, setAffiliates] = useState<any[]>([]);
    const [conversions, setConversions] = useState<any[]>([]);
    const [isAddingAffiliate, setIsAddingAffiliate] = useState(false);
    const [newAffName, setNewAffName] = useState('');
    const [newAffEmail, setNewAffEmail] = useState('');
    const [newAffPhone, setNewAffPhone] = useState('');
    const [newAffCode, setNewAffCode] = useState('');
    const [newAffRate, setNewAffRate] = useState(15);
    const [newAffUpi, setNewAffUpi] = useState('');

    // Abandoned Carts
    const [abandonedCarts, setAbandonedCarts] = useState<any[]>([]);
    const [sendingNudgeId, setSendingNudgeId] = useState<string | null>(null);

    useEffect(() => {
        const storedUser = localStorage.getItem('user_profile');
        if (storedUser) {
            setUserRole(JSON.parse(storedUser).role);
        }
        fetchAllData();
    }, []);

    const fetchAllData = async () => {
        setLoading(true);
        setError('');
        try {
            // CRM Data
            const leadsData = await apiRequest('/api/marketing/leads').catch(() => ({ leads: [] }));
            setLeads(leadsData.leads || []);

            const campaignsData = await apiRequest('/api/marketing/campaigns').catch(() => ({ campaigns: [] }));
            setCampaigns(campaignsData.campaigns || []);

            const logsData = await apiRequest('/api/marketing/logs').catch(() => ({ logs: [] }));
            setLogs(logsData.logs || []);

            // Affiliates Data
            const affData = await apiRequest('/api/marketing/affiliates').catch(() => ({ affiliates: [], conversions: [] }));
            setAffiliates(affData.affiliates || []);
            setConversions(affData.conversions || []);

            // Abandoned Carts Data
            const cartsData = await apiRequest('/api/marketing/abandoned-carts').catch(() => ({ abandonedCarts: [] }));
            setAbandonedCarts(cartsData.abandonedCarts || []);
        } catch (err: any) {
            setError(err.message || 'Failed to load marketing details.');
        } finally {
            setLoading(false);
        }
    };

    // Lead Status Handler
    const handleUpdateLeadStatus = async (leadId: string, status: string) => {
        try {
            await apiRequest(`/api/marketing/leads/${leadId}/status`, {
                method: 'POST',
                body: JSON.stringify({ status })
            });
            fetchAllData();
        } catch (err: any) {
            alert(err.message || 'Failed to update lead status.');
        }
    };

    // Create Campaign Handler
    const handleCreateCampaign = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await apiRequest('/api/marketing/campaigns', {
                method: 'POST',
                body: JSON.stringify({
                    title: campTitle,
                    triggerType: campTrigger,
                    channel: campChannel,
                    messageTemplate: campTemplate
                })
            });
            setCampTitle('');
            setCampTemplate('');
            setIsCreatingCampaign(false);
            setSuccessMessage('New campaign template registered successfully!');
            fetchAllData();
            setTimeout(() => setSuccessMessage(''), 4000);
        } catch (err: any) {
            alert(err.message || 'Failed to create campaign template.');
        }
    };

    // Trigger Campaign Handler
    const handleTriggerCampaign = async (campaignId: string) => {
        try {
            const data = await apiRequest(`/api/marketing/campaigns/${campaignId}/trigger`, {
                method: 'POST'
            });
            setSuccessMessage(data.message || 'Campaign manual dispatch simulations triggered successfully!');
            fetchAllData();
            setTimeout(() => setSuccessMessage(''), 4000);
        } catch (err: any) {
            alert(err.message || 'Failed to run campaign simulation.');
        }
    };

    // Create Affiliate Handler
    const handleCreateAffiliate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await apiRequest('/api/marketing/affiliates', {
                method: 'POST',
                body: JSON.stringify({
                    name: newAffName,
                    email: newAffEmail,
                    phone: newAffPhone || undefined,
                    referralCode: newAffCode,
                    commissionRate: Number(newAffRate),
                    upiId: newAffUpi || undefined
                })
            });
            setNewAffName('');
            setNewAffEmail('');
            setNewAffPhone('');
            setNewAffCode('');
            setNewAffUpi('');
            setIsAddingAffiliate(false);
            setSuccessMessage('Partner registered with unique affiliate referral code!');
            fetchAllData();
            setTimeout(() => setSuccessMessage(''), 4000);
        } catch (err: any) {
            alert(err.message || 'Failed to register affiliate partner.');
        }
    };

    // Settle Payout Handler
    const handleSettlePayout = async (affiliateId: string, name: string) => {
        if (!confirm(`Confirm payout settlement for ${name}?`)) return;
        try {
            const res = await apiRequest(`/api/marketing/affiliates/${affiliateId}/payout`, {
                method: 'POST'
            });
            setSuccessMessage(res.message || 'Payout settled successfully!');
            fetchAllData();
            setTimeout(() => setSuccessMessage(''), 4000);
        } catch (err: any) {
            alert(err.message || 'Failed to process payout.');
        }
    };

    // Send WhatsApp Recovery Nudge Handler
    const handleSendRecoveryNudge = async (cartId: string) => {
        setSendingNudgeId(cartId);
        try {
            const res = await apiRequest(`/api/marketing/abandoned-carts/${cartId}/recover`, {
                method: 'POST'
            });
            setSuccessMessage(res.message || 'WhatsApp Recovery Nudge dispatched with coupon code!');
            fetchAllData();
            setTimeout(() => setSuccessMessage(''), 5000);
        } catch (err: any) {
            alert(err.message || 'Failed to dispatch recovery nudge.');
        } finally {
            setSendingNudgeId(null);
        }
    };

    const copyAffiliateLink = (code: string) => {
        const origin = typeof window !== 'undefined' ? window.location.origin : 'https://academy.edu';
        const url = `${origin}/store?ref=${code}`;
        navigator.clipboard.writeText(url);
        setSuccessMessage(`Affiliate referral link copied: ${url}`);
        setTimeout(() => setSuccessMessage(''), 4000);
    };

    // Metrics Calculations
    const totalPartnerSales = affiliates.reduce((acc, a) => acc + parseFloat(a.total_sales_generated || 0), 0);
    const totalPendingPayout = affiliates.reduce((acc, a) => acc + parseFloat(a.pending_payout || 0), 0);
    const totalAbandonedValue = abandonedCarts.reduce((acc, c) => acc + parseFloat(c.cart_value || 0), 0);
    const recoveredCount = abandonedCarts.filter(c => c.recovery_status === 'nudge_sent' || c.recovery_status === 'recovered').length;

    if (loading) {
        return (
            <SidebarLayout>
                <div style={{ color: 'var(--text-secondary)' }}>Loading Growth & Marketing Suite...</div>
            </SidebarLayout>
        );
    }

    if (userRole !== 'admin' && userRole !== 'teacher') {
        return (
            <SidebarLayout>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 0', gap: '16px' }}>
                    <ShieldCheck size={48} style={{ color: 'var(--danger)' }} />
                    <h3>Access Restricted</h3>
                    <p style={{ color: 'var(--text-muted)' }}>Only admin and instructors can manage marketing automations.</p>
                </div>
            </SidebarLayout>
        );
    }

    return (
        <SidebarLayout>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
                
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                    <div>
                        <h1 className="brand-gradient" style={{ fontSize: '2.2rem', fontWeight: '800' }}>
                            Marketing, Sales & Growth Engine
                        </h1>
                        <p style={{ color: 'var(--text-secondary)' }}>
                            High-converting lead captures, affiliate referral tracking, and automated WhatsApp cart recovery nudges.
                        </p>
                    </div>

                    <button 
                        onClick={fetchAllData} 
                        className="btn-secondary" 
                        style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}
                    >
                        <RefreshCw size={14} /> Refresh Data
                    </button>
                </div>

                {/* Notifications */}
                {error && (
                    <div style={{ padding: '12px 16px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#fca5a5', borderRadius: '8px', fontSize: '0.9rem' }}>
                        ⚠️ {error}
                    </div>
                )}
                {successMessage && (
                    <div style={{ padding: '12px 16px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', color: '#a7f3d0', borderRadius: '8px', fontSize: '0.9rem' }}>
                        ✓ {successMessage}
                    </div>
                )}

                {/* Navigation Tabs */}
                <div style={{
                    display: 'flex',
                    background: 'rgba(255, 255, 255, 0.03)',
                    padding: '6px',
                    borderRadius: '12px',
                    border: '1px solid var(--border-glass)',
                    width: 'fit-content',
                    gap: '6px'
                }}>
                    <button
                        onClick={() => setActiveTab('crm')}
                        style={{
                            padding: '10px 18px',
                            borderRadius: '8px',
                            border: 'none',
                            fontSize: '0.88rem',
                            fontWeight: '600',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            background: activeTab === 'crm' ? 'var(--primary)' : 'transparent',
                            color: activeTab === 'crm' ? '#fff' : 'var(--text-muted)',
                            transition: 'all 0.2s ease'
                        }}
                    >
                        <Users size={16} /> Student Leads & CRM ({leads.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('affiliates')}
                        style={{
                            padding: '10px 18px',
                            borderRadius: '8px',
                            border: 'none',
                            fontSize: '0.88rem',
                            fontWeight: '600',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            background: activeTab === 'affiliates' ? 'var(--primary)' : 'transparent',
                            color: activeTab === 'affiliates' ? '#fff' : 'var(--text-muted)',
                            transition: 'all 0.2s ease'
                        }}
                    >
                        <Share2 size={16} /> Affiliate & Referral Engine ({affiliates.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('abandoned')}
                        style={{
                            padding: '10px 18px',
                            borderRadius: '8px',
                            border: 'none',
                            fontSize: '0.88rem',
                            fontWeight: '600',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            background: activeTab === 'abandoned' ? 'var(--primary)' : 'transparent',
                            color: activeTab === 'abandoned' ? '#fff' : 'var(--text-muted)',
                            transition: 'all 0.2s ease'
                        }}
                    >
                        <ShoppingCart size={16} /> WhatsApp Cart Recovery ({abandonedCarts.length})
                    </button>
                </div>

                {/* ========================================================
                    TAB 1: CRM & LEADS
                   ======================================================== */}
                {activeTab === 'crm' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.2fr', gap: '24px' }}>
                            {/* Leads Table */}
                            <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <h3 style={{ fontSize: '1.2rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <Users size={18} style={{ color: 'var(--primary)' }} /> Student Leads Pipeline
                                    </h3>
                                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Auto-captured from landing page</span>
                                </div>
                                
                                {leads.length === 0 ? (
                                    <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '30px' }}>No lead inquiries recorded yet.</div>
                                ) : (
                                    <div style={{ overflowX: 'auto' }}>
                                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                                            <thead>
                                                <tr style={{ borderBottom: '1px solid var(--border-glass)' }}>
                                                    <th style={{ padding: '12px 10px', color: 'var(--text-muted)' }}>Student Name</th>
                                                    <th style={{ padding: '12px 10px', color: 'var(--text-muted)' }}>Contact Details</th>
                                                    <th style={{ padding: '12px 10px', color: 'var(--text-muted)' }}>Course Interest</th>
                                                    <th style={{ padding: '12px 10px', color: 'var(--text-muted)' }}>Pipeline Status</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {leads.map(lead => (
                                                    <tr key={lead.id} style={{ borderBottom: '1px solid var(--border-glass)' }}>
                                                        <td style={{ padding: '12px 10px', fontWeight: '600' }}>{lead.name}</td>
                                                        <td style={{ padding: '12px 10px', color: 'var(--text-secondary)' }}>
                                                            <div>{lead.email}</div>
                                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{lead.phone || '—'}</div>
                                                        </td>
                                                        <td style={{ padding: '12px 10px', color: 'var(--text-secondary)' }}>{lead.course_title || 'General Admission'}</td>
                                                        <td style={{ padding: '12px 10px' }}>
                                                            <select 
                                                                className="glass-input" 
                                                                value={lead.status}
                                                                onChange={(e) => handleUpdateLeadStatus(lead.id, e.target.value)}
                                                                style={{ padding: '4px 8px', fontSize: '0.78rem', width: 'auto' }}
                                                            >
                                                                <option value="new">New</option>
                                                                <option value="contacted">Contacted</option>
                                                                <option value="converted">Converted</option>
                                                                <option value="closed">Closed</option>
                                                            </select>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>

                            {/* Campaign Rules */}
                            <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <h3 style={{ fontSize: '1.05rem', fontWeight: '700' }}>Automated Campaign Triggers</h3>
                                    <button onClick={() => setIsCreatingCampaign(!isCreatingCampaign)} className="btn-secondary" style={{ padding: '4px 10px', fontSize: '0.75rem' }}>
                                        {isCreatingCampaign ? 'Close' : '+ New Rule'}
                                    </button>
                                </div>

                                {isCreatingCampaign && (
                                    <form onSubmit={handleCreateCampaign} style={{ display: 'flex', flexDirection: 'column', gap: '12px', background: 'rgba(255,255,255,0.02)', padding: '14px', borderRadius: '8px', border: '1px solid var(--border-glass)' }}>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Rule Title</label>
                                            <input 
                                                type="text" 
                                                className="glass-input" 
                                                placeholder="e.g. 7-Day Inactive Re-engagement"
                                                required 
                                                value={campTitle}
                                                onChange={e => setCampTitle(e.target.value)}
                                            />
                                        </div>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <div style={{ flex: 1 }}>
                                                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Trigger</label>
                                                <select 
                                                    className="glass-input" 
                                                    value={campTrigger}
                                                    onChange={e => setCampTrigger(e.target.value as any)}
                                                >
                                                    <option value="manual">Manual</option>
                                                    <option value="inactive_7_days">Inactive 7 Days</option>
                                                    <option value="course_completed">Course Completed</option>
                                                </select>
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Channel</label>
                                                <select 
                                                    className="glass-input" 
                                                    value={campChannel}
                                                    onChange={e => setCampChannel(e.target.value as any)}
                                                >
                                                    <option value="whatsapp">WhatsApp</option>
                                                    <option value="email">Email</option>
                                                    <option value="both">Both</option>
                                                </select>
                                            </div>
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Message Template</label>
                                            <textarea 
                                                className="glass-input" 
                                                rows={2}
                                                placeholder="Hi {{name}}, here is your reminder..."
                                                required
                                                value={campTemplate}
                                                onChange={e => setCampTemplate(e.target.value)}
                                            />
                                        </div>
                                        <button type="submit" className="btn-primary" style={{ padding: '8px', fontSize: '0.8rem' }}>Save Rule</button>
                                    </form>
                                )}

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    {campaigns.map(camp => (
                                        <div key={camp.id} style={{
                                            background: 'rgba(255,255,255,0.01)',
                                            border: '1px solid var(--border-glass)',
                                            borderRadius: '8px',
                                            padding: '14px',
                                            fontSize: '0.82rem'
                                        }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                                                <strong>{camp.title}</strong>
                                                <span style={{ fontSize: '0.7rem', color: 'var(--primary)', fontWeight: '700', background: 'rgba(99, 102, 241, 0.1)', padding: '2px 6px', borderRadius: '4px' }}>
                                                    {camp.channel.toUpperCase()}
                                                </span>
                                            </div>
                                            <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', display: 'block', marginBottom: '8px' }}>
                                                Trigger: {camp.trigger_type.replace(/_/g, ' ')}
                                            </span>
                                            <button 
                                                onClick={() => handleTriggerCampaign(camp.id)}
                                                className="btn-primary" 
                                                style={{ width: '100%', padding: '6px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                                            >
                                                <PlayCircle size={14} /> Trigger Dispatch Simulation
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Dispatch History Logs */}
                        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <h3 style={{ fontSize: '1.1rem', fontWeight: '700' }}>Recent Dispatch Delivery History</h3>
                            {logs.length === 0 ? (
                                <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px' }}>No logs recorded yet.</div>
                            ) : (
                                <div style={{ maxHeight: '250px', overflowY: 'auto' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                                        <thead>
                                            <tr style={{ borderBottom: '1px solid var(--border-glass)' }}>
                                                <th style={{ padding: '10px', color: 'var(--text-muted)' }}>Campaign Rule</th>
                                                <th style={{ padding: '10px', color: 'var(--text-muted)' }}>Recipient Contact</th>
                                                <th style={{ padding: '10px', color: 'var(--text-muted)' }}>Channel</th>
                                                <th style={{ padding: '10px', color: 'var(--text-muted)' }}>Delivery Status</th>
                                                <th style={{ padding: '10px', color: 'var(--text-muted)' }}>Timestamp</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {logs.map(log => (
                                                <tr key={log.id} style={{ borderBottom: '1px solid var(--border-glass)' }}>
                                                    <td style={{ padding: '10px', fontWeight: '600' }}>{log.campaign_title || 'Automated Nudge'}</td>
                                                    <td style={{ padding: '10px', color: 'var(--text-secondary)' }}>{log.recipient_email}</td>
                                                    <td style={{ padding: '10px' }}>
                                                        <span style={{ textTransform: 'uppercase', fontSize: '0.75rem', color: log.channel === 'whatsapp' ? '#34d399' : 'var(--primary)' }}>
                                                            {log.channel}
                                                        </span>
                                                    </td>
                                                    <td style={{ padding: '10px', color: '#10b981', fontWeight: '600' }}>SENT</td>
                                                    <td style={{ padding: '10px', color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                                                        {new Date(log.sent_at).toLocaleString()}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* ========================================================
                    TAB 2: AFFILIATES & PARTNER ENGINE
                   ======================================================== */}
                {activeTab === 'affiliates' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        {/* Top Metric Cards */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
                            <div className="glass-panel" style={{ padding: '20px' }}>
                                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Total Partner Revenue</span>
                                <h3 style={{ fontSize: '1.8rem', fontWeight: '800', marginTop: '6px', color: '#34d399' }}>
                                    ₹{totalPartnerSales.toLocaleString()}
                                </h3>
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Generated via influencers & referrals</span>
                            </div>

                            <div className="glass-panel" style={{ padding: '20px' }}>
                                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Active Partners</span>
                                <h3 style={{ fontSize: '1.8rem', fontWeight: '800', marginTop: '6px', color: 'var(--primary)' }}>
                                    {affiliates.length}
                                </h3>
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Content creators & educators</span>
                            </div>

                            <div className="glass-panel" style={{ padding: '20px' }}>
                                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Pending Payout Balance</span>
                                <h3 style={{ fontSize: '1.8rem', fontWeight: '800', marginTop: '6px', color: '#fbbf24' }}>
                                    ₹{totalPendingPayout.toLocaleString()}
                                </h3>
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Ready for UPI / Bank transfer</span>
                            </div>

                            <div className="glass-panel" style={{ padding: '20px' }}>
                                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Total Conversions</span>
                                <h3 style={{ fontSize: '1.8rem', fontWeight: '800', marginTop: '6px', color: '#60a5fa' }}>
                                    {conversions.length}
                                </h3>
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Successful student course enrollments</span>
                            </div>
                        </div>

                        {/* Partner Directory Table */}
                        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                                <div>
                                    <h3 style={{ fontSize: '1.2rem', fontWeight: '700' }}>Affiliate & Influencer Partners</h3>
                                    <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Unique tracking codes and real-time revenue shares</p>
                                </div>
                                <button onClick={() => setIsAddingAffiliate(true)} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}>
                                    <Plus size={16} /> Add Affiliate Partner
                                </button>
                            </div>

                            {/* Add Affiliate Modal */}
                            {isAddingAffiliate && (
                                <form onSubmit={handleCreateAffiliate} style={{
                                    background: 'rgba(255, 255, 255, 0.02)',
                                    border: '1px solid var(--border-glass)',
                                    borderRadius: '12px',
                                    padding: '20px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '14px'
                                }}>
                                    <h4 style={{ fontSize: '1rem', fontWeight: '700' }}>Register New Affiliate Partner</h4>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Partner Full Name</label>
                                            <input 
                                                type="text" 
                                                className="glass-input" 
                                                placeholder="e.g. Karan Sharma" 
                                                required 
                                                value={newAffName}
                                                onChange={e => setNewAffName(e.target.value)}
                                            />
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Email Address</label>
                                            <input 
                                                type="email" 
                                                className="glass-input" 
                                                placeholder="karan@youtube.com" 
                                                required 
                                                value={newAffEmail}
                                                onChange={e => setNewAffEmail(e.target.value)}
                                            />
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Phone Number</label>
                                            <input 
                                                type="text" 
                                                className="glass-input" 
                                                placeholder="+919876543210" 
                                                value={newAffPhone}
                                                onChange={e => setNewAffPhone(e.target.value)}
                                            />
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Custom Referral Code</label>
                                            <input 
                                                type="text" 
                                                className="glass-input" 
                                                placeholder="e.g. KARAN15" 
                                                required 
                                                value={newAffCode}
                                                onChange={e => setNewAffCode(e.target.value)}
                                                style={{ textTransform: 'uppercase' }}
                                            />
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Commission Rate (%)</label>
                                            <input 
                                                type="number" 
                                                className="glass-input" 
                                                min={1} 
                                                max={50} 
                                                required 
                                                value={newAffRate}
                                                onChange={e => setNewAffRate(Number(e.target.value))}
                                            />
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Payout UPI ID</label>
                                            <input 
                                                type="text" 
                                                className="glass-input" 
                                                placeholder="karan@okhdfcbank" 
                                                value={newAffUpi}
                                                onChange={e => setNewAffUpi(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                                        <button type="submit" className="btn-primary" style={{ padding: '8px 16px', fontSize: '0.85rem' }}>Create Partner</button>
                                        <button type="button" onClick={() => setIsAddingAffiliate(false)} className="btn-secondary" style={{ padding: '8px 16px', fontSize: '0.85rem' }}>Cancel</button>
                                    </div>
                                </form>
                            )}

                            {affiliates.length === 0 ? (
                                <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '30px' }}>No affiliate partners registered yet.</div>
                            ) : (
                                <div style={{ overflowX: 'auto' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                                        <thead>
                                            <tr style={{ borderBottom: '1px solid var(--border-glass)' }}>
                                                <th style={{ padding: '12px 10px', color: 'var(--text-muted)' }}>Partner Name</th>
                                                <th style={{ padding: '12px 10px', color: 'var(--text-muted)' }}>Referral Code</th>
                                                <th style={{ padding: '12px 10px', color: 'var(--text-muted)' }}>Commission</th>
                                                <th style={{ padding: '12px 10px', color: 'var(--text-muted)' }}>Total Earnings</th>
                                                <th style={{ padding: '12px 10px', color: 'var(--text-muted)' }}>Pending Payout</th>
                                                <th style={{ padding: '12px 10px', color: 'var(--text-muted)' }}>Payment Details</th>
                                                <th style={{ padding: '12px 10px', color: 'var(--text-muted)' }}>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {affiliates.map(aff => (
                                                <tr key={aff.id} style={{ borderBottom: '1px solid var(--border-glass)' }}>
                                                    <td style={{ padding: '12px 10px' }}>
                                                        <div style={{ fontWeight: '600' }}>{aff.name}</div>
                                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{aff.email}</div>
                                                    </td>
                                                    <td style={{ padding: '12px 10px' }}>
                                                        <span style={{
                                                            background: 'rgba(99, 102, 241, 0.15)',
                                                            color: 'var(--primary)',
                                                            padding: '4px 8px',
                                                            borderRadius: '6px',
                                                            fontWeight: '700',
                                                            letterSpacing: '0.05em'
                                                        }}>
                                                            {aff.referral_code}
                                                        </span>
                                                    </td>
                                                    <td style={{ padding: '12px 10px', fontWeight: '600' }}>{aff.commission_rate}%</td>
                                                    <td style={{ padding: '12px 10px', color: '#34d399', fontWeight: '600' }}>
                                                        ₹{parseFloat(aff.total_earnings || 0).toLocaleString()}
                                                    </td>
                                                    <td style={{ padding: '12px 10px', color: parseFloat(aff.pending_payout) > 0 ? '#fbbf24' : 'var(--text-muted)', fontWeight: '700' }}>
                                                        ₹{parseFloat(aff.pending_payout || 0).toLocaleString()}
                                                    </td>
                                                    <td style={{ padding: '12px 10px', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                                                        {aff.upi_id || 'Direct Account'}
                                                    </td>
                                                    <td style={{ padding: '12px 10px' }}>
                                                        <div style={{ display: 'flex', gap: '8px' }}>
                                                            <button
                                                                onClick={() => copyAffiliateLink(aff.referral_code)}
                                                                className="btn-secondary"
                                                                title="Copy shareable link"
                                                                style={{ padding: '6px 10px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                                                            >
                                                                <Share2 size={12} /> Share Link
                                                            </button>
                                                            {parseFloat(aff.pending_payout) > 0 && (
                                                                <button
                                                                    onClick={() => handleSettlePayout(aff.id, aff.name)}
                                                                    className="btn-primary"
                                                                    style={{ padding: '6px 10px', fontSize: '0.75rem', background: '#10b981', border: 'none' }}
                                                                >
                                                                    Settle Payout
                                                                </button>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>

                        {/* Recent Referral Conversions History */}
                        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <h3 style={{ fontSize: '1.1rem', fontWeight: '700' }}>Recent Referral Conversions Log</h3>
                            {conversions.length === 0 ? (
                                <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px' }}>No conversions recorded yet.</div>
                            ) : (
                                <div style={{ overflowX: 'auto' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                                        <thead>
                                            <tr style={{ borderBottom: '1px solid var(--border-glass)' }}>
                                                <th style={{ padding: '10px', color: 'var(--text-muted)' }}>Buyer Student</th>
                                                <th style={{ padding: '10px', color: 'var(--text-muted)' }}>Enrolled Course</th>
                                                <th style={{ padding: '10px', color: 'var(--text-muted)' }}>Order Amount</th>
                                                <th style={{ padding: '10px', color: 'var(--text-muted)' }}>Attributed Partner</th>
                                                <th style={{ padding: '10px', color: 'var(--text-muted)' }}>Commission Credited</th>
                                                <th style={{ padding: '10px', color: 'var(--text-muted)' }}>Date</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {conversions.map(conv => (
                                                <tr key={conv.id} style={{ borderBottom: '1px solid var(--border-glass)' }}>
                                                    <td style={{ padding: '10px', fontWeight: '600' }}>
                                                        <div>{conv.buyer_name}</div>
                                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{conv.buyer_email || '—'}</div>
                                                    </td>
                                                    <td style={{ padding: '10px', color: 'var(--text-secondary)' }}>{conv.course_title}</td>
                                                    <td style={{ padding: '10px', fontWeight: '600' }}>₹{parseFloat(conv.order_amount).toLocaleString()}</td>
                                                    <td style={{ padding: '10px' }}>
                                                        <span style={{ color: 'var(--primary)', fontWeight: '600' }}>{conv.affiliate_name}</span>
                                                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Code: {conv.referral_code}</div>
                                                    </td>
                                                    <td style={{ padding: '10px', color: '#34d399', fontWeight: '700' }}>
                                                        +₹{parseFloat(conv.commission_amount).toLocaleString()}
                                                    </td>
                                                    <td style={{ padding: '10px', color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                                                        {new Date(conv.created_at).toLocaleDateString()}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* ========================================================
                    TAB 3: ABANDONED CART & WHATSAPP AUTOMATION
                   ======================================================== */}
                {activeTab === 'abandoned' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        {/* Metric Highlights */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
                            <div className="glass-panel" style={{ padding: '20px' }}>
                                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Abandoned Cart Value</span>
                                <h3 style={{ fontSize: '1.8rem', fontWeight: '800', marginTop: '6px', color: '#f87171' }}>
                                    ₹{totalAbandonedValue.toLocaleString()}
                                </h3>
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Uncompleted checkout attempts</span>
                            </div>

                            <div className="glass-panel" style={{ padding: '20px' }}>
                                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Nudges Dispatched</span>
                                <h3 style={{ fontSize: '1.8rem', fontWeight: '800', marginTop: '6px', color: '#34d399' }}>
                                    {recoveredCount} / {abandonedCarts.length}
                                </h3>
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Automated WhatsApp recovery triggers</span>
                            </div>

                            <div className="glass-panel" style={{ padding: '20px' }}>
                                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Recovery Conversion Rate</span>
                                <h3 style={{ fontSize: '1.8rem', fontWeight: '800', marginTop: '6px', color: 'var(--primary)' }}>
                                    {abandonedCarts.length > 0 ? ((recoveredCount / abandonedCarts.length) * 100).toFixed(0) : 0}%
                                </h3>
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Industry standard benchmark: 18%</span>
                            </div>

                            <div className="glass-panel" style={{ padding: '20px' }}>
                                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Active Coupon Applied</span>
                                <h3 style={{ fontSize: '1.5rem', fontWeight: '800', marginTop: '6px', color: '#fbbf24' }}>
                                    RECOVER15 (15% OFF)
                                </h3>
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Dynamic urgency discount</span>
                            </div>
                        </div>

                        {/* Abandoned Checkouts Table */}
                        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <div>
                                <h3 style={{ fontSize: '1.2rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <MessageCircle size={20} style={{ color: '#25D366' }} /> Abandoned Course Checkouts
                                </h3>
                                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                                    Send personalized WhatsApp messages with 1-click checkout recovery link and exclusive 15% discount.
                                </p>
                            </div>

                            {abandonedCarts.length === 0 ? (
                                <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '30px' }}>No abandoned checkouts recorded. All students completing purchases smoothly!</div>
                            ) : (
                                <div style={{ overflowX: 'auto' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                                        <thead>
                                            <tr style={{ borderBottom: '1px solid var(--border-glass)' }}>
                                                <th style={{ padding: '12px 10px', color: 'var(--text-muted)' }}>Student Name</th>
                                                <th style={{ padding: '12px 10px', color: 'var(--text-muted)' }}>WhatsApp Contact</th>
                                                <th style={{ padding: '12px 10px', color: 'var(--text-muted)' }}>Abandoned Course</th>
                                                <th style={{ padding: '12px 10px', color: 'var(--text-muted)' }}>Cart Value</th>
                                                <th style={{ padding: '12px 10px', color: 'var(--text-muted)' }}>Status</th>
                                                <th style={{ padding: '12px 10px', color: 'var(--text-muted)' }}>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {abandonedCarts.map(cart => (
                                                <tr key={cart.id} style={{ borderBottom: '1px solid var(--border-glass)' }}>
                                                    <td style={{ padding: '12px 10px', fontWeight: '600' }}>
                                                        <div>{cart.student_name}</div>
                                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{cart.student_email || '—'}</div>
                                                    </td>
                                                    <td style={{ padding: '12px 10px', color: 'var(--text-secondary)' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                            <Smartphone size={14} style={{ color: '#25D366' }} />
                                                            <span>{cart.student_phone}</span>
                                                        </div>
                                                    </td>
                                                    <td style={{ padding: '12px 10px', color: 'var(--text-secondary)' }}>{cart.course_title}</td>
                                                    <td style={{ padding: '12px 10px', fontWeight: '700' }}>₹{parseFloat(cart.cart_value).toLocaleString()}</td>
                                                    <td style={{ padding: '12px 10px' }}>
                                                        {cart.recovery_status === 'nudge_sent' ? (
                                                            <span style={{ background: 'rgba(52, 211, 153, 0.15)', color: '#34d399', padding: '4px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '600' }}>
                                                                Nudge Dispatched
                                                            </span>
                                                        ) : cart.recovery_status === 'recovered' ? (
                                                            <span style={{ background: 'rgba(99, 102, 241, 0.15)', color: 'var(--primary)', padding: '4px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '600' }}>
                                                                Recovered & Paid
                                                            </span>
                                                        ) : (
                                                            <span style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#f87171', padding: '4px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '600' }}>
                                                                Abandoned
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td style={{ padding: '12px 10px' }}>
                                                        <button
                                                            onClick={() => handleSendRecoveryNudge(cart.id)}
                                                            disabled={sendingNudgeId === cart.id}
                                                            style={{
                                                                background: '#25D366',
                                                                color: '#000',
                                                                border: 'none',
                                                                borderRadius: '6px',
                                                                padding: '6px 12px',
                                                                fontWeight: '600',
                                                                fontSize: '0.75rem',
                                                                cursor: 'pointer',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: '6px'
                                                            }}
                                                        >
                                                            <Send size={12} />
                                                            {sendingNudgeId === cart.id ? 'Sending...' : cart.recovery_status === 'nudge_sent' ? 'Resend WhatsApp' : 'Send WhatsApp Nudge'}
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>

                        {/* WhatsApp Message Preview Cards */}
                        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <h3 style={{ fontSize: '1.1rem', fontWeight: '700' }}>Official WhatsApp Broadcast Templates</h3>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                                
                                <div style={{ background: '#0b141a', border: '1px solid #1f2c34', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontSize: '0.75rem', color: '#25D366', fontWeight: '700' }}>CART RECOVERY TEMPLATE</span>
                                        <span style={{ fontSize: '0.7rem', color: '#8696a0' }}>Auto-Trigger</span>
                                    </div>
                                    <p style={{ fontSize: '0.82rem', color: '#e9edef', lineHeight: '1.5', margin: 0 }}>
                                        "Hi Rahul 👋 We noticed you started enrolling in <strong>Complete JEE Physics Mastery</strong> but didn't finish! Here is an exclusive 15% discount coupon <strong>RECOVER15</strong> valid for the next 2 hours. Click below to complete your seat!"
                                    </p>
                                    <div style={{ background: '#111b21', padding: '8px 12px', borderRadius: '6px', fontSize: '0.78rem', color: '#53bdeb', textAlign: 'center', fontWeight: '600' }}>
                                        🔗 Complete Enrollment (15% Applied)
                                    </div>
                                </div>

                                <div style={{ background: '#0b141a', border: '1px solid #1f2c34', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontSize: '0.75rem', color: '#25D366', fontWeight: '700' }}>FEE INSTALLMENT ALERT</span>
                                        <span style={{ fontSize: '0.7rem', color: '#8696a0' }}>Due Date - 3 Days</span>
                                    </div>
                                    <p style={{ fontSize: '0.82rem', color: '#e9edef', lineHeight: '1.5', margin: 0 }}>
                                        "Dear Student/Parent, This is a gentle reminder that Term 2 installment of ₹10,000 for <strong>NEET Crash Course</strong> is due on 20th Oct. Click below to pay online instantly and download your receipt."
                                    </p>
                                    <div style={{ background: '#111b21', padding: '8px 12px', borderRadius: '6px', fontSize: '0.78rem', color: '#53bdeb', textAlign: 'center', fontWeight: '600' }}>
                                        💳 1-Click Fee Payment Portal
                                    </div>
                                </div>

                                <div style={{ background: '#0b141a', border: '1px solid #1f2c34', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontSize: '0.75rem', color: '#25D366', fontWeight: '700' }}>NTA EXAM SIMULATOR ALERT</span>
                                        <span style={{ fontSize: '0.7rem', color: '#8696a0' }}>Exam Day Morning</span>
                                    </div>
                                    <p style={{ fontSize: '0.82rem', color: '#e9edef', lineHeight: '1.5', margin: 0 }}>
                                        "Good morning! Your <strong>All-India JEE Main Mock Test 1</strong> goes live at 10:00 AM on your simulator desk. Prepare your workstation and click below to enter the live examination hall."
                                    </p>
                                    <div style={{ background: '#111b21', padding: '8px 12px', borderRadius: '6px', fontSize: '0.78rem', color: '#53bdeb', textAlign: 'center', fontWeight: '600' }}>
                                        🎯 Enter NTA Exam Simulator
                                    </div>
                                </div>

                            </div>
                        </div>

                    </div>
                )}

            </div>
        </SidebarLayout>
    );
}
