'use client';

import { useState, useEffect } from 'react';
import SidebarLayout from '../../components/SidebarLayout';
import { apiRequest } from '../../utils/api';
import { Mail, MessageSquare, Send, Users, AlertCircle, PlayCircle, ShieldCheck } from 'lucide-react';

export default function MarketingCRMPage() {
    const [leads, setLeads] = useState<any[]>([]);
    const [campaigns, setCampaigns] = useState<any[]>([]);
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [userRole, setUserRole] = useState('');

    // Campaign creation fields
    const [isCreating, setIsCreating] = useState(false);
    const [campTitle, setCampTitle] = useState('');
    const [campTrigger, setCampTrigger] = useState<'inactive_7_days' | 'course_completed' | 'manual'>('manual');
    const [campChannel, setCampChannel] = useState<'email' | 'whatsapp' | 'both'>('email');
    const [campTemplate, setCampTemplate] = useState('');

    useEffect(() => {
        const storedUser = localStorage.getItem('user_profile');
        if (storedUser) {
            setUserRole(JSON.parse(storedUser).role);
        }
        fetchCRMData();
    }, []);

    const fetchCRMData = async () => {
        setLoading(true);
        setError('');
        try {
            const leadsData = await apiRequest('/api/marketing/leads');
            setLeads(leadsData.leads);

            const campaignsData = await apiRequest('/api/marketing/campaigns');
            setCampaigns(campaignsData.campaigns);

            const logsData = await apiRequest('/api/marketing/logs');
            setLogs(logsData.logs);
        } catch (err: any) {
            setError(err.message || 'Failed to load CRM details.');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateLeadStatus = async (leadId: string, status: string) => {
        try {
            await apiRequest(`/api/marketing/leads/${leadId}/status`, {
                method: 'POST',
                body: JSON.stringify({ status })
            });
            fetchCRMData();
        } catch (err: any) {
            alert(err.message || 'Failed to update lead status.');
        }
    };

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
            setIsCreating(false);
            fetchCRMData();
        } catch (err: any) {
            alert(err.message || 'Failed to create campaign template.');
        }
    };

    const handleTriggerCampaign = async (campaignId: string) => {
        try {
            const data = await apiRequest(`/api/marketing/campaigns/${campaignId}/trigger`, {
                method: 'POST'
            });
            alert(data.message || 'Campaign manual dispatch simulations triggered successfully!');
            fetchCRMData();
        } catch (err: any) {
            alert(err.message || 'Failed to run campaign simulation.');
        }
    };

    if (loading) {
        return (
            <SidebarLayout>
                <div style={{ color: 'var(--text-secondary)' }}>Loading CRM management board...</div>
            </SidebarLayout>
        );
    }

    // Security check
    if (userRole !== 'admin' && userRole !== 'teacher') {
        return (
            <SidebarLayout>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 0', gap: '16px' }}>
                    <ShieldCheck size={48} style={{ color: 'var(--danger)' }} />
                    <h3>Access Restricted</h3>
                    <p style={{ color: 'var(--text-muted)' }}>Only admin and instructors can manage CRM and campaigns.</p>
                </div>
            </SidebarLayout>
        );
    }

    return (
        <SidebarLayout>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h1 className="brand-gradient" style={{ fontSize: '2.2rem', fontWeight: '800' }}>
                            Marketing Automation & CRM
                        </h1>
                        <p style={{ color: 'var(--text-secondary)' }}>
                            Capture landing page inquiries, track convert ratios, and rule campaign templates.
                        </p>
                    </div>
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

                {/* Grid CRM Leads vs Campaigns */}
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.2fr', gap: '30px' }}>
                    
                    {/* 1. LEFT - Leads Pipeline */}
                    <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <h3 style={{ fontSize: '1.2rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Users size={18} style={{ color: 'var(--primary)' }} /> Student Leads CRM
                        </h3>
                        
                        {leads.length === 0 ? (
                            <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px' }}>No lead inquiries recorded.</div>
                        ) : (
                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                                    <thead>
                                        <tr style={{ borderBottom: '1px solid var(--border-glass)' }}>
                                            <th style={{ padding: '10px', color: 'var(--text-muted)' }}>Name</th>
                                            <th style={{ padding: '10px', color: 'var(--text-muted)' }}>Contact</th>
                                            <th style={{ padding: '10px', color: 'var(--text-muted)' }}>Interest</th>
                                            <th style={{ padding: '10px', color: 'var(--text-muted)' }}>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {leads.map(lead => (
                                            <tr key={lead.id} style={{ borderBottom: '1px solid var(--border-glass)' }}>
                                                <td style={{ padding: '10px', fontWeight: '600' }}>{lead.name}</td>
                                                <td style={{ padding: '10px', color: 'var(--text-secondary)' }}>
                                                    <div>{lead.email}</div>
                                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{lead.phone || '—'}</div>
                                                </td>
                                                <td style={{ padding: '10px', color: 'var(--text-secondary)' }}>{lead.course_title || 'General'}</td>
                                                <td style={{ padding: '10px' }}>
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

                    {/* 2. RIGHT - Campaign triggers templates */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <h3 style={{ fontSize: '1.05rem', fontWeight: '700' }}>Campaign Rules</h3>
                                <button onClick={() => setIsCreating(true)} className="btn-secondary" style={{ padding: '4px 8px', fontSize: '0.75rem' }}>Add Rule</button>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {campaigns.map(camp => (
                                    <div key={camp.id} style={{
                                        background: 'rgba(255,255,255,0.01)',
                                        border: '1px solid var(--border-glass)',
                                        borderRadius: '8px',
                                        padding: '12px',
                                        fontSize: '0.82rem'
                                    }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                                            <strong>{camp.title}</strong>
                                            <span style={{ fontSize: '0.7rem', color: 'var(--primary)', fontWeight: '600' }}>{camp.channel.toUpperCase()}</span>
                                        </div>
                                        <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', display: 'block', marginBottom: '8px' }}>
                                            Trigger: {camp.trigger_type.replace(/_/g, ' ')}
                                        </span>
                                        <button 
                                            onClick={() => handleTriggerCampaign(camp.id)}
                                            className="btn-primary" 
                                            style={{ width: '100%', padding: '6px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                                        >
                                            <PlayCircle size={14} /> Trigger Dispatch
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* 3. BOTTOM - Delivery Logs history */}
                <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: '700' }}>Campaign Dispatch Logs</h3>
                    
                    {logs.length === 0 ? (
                        <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px' }}>No logs recorded. Trigger a campaign ruleset.</div>
                    ) : (
                        <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                                <thead>
                                    <tr style={{ borderBottom: '1px solid var(--border-glass)' }}>
                                        <th style={{ padding: '10px', color: 'var(--text-muted)' }}>Campaign</th>
                                        <th style={{ padding: '10px', color: 'var(--text-muted)' }}>Recipient</th>
                                        <th style={{ padding: '10px', color: 'var(--text-muted)' }}>Channel</th>
                                        <th style={{ padding: '10px', color: 'var(--text-muted)' }}>Status</th>
                                        <th style={{ padding: '10px', color: 'var(--text-muted)' }}>Sent Time</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {logs.map(log => (
                                        <tr key={log.id} style={{ borderBottom: '1px solid var(--border-glass)' }}>
                                            <td style={{ padding: '10px', fontWeight: '600' }}>{log.campaign_title}</td>
                                            <td style={{ padding: '10px', color: 'var(--text-primary)' }}>{log.recipient_email}</td>
                                            <td style={{ padding: '10px', textTransform: 'uppercase' }}>{log.channel}</td>
                                            <td style={{ padding: '10px', color: 'var(--success)', fontWeight: '600' }}>{log.status.toUpperCase()}</td>
                                            <td style={{ padding: '10px', color: 'var(--text-muted)' }}>{new Date(log.sent_at).toLocaleString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

            </div>

            {/* Create Campaign Modal */}
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
                    <div className="glass-panel" style={{ width: '420px', padding: '30px', borderRadius: '16px' }}>
                        <h3>Add Campaign Automation Template</h3>
                        <form onSubmit={handleCreateCampaign} style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Campaign Title</label>
                                <input 
                                    type="text" 
                                    className="glass-input" 
                                    placeholder="e.g. 7-Day Inactivity Warning" 
                                    required 
                                    value={campTitle} 
                                    onChange={(e) => setCampTitle(e.target.value)} 
                                />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Trigger Rule</label>
                                    <select 
                                        className="glass-input" 
                                        value={campTrigger} 
                                        onChange={(e) => setCampTrigger(e.target.value as any)}
                                    >
                                        <option value="manual">Manual trigger</option>
                                        <option value="inactive_7_days">Inactive for 7 days</option>
                                        <option value="course_completed">Course completes</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Delivery Channel</label>
                                    <select 
                                        className="glass-input" 
                                        value={campChannel} 
                                        onChange={(e) => setCampChannel(e.target.value as any)}
                                    >
                                        <option value="email">Email</option>
                                        <option value="whatsapp">WhatsApp</option>
                                        <option value="both">Both</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Message Template</label>
                                <textarea 
                                    className="glass-input" 
                                    rows={4}
                                    placeholder="Hi {name}, continuue learning Physics..." 
                                    required 
                                    value={campTemplate} 
                                    onChange={(e) => setCampTemplate(e.target.value)} 
                                    style={{ fontFamily: 'inherit', resize: 'vertical' }}
                                />
                            </div>
                            <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                                <button type="submit" className="btn-primary" style={{ flex: 1 }}>Submit</button>
                                <button type="button" className="btn-secondary" style={{ flex: 1 }} onClick={() => setIsCreating(false)}>Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </SidebarLayout>
    );
}
