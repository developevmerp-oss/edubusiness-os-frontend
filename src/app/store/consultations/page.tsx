'use client';

import { useState, useEffect } from 'react';
import SidebarLayout from '../../../components/SidebarLayout';
import { apiRequest } from '../../../utils/api';
import { Calendar, Video, Clock, DollarSign, Plus, Loader, CheckCircle } from 'lucide-react';

export default function ConsultationsStorePage() {
    const [consultations, setConsultations] = useState<any[]>([]);
    const [bookings, setBookings] = useState<any[]>([]);
    const [userRole, setUserRole] = useState('');
    const [loading, setLoading] = useState(true);
    const [bookingSessionId, setBookingSessionId] = useState<string | null>(null);
    const [selectedSlot, setSelectedSlot] = useState<string>('');

    // Teacher slot creation state
    const [isCreating, setIsCreating] = useState(false);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [price, setPrice] = useState('');
    
    // Dynamic slots list picker state
    const [slotsList, setSlotsList] = useState<string[]>([]);
    const [currentSlotPicker, setCurrentSlotPicker] = useState('');

    const handleAddSlot = () => {
        if (!currentSlotPicker) return;
        if (slotsList.includes(currentSlotPicker)) {
            alert('This time slot is already added.');
            return;
        }
        setSlotsList([...slotsList, currentSlotPicker]);
        setCurrentSlotPicker('');
    };

    const handleRemoveSlot = (index: number) => {
        setSlotsList(slotsList.filter((_, i) => i !== index));
    };

    useEffect(() => {
        const storedUser = localStorage.getItem('user_profile');
        if (storedUser) {
            setUserRole(JSON.parse(storedUser).role);
        }
        fetchConsultationsAndBookings();
    }, []);

    const fetchConsultationsAndBookings = async () => {
        setLoading(true);
        try {
            const consRes = await apiRequest('/api/consultations');
            setConsultations(consRes.consultations);

            const bookingsRes = await apiRequest('/api/consultations/bookings');
            setBookings(bookingsRes.bookings);
        } catch (err) {
            console.error('Failed to load consultations booking data:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = async (id: string, newStatus: string) => {
        try {
            await apiRequest(`/api/consultations/bookings/${id}/status`, {
                method: 'PATCH',
                body: JSON.stringify({ status: newStatus })
            });
            fetchConsultationsAndBookings();
            alert(`Appointment status updated to: ${newStatus.toUpperCase()}`);
        } catch (err: any) {
            alert(err.message || 'Failed to update status.');
        }
    };

    const handleCancelBooking = async (id: string) => {
        if (!confirm('Are you sure you want to cancel this mentorship session?')) return;
        try {
            await apiRequest(`/api/consultations/bookings/${id}`, { method: 'DELETE' });
            fetchConsultationsAndBookings();
            alert('Mentorship appointment cancelled.');
        } catch (err: any) {
            alert(err.message || 'Failed to cancel booking.');
        }
    };

    const handleCreateSession = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (slotsList.length === 0) {
                alert('Please add at least one available slot.');
                return;
            }
            const slotsArray = slotsList.map(s => new Date(s).toISOString());
            await apiRequest('/api/consultations', {
                method: 'POST',
                body: JSON.stringify({
                    title,
                    description,
                    price: parseFloat(price),
                    slots: slotsArray
                })
            });
            setTitle('');
            setDescription('');
            setPrice('');
            setSlotsList([]);
            setIsCreating(false);
            fetchConsultationsAndBookings();
            alert('Consultation mentorship session created successfully!');
        } catch (err: any) {
            alert(err.message || 'Failed to list session slots.');
        }
    };

    const handleBookSlot = async (id: string) => {
        if (!selectedSlot) {
            alert('Please select an available slot time.');
            return;
        }

        try {
            await apiRequest(`/api/consultations/${id}/book`, {
                method: 'POST',
                body: JSON.stringify({ slot: selectedSlot })
            });
            setSelectedSlot('');
            setBookingSessionId(null);
            fetchConsultationsAndBookings();
            alert('Mentorship slot booked successfully! Invoices generated in your receipts ledger.');
        } catch (err: any) {
            alert(err.message || 'Failed to book slot.');
        }
    };

    if (loading) {
        return (
            <SidebarLayout>
                <div style={{ color: 'var(--text-secondary)' }}>Loading consultations calendar...</div>
            </SidebarLayout>
        );
    }

    return (
        <SidebarLayout>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '30px' }}>
                
                {/* 1. LEFT COLUMN - Available slots catalogue */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    
                    {/* Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <h1 className="brand-gradient" style={{ fontSize: '2.2rem', fontWeight: '800' }}>
                                Mentorship & Consultations
                            </h1>
                            <p style={{ color: 'var(--text-secondary)' }}>
                                Book paid 1-on-1 coaching sessions and specialized problem-solving workshops.
                            </p>
                        </div>
                        
                        {(userRole === 'admin' || userRole === 'teacher') && (
                            <button onClick={() => setIsCreating(true)} className="btn-primary" style={{ padding: '10px 18px', fontSize: '0.85rem' }}>
                                <Plus size={16} /> Schedule Session
                            </button>
                        )}
                    </div>

                    {/* Catalog */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        {consultations.length === 0 ? (
                            <div className="glass-panel" style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
                                <Calendar size={48} style={{ opacity: 0.2, marginBottom: '12px' }} />
                                <p>No mentorship or consultations sessions scheduled.</p>
                            </div>
                        ) : (
                            consultations.map(session => (
                                <div key={session.id} className="glass-panel" style={{ padding: '24px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <div>
                                            <h3 style={{ fontSize: '1.25rem', fontWeight: '700' }}>{session.title}</h3>
                                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Mentor: {session.teacher_first_name} {session.teacher_last_name}</span>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <span style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--primary)' }}>₹{parseFloat(session.price).toLocaleString()}</span>
                                            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>+ 18% GST</span>
                                        </div>
                                    </div>

                                    <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: '1.6' }}>{session.description}</p>

                                    {/* Booking Slot Selection Interface for Student */}
                                    {userRole === 'student' && (
                                        <div style={{ borderTop: '1px solid var(--border-glass)', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                            <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: '600' }}>Available Slot Times:</span>
                                            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                                                {session.slots.map((s: string) => {
                                                    const formatted = new Date(s).toLocaleString();
                                                    const isSelected = selectedSlot === s && bookingSessionId === session.id;
                                                    return (
                                                        <button 
                                                            key={s} 
                                                            onClick={() => { setSelectedSlot(s); setBookingSessionId(session.id); }}
                                                            className={isSelected ? "btn-primary" : "btn-secondary"}
                                                            style={{ padding: '6px 12px', fontSize: '0.78rem' }}
                                                        >
                                                            {formatted}
                                                        </button>
                                                    );
                                                })}
                                            </div>

                                            {bookingSessionId === session.id && selectedSlot && (
                                                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
                                                    <button onClick={() => handleBookSlot(session.id)} className="btn-primary" style={{ padding: '8px 16px', fontSize: '0.82rem' }}>
                                                        Book Selected Slot
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                </div>
                            ))
                        )}
                    </div>

                </div>

                {/* 2. RIGHT COLUMN - Scheduled Appointments */}
                <div>
                    <div className="glass-panel" style={{ padding: '24px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <h3 style={{ fontSize: '1.05rem', fontWeight: '700' }}>Mentorship Appointments</h3>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {bookings.length === 0 ? (
                                <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>No booked slots.</span>
                            ) : (
                                bookings.map(b => (
                                    <div key={b.id} style={{
                                        background: 'rgba(255,255,255,0.01)',
                                        border: '1px solid var(--border-glass)',
                                        borderRadius: '8px',
                                        padding: '12px',
                                        fontSize: '0.82rem'
                                    }}>
                                        <div style={{ fontWeight: '600', marginBottom: '4px' }}>{b.title}</div>
                                        <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>
                                            Time: {new Date(b.booked_slot).toLocaleString()}
                                        </span>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
                                            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                                                {userRole === 'student' ? `Mentor: ${b.teacher_first_name} ${b.teacher_last_name}` : `Student: ${b.student_first_name} ${b.student_last_name}`}
                                            </span>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <span style={{
                                                    fontSize: '0.72rem',
                                                    padding: '2px 6px',
                                                    borderRadius: '4px',
                                                    background: b.status === 'completed' ? 'rgba(16,185,129,0.15)' : b.status === 'cancelled' ? 'rgba(239,68,68,0.12)' : 'rgba(99,102,241,0.12)',
                                                    color: b.status === 'completed' ? 'var(--success)' : b.status === 'cancelled' ? '#f87171' : 'var(--primary)',
                                                    fontWeight: '600'
                                                }}>{b.status.toUpperCase()}</span>

                                                {/* Teacher/Admin: status change dropdown */}
                                                {(userRole === 'admin' || userRole === 'teacher') && b.status !== 'cancelled' && (
                                                    <select
                                                        value={b.status}
                                                        onChange={(e) => handleStatusChange(b.id, e.target.value)}
                                                        style={{
                                                            fontSize: '0.72rem',
                                                            padding: '3px 6px',
                                                            borderRadius: '5px',
                                                            background: 'rgba(255,255,255,0.05)',
                                                            color: 'var(--text-primary)',
                                                            border: '1px solid var(--border-glass)',
                                                            cursor: 'pointer'
                                                        }}
                                                    >
                                                        <option value="booked">Booked</option>
                                                        <option value="completed">Mark Completed</option>
                                                        <option value="cancelled">Cancel</option>
                                                    </select>
                                                )}

                                                {/* Student: Cancel button */}
                                                {userRole === 'student' && b.status === 'booked' && (
                                                    <button
                                                        onClick={() => handleCancelBooking(b.id)}
                                                        style={{
                                                            fontSize: '0.72rem',
                                                            padding: '3px 8px',
                                                            borderRadius: '5px',
                                                            background: 'rgba(239,68,68,0.12)',
                                                            color: '#f87171',
                                                            border: '1px solid rgba(239,68,68,0.2)',
                                                            cursor: 'pointer'
                                                        }}
                                                    >
                                                        Cancel
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

            </div>

            {/* Create Slots Modal */}
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
                        <h3>Schedule Mentorship Session</h3>
                        <form onSubmit={handleCreateSession} style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Session Title</label>
                                <input 
                                    type="text" 
                                    className="glass-input" 
                                    placeholder="e.g. 1-on-1 Physics Mentorship" 
                                    required 
                                    value={title} 
                                    onChange={(e) => setTitle(e.target.value)} 
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Description</label>
                                <textarea 
                                    className="glass-input" 
                                    rows={3}
                                    placeholder="Provide session agenda details..." 
                                    required 
                                    value={description} 
                                    onChange={(e) => setDescription(e.target.value)} 
                                    style={{ fontFamily: 'inherit', resize: 'vertical' }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Price (INR)</label>
                                <input 
                                    type="number" 
                                    className="glass-input" 
                                    required 
                                    value={price} 
                                    onChange={(e) => setPrice(e.target.value)} 
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Add Available Slots</label>
                                <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                                    <input 
                                        type="datetime-local" 
                                        className="glass-input" 
                                        value={currentSlotPicker} 
                                        onChange={(e) => setCurrentSlotPicker(e.target.value)} 
                                        style={{ flex: 1 }}
                                    />
                                    <button 
                                        type="button" 
                                        className="btn-secondary" 
                                        onClick={handleAddSlot} 
                                        style={{ padding: '8px 16px', fontSize: '0.82rem' }}
                                    >
                                        Add
                                    </button>
                                </div>

                                {slotsList.length > 0 && (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '120px', overflowY: 'auto', background: 'rgba(255,255,255,0.02)', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-glass)' }}>
                                        {slotsList.map((slot, idx) => (
                                            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem' }}>
                                                <span style={{ color: 'var(--text-secondary)' }}>{new Date(slot).toLocaleString()}</span>
                                                <button 
                                                    type="button" 
                                                    onClick={() => handleRemoveSlot(idx)} 
                                                    style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', fontSize: '0.72rem' }}
                                                >
                                                    Remove
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
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
