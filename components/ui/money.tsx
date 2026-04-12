'use client';

import { useZenMode } from '@/components/providers/zen-provider';
import { formatMoney } from '@/lib/services/moneyService';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';

interface MoneyProps {
    amount: number;
    currency?: string;
    className?: string;
    alwaysShow?: boolean; // Override to always show (e.g. inputs)
}

export function Money({ amount, currency = 'EUR', className, alwaysShow = false }: MoneyProps) {
    const { isZenMode } = useZenMode();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        // Render a stable placeholder or the actual value to avoid hydration mismatch.
        // Since isZenMode defaults to false on server/initial client, we render the value.
        // If user has Zen Mode ON in localStorage, it will blur after mount.
        return <span className={className}>{formatMoney(amount, currency)}</span>;
    }

    const shouldBlur = isZenMode && !alwaysShow;

    return (
        <span
            className={cn(
                "font-mono tracking-tight transition-all duration-300",
                shouldBlur ? "filter blur-sm select-none opacity-60" : "",
                className
            )}
            aria-hidden={shouldBlur}
            title={shouldBlur ? 'Modo Zen activo' : undefined}
        >
            {shouldBlur ? '****' : formatMoney(amount, currency)}
        </span>
    );
}
