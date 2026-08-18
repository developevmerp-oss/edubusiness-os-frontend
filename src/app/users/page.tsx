'use client';

import { useState, useEffect } from 'react';
import SidebarLayout from '../../components/SidebarLayout';
import { apiRequest } from '../../utils/api';
import ModalPortal from '../../components/ModalPortal';
import { UserPlus, Users, Search, X, Shield, GraduationCap, BookOpen, Heart } from 'lucide-react';

interface UserRecord {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
    role: 'admin' | 'teacher' | 'student' | 'parent';
    phone: string | null;
    status: string;
    created_at: string;
}

const ROLE_CONFIG = {
    admin:   { label: 'Admin',   icon: Shield,         color: '#818cf8', bg: 'rgba(99,102,241,0.12)' },
    teacher: { label: 'Teacher', icon: BookOpen,        color: '#34d399', bg: 'rgba(52,211,153,0.12)' },
    student: { label: 'Student', icon: GraduationCap,   color: '#60a5fa', bg: 'rgba(96,165,250,0.12)' },
    parent:  { label: 'Parent',  icon: Heart,           color: '#f472b6', bg: 'rgba(244,114,182,0.12)' },
};

export default function UsersPage() {
    const [users, setUsers]               = useState<UserRecord[]>([]);
    const [loading, setLoading]           = useState(true);
    const [search, setSearch]             = useState('');
    const [filterRole, setFilterRole]     = useState('');
    const [showModal, setShowModal]       = useState(false);

    // New user form
    const [firstName, setFirstName]       = useState('');
    const [lastName, setLastName]         = useState('');
    const [email, setEmail]               = useState('');
    const [password, setPassword]         = useState('');
    const [phone, setPhone]               = useState('');
    const [role, setRole]                 = useState<'teacher' | 'student' | 'parent' | 'admin'>('student');
    const [saving, setSaving]             = useState(false);

    useEffect(() => { fetchUsers(); }, [filterRole]);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const url = filterRole ? `/api/auth/users?role=${filterRole}` : '/api/auth/users';
            const data = await apiRequest(url);
            setUsers(data.users || []);
        } catch (err) {
            console.error('Failed to fetch users:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            await apiRequest('/api/auth/users', {
                method: 'POST',
                body: JSON.stringify({ firstName, lastName, email, password, role, phone })
            });
            alert(`${ROLE_CONFIG[role].label} account created successfully!`);
            setShowModal(false);
            setFirstName(''); setLastName(''); setEmail('');
            setPassword(''); setPhone(''); setRole('student');
            fetchUsers();
        } catch (err: any) {
            alert(err.message || 'Failed to create user.');
        } finally {
            setSaving(false);
        }
    };

    const filtered = users.filter(u => {
        const q = search.toLowerCase();
        return (
            u.first_name.toLowerCase().includes(q) ||
            u.last_name.toLowerCase().includes(q) ||
            u.email.toLowerCase().includes(q)
        );
    });

    const roleCounts = users.reduce((acc, u) => {
        acc[u.role] = (acc[u.role] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    return (
        <SidebarLayout>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>

                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
                    <div>
                        <h1 className="gradient-text" style={{ fontSize: '2.2rem', fontWeight: '800' }}>User Management</h1>
                        <p style={{ color: 'var(--text-secondary)' }}>Add and manage all members in your academy — teachers, students, parents, and admins.</p>
                    </div>
                    <button onClick={() => setShowModal(true)} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 22px' }}>
                        <UserPlus size={18} /> Add Member
                    </button>
                </div>

                {/* Stats Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px' }}>
                    {(Object.keys(ROLE_CONFIG) as Array<keyof typeof ROLE_CONFIG>).map(r => {
                        const cfg = ROLE_CONFIG[r];
                        const Icon = cfg.icon;
                        return (
                            <div key={r} className="glass-panel" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '14px', cursor: 'pointer', border: filterRole === r ? `1px solid ${cfg.color}` : undefined }}
                                onClick={() => setFilterRole(filterRole === r ? '' : r)}>
                                <div style={{ background: cfg.bg, color: cfg.color, borderRadius: '10px', padding: '10px' }}>
                                    <Icon size={20} />
                                </div>
                                <div>
                                    <div style={{ fontSize: '1.5rem', fontWeight: '800' }}>{roleCounts[r] || 0}</div>
                                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{cfg.label}s</div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Search + Filter */}
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: '220px', position: 'relative' }}>
                        <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                        <input
                            className="glass-input"
                            placeholder="Search by name or email..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            style={{ paddingLeft: '36px' }}
                        />
                    </div>
                    <select
                        className="glass-input"
                        value={filterRole}
                        onChange={e => setFilterRole(e.target.value)}
                        style={{ minWidth: '150px' }}
                    >
                        <option value="">All Roles</option>
                        <option value="admin">Admin</option>
                        <option value="teacher">Teacher</option>
                        <option value="student">Student</option>
                        <option value="parent">Parent</option>
                    </select>
                </div>

                {/* Users Table */}
                <div className="glass-panel" style={{ padding: 0, overflow: 'hidden', borderRadius: '14px' }}>
                    {loading ? (
                        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading members...</div>
                    ) : filtered.length === 0 ? (
                        <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
                            <Users size={40} style={{ marginBottom: '12px', opacity: 0.3 }} />
                            <p>{search ? 'No members match your search.' : 'No members yet. Click "Add Member" to get started.'}</p>
                        </div>
                    ) : (
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
                            <thead>
                                <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--border-glass)' }}>
                                    {['Name', 'Email', 'Role', 'Phone', 'Status', 'Joined'].map(h => (
                                        <th key={h} style={{ padding: '14px 20px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map(u => {
                                    const cfg = ROLE_CONFIG[u.role];
                                    const Icon = cfg.icon;
                                    return (
                                        <tr key={u.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                                            <td style={{ padding: '14px 20px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                    <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: cfg.bg, color: cfg.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '0.88rem', flexShrink: 0 }}>
                                                        {u.first_name[0]}{u.last_name[0]}
                                                    </div>
                                                    <span style={{ fontWeight: '600' }}>{u.first_name} {u.last_name}</span>
                                                </div>
                                            </td>
                                            <td style={{ padding: '14px 20px', color: 'var(--text-secondary)' }}>{u.email}</td>
                                            <td style={{ padding: '14px 20px' }}>
                                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '3px 10px', borderRadius: '20px', background: cfg.bg, color: cfg.color, fontWeight: '600', fontSize: '0.78rem' }}>
                                                    <Icon size={12} /> {cfg.label}
                                                </span>
                                            </td>
                                            <td style={{ padding: '14px 20px', color: 'var(--text-muted)' }}>{u.phone || '—'}</td>
                                            <td style={{ padding: '14px 20px' }}>
                                                <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: '600', background: u.status === 'active' ? 'rgba(52,211,153,0.12)' : 'rgba(239,68,68,0.1)', color: u.status === 'active' ? '#34d399' : '#f87171' }}>
                                                    {u.status?.toUpperCase()}
                                                </span>
                                            </td>
                                            <td style={{ padding: '14px 20px', color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                                                {new Date(u.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* Add Member Modal — rendered via portal at document.body */}
            {showModal && (
                <ModalPortal onClose={() => setShowModal(false)}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                        <h2 style={{ fontWeight: '800', fontSize: '1.3rem', color: 'var(--text-primary)' }}>Add New Member</h2>
                        <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={20} /></button>
                    </div>

                        <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {/* Role Picker */}
                            <div>
                                <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>Member Role</label>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                    {(Object.keys(ROLE_CONFIG) as Array<keyof typeof ROLE_CONFIG>).map(r => {
                                        const cfg = ROLE_CONFIG[r];
                                        const Icon = cfg.icon;
                                        const isSelected = role === r;
                                        return (
                                            <button key={r} type="button" onClick={() => setRole(r as any)}
                                                style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', borderRadius: '10px', border: isSelected ? `1.5px solid ${cfg.color}` : '1.5px solid var(--border-glass)', background: isSelected ? cfg.bg : 'transparent', color: isSelected ? cfg.color : 'var(--text-muted)', cursor: 'pointer', fontWeight: '600', fontSize: '0.85rem', transition: 'all 0.15s' }}>
                                                <Icon size={15} /> {cfg.label}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '5px' }}>First Name</label>
                                    <input className="glass-input" required placeholder="e.g. Rahul" value={firstName} onChange={e => setFirstName(e.target.value)} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '5px' }}>Last Name</label>
                                    <input className="glass-input" required placeholder="e.g. Kumar" value={lastName} onChange={e => setLastName(e.target.value)} />
                                </div>
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '5px' }}>Email Address</label>
                                <input className="glass-input" type="email" required placeholder="e.g. rahul@youracademy.com" value={email} onChange={e => setEmail(e.target.value)} />
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '5px' }}>Password</label>
                                <input className="glass-input" type="password" required placeholder="Min 8 characters" value={password} onChange={e => setPassword(e.target.value)} />
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '5px' }}>Phone (optional)</label>
                                <input className="glass-input" placeholder="e.g. +91 98765 43210" value={phone} onChange={e => setPhone(e.target.value)} />
                            </div>

                            <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
                                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary" style={{ flex: 1, padding: '12px' }}>Cancel</button>
                                <button type="submit" className="btn-primary" style={{ flex: 2, padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }} disabled={saving}>
                                    <UserPlus size={16} /> {saving ? 'Creating...' : `Add ${ROLE_CONFIG[role].label}`}
                                </button>
                            </div>
                        </form>
                </ModalPortal>
            )}
        </SidebarLayout>
    );
}
