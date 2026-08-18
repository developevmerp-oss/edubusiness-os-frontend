'use client';

import { useState, useEffect } from 'react';
import SidebarLayout from '../../components/SidebarLayout';
import { apiRequest } from '../../utils/api';
import { Settings, ShieldCheck, Paintbrush, Save } from 'lucide-react';

export default function SettingsBrandingPage() {
    const [userRole, setUserRole] = useState('');
    const [tenant, setTenant] = useState<any>(null);
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [accentColor, setAccentColor] = useState('#6366f1');
    const [logoUrl, setLogoUrl] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

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
        setLoading(false);
    }, []);

    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);

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
            alert('Academy logo image uploaded successfully!');
            window.location.reload();
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

            // Update localStorage tenant info so header updates instantly
            localStorage.setItem('tenant_info', JSON.stringify(data.tenant));
            alert('Institute customizations saved successfully! Refreshing layout...');
            
            // Reload page to apply changes everywhere
            window.location.reload();
        } catch (err: any) {
            alert(err.message || 'Failed to update configurations.');
        } finally {
            setSaving(false);
        }
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
            <div style={{ display: 'flex', flexDirection: 'column', gap: '30px', maxWidth: '640px' }}>
                {/* Header */}
                <div>
                    <h1 className="brand-gradient" style={{ fontSize: '2.2rem', fontWeight: '800' }}>
                        White-Label settings
                    </h1>
                    <p style={{ color: 'var(--text-secondary)' }}>
                        Customize your academy brand name, descriptions, and dashboard theme colors.
                    </p>
                </div>

                {/* Edit Form */}
                <div className="glass-panel" style={{ padding: '30px', borderRadius: '16px' }}>
                    <form onSubmit={handleSaveBranding} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        
                        <div>
                            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>Institute Name</label>
                            <input 
                                type="text" 
                                className="glass-input" 
                                placeholder="e.g. ABC Academy" 
                                required
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>Description / Slogan</label>
                            <textarea 
                                className="glass-input" 
                                rows={3}
                                placeholder="Provide a brief slogan..."
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                style={{ fontFamily: 'inherit', resize: 'vertical' }}
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>Academy Logo Image</label>
                            
                            {logoUrl && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px', background: 'rgba(255,255,255,0.02)', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-glass)' }}>
                                    <img src={logoUrl} alt="Logo Preview" style={{ maxHeight: '46px', objectFit: 'contain' }} />
                                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Current Logo Uploaded</span>
                                </div>
                            )}

                            <div style={{ display: 'flex', gap: '10px' }}>
                                <input 
                                    type="file" 
                                    accept="image/*"
                                    className="glass-input" 
                                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                                    style={{ flex: 1, padding: '8px' }}
                                />
                                {selectedFile && (
                                    <button 
                                        type="button" 
                                        onClick={handleLogoUpload}
                                        className="btn-primary" 
                                        style={{ padding: '8px 16px', fontSize: '0.82rem' }}
                                        disabled={uploading}
                                    >
                                        {uploading ? 'Uploading...' : 'Upload File'}
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Theme Accent Picker */}
                        <div style={{ borderTop: '1px solid var(--border-glass)', paddingTop: '20px' }}>
                            <h4 style={{ fontSize: '0.98rem', fontWeight: '700', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Paintbrush size={16} style={{ color: 'var(--primary)' }} /> Visual Styling Theme
                            </h4>
                            <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>Primary Accent Color (Hex)</label>
                                    <input 
                                        type="text" 
                                        className="glass-input" 
                                        pattern="^\s*#[0-9a-fA-F]{6}\s*$"
                                        placeholder="e.g. #6366f1"
                                        required
                                        value={accentColor}
                                        onChange={(e) => setAccentColor(e.target.value.trim())}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>Preview Color</label>
                                    <div style={{
                                        width: '46px',
                                        height: '46px',
                                        borderRadius: '8px',
                                        border: '2px solid var(--border-glass)',
                                        background: accentColor,
                                        transition: 'background 0.2s ease'
                                    }} />
                                </div>
                            </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--border-glass)', paddingTop: '20px', marginTop: '10px' }}>
                            <button type="submit" className="btn-primary" style={{ padding: '12px 24px', display: 'flex', alignItems: 'center', gap: '8px' }} disabled={saving}>
                                <Save size={16} /> {saving ? 'Saving...' : 'Save Configuration'}
                            </button>
                        </div>

                    </form>
                </div>
            </div>
        </SidebarLayout>
    );
}
