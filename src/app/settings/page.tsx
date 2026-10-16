'use client';

import { useState, useEffect } from 'react';
import SidebarLayout from '../../components/SidebarLayout';
import ModalPortal from '../../components/ModalPortal';
import { apiRequest } from '../../utils/api';
import { 
    Settings, ShieldCheck, Paintbrush, Save, Smartphone, 
    Download, CheckCircle, Code, Layers, Sparkles, ExternalLink,
    CreditCard, Key, Copy, Check, RefreshCw, AlertTriangle, Globe
} from 'lucide-react';

export default function SettingsBrandingPage() {
    const [activeTab, setActiveTab] = useState<'branding' | 'mobile' | 'payment'>('branding');
    const [userRole, setUserRole] = useState('');
    const [tenant, setTenant] = useState<any>(null);
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [accentColor, setAccentColor] = useState('#6366f1');
    const [logoUrl, setLogoUrl] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [successMsg, setSuccessMsg] = useState('');

    // Payment Gateway State
    const [activeGateway, setActiveGateway] = useState<'sandbox' | 'razorpay' | 'stripe'>('sandbox');
    const [isTestMode, setIsTestMode] = useState(true);
    const [razorpayKeyId, setRazorpayKeyId] = useState('');
    const [razorpayKeySecret, setRazorpayKeySecret] = useState('');
    const [razorpayWebhookSecret, setRazorpayWebhookSecret] = useState('');
    const [stripePublishableKey, setStripePublishableKey] = useState('');
    const [stripeSecretKey, setStripeSecretKey] = useState('');
    const [stripeWebhookSecret, setStripeWebhookSecret] = useState('');
    const [webhookUrl, setWebhookUrl] = useState('https://edubusiness-os-backend.onrender.com/api/store/webhooks/razorpay');
    const [copiedWebhook, setCopiedWebhook] = useState(false);
    const [testingConnection, setTestingConnection] = useState(false);
    const [testResult, setTestResult] = useState<{ status: string; message: string } | null>(null);
    const [savingGateway, setSavingGateway] = useState(false);

    // Mobile App Builder State
    const [appName, setAppName] = useState('Apex Academy Pro');
    const [packageName, setPackageName] = useState('com.apexacademy.learning');
    const [versionName, setVersionName] = useState('1.0.0');
    const [appPrimaryColor, setAppPrimaryColor] = useState('#6366f1');
    const [splashBgColor, setSplashBgColor] = useState('#0a0b10');
    const [enableOffline, setEnableOffline] = useState(true);
    const [enablePush, setEnablePush] = useState(true);
    const [savingMobile, setSavingMobile] = useState(false);
    const [exportModalOpen, setExportModalOpen] = useState(false);
    const [exportData, setExportData] = useState<any>(null);

    // Logo Upload
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        const storedUser = localStorage.getItem('user_profile');
        const storedTenant = localStorage.getItem('tenant_info');

        if (storedUser) {
            setUserRole(JSON.parse(storedUser).role);
        }
        if (storedTenant) {
            const tenantObj = JSON.parse(storedTenant);
            setTenant(tenantObj);
            setName(tenantObj.name || '');
            if (tenantObj.branding) {
                setDescription(tenantObj.branding.description || '');
                setAccentColor(tenantObj.branding.accentColor || '#6366f1');
                setLogoUrl(tenantObj.branding.logoUrl || '');
            }
        }
        fetchMobileConfig();
        fetchPaymentGatewayConfig();
    }, []);

    const fetchPaymentGatewayConfig = async () => {
        try {
            const res = await apiRequest('/api/settings/payment-gateway');
            if (res.config) {
                setActiveGateway(res.config.activeGateway || 'sandbox');
                setIsTestMode(res.config.isTestMode ?? true);
                setRazorpayKeyId(res.config.razorpayKeyId || '');
                setRazorpayKeySecret(res.config.razorpayKeySecretMasked || '');
                setRazorpayWebhookSecret(res.config.razorpayWebhookSecretMasked || '');
                setStripePublishableKey(res.config.stripePublishableKey || '');
                setStripeSecretKey(res.config.stripeSecretKeyMasked || '');
                setStripeWebhookSecret(res.config.stripeWebhookSecretMasked || '');
                setWebhookUrl(res.config.webhookUrl || 'https://edubusiness-os-backend.onrender.com/api/store/webhooks/razorpay');
            }
        } catch (e) {
            console.error('Failed to load gateway config:', e);
        }
    };

    const handleSaveGateway = async (e: React.FormEvent) => {
        e.preventDefault();
        setSavingGateway(true);
        setTestResult(null);
        try {
            const res = await apiRequest('/api/settings/payment-gateway', {
                method: 'POST',
                body: JSON.stringify({
                    activeGateway,
                    isTestMode,
                    razorpayKeyId,
                    razorpayKeySecret,
                    razorpayWebhookSecret,
                    stripePublishableKey,
                    stripeSecretKey,
                    stripeWebhookSecret
                })
            });
            setSuccessMsg(res.message || 'Payment gateway configuration updated!');
            setTimeout(() => setSuccessMsg(''), 4000);
        } catch (err: any) {
            alert(err.message || 'Failed to save payment gateway settings.');
        } finally {
            setSavingGateway(false);
        }
    };

    const handleTestConnection = async () => {
        setTestingConnection(true);
        setTestResult(null);
        try {
            const res = await apiRequest('/api/settings/payment-gateway/test-connection', {
                method: 'POST'
            });
            setTestResult({ status: 'success', message: res.message || 'Connection verified successfully!' });
        } catch (err: any) {
            setTestResult({ status: 'error', message: err.message || 'Gateway connection failed.' });
        } finally {
            setTestingConnection(false);
        }
    };

    const fetchMobileConfig = async () => {
        try {
            const res = await apiRequest('/api/settings/mobile-app');
            if (res.config) {
                setAppName(res.config.app_name);
                setPackageName(res.config.package_name);
                setVersionName(res.config.version_name || '1.0.0');
                setAppPrimaryColor(res.config.primary_color || '#6366f1');
                setSplashBgColor(res.config.splash_bg_color || '#0a0b10');
                setEnableOffline(res.config.enable_offline_mode ?? true);
                setEnablePush(res.config.enable_push_notifications ?? true);
            }
        } catch (e) {
            // Ignore error
        } finally {
            setLoading(false);
        }
    };

    const handleLogoUpload = async () => {
        if (!selectedFile) return;
        setUploading(true);
        try {
            const formData = new FormData();
            formData.append('logo', selectedFile);

            const data = await apiRequest('/api/settings/logo', {
                method: 'POST',
                body: formData
            });

            setLogoUrl(data.logoUrl);
            setSelectedFile(null);
            localStorage.setItem('tenant_info', JSON.stringify(data.tenant));
            setSuccessMsg('Academy logo image uploaded successfully!');
            setTimeout(() => setSuccessMsg(''), 4000);
        } catch (err: any) {
            alert(err.message || 'File upload failed.');
        } finally {
            setUploading(false);
        }
    };

    const handleSaveBranding = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const data = await apiRequest('/api/settings/branding', {
                method: 'POST',
                body: JSON.stringify({
                    name,
                    description,
                    accentColor: accentColor.trim(),
                    logoUrl: logoUrl.trim()
                })
            });

            localStorage.setItem('tenant_info', JSON.stringify(data.tenant));
            setSuccessMsg('Institute branding customizations saved successfully!');
            setTimeout(() => setSuccessMsg(''), 4000);
        } catch (err: any) {
            alert(err.message || 'Failed to update configurations.');
        } finally {
            setSaving(false);
        }
    };

    const handleSaveMobileApp = async (e: React.FormEvent) => {
        e.preventDefault();
        setSavingMobile(true);
        try {
            const res = await apiRequest('/api/settings/mobile-app', {
                method: 'POST',
                body: JSON.stringify({
                    appName,
                    packageName,
                    versionName,
                    primaryColor: appPrimaryColor,
                    splashBgColor,
                    enableOfflineMode: enableOffline,
                    enablePushNotifications: enablePush
                })
            });

            setSuccessMsg(res.message || 'Native mobile app settings saved!');
            setTimeout(() => setSuccessMsg(''), 4000);
        } catch (err: any) {
            alert(err.message || 'Failed to save mobile app config.');
        } finally {
            setSavingMobile(false);
        }
    };

    const handleExportPackage = async () => {
        try {
            const res = await apiRequest('/api/settings/mobile-app/export-package');
            setExportData(res);
            setExportModalOpen(true);
        } catch (err: any) {
            alert(err.message || 'Failed to generate package specifications.');
        }
    };

    const handleDownloadManifest = () => {
        const manifestObj = {
            name: appName,
            short_name: appName.slice(0, 12),
            start_url: '/dashboard',
            display: 'standalone',
            background_color: splashBgColor,
            theme_color: appPrimaryColor,
            orientation: 'portrait-primary',
            icons: [
                { src: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
                { src: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png' }
            ]
        };

        const blob = new Blob([JSON.stringify(manifestObj, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'manifest.json';
        a.click();
        URL.revokeObjectURL(url);
    };

    if (loading) {
        return (
            <SidebarLayout>
                <div style={{ color: 'var(--text-secondary)' }}>Loading settings workspace...</div>
            </SidebarLayout>
        );
    }

    if (userRole !== 'admin') {
        return (
            <SidebarLayout>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 0', gap: '16px' }}>
                    <ShieldCheck size={48} style={{ color: 'var(--danger)' }} />
                    <h3>Access Restricted</h3>
                    <p style={{ color: 'var(--text-muted)' }}>Only the institute owner/admin has permission to change white-label settings.</p>
                </div>
            </SidebarLayout>
        );
    }

    return (
        <SidebarLayout>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '30px', maxWidth: '1080px' }}>
                
                {/* Header */}
                <div>
                    <h1 className="brand-gradient" style={{ fontSize: '2.2rem', fontWeight: '800' }}>
                        White-Label & Mobile App Customizer
                    </h1>
                    <p style={{ color: 'var(--text-secondary)' }}>
                        Control institute branding across web portals, PWA, and Google Play Store Android app packages.
                    </p>
                </div>

                {/* Notifications */}
                {successMsg && (
                    <div style={{ padding: '12px 16px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', color: '#a7f3d0', borderRadius: '8px', fontSize: '0.9rem' }}>
                        ✓ {successMsg}
                    </div>
                )}

                {/* Tab Switcher */}
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
                        onClick={() => setActiveTab('branding')}
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
                            background: activeTab === 'branding' ? 'var(--primary)' : 'transparent',
                            color: activeTab === 'branding' ? '#fff' : 'var(--text-muted)',
                            transition: 'all 0.2s ease'
                        }}
                    >
                        <Paintbrush size={16} /> Web Institute Branding
                    </button>
                    <button
                        onClick={() => setActiveTab('mobile')}
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
                            background: activeTab === 'mobile' ? 'var(--primary)' : 'transparent',
                            color: activeTab === 'mobile' ? '#fff' : 'var(--text-muted)',
                            transition: 'all 0.2s ease'
                        }}
                    >
                        <Smartphone size={16} /> Native Android & PWA Builder
                    </button>
                    <button
                        onClick={() => setActiveTab('payment')}
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
                            background: activeTab === 'payment' ? 'var(--primary)' : 'transparent',
                            color: activeTab === 'payment' ? '#fff' : 'var(--text-muted)',
                            transition: 'all 0.2s ease'
                        }}
                    >
                        <CreditCard size={16} /> Payment Gateways & Webhooks
                    </button>
                </div>

                {/* ========================================================
                    TAB 1: WEB BRANDING
                   ======================================================== */}
                {activeTab === 'branding' && (
                    <div className="glass-panel" style={{ padding: '32px', borderRadius: '16px', maxWidth: '640px' }}>
                        <form onSubmit={handleSaveBranding} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '8px', fontWeight: '600' }}>
                                    Institute / Organization Name
                                </label>
                                <input 
                                    type="text" 
                                    className="glass-input" 
                                    placeholder="e.g. Apex Institute of Science" 
                                    required 
                                    value={name} 
                                    onChange={(e) => setName(e.target.value)} 
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '8px', fontWeight: '600' }}>
                                    Tagline / Description
                                </label>
                                <textarea 
                                    className="glass-input" 
                                    rows={2} 
                                    placeholder="e.g. Premier coaching for JEE & NEET entrance preparation" 
                                    value={description} 
                                    onChange={(e) => setDescription(e.target.value)} 
                                />
                            </div>

                            {/* Color Selector */}
                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '8px', fontWeight: '600' }}>
                                    Primary Brand Accent Color
                                </label>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                    <input 
                                        type="color" 
                                        value={accentColor} 
                                        onChange={(e) => setAccentColor(e.target.value)}
                                        style={{ width: '48px', height: '48px', border: 'none', borderRadius: '8px', background: 'none', cursor: 'pointer' }}
                                    />
                                    <input 
                                        type="text" 
                                        className="glass-input" 
                                        style={{ width: '140px' }} 
                                        value={accentColor} 
                                        onChange={(e) => setAccentColor(e.target.value)} 
                                    />
                                </div>
                            </div>

                            {/* Logo URL / Upload */}
                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '8px', fontWeight: '600' }}>
                                    Institute Logo (Square or Rectangular PNG/SVG)
                                </label>
                                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '12px' }}>
                                    <input 
                                        type="file" 
                                        accept="image/*"
                                        onChange={(e) => setSelectedFile(e.target.files ? e.target.files[0] : null)}
                                        className="glass-input"
                                        style={{ padding: '8px' }}
                                    />
                                    <button 
                                        type="button" 
                                        onClick={handleLogoUpload} 
                                        disabled={!selectedFile || uploading} 
                                        className="btn-secondary"
                                        style={{ flexShrink: 0 }}
                                    >
                                        {uploading ? 'Uploading...' : 'Upload Logo'}
                                    </button>
                                </div>
                                <input 
                                    type="text" 
                                    className="glass-input" 
                                    placeholder="Or paste an image URL directly" 
                                    value={logoUrl} 
                                    onChange={(e) => setLogoUrl(e.target.value)} 
                                />
                            </div>

                            <button 
                                type="submit" 
                                className="btn-primary" 
                                disabled={saving} 
                                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px' }}
                            >
                                <Save size={16} /> {saving ? 'Saving Changes...' : 'Save Web Branding'}
                            </button>
                        </form>
                    </div>
                )}

                {/* ========================================================
                    TAB 2: ANDROID & PWA MOBILE APP BUILDER
                   ======================================================== */}
                {activeTab === 'mobile' && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '30px', alignItems: 'start' }}>
                        
                        {/* LEFT: Config Form */}
                        <div className="glass-panel" style={{ padding: '32px', borderRadius: '16px' }}>
                            <form onSubmit={handleSaveMobileApp} style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <h3 style={{ fontSize: '1.2rem', fontWeight: '700' }}>Google Play & Android App Package</h3>
                                    <span style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: '700', background: 'rgba(16, 185, 129, 0.1)', padding: '4px 8px', borderRadius: '6px' }}>
                                        Play Store Ready
                                    </span>
                                </div>

                                <div>
                                    <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: '600' }}>
                                        Mobile App Display Name
                                    </label>
                                    <input 
                                        type="text" 
                                        className="glass-input" 
                                        placeholder="e.g. Apex Academy Pro" 
                                        required 
                                        value={appName} 
                                        onChange={e => setAppName(e.target.value)} 
                                    />
                                </div>

                                <div>
                                    <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: '600' }}>
                                        Android Package Name (Application ID)
                                    </label>
                                    <input 
                                        type="text" 
                                        className="glass-input" 
                                        placeholder="com.apexacademy.learning" 
                                        required 
                                        value={packageName} 
                                        onChange={e => setPackageName(e.target.value.toLowerCase())} 
                                    />
                                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Must be lowercase domain-reversed format (e.g. com.institute.app)</span>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: '600' }}>
                                            App Version
                                        </label>
                                        <input 
                                            type="text" 
                                            className="glass-input" 
                                            placeholder="1.0.0" 
                                            value={versionName} 
                                            onChange={e => setVersionName(e.target.value)} 
                                        />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: '600' }}>
                                            Target SDK Level
                                        </label>
                                        <input 
                                            type="text" 
                                            className="glass-input" 
                                            value="Android 14 (API 34)" 
                                            disabled 
                                        />
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: '600' }}>
                                            Primary App Theme
                                        </label>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <input 
                                                type="color" 
                                                value={appPrimaryColor} 
                                                onChange={e => setAppPrimaryColor(e.target.value)} 
                                                style={{ width: '40px', height: '40px', border: 'none', borderRadius: '6px', background: 'none', cursor: 'pointer' }}
                                            />
                                            <input 
                                                type="text" 
                                                className="glass-input" 
                                                value={appPrimaryColor} 
                                                onChange={e => setAppPrimaryColor(e.target.value)} 
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: '600' }}>
                                            Splash Screen Background
                                        </label>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <input 
                                                type="color" 
                                                value={splashBgColor} 
                                                onChange={e => setSplashBgColor(e.target.value)} 
                                                style={{ width: '40px', height: '40px', border: 'none', borderRadius: '6px', background: 'none', cursor: 'pointer' }}
                                            />
                                            <input 
                                                type="text" 
                                                className="glass-input" 
                                                value={splashBgColor} 
                                                onChange={e => setSplashBgColor(e.target.value)} 
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Feature Toggles */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '10px', border: '1px solid var(--border-glass)' }}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.85rem', cursor: 'pointer' }}>
                                        <input 
                                            type="checkbox" 
                                            checked={enableOffline} 
                                            onChange={e => setEnableOffline(e.target.checked)} 
                                            style={{ width: '16px', height: '16px' }}
                                        />
                                        <span><strong>Offline Video & Notes Caching</strong> (Service Worker PWA Storage)</span>
                                    </label>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.85rem', cursor: 'pointer' }}>
                                        <input 
                                            type="checkbox" 
                                            checked={enablePush} 
                                            onChange={e => setEnablePush(e.target.checked)} 
                                            style={{ width: '16px', height: '16px' }}
                                        />
                                        <span><strong>FCM Push Notification Triggers</strong> (Live Class & Exam Alerts)</span>
                                    </label>
                                </div>

                                {/* Action Buttons */}
                                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                                    <button 
                                        type="submit" 
                                        className="btn-primary" 
                                        disabled={savingMobile}
                                        style={{ padding: '10px 18px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}
                                    >
                                        <Save size={14} /> {savingMobile ? 'Saving...' : 'Save App Config'}
                                    </button>
                                    <button 
                                        type="button" 
                                        onClick={handleDownloadManifest}
                                        className="btn-secondary"
                                        style={{ padding: '10px 18px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}
                                    >
                                        <Download size={14} /> Download manifest.json
                                    </button>
                                    <button 
                                        type="button" 
                                        onClick={handleExportPackage}
                                        className="btn-secondary"
                                        style={{ padding: '10px 18px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(99, 102, 241, 0.15)', borderColor: 'var(--primary)', color: 'var(--primary)' }}
                                    >
                                        <Code size={14} /> Export Play Store Package
                                    </button>
                                </div>
                            </form>
                        </div>

                        {/* RIGHT: Live Android Phone Simulator Mockup */}
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: '600' }}>
                                LIVE PHONE SPLASH & APP PREVIEW
                            </span>
                            
                            {/* Realistic Smartphone Frame */}
                            <div style={{
                                width: '270px',
                                height: '530px',
                                background: splashBgColor,
                                borderRadius: '36px',
                                border: '10px solid #1e2029',
                                boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.7), 0 0 20px rgba(99, 102, 241, 0.15)',
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'space-between',
                                padding: '16px 20px',
                                position: 'relative',
                                overflow: 'hidden'
                            }}>
                                {/* Phone Notch / Camera Hole */}
                                <div style={{
                                    width: '80px',
                                    height: '14px',
                                    background: '#1e2029',
                                    borderRadius: '0 0 10px 10px',
                                    position: 'absolute',
                                    top: 0,
                                    left: '50%',
                                    transform: 'translateX(-50%)',
                                    zIndex: 5
                                }} />

                                {/* Android Status Bar */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: 'rgba(255,255,255,0.6)', paddingTop: '6px' }}>
                                    <span>09:41</span>
                                    <span>5G 📶 100% 🔋</span>
                                </div>

                                {/* Center Splash Content */}
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px', textAlign: 'center' }}>
                                    <div style={{
                                        width: '74px',
                                        height: '74px',
                                        borderRadius: '20px',
                                        background: appPrimaryColor,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        boxShadow: `0 10px 25px ${appPrimaryColor}55`,
                                        color: '#fff',
                                        fontWeight: '800',
                                        fontSize: '1.8rem'
                                    }}>
                                        {appName.charAt(0)}
                                    </div>
                                    <h4 style={{ color: '#fff', fontSize: '1.1rem', fontWeight: '800', margin: 0 }}>
                                        {appName}
                                    </h4>
                                    <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)', letterSpacing: '0.05em' }}>
                                        POWERED BY EDU OS
                                    </span>
                                </div>

                                {/* Bottom Nav / Gesture Bar */}
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                                    <div style={{ width: '80px', height: '4px', background: 'rgba(255,255,255,0.3)', borderRadius: '2px' }} />
                                </div>
                            </div>

                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                Package: <code style={{ color: 'var(--primary)' }}>{packageName}</code>
                            </span>
                        </div>

                    </div>
                )}

                {/* ========================================================
                    TAB 3: PAYMENT GATEWAYS & LIVE WEBHOOKS
                   ======================================================== */}
                {activeTab === 'payment' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px', maxWidth: '840px' }}>
                        
                        {/* Gateway Selector Cards */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
                            {/* Card 1: Sandbox Simulator */}
                            <div 
                                onClick={() => setActiveGateway('sandbox')}
                                className="glass-panel"
                                style={{
                                    padding: '24px',
                                    borderRadius: '16px',
                                    cursor: 'pointer',
                                    border: '2px solid',
                                    borderColor: activeGateway === 'sandbox' ? '#6366f1' : 'var(--border-glass)',
                                    background: activeGateway === 'sandbox' ? 'rgba(99, 102, 241, 0.1)' : 'rgba(15, 23, 42, 0.4)',
                                    transition: 'all 0.2s ease',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent: 'space-between'
                                }}
                            >
                                <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                        <div style={{ padding: '8px', borderRadius: '10px', background: 'rgba(99, 102, 241, 0.2)', color: '#818cf8' }}>
                                            <CreditCard size={22} />
                                        </div>
                                        {activeGateway === 'sandbox' && (
                                            <span style={{ fontSize: '0.72rem', background: '#6366f1', color: '#fff', padding: '2px 8px', borderRadius: '4px', fontWeight: '700' }}>
                                                ACTIVE
                                            </span>
                                        )}
                                    </div>
                                    <h4 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '6px' }}>Sandbox Simulator</h4>
                                    <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                                        Instant local & staging simulation. Free, zero-setup testing for students with automated GST invoicing.
                                    </p>
                                </div>
                                <div style={{ marginTop: '16px', fontSize: '0.78rem', color: '#34d399', fontWeight: '600' }}>
                                    ✓ 100% Operational (Ready)
                                </div>
                            </div>

                            {/* Card 2: Razorpay (India & UPI) */}
                            <div 
                                onClick={() => setActiveGateway('razorpay')}
                                className="glass-panel"
                                style={{
                                    padding: '24px',
                                    borderRadius: '16px',
                                    cursor: 'pointer',
                                    border: '2px solid',
                                    borderColor: activeGateway === 'razorpay' ? '#0ea5e9' : 'var(--border-glass)',
                                    background: activeGateway === 'razorpay' ? 'rgba(14, 165, 233, 0.1)' : 'rgba(15, 23, 42, 0.4)',
                                    transition: 'all 0.2s ease',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent: 'space-between'
                                }}
                            >
                                <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                        <div style={{ padding: '8px', borderRadius: '10px', background: 'rgba(14, 165, 233, 0.2)', color: '#38bdf8' }}>
                                            <Globe size={22} />
                                        </div>
                                        {activeGateway === 'razorpay' && (
                                            <span style={{ fontSize: '0.72rem', background: '#0ea5e9', color: '#fff', padding: '2px 8px', borderRadius: '4px', fontWeight: '700' }}>
                                                ACTIVE
                                            </span>
                                        )}
                                    </div>
                                    <h4 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '6px' }}>Razorpay (India & UPI)</h4>
                                    <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                                        Accept UPI (GPay, PhonePe, Paytm), NetBanking, Credit/Debit Cards, and Wallets with real-time webhooks.
                                    </p>
                                </div>
                                <div style={{ marginTop: '16px', fontSize: '0.78rem', color: '#38bdf8', fontWeight: '600' }}>
                                    🇮🇳 Primary Indian PG
                                </div>
                            </div>

                            {/* Card 3: Stripe Global */}
                            <div 
                                onClick={() => setActiveGateway('stripe')}
                                className="glass-panel"
                                style={{
                                    padding: '24px',
                                    borderRadius: '16px',
                                    cursor: 'pointer',
                                    border: '2px solid',
                                    borderColor: activeGateway === 'stripe' ? '#8b5cf6' : 'var(--border-glass)',
                                    background: activeGateway === 'stripe' ? 'rgba(139, 92, 246, 0.1)' : 'rgba(15, 23, 42, 0.4)',
                                    transition: 'all 0.2s ease',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent: 'space-between'
                                }}
                            >
                                <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                        <div style={{ padding: '8px', borderRadius: '10px', background: 'rgba(139, 92, 246, 0.2)', color: '#a78bfa' }}>
                                            <Key size={22} />
                                        </div>
                                        {activeGateway === 'stripe' && (
                                            <span style={{ fontSize: '0.72rem', background: '#8b5cf6', color: '#fff', padding: '2px 8px', borderRadius: '4px', fontWeight: '700' }}>
                                                ACTIVE
                                            </span>
                                        )}
                                    </div>
                                    <h4 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '6px' }}>Stripe (International)</h4>
                                    <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                                        Accept multi-currency payments globally across 135+ countries in USD, EUR, GBP, and INR.
                                    </p>
                                </div>
                                <div style={{ marginTop: '16px', fontSize: '0.78rem', color: '#a78bfa', fontWeight: '600' }}>
                                    🌍 International Support
                                </div>
                            </div>
                        </div>

                        {/* Gateway Configuration Form */}
                        <div className="glass-panel" style={{ padding: '32px', borderRadius: '16px' }}>
                            <form onSubmit={handleSaveGateway} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-glass)', paddingBottom: '16px' }}>
                                    <div>
                                        <h3 style={{ fontSize: '1.2rem', fontWeight: '700' }}>
                                            {activeGateway === 'sandbox' ? 'Sandbox Gateway Simulator' : activeGateway === 'razorpay' ? 'Razorpay Merchant Credentials' : 'Stripe Account Credentials'}
                                        </h3>
                                        <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                                            Configure environment API keys and webhook signatures.
                                        </span>
                                    </div>

                                    {/* Test Mode Switch */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <span style={{ fontSize: '0.82rem', color: isTestMode ? '#fbbf24' : '#10b981', fontWeight: '700' }}>
                                            {isTestMode ? 'TEST MODE' : 'LIVE PRODUCTION'}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => setIsTestMode(!isTestMode)}
                                            style={{
                                                width: '46px',
                                                height: '24px',
                                                borderRadius: '12px',
                                                background: isTestMode ? 'rgba(245, 158, 11, 0.4)' : '#10b981',
                                                border: 'none',
                                                cursor: 'pointer',
                                                position: 'relative',
                                                transition: 'all 0.2s ease'
                                            }}
                                        >
                                            <div style={{
                                                width: '18px',
                                                height: '18px',
                                                borderRadius: '50%',
                                                background: '#fff',
                                                position: 'absolute',
                                                top: '3px',
                                                left: isTestMode ? '3px' : '25px',
                                                transition: 'all 0.2s ease'
                                            }} />
                                        </button>
                                    </div>
                                </div>

                                {activeGateway === 'sandbox' && (
                                    <div style={{ padding: '16px 20px', background: 'rgba(99, 102, 241, 0.08)', borderRadius: '10px', border: '1px solid rgba(99, 102, 241, 0.2)', fontSize: '0.88rem', color: '#cbd5e1', lineHeight: '1.6' }}>
                                        <strong style={{ color: '#818cf8' }}>Sandbox Gateway is Active:</strong> Students can immediately purchase courses, bundles, and digital notes without real payments. Automated 18% GST tax calculation, coupon redemption, and instant enrollment remain 100% active.
                                    </div>
                                )}

                                {activeGateway === 'razorpay' && (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '8px', fontWeight: '600' }}>
                                                Razorpay Key ID ({isTestMode ? 'rzp_test_...' : 'rzp_live_...'})
                                            </label>
                                            <input
                                                type="text"
                                                value={razorpayKeyId}
                                                onChange={(e) => setRazorpayKeyId(e.target.value)}
                                                placeholder={isTestMode ? "rzp_test_YourKeyId" : "rzp_live_YourKeyId"}
                                                className="input-field"
                                                style={{ width: '100%', padding: '12px 14px', borderRadius: '8px' }}
                                            />
                                        </div>

                                        <div>
                                            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '8px', fontWeight: '600' }}>
                                                Razorpay Key Secret
                                            </label>
                                            <input
                                                type="password"
                                                value={razorpayKeySecret}
                                                onChange={(e) => setRazorpayKeySecret(e.target.value)}
                                                placeholder="Enter Razorpay Secret Key"
                                                className="input-field"
                                                style={{ width: '100%', padding: '12px 14px', borderRadius: '8px' }}
                                            />
                                        </div>

                                        <div>
                                            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '8px', fontWeight: '600' }}>
                                                Razorpay Webhook Secret (Optional for HMAC verification)
                                            </label>
                                            <input
                                                type="password"
                                                value={razorpayWebhookSecret}
                                                onChange={(e) => setRazorpayWebhookSecret(e.target.value)}
                                                placeholder="Enter Webhook Secret (from Razorpay Dashboard)"
                                                className="input-field"
                                                style={{ width: '100%', padding: '12px 14px', borderRadius: '8px' }}
                                            />
                                        </div>
                                    </div>
                                )}

                                {activeGateway === 'stripe' && (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '8px', fontWeight: '600' }}>
                                                Stripe Publishable Key ({isTestMode ? 'pk_test_...' : 'pk_live_...'})
                                            </label>
                                            <input
                                                type="text"
                                                value={stripePublishableKey}
                                                onChange={(e) => setStripePublishableKey(e.target.value)}
                                                placeholder={isTestMode ? "pk_test_..." : "pk_live_..."}
                                                className="input-field"
                                                style={{ width: '100%', padding: '12px 14px', borderRadius: '8px' }}
                                            />
                                        </div>

                                        <div>
                                            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '8px', fontWeight: '600' }}>
                                                Stripe Secret Key ({isTestMode ? 'sk_test_...' : 'sk_live_...'})
                                            </label>
                                            <input
                                                type="password"
                                                value={stripeSecretKey}
                                                onChange={(e) => setStripeSecretKey(e.target.value)}
                                                placeholder="sk_..."
                                                className="input-field"
                                                style={{ width: '100%', padding: '12px 14px', borderRadius: '8px' }}
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* Webhook Endpoint Box */}
                                <div style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-glass)', borderRadius: '12px', padding: '16px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                        <span style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                                            Server Webhook Listener URL
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                navigator.clipboard.writeText(webhookUrl);
                                                setCopiedWebhook(true);
                                                setTimeout(() => setCopiedWebhook(false), 2000);
                                            }}
                                            style={{
                                                background: 'none',
                                                border: 'none',
                                                color: copiedWebhook ? '#10b981' : '#38bdf8',
                                                fontSize: '0.78rem',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '4px',
                                                fontWeight: '600'
                                            }}
                                        >
                                            {copiedWebhook ? <Check size={14} /> : <Copy size={14} />}
                                            {copiedWebhook ? 'Copied URL!' : 'Copy Webhook URL'}
                                        </button>
                                    </div>
                                    <code style={{ fontSize: '0.82rem', color: '#a5b4fc', wordBreak: 'break-all' }}>
                                        {webhookUrl}
                                    </code>
                                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '8px' }}>
                                        Add this URL to your merchant dashboard to automatically unlock enrollments when students pay via UPI QR code or background banking.
                                    </p>
                                </div>

                                {/* Connection Test Result Badge */}
                                {testResult && (
                                    <div style={{
                                        padding: '12px 16px',
                                        borderRadius: '8px',
                                        fontSize: '0.85rem',
                                        background: testResult.status === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                                        border: '1px solid',
                                        borderColor: testResult.status === 'success' ? '#10b981' : '#ef4444',
                                        color: testResult.status === 'success' ? '#34d399' : '#f87171'
                                    }}>
                                        {testResult.status === 'success' ? '✓ ' : '✕ '} {testResult.message}
                                    </div>
                                )}

                                {/* Action Buttons */}
                                <div style={{ display: 'flex', gap: '14px', alignItems: 'center', marginTop: '10px' }}>
                                    <button
                                        type="submit"
                                        className="btn-primary"
                                        disabled={savingGateway}
                                        style={{
                                            padding: '12px 24px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px',
                                            fontWeight: '700'
                                        }}
                                    >
                                        <Save size={16} />
                                        {savingGateway ? 'Saving Settings...' : 'Save Payment Configuration'}
                                    </button>

                                    <button
                                        type="button"
                                        onClick={handleTestConnection}
                                        disabled={testingConnection}
                                        className="btn-secondary"
                                        style={{
                                            padding: '12px 20px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px'
                                        }}
                                    >
                                        <RefreshCw size={15} className={testingConnection ? 'animate-spin' : ''} />
                                        {testingConnection ? 'Verifying...' : 'Test Gateway Connection'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Google Play Package Modal */}
                {exportModalOpen && exportData && (
                    <ModalPortal onClose={() => setExportModalOpen(false)}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '620px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <h3 style={{ fontSize: '1.25rem', fontWeight: '700' }}>Google Play Store Build Manifest</h3>
                                <button onClick={() => setExportModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.2rem' }}>✕</button>
                            </div>

                            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-glass)', borderRadius: '10px', padding: '14px', fontSize: '0.82rem', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ color: 'var(--text-muted)' }}>Application Name:</span>
                                    <strong>{exportData.packageDetails.appName}</strong>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ color: 'var(--text-muted)' }}>Package ID:</span>
                                    <strong style={{ color: 'var(--primary)' }}>{exportData.packageDetails.packageName}</strong>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ color: 'var(--text-muted)' }}>Version:</span>
                                    <strong>{exportData.packageDetails.version}</strong>
                                </div>
                            </div>

                            <div>
                                <h4 style={{ fontSize: '0.9rem', fontWeight: '700', marginBottom: '8px' }}>AndroidManifest.xml</h4>
                                <pre style={{ background: '#0a0b10', padding: '14px', borderRadius: '8px', fontSize: '0.72rem', color: '#a7f3d0', overflowX: 'auto', border: '1px solid var(--border-glass)' }}>
                                    {exportData.files['AndroidManifest.xml']}
                                </pre>
                            </div>

                            <div>
                                <h4 style={{ fontSize: '0.9rem', fontWeight: '700', marginBottom: '8px' }}>Google Play Store Compliance Checklist</h4>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.8rem' }}>
                                    {exportData.storeChecklist.map((item: string, i: number) => (
                                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)' }}>
                                            <CheckCircle size={14} style={{ color: '#10b981' }} />
                                            <span>{item}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </ModalPortal>
                )}

            </div>
        </SidebarLayout>
    );
}
