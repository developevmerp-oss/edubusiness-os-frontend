'use client';

import { useState, useEffect } from 'react';
import SidebarLayout from '../../components/SidebarLayout';
import { apiRequest } from '../../utils/api';
import ModalPortal from '../../components/ModalPortal';
import { 
    UserPlus, Users, Search, X, Shield, GraduationCap, 
    BookOpen, Heart, Edit2, Key, Trash2, Link2, 
    UserCheck, UserX, CheckCircle, AlertCircle
} from 'lucide-react';

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

    // Edit user state
    const [editingUser, setEditingUser]   = useState<UserRecord | null>(null);
    const [editFirstName, setEditFirstName] = useState('');
    const [editLastName, setEditLastName] = useState('');
    const [editEmail, setEditEmail]       = useState('');
    const [editPhone, setEditPhone]       = useState('');
    const [editRole, setEditRole]         = useState<'teacher' | 'student' | 'parent' | 'admin'>('student');
    const [updating, setUpdating]         = useState(false);

    // Reset password state
    const [resettingUser, setResettingUser] = useState<UserRecord | null>(null);
    const [newPassword, setNewPassword]   = useState('');
    const [resetting, setResetting]       = useState(false);

    // Parent-student linking state
    const [linkingParent, setLinkingParent] = useState<UserRecord | null>(null);
    const [linkedStudents, setLinkedStudents] = useState<any[]>([]);
    const [selectedStudentToLink, setSelectedStudentToLink] = useState('');
    const [loadingLinks, setLoadingLinks] = useState(false);
    const [linkingSubmitting, setLinkingSubmitting] = useState(false);

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

    // Edit User Handlers
    const openEditModal = (u: UserRecord) => {
        setEditingUser(u);
        setEditFirstName(u.first_name);
        setEditLastName(u.last_name);
        setEditEmail(u.email);
        setEditPhone(u.phone || '');
        setEditRole(u.role);
    };

    const handleUpdateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingUser) return;
        setUpdating(true);
        try {
            await apiRequest(`/api/auth/users/${editingUser.id}`, {
                method: 'PUT',
                body: JSON.stringify({
                    firstName: editFirstName,
                    lastName: editLastName,
                    email: editEmail,
                    phone: editPhone || null,
                    role: editRole
                })
            });
            alert('User profile updated successfully.');
            setEditingUser(null);
            fetchUsers();
        } catch (err: any) {
            alert(err.message || 'Failed to update user.');
        } finally {
            setUpdating(false);
        }
    };

    // Toggle Status
    const handleToggleStatus = async (u: UserRecord) => {
        const action = u.status === 'active' ? 'suspend' : 'activate';
        if (!confirm(`Are you sure you want to ${action} ${u.first_name} ${u.last_name}'s account?`)) return;
        try {
            const res = await apiRequest(`/api/auth/users/${u.id}/status`, { method: 'PATCH' });
            alert(res.message);
            fetchUsers();
        } catch (err: any) {
            alert(err.message || 'Failed to update account status.');
        }
    };

    // Reset Password
    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!resettingUser) return;
        setResetting(true);
        try {
            const res = await apiRequest(`/api/auth/users/${resettingUser.id}/reset-password`, {
                method: 'POST',
                body: JSON.stringify({ newPassword })
            });
            alert(res.message || 'Password reset successfully.');
            setResettingUser(null);
            setNewPassword('');
        } catch (err: any) {
            alert(err.message || 'Failed to reset password.');
        } finally {
            setResetting(false);
        }
    };

    // Delete User
    const handleDeleteUser = async (u: UserRecord) => {
        if (!confirm(`Are you sure you want to PERMANENTLY delete user ${u.first_name} ${u.last_name} (${u.email})? This action cannot be undone.`)) return;
        try {
            await apiRequest(`/api/auth/users/${u.id}`, { method: 'DELETE' });
            alert('User deleted successfully.');
            fetchUsers();
        } catch (err: any) {
            alert(err.message || 'Failed to delete user.');
        }
    };

    // Parent-Student Linking
    const openLinkingModal = async (parent: UserRecord) => {
        setLinkingParent(parent);
        setSelectedStudentToLink('');
        setLoadingLinks(true);
        try {
            const res = await apiRequest(`/api/auth/parents-students/${parent.id}`);
            setLinkedStudents(res.students || []);
        } catch (err: any) {
            alert(err.message || 'Failed to fetch linked children.');
        } finally {
            setLoadingLinks(false);
        }
    };

    const handleLinkStudent = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!linkingParent || !selectedStudentToLink) return;
        setLinkingSubmitting(true);
        try {
            await apiRequest('/api/auth/parents-students', {
                method: 'POST',
                body: JSON.stringify({
                    parentId: linkingParent.id,
                    studentId: selectedStudentToLink
                })
            });
            setSelectedStudentToLink('');
            // Refresh linked students
            const res = await apiRequest(`/api/auth/parents-students/${linkingParent.id}`);
            setLinkedStudents(res.students || []);
            alert('Student successfully linked to parent.');
        } catch (err: any) {
            alert(err.message || 'Failed to link student.');
        } finally {
            setLinkingSubmitting(false);
        }
    };

    const handleUnlinkStudent = async (studentId: string, studentName: string) => {
        if (!linkingParent) return;
        if (!confirm(`Are you sure you want to unlink ${studentName} from this parent?`)) return;
        try {
            await apiRequest(`/api/auth/parents-students/${linkingParent.id}/${studentId}`, { method: 'DELETE' });
            const res = await apiRequest(`/api/auth/parents-students/${linkingParent.id}`);
            setLinkedStudents(res.students || []);
        } catch (err: any) {
            alert(err.message || 'Failed to unlink student.');
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

    const allStudents = users.filter(u => u.role === 'student');

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
                        <p style={{ color: 'var(--text-secondary)' }}>Add, edit, monitor, and manage all members in your academy — teachers, students, parents, and admins.</p>
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
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
                                <thead>
                                    <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--border-glass)' }}>
                                        {['Name', 'Email', 'Role', 'Phone', 'Status', 'Joined', 'Actions'].map(h => (
                                            <th key={h} style={{ padding: '14px 20px', textAlign: h === 'Actions' ? 'right' : 'left', color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</th>
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
                                                <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                                                    <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end', alignItems: 'center' }}>
                                                        {u.role === 'parent' && (
                                                            <button 
                                                                onClick={() => openLinkingModal(u)}
                                                                title="Manage Linked Children"
                                                                className="btn-secondary" 
                                                                style={{ padding: '6px 10px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px', color: '#f472b6', borderColor: 'rgba(244,114,182,0.3)' }}
                                                            >
                                                                <Link2 size={13} /> Children
                                                            </button>
                                                        )}
                                                        <button 
                                                            onClick={() => openEditModal(u)}
                                                            title="Edit User"
                                                            className="btn-secondary" 
                                                            style={{ padding: '6px 10px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                                                        >
                                                            <Edit2 size={13} /> Edit
                                                        </button>
                                                        <button 
                                                            onClick={() => { setResettingUser(u); setNewPassword(''); }}
                                                            title="Reset Password"
                                                            className="btn-secondary" 
                                                            style={{ padding: '6px 10px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px', color: '#fbbf24', borderColor: 'rgba(251,191,36,0.3)' }}
                                                        >
                                                            <Key size={13} />
                                                        </button>
                                                        <button 
                                                            onClick={() => handleToggleStatus(u)}
                                                            title={u.status === 'active' ? 'Suspend User' : 'Activate User'}
                                                            className="btn-secondary" 
                                                            style={{ padding: '6px 10px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px', color: u.status === 'active' ? '#f87171' : '#34d399', borderColor: u.status === 'active' ? 'rgba(248,113,113,0.3)' : 'rgba(52,211,153,0.3)' }}
                                                        >
                                                            {u.status === 'active' ? <UserX size={13} /> : <UserCheck size={13} />}
                                                        </button>
                                                        <button 
                                                            onClick={() => handleDeleteUser(u)}
                                                            title="Delete User"
                                                            className="btn-secondary" 
                                                            style={{ padding: '6px 10px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--danger)', borderColor: 'rgba(239,68,68,0.3)' }}
                                                        >
                                                            <Trash2 size={13} />
                                                        </button>
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

            {/* Add Member Modal */}
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

            {/* Edit User Modal */}
            {editingUser && (
                <ModalPortal onClose={() => setEditingUser(null)}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                        <h2 style={{ fontWeight: '800', fontSize: '1.3rem', color: 'var(--text-primary)' }}>Edit Member Details</h2>
                        <button onClick={() => setEditingUser(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={20} /></button>
                    </div>

                    <form onSubmit={handleUpdateUser} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>Role</label>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                {(Object.keys(ROLE_CONFIG) as Array<keyof typeof ROLE_CONFIG>).map(r => {
                                    const cfg = ROLE_CONFIG[r];
                                    const Icon = cfg.icon;
                                    const isSelected = editRole === r;
                                    return (
                                        <button key={r} type="button" onClick={() => setEditRole(r as any)}
                                            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', borderRadius: '10px', border: isSelected ? `1.5px solid ${cfg.color}` : '1.5px solid var(--border-glass)', background: isSelected ? cfg.bg : 'transparent', color: isSelected ? cfg.color : 'var(--text-muted)', cursor: 'pointer', fontWeight: '600', fontSize: '0.85rem' }}>
                                            <Icon size={15} /> {cfg.label}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '5px' }}>First Name</label>
                                <input className="glass-input" required value={editFirstName} onChange={e => setEditFirstName(e.target.value)} />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '5px' }}>Last Name</label>
                                <input className="glass-input" required value={editLastName} onChange={e => setEditLastName(e.target.value)} />
                            </div>
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '5px' }}>Email Address</label>
                            <input className="glass-input" type="email" required value={editEmail} onChange={e => setEditEmail(e.target.value)} />
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '5px' }}>Phone</label>
                            <input className="glass-input" value={editPhone} onChange={e => setEditPhone(e.target.value)} />
                        </div>

                        <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                            <button type="button" onClick={() => setEditingUser(null)} className="btn-secondary" style={{ flex: 1, padding: '12px' }}>Cancel</button>
                            <button type="submit" className="btn-primary" style={{ flex: 2, padding: '12px' }} disabled={updating}>
                                {updating ? 'Saving Changes...' : 'Save Profile Changes'}
                            </button>
                        </div>
                    </form>
                </ModalPortal>
            )}

            {/* Admin Reset Password Modal */}
            {resettingUser && (
                <ModalPortal onClose={() => setResettingUser(null)}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <div>
                            <h2 style={{ fontWeight: '800', fontSize: '1.25rem', color: 'var(--text-primary)' }}>Reset Password</h2>
                            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>For {resettingUser.first_name} {resettingUser.last_name} ({resettingUser.email})</span>
                        </div>
                        <button onClick={() => setResettingUser(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={20} /></button>
                    </div>

                    <form onSubmit={handleResetPassword} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>New Password</label>
                            <input 
                                className="glass-input" 
                                type="password" 
                                required 
                                minLength={8}
                                placeholder="Enter at least 8 characters" 
                                value={newPassword} 
                                onChange={e => setNewPassword(e.target.value)} 
                            />
                        </div>

                        <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                            <button type="button" onClick={() => setResettingUser(null)} className="btn-secondary" style={{ flex: 1, padding: '12px' }}>Cancel</button>
                            <button type="submit" className="btn-primary" style={{ flex: 2, padding: '12px' }} disabled={resetting}>
                                {resetting ? 'Updating...' : 'Set New Password'}
                            </button>
                        </div>
                    </form>
                </ModalPortal>
            )}

            {/* Parent-Student Linking Modal */}
            {linkingParent && (
                <ModalPortal onClose={() => setLinkingParent(null)}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <div>
                            <h2 style={{ fontWeight: '800', fontSize: '1.25rem', color: 'var(--text-primary)' }}>Manage Parent Children</h2>
                            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Parent: {linkingParent.first_name} {linkingParent.last_name} ({linkingParent.email})</span>
                        </div>
                        <button onClick={() => setLinkingParent(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={20} /></button>
                    </div>

                    {/* Link a new student form */}
                    <form onSubmit={handleLinkStudent} style={{ 
                        background: 'rgba(255,255,255,0.02)', 
                        border: '1px dashed var(--border-glass)', 
                        padding: '16px', 
                        borderRadius: '10px', 
                        marginBottom: '20px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '10px'
                    }}>
                        <label style={{ fontSize: '0.82rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Attach Student / Child to Parent</label>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <select 
                                className="glass-input" 
                                style={{ flex: 1 }}
                                value={selectedStudentToLink} 
                                onChange={e => setSelectedStudentToLink(e.target.value)}
                                required
                            >
                                <option value="">-- Select a registered student --</option>
                                {allStudents.map(s => (
                                    <option key={s.id} value={s.id}>
                                        {s.first_name} {s.last_name} ({s.email})
                                    </option>
                                ))}
                            </select>
                            <button type="submit" className="btn-primary" style={{ padding: '8px 16px', fontSize: '0.85rem' }} disabled={linkingSubmitting}>
                                {linkingSubmitting ? 'Linking...' : 'Link Child'}
                            </button>
                        </div>
                    </form>

                    {/* Linked students list */}
                    <h3 style={{ fontSize: '0.88rem', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '10px' }}>
                        Currently Linked Students ({linkedStudents.length})
                    </h3>

                    {loadingLinks ? (
                        <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading linked students...</div>
                    ) : linkedStudents.length === 0 ? (
                        <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.01)', borderRadius: '8px' }}>
                            No student linked to this parent yet. Select a student above to connect them.
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '250px', overflowY: 'auto' }}>
                            {linkedStudents.map(child => (
                                <div key={child.id} style={{ 
                                    display: 'flex', 
                                    justifyContent: 'space-between', 
                                    alignItems: 'center', 
                                    padding: '10px 14px', 
                                    background: 'rgba(255,255,255,0.02)', 
                                    border: '1px solid var(--border-glass)', 
                                    borderRadius: '8px' 
                                }}>
                                    <div>
                                        <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>{child.first_name} {child.last_name}</div>
                                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{child.email} {child.phone ? `• ${child.phone}` : ''}</div>
                                    </div>
                                    <button 
                                        type="button" 
                                        onClick={() => handleUnlinkStudent(child.id, `${child.first_name} ${child.last_name}`)}
                                        className="btn-secondary"
                                        style={{ padding: '4px 10px', fontSize: '0.75rem', color: 'var(--danger)', borderColor: 'rgba(239,68,68,0.3)' }}
                                    >
                                        Remove Link
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </ModalPortal>
            )}
        </SidebarLayout>
    );
}
