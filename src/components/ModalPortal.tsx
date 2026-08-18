'use client';

import { useEffect, useState, ReactNode } from 'react';
import { createPortal } from 'react-dom';

interface ModalPortalProps {
    children: ReactNode;
    onClose?: () => void;
}

/**
 * ModalPortal - Renders modal content directly on document.body
 * so it escapes all overflow/stacking constraints from the sidebar layout.
 */
export default function ModalPortal({ children, onClose }: ModalPortalProps) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        // Prevent background scroll when modal is open
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = '';
        };
    }, []);

    if (!mounted) return null;

    return createPortal(
        <div
            onClick={(e) => {
                // Close on backdrop click
                if (e.target === e.currentTarget && onClose) onClose();
            }}
            style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(0, 0, 0, 0.78)',
                backdropFilter: 'blur(6px)',
                WebkitBackdropFilter: 'blur(6px)',
                zIndex: 99999,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflowY: 'auto',
                padding: '24px 16px',
            }}
        >
            <div
                style={{
                    background: '#13141f',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '18px',
                    padding: '32px',
                    width: '100%',
                    maxWidth: '520px',
                    margin: 'auto',
                    boxShadow: '0 24px 64px rgba(0,0,0,0.7)',
                    position: 'relative',
                }}
            >
                {children}
            </div>
        </div>,
        document.body
    );
}
