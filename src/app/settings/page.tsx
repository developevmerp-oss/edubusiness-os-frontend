'use client';

import { useState, useEffect } from 'react';
import SidebarLayout from '../../components/SidebarLayout';
import ModalPortal from '../../components/ModalPortal';
import { apiRequest } from '../../utils/api';
import { 
    Settings, ShieldCheck, Paintbrush, Save, Smartphone, 
    Download, CheckCircle, Code, Layers, Sparkles, ExternalLink
} from 'lucide-react';

export default function SettingsBrandingPage() {
    const [activeTab, setActiveTab] = useState<'branding' | 'mobile'>('branding');
    const [userRole, setUserRole] = useState('');
    const [tenant, setTenant] = useState<any>(null);
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [accentColor, setAccentColor] = useState('#6366f1');
    const [logoUrl, setLogoUrl] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [successMsg, setSuccessMsg] = useState('');

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
    }, []);

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
