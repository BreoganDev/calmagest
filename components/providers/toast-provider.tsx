'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { X, CheckCircle, AlertTriangle, Info } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
    id: string;
    type: ToastType;
    message: string;
    duration?: number;
}

interface ToastContextType {
    toast: (payload: Omit<Toast, 'id'>) => void;
    success: (message: string) => void;
    error: (message: string) => void;
    info: (message: string) => void;
    warning: (message: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const addToast = useCallback((payload: Omit<Toast, 'id'>) => {
        const id = Math.random().toString(36).substring(2, 9);
        const toast = { ...payload, id };

        setToasts((prev) => [...prev, toast]);

        const duration = payload.duration ?? 4000;
        if (duration > 0) {
            setTimeout(() => {
                removeToast(id);
            }, duration);
        }
    }, []);

    const removeToast = useCallback((id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    const contextValue: ToastContextType = {
        toast: addToast,
        success: (message) => addToast({ type: 'success', message }),
        error: (message) => addToast({ type: 'error', message }),
        info: (message) => addToast({ type: 'info', message }),
        warning: (message) => addToast({ type: 'warning', message }),
    };

    return (
        <ToastContext.Provider value={contextValue}>
            {children}
            <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
                {toasts.map((t) => (
                    <div
                        key={t.id}
                        className={`
              pointer-events-auto flex items-center gap-3 min-w-[300px] max-w-sm rounded-xl p-4 shadow-lg transition-all duration-300 animate-in slide-in-from-right-full
              ${t.type === 'success' ? 'bg-[#EAF4F1] border border-[#CFE7E1] text-[#2F7C66]' : ''}
              ${t.type === 'error' ? 'bg-[#F7E7E0] border border-[#EFCFC3] text-[#B16A59]' : ''}
              ${t.type === 'warning' ? 'bg-[#FEFCE8] border border-[#FEF9C3] text-[#854D0E]' : ''}
              ${t.type === 'info' ? 'bg-white border border-border text-foreground' : ''}
            `}
                    >
                        {t.type === 'success' && <CheckCircle className="h-5 w-5 shrink-0" />}
                        {t.type === 'error' && <AlertTriangle className="h-5 w-5 shrink-0" />}
                        {t.type === 'warning' && <AlertTriangle className="h-5 w-5 shrink-0" />}
                        {t.type === 'info' && <Info className="h-5 w-5 shrink-0 text-muted-foreground" />}

                        <p className="text-sm font-medium flex-1">{t.message}</p>

                        <button
                            onClick={() => removeToast(t.id)}
                            className="shrink-0 opacity-50 hover:opacity-100"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
}

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};
