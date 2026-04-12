'use client';

import { Sparkles, ArrowRight, Lightbulb, TrendingUp, AlertTriangle, Info } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface CoachInsightCardProps {
    insight: string;
    type: 'success' | 'warning' | 'info';
}

export function CoachInsightCard({ insight, type }: CoachInsightCardProps) {
    const getGradient = () => {
        switch (type) {
            case 'success':
                return 'from-rd-calm-green/10 via-rd-calm-green/5 to-rd-calm-green/0';
            case 'warning':
                return 'from-rd-rose/10 via-rd-rose/5 to-rd-rose/0';
            case 'info':
                return 'from-rd-secondary/10 via-rd-secondary/5 to-rd-secondary/0';
        }
    };

    const getIconBg = () => {
        switch (type) {
            case 'success':
                return 'bg-rd-calm-green';
            case 'warning':
                return 'bg-rd-rose';
            case 'info':
                return 'bg-rd-secondary';
        }
    };

    const getLabelBg = () => {
        switch (type) {
            case 'success':
                return 'bg-rd-success-bg text-rd-success';
            case 'warning':
                return 'bg-rd-warning-bg text-rd-warning';
            case 'info':
                return 'bg-rd-info-bg text-rd-info';
        }
    };

    const getIcon = () => {
        switch (type) {
            case 'success':
                return TrendingUp;
            case 'warning':
                return AlertTriangle;
            case 'info':
                return Lightbulb;
        }
    };

    const getLabelText = () => {
        switch (type) {
            case 'success':
                return 'Excelente';
            case 'warning':
                return 'Atención';
            case 'info':
                return 'Consejo';
        }
    };

    return (
        <div className={cn(
            'relative overflow-hidden rounded-3xl border border-border p-6',
            'bg-gradient-to-br transition-all duration-300',
            'hover:shadow-xl hover:scale-[1.01]',
            'group animate-rise'
        )}>
            {/* Animated background gradient */}
            <div className={cn(
                'absolute inset-0 pointer-events-none',
                'bg-gradient-to-br blur-3xl',
                getGradient(),
                'opacity-50 animate-pulse-soft'
            )} />

            {/* Decorative particles */}
            <div className="absolute -right-4 -top-4 h-40 w-40 rounded-full bg-gradient-to-br from-white/20 to-transparent blur-2xl opacity-30" />
            
            <div className="relative flex items-start gap-6">
                {/* Animated icon container */}
                <div className={cn(
                    'relative flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-2xl shadow-lg',
                    getIconBg(),
                    'transition-all duration-300',
                    'group-hover:scale-110 group-hover:shadow-xl'
                )}>
                    {/* Pulsing ring */}
                    <div className={cn(
                        'absolute inset-0 rounded-2xl animate-pulse-soft opacity-20',
                        getIconBg()
                    )} />
                    
                    {/* Icon with subtle rotation */}
                    <Sparkles className={cn(
                        'h-8 w-8 text-white relative z-10',
                        'animate-float'
                    )} />
                </div>

                {/* Content */}
                <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                        <h3 className="text-base font-bold text-rd-gray-800">Coach IA</h3>
                        <span className={cn(
                            'px-3 py-1 rounded-full text-xs font-semibold',
                            getLabelBg()
                        )}>
                            {getLabelText()}
                        </span>
                    </div>
                    <p className="text-sm leading-relaxed text-rd-gray-700 font-medium">
                        {insight}
                    </p>
                </div>
            </div>

            {/* CTA Link */}
            <Link
                href="/app/coach"
                className={cn(
                    'mt-5 inline-flex items-center gap-2 text-sm font-semibold',
                    'transition-all duration-200',
                    type === 'success' && 'text-rd-calm-green hover:text-rd-calm-green/80',
                    type === 'warning' && 'text-rd-rose hover:text-rd-rose/80',
                    type === 'info' && 'text-rd-secondary hover:text-rd-secondary/80',
                    'group-hover:gap-3'
                )}
            >
                Ver análisis completo
                <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
            </Link>
        </div>
    );
}