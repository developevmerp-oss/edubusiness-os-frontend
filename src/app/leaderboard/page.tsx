'use client';

import { useState, useEffect } from 'react';
import SidebarLayout from '../../components/SidebarLayout';
import { apiRequest } from '../../utils/api';
import { Trophy, CalendarCheck, Award, Zap, ChevronRight, HelpCircle } from 'lucide-react';

export default function LeaderboardPage() {
    const [leaderboard, setLeaderboard] = useState<any[]>([]);
    const [profile, setProfile] = useState<any>(null);
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [userRole, setUserRole] = useState('');
    const [isClaiming, setIsClaiming] = useState(false);

    useEffect(() => {
        const storedUser = localStorage.getItem('user_profile');
        if (storedUser) {
            setUserRole(JSON.parse(storedUser).role);
        }
        fetchLeaderboardAndProfile();
    }, []);

    const fetchLeaderboardAndProfile = async () => {
        setLoading(true);
        setError('');
        try {
            const lbData = await apiRequest('/api/gamification/leaderboard');
            setLeaderboard(lbData.leaderboard);

            const storedUser = localStorage.getItem('user_profile');
            const role = storedUser ? JSON.parse(storedUser).role : '';

            // Only students have a gamification profile with XP calculations
            if (role === 'student') {
                const profData = await apiRequest('/api/gamification/profile');
                setProfile(profData.profile);
                setLogs(profData.logs);
            }
        } catch (err: any) {
            setError(err.message || 'Failed to load gamification rankings.');
        } finally {
            setLoading(false);
        }
    };

    const handleClaimDaily = async () => {
        setIsClaiming(true);
        try {
            await apiRequest('/api/gamification/claim-login', { method: 'POST' });
            alert('Daily check-in successful! You earned +2 XP points.');
            fetchLeaderboardAndProfile();
        } catch (err: any) {
            alert(err.message || 'Daily check-in already claimed.');
        } finally {
            setIsClaiming(false);
        }
    };

    const formatActionType = (action: string) => {
        switch (action) {
            case 'attend_class': return 'Attended Live Lecture';
            case 'pass_test': return 'Submitted Timed Exam';
            case 'post_question': return 'Published Community Post';
            case 'daily_login': return 'Daily Check-in Reward';
            default: return action;
        }
    };

    if (loading) {
        return (
            <SidebarLayout>
                <div style={{ color: 'var(--text-secondary)' }}>Loading leaderboard and rewards...</div>
            </SidebarLayout>
        );
    }

    // Top 3 Podium
    const podiumGold = leaderboard[0] || null;
    const podiumSilver = leaderboard[1] || null;
    const podiumBronze = leaderboard[2] || null;

    // Remaining rankings list
    const runnerUps = leaderboard.slice(3);

    return (
        <SidebarLayout>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                {/* Header */}
                <div>
                    <h1 className="brand-gradient" style={{ fontSize: '2.2rem', fontWeight: '800' }}>
                        Academy Leaderboard
                    </h1>
                    <p style={{ color: 'var(--text-secondary)' }}>
                        Earn Experience Points (XP) for class attendance, exams, and community support.
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

                {/* 1. STUDENT PROFILE XP PROGRESS BOARD */}
                {userRole === 'student' && profile && (
                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
                        {/* Profile metrics */}
                        <div className="glass-panel" style={{
                            padding: '30px',
                            borderRadius: '16px',
                            background: 'linear-gradient(135deg, rgba(var(--primary-rgb), 0.05) 0%, rgba(var(--secondary-rgb), 0.03) 100%)',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            gap: '20px'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div>
                                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Academic Level</span>
                                    <h2 style={{ fontSize: '1.75rem', fontWeight: '800', marginTop: '4px' }}>{profile.level}</h2>
                                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Total Experience Points: <strong>{profile.totalXp} XP</strong></span>
                                </div>
                                <button 
                                    onClick={handleClaimDaily} 
                                    className="btn-primary" 
                                    disabled={profile.isDailyClaimed || isClaiming}
                                    style={{
                                        padding: '10px 18px',
                                        fontSize: '0.85rem',
                                        background: profile.isDailyClaimed ? 'rgba(255,255,255,0.03)' : undefined,
                                        borderColor: profile.isDailyClaimed ? 'var(--border-glass)' : undefined,
                                        color: profile.isDailyClaimed ? 'var(--text-muted)' : undefined,
                                        cursor: profile.isDailyClaimed ? 'default' : 'pointer'
                                    }}
                                >
                                    <CalendarCheck size={16} />
                                    {profile.isDailyClaimed ? 'Claimed Today' : 'Daily Check-in (+2 XP)'}
                                </button>
                            </div>

                            {/* Progress bar to next level */}
                            {profile.xpToNextLevel > 0 ? (
                                <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                                        <span>Progress to next tier</span>
                                        <span>{profile.xpToNextLevel} XP remaining</span>
                                    </div>
                                    <div style={{ height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden', border: '1px solid var(--border-glass)' }}>
                                        <div style={{
                                            width: `${Math.min(100, (profile.totalXp / profile.nextLevelThreshold) * 100)}%`,
                                            height: '100%',
                                            background: 'linear-gradient(90deg, var(--primary) 0%, var(--secondary) 100%)'
                                        }} />
                                    </div>
                                </div>
                            ) : (
                                <div style={{ fontSize: '0.82rem', color: 'var(--success)' }}>✓ Maximum Level Tier Reached!</div>
                            )}
                        </div>

                        {/* Recent Points log */}
                        <div className="glass-panel" style={{ padding: '24px', borderRadius: '16px' }}>
                            <h3 style={{ fontSize: '0.98rem', fontWeight: '700', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Zap size={16} style={{ color: 'var(--primary)' }} /> Recent XP Logs
                            </h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {logs.length === 0 ? (
                                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>No reward points earned yet.</span>
                                ) : (
                                    logs.map((log, idx) => (
                                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem' }}>
                                            <span style={{ color: 'var(--text-secondary)' }}>{formatActionType(log.action_type)}</span>
                                            <strong style={{ color: 'var(--success)' }}>+{log.points} XP</strong>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* 2. PODIUM AREA (Top 3 grid) */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '20px' }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Trophy size={18} style={{ color: 'var(--warning)' }} /> Top Performers
                    </h2>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px', alignItems: 'flex-end', padding: '20px 0' }}>
                        
                        {/* 2. Silver Medal Podium */}
                        {podiumSilver ? (
                            <div className="glass-panel" style={{ padding: '20px', borderRadius: '12px', textAlign: 'center', minHeight: '140px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', borderTop: '4px solid #94a3b8' }}>
                                <div>
                                    <span style={{ fontSize: '1.8rem' }}>🥈</span>
                                    <h4 style={{ fontSize: '0.95rem', fontWeight: '700', margin: '8px 0 2px 0' }}>{podiumSilver.first_name} {podiumSilver.last_name}</h4>
                                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{podiumSilver.level}</span>
                                </div>
                                <span style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--text-primary)' }}>{podiumSilver.total_xp} XP</span>
                            </div>
                        ) : <div />}

                        {/* 1. Gold Medal Podium */}
                        {podiumGold ? (
                            <div className="glass-panel" style={{ padding: '30px 20px', borderRadius: '16px', textAlign: 'center', minHeight: '180px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', borderTop: '4px solid #fbbf24', background: 'linear-gradient(180deg, rgba(251, 191, 36, 0.05) 0%, rgba(255,255,255,0.01) 100%)' }}>
                                <div>
                                    <span style={{ fontSize: '2.5rem' }}>👑</span>
                                    <h3 style={{ fontSize: '1.15rem', fontWeight: '800', margin: '8px 0 2px 0' }}>{podiumGold.first_name} {podiumGold.last_name}</h3>
                                    <span style={{ fontSize: '0.72rem', color: 'var(--warning)', fontWeight: '700', textTransform: 'uppercase' }}>{podiumGold.level}</span>
                                </div>
                                <span style={{ fontSize: '1.4rem', fontWeight: '900', color: '#fbbf24' }}>{podiumGold.total_xp} XP</span>
                            </div>
                        ) : <div />}

                        {/* 3. Bronze Medal Podium */}
                        {podiumBronze ? (
                            <div className="glass-panel" style={{ padding: '16px', borderRadius: '12px', textAlign: 'center', minHeight: '120px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', borderTop: '4px solid #b45309' }}>
                                <div>
                                    <span style={{ fontSize: '1.5rem' }}>🥉</span>
                                    <h4 style={{ fontSize: '0.9rem', fontWeight: '700', margin: '8px 0 2px 0' }}>{podiumBronze.first_name} {podiumBronze.last_name}</h4>
                                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{podiumBronze.level}</span>
                                </div>
                                <span style={{ fontSize: '1rem', fontWeight: '800', color: 'var(--text-primary)' }}>{podiumBronze.total_xp} XP</span>
                            </div>
                        ) : <div />}

                    </div>
                </div>

                {/* 3. LEADERBOARD LIST TABLE */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: '700' }}>Overall Rankings</h3>
                    
                    {leaderboard.length === 0 ? (
                        <span style={{ color: 'var(--text-muted)' }}>No students enrolled.</span>
                    ) : (
                        <div className="glass-panel" style={{ padding: '0', overflow: 'hidden' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                                <thead>
                                    <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--border-glass)' }}>
                                        <th style={{ padding: '16px 24px', color: 'var(--text-muted)', fontWeight: '600', width: '80px' }}>Rank</th>
                                        <th style={{ padding: '16px 24px', color: 'var(--text-muted)', fontWeight: '600' }}>Student Name</th>
                                        <th style={{ padding: '16px 24px', color: 'var(--text-muted)', fontWeight: '600' }}>Email Address</th>
                                        <th style={{ padding: '16px 24px', color: 'var(--text-muted)', fontWeight: '600' }}>Level Status</th>
                                        <th style={{ padding: '16px 24px', color: 'var(--text-muted)', fontWeight: '600', textAlign: 'right' }}>Experience Points</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {leaderboard.map((student, index) => (
                                        <tr key={student.id} style={{ borderBottom: '1px solid var(--border-glass)' }}>
                                            <td style={{ padding: '16px 24px', fontWeight: '700', color: index < 3 ? 'var(--primary)' : 'var(--text-muted)' }}>
                                                #{index + 1}
                                            </td>
                                            <td style={{ padding: '16px 24px', fontWeight: '600', color: 'var(--text-primary)' }}>
                                                {student.first_name} {student.last_name}
                                            </td>
                                            <td style={{ padding: '16px 24px', color: 'var(--text-secondary)' }}>{student.email}</td>
                                            <td style={{ padding: '16px 24px', color: 'var(--text-secondary)' }}>{student.level}</td>
                                            <td style={{ padding: '16px 24px', fontWeight: '800', color: 'var(--text-primary)', textAlign: 'right' }}>
                                                {student.total_xp} XP
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

            </div>
        </SidebarLayout>
    );
}
