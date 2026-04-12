'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

interface ZenContextType {
    isZenMode: boolean;
    toggleZenMode: () => void;
}

const ZenContext = createContext<ZenContextType | undefined>(undefined);

const STORAGE_KEY = 'calma-zen-mode';

export function ZenProvider({ children }: { children: React.ReactNode }) {
    const [isZenMode, setIsZenMode] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            setIsZenMode(JSON.parse(stored));
        }
        setMounted(true);
    }, []);

    const toggleZenMode = () => {
        setIsZenMode((prev) => {
            const next = !prev;
            localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
            return next;
        });
    };

    // Avoid hydration mismatch by rendering children without context logic until mounted?
    // Or just accept that initial server render assumes false. 
    // For Zen Mode, it's better to default to false (show numbers) or wait for mount to avoid flash of numbers if true.
    // Actually, standard practice for localStorage preferences is to wait for mount or suppress mismatch warning.

    return (
        <ZenContext.Provider value={{ isZenMode, toggleZenMode }}>
            {children}
        </ZenContext.Provider>
    );
}

export function useZenMode() {
    const context = useContext(ZenContext);
    if (context === undefined) {
        throw new Error('useZenMode must be used within a ZenProvider');
    }
    return context;
}
