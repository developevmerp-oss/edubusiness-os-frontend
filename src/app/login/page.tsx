'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiRequest, getSubdomain } from '../../utils/api';
import { Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
    const router = useRouter();
    const [subdomain, setSubdomainState] = useState('');
    const [isRegisteringTenant, setIsRegisteringTenant] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Credentials
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    // Register Tenant fields
    const [tenantName, setTenantName] = useState('');
    const [regSubdomain, setRegSubdomain] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');

    useEffect(() => {
        setSubdomainState(getSubdomain());
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            if (params.get('register') === 'true' || params.get('mode') === 'register') {
                setIsRegisteringTenant(true);
            }
            // If already logged in, redirect to dashboard automatically
            const storedUser = localStorage.getItem('user_profile');
            if (storedUser && params.get('logout') !== 'true') {
                try {
                    const parsed = JSON.parse(storedUser);
                    if (parsed && parsed.email) {
                        router.push('/dashboard');
                    }
                } catch (e) {
                    // ignore invalid JSON
                }
            }
        }
    }, [router]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const data = await apiRequest('/api/auth/login', {
                method: 'POST',
                body: JSON.stringify({ email, password })
            });

            // Store user profile details in localStorage for dynamic layout use
            localStorage.setItem('user_profile', JSON.stringify(data.user));
            localStorage.setItem('tenant_info', JSON.stringify(data.tenant));
            localStorage.setItem('tenant_subdomain', data.tenant.subdomain);
            
            setSuccess('Login successful! Redirecting...');
            setTimeout(() => {
                router.push('/dashboard');
            }, 1000);
        } catch (err: any) {
            setError(err.message || 'Login failed. Please check your credentials.');
        } finally {
            setLoading(false);
        }
    };

    const handleRegisterTenant = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            await apiRequest('/api/auth/register-tenant', {
                method: 'POST',
                body: JSON.stringify({
                    tenantName,
                    subdomain: regSubdomain.toLowerCase(),
                    email,
                    password,
                    firstName,
                    lastName
                })
            });

            setSuccess('Academy registered successfully! Switching context...');
            localStorage.setItem('tenant_subdomain', regSubdomain.toLowerCase());
            setSubdomainState(regSubdomain.toLowerCase());
            
            // Switch tabs
            setTimeout(() => {
                setIsRegisteringTenant(false);
                setSuccess('');
                setEmail('');
                setPassword('');
            }, 1500);
        } catch (err: any) {
            setError(err.message || 'Registration failed.');
        } finally {
            setLoading(false);
        }
    };

    const handleSubdomainChange = (newVal: string) => {
        localStorage.setItem('tenant_subdomain', newVal);
        setSubdomainState(newVal);
        // Refresh page to load correct branding from database
        window.location.reload();
    };

    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            padding: '24px',
            position: 'relative',
            background: '#0a0b10'
        }}>
            <div className="pulse-glow-bg" style={{ top: '15%', left: '15%' }} />
            <div className="pulse-glow-bg" style={{ bottom: '15%', right: '15%' }} />

            <div className="glass-panel" style={{
                width: '100%',
                maxWidth: '450px',
                padding: '40px',
                zIndex: 2,
                borderRadius: '24px'
            }}>
                {/* Header branding */}
                <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                    <span style={{
                        fontSize: '0.8rem',
                        fontWeight: '700',
                        textTransform: 'uppercase',
                        letterSpacing: '0.15em',
                        color: 'var(--primary)'
                    }}>
                        {isRegisteringTenant ? 'GET STARTED' : 'WELCOME BACK'}
                    </span>
                    <h2 className="gradient-text" style={{ fontSize: '2rem', marginTop: '6px', fontWeight: '800' }}>
                        {isRegisteringTenant ? 'Register Academy' : 'Sign In'}
                    </h2>
                </div>

                {error && (
                    <div style={{
                        padding: '12px 16px',
                        background: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid rgba(239, 68, 68, 0.2)',
                        color: '#fca5a5',
                        borderRadius: '8px',
                        fontSize: '0.9rem',
                        marginBottom: '20px'
                    }}>
                        âš ï¸ {error}
                    </div>
                )}

                {success && (
                    <div style={{
                        padding: '12px 16px',
                        background: 'rgba(16, 185, 129, 0.1)',
                        border: '1px solid rgba(16, 185, 129, 0.2)',
                        color: '#a7f3d0',
                        borderRadius: '8px',
                        fontSize: '0.9rem',
                        marginBottom: '20px'
                    }}>
                        âœ“ {success}
                    </div>
                )}

                {isRegisteringTenant ? (
                    /* Registration Form */
                    <form onSubmit={handleRegisterTenant} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>Academy Name</label>
                            <input 
                                type="text" 
                                className="glass-input" 
                                placeholder="e.g. Apex Institute"
                                required 
                                value={tenantName}
                                onChange={(e) => setTenantName(e.target.value)}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>Subdomain</label>
                            <input 
                                type="text" 
                                className="glass-input" 
                                placeholder="e.g. apex"
                                required 
                                value={regSubdomain}
                                onChange={(e) => setRegSubdomain(e.target.value)}
                            />
                        </div>
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <div style={{ flex: 1 }}>
                                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>First Name</label>
                                <input 
                                    type="text" 
                                    className="glass-input" 
                                    required 
                                    value={firstName}
                                    onChange={(e) => setFirstName(e.target.value)}
                                />
                            </div>
                            <div style={{ flex: 1 }}>
                                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>Last Name</label>
                                <input 
                                    type="text" 
                                    className="glass-input" 
                                    required 
                                    value={lastName}
                                    onChange={(e) => setLastName(e.target.value)}
                                />
                            </div>
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>Admin Email</label>
                            <input 
                                type="email" 
                                className="glass-input" 
                                required 
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>Password</label>
                            <div style={{ position: 'relative' }}>
                                <input 
                                    type={showPassword ? "text" : "password"} 
                                    className="glass-input" 
                                    required 
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    style={{ paddingRight: '40px' }}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    style={{
                                        position: 'absolute',
                                        right: '12px',
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        background: 'none',
                                        border: 'none',
                                        color: 'var(--text-muted)',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        padding: 0
                                    }}
                                >
                                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>

                        <button type="submit" className="btn-primary" style={{ marginTop: '10px' }} disabled={loading}>
                            {loading ? 'Registering...' : 'Create Academy'}
                        </button>

                        <button 
                            type="button" 
                            className="btn-secondary" 
                            onClick={() => setIsRegisteringTenant(false)}
                            disabled={loading}
                        >
                            Cancel
                        </button>
                    </form>
                ) : (
                    /* Login Form */
                    <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>Email Address</label>
                            <input 
                                type="email" 
                                className="glass-input" 
                                placeholder="email@domain.com"
                                required 
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>Password</label>
                            <div style={{ position: 'relative' }}>
                                <input 
                                    type={showPassword ? "text" : "password"} 
                                    className="glass-input" 
                                    placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢"
                                    required 
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    style={{ paddingRight: '40px' }}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    style={{
                                        position: 'absolute',
                                        right: '12px',
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        background: 'none',
                                        border: 'none',
                                        color: 'var(--text-muted)',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        padding: 0
                                    }}
                                >
                                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>

                        <button type="submit" className="btn-primary" style={{ marginTop: '10px' }} disabled={loading}>
                            {loading ? 'Signing In...' : 'Access Dashboard'}
                        </button>

                        <div style={{
                            textAlign: 'center',
                            marginTop: '20px',
                            borderTop: '1px solid var(--border-glass)',
                            paddingTop: '20px'
                        }}>
                            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Want to launch your own SaaS workspace?</span>
                            <button 
                                type="button" 
                                onClick={() => setIsRegisteringTenant(true)}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    color: 'var(--primary)',
                                    fontWeight: '600',
                                    fontSize: '0.85rem',
                                    cursor: 'pointer',
                                    marginLeft: '6px',
                                    textDecoration: 'underline'
                                }}
                            >
                                Register now
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}


