'use client';

import { ReactNode, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { 
    LayoutDashboard, 
    BookOpen, 
    Calendar, 
    LogOut, 
    Users, 
    Settings,
    FileText,
    ShoppingBag,
    CreditCard,
    MessageSquare,
    Trophy,
    Mail,
    HelpCircle,
    ClipboardList
} from 'lucide-react';
import { apiRequest } from '../utils/api';

interface SidebarLayoutProps {
    children: ReactNode;
}

export default function SidebarLayout({ children }: SidebarLayoutProps) {
    const router = useRouter();
    const pathname = usePathname();
    const [user, setUser] = useState<any>(null);
    const [tenant, setTenant] = useState<any>(null);

    useEffect(() => {
        const storedUser = localStorage.getItem('user_profile');
        const storedTenant = localStorage.getItem('tenant_info');

        if (storedUser && storedTenant) {
            setUser(JSON.parse(storedUser));
            setTenant(JSON.parse(storedTenant));
        } else {
            // Redirect to login if profile not found
            router.push('/login');
        }
    }, [router]);

    useEffect(() => {
        if (tenant && tenant.branding && tenant.branding.accentColor) {
            document.documentElement.style.setProperty('--primary', tenant.branding.accentColor);
            const hex = tenant.branding.accentColor.replace('#', '');
            const r = parseInt(hex.substring(0, 2), 16);
            const g = parseInt(hex.substring(2, 4), 16);
            const b = parseInt(hex.substring(4, 6), 16);
            document.documentElement.style.setProperty('--primary-rgb', `${r}, ${g}, ${b}`);
        }
    }, [tenant]);

    const handleLogout = async () => {
        try {
            await apiRequest('/api/auth/logout', { method: 'POST' });
        } catch (err) {
            // Force clear even if request fails
        }
        localStorage.removeItem('user_profile');
        localStorage.removeItem('tenant_info');
        router.push('/login');
    };

    if (!user || !tenant) {
        return (
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100vh',
                background: '#0a0b10',
                color: 'var(--text-secondary)'
            }}>
                Loading workspace...
            </div>
        );
    }

    const menuItems = [
        { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, roles: ['admin', 'teacher', 'student', 'parent'] },
        { name: 'Courses', path: '/courses', icon: BookOpen, roles: ['admin', 'teacher', 'student', 'parent'] },
        { name: 'Batches', path: '/batches', icon: Calendar, roles: ['admin', 'teacher', 'student', 'parent'] },
        { name: 'Users', path: '/users', icon: Users, roles: ['admin'] },
        { name: 'Exams', path: '/exams', icon: FileText, roles: ['admin', 'teacher', 'student', 'parent'] },
        { name: 'Assignments', path: '/assignments', icon: ClipboardList, roles: ['admin', 'teacher', 'student'] },
        { name: 'Doubts Desk', path: '/doubts', icon: HelpCircle, roles: ['admin', 'teacher', 'student'] },
        { name: 'Storefront', path: '/store', icon: ShoppingBag, roles: ['admin', 'teacher', 'student', 'parent'] },
        { name: 'Receipts', path: '/store/purchases', icon: CreditCard, roles: ['student'] },
        { name: 'Community', path: '/community', icon: MessageSquare, roles: ['admin', 'teacher', 'student', 'parent'] },
        { name: 'Leaderboard', path: '/leaderboard', icon: Trophy, roles: ['admin', 'teacher', 'student', 'parent'] },
        { name: 'Marketing', path: '/marketing', icon: Mail, roles: ['admin', 'teacher'] },
        { name: 'Consultations', path: '/store/consultations', icon: Users, roles: ['admin', 'teacher', 'student'] },
        { name: 'Settings', path: '/settings', icon: Settings, roles: ['admin'] }
    ];

    const activeItemStyle = {
        background: 'linear-gradient(135deg, rgba(var(--primary-rgb), 0.15) 0%, rgba(var(--secondary-rgb), 0.1) 100%)',
        color: 'var(--text-primary)',
        borderColor: 'var(--primary)'
    };

    return (
        <div className="main-wrapper">
            {/* Sidebar */}
            <aside className="sidebar">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                    {/* Logo/Academy Brand */}
                    <div style={{ borderBottom: '1px solid var(--border-glass)', paddingBottom: '20px' }}>
                        {tenant.branding && tenant.branding.logoUrl ? (
                            <div style={{ marginBottom: '8px' }}>
                                <img 
                                    src={tenant.branding.logoUrl} 
                                    alt={tenant.name} 
                                    style={{ maxHeight: '42px', maxWidth: '100%', objectFit: 'contain', display: 'block' }} 
                                />
                            </div>
                        ) : (
                            <h2 className="brand-gradient" style={{ fontSize: '1.4rem', fontWeight: '800', wordBreak: 'break-word', marginBottom: '8px' }}>
                                {tenant.name}
                            </h2>
                        )}
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                            {user.role} workspace
                        </span>
                    </div>

                    {/* Nav Links */}
                    <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {menuItems
                            .filter(item => item.roles.includes(user.role))
                            .map((item) => {
                                const Icon = item.icon;
                                const isActive = pathname === item.path;
                                return (
                                    <Link 
                                        key={item.path} 
                                        href={item.path}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '12px',
                                            padding: '12px 16px',
                                            borderRadius: '10px',
                                            color: 'var(--text-secondary)',
                                            textDecoration: 'none',
                                            fontSize: '0.95rem',
                                            fontWeight: '500',
                                            borderLeft: '3px solid transparent',
                                            transition: 'all 0.2s ease',
                                            ...(isActive ? activeItemStyle : {})
                                        }}
                                        onMouseEnter={(e) => {
                                            if (!isActive) e.currentTarget.style.color = 'var(--text-primary)';
                                        }}
                                        onMouseLeave={(e) => {
                                            if (!isActive) e.currentTarget.style.color = 'var(--text-secondary)';
                                        }}
                                    >
                                        <Icon size={18} />
                                        <span>{item.name}</span>
                                    </Link>
                                );
                            })}
                    </nav>
                </div>

                {/* User footer profile & logout */}
                <div style={{ 
                    borderTop: '1px solid var(--border-glass)', 
                    paddingTop: '20px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '16px'
                }}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontWeight: '600', fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                            {user.first_name} {user.last_name}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {user.email}
                        </span>
                    </div>
                    <button 
                        onClick={handleLogout}
                        className="btn-secondary"
                        style={{ padding: '10px 16px', width: '100%', fontSize: '0.9rem' }}
                    >
                        <LogOut size={16} />
                        Logout
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="content-area">
                {children}
            </main>
        </div>
    );
}
