'use client';

import { TrendingUp, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { Money } from '@/components/ui/money';

interface HeroBalanceCardProps {
    balance: number;
    income: number;
    expenses: number;
    savings: number;
    investment: number;
    changePercent: number;
    monthLabel: string;
}

export function HeroBalanceCard({
    balance,
    income,
    expenses,
    savings,
    investment,
    changePercent,
    monthLabel
}: HeroBalanceCardProps) {
    const isPositive = changePercent >= 0;

    return (
        <div className="relative w-full overflow-hidden rounded-[2rem] bg-gradient-to-br from-rd-rose/80 via-rd-nude/90 to-white/90 p-6 sm:p-8 shadow-glass transition-shadow hover:shadow-glass-hover border border-white/60 dark:border-white/10 dark:from-rd-rose/20 dark:via-rd-nude/10 dark:to-black/20 font-app">
            {/* Decorative elements - warm theme */}
            <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/30 dark:bg-white/5 blur-3xl" />
            <div className="absolute -bottom-20 -left-20 h-80 w-80 rounded-full bg-rd-rose/20 dark:bg-rd-rose/10 blur-3xl animate-pulse-soft" />
            
            {/* Subtle pattern overlay */}
            <div className="absolute inset-0 opacity-[0.03] mix-blend-overlay">
                <svg className="h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                    <defs>
                        <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                            <path d="M 10 0 L 0 0 0 10" fill="none" stroke="currentColor" strokeWidth="0.5"/>
                        </pattern>
                    </defs>
                    <rect width="100" height="100" fill="url(#grid)" />
                </svg>
            </div>

            <div className="relative z-10">
                {/* Header */}
                <div className="mb-4 sm:mb-6 flex items-center justify-between">
                    <div>
                        <p className="text-xs sm:text-sm font-semibold uppercase tracking-widest text-rd-gray-700/60 dark:text-rd-gray-300">Balance disponible</p>
                        <p className="text-[11px] sm:text-xs text-rd-gray-500/80 dark:text-rd-gray-400 mt-0.5">{monthLabel}</p>
                    </div>
                    <div className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold backdrop-blur-md transition-all duration-300 ${
                        isPositive 
                            ? 'bg-rd-calm-green/20 text-green-700 dark:text-green-400' 
                            : 'bg-rd-danger/20 text-red-700 dark:text-red-400'
                    }`}>
                        {isPositive ? (
                            <ArrowUpRight className="h-4 w-4" />
                        ) : (
                            <ArrowDownRight className="h-4 w-4" />
                        )}
                        <span>{Math.abs(changePercent).toFixed(1)}%</span>
                    </div>
                </div>

                {/* Balance */}
                <div className="mb-6 sm:mb-8 mt-2">
                    <div className="text-4xl sm:text-5xl lg:text-7xl font-extrabold text-rd-gray-900 dark:text-white tracking-tighter drop-shadow-sm transition-all duration-500 hover:scale-[1.01] origin-left">
                        <Money amount={balance} />
                    </div>
                </div>

                {/* Income, Expenses, Savings, Investment */}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
                    {/* Income */}
                    <div className="group min-w-0 rounded-2xl bg-white/40 dark:bg-black/20 backdrop-blur-md p-3 sm:p-4 border border-white/60 dark:border-white/10 transition-all duration-300 hover:bg-white/70 dark:hover:bg-black/40 hover:shadow-lg hover:-translate-y-1 cursor-default">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-rd-calm-green/20">
                                <ArrowUpRight className="h-3.5 w-3.5 text-rd-calm-green" />
                            </div>
                            <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-rd-gray-600/80 dark:text-rd-gray-400">Ingresos</p>
                        </div>
                        <p className="text-base sm:text-xl font-bold text-rd-gray-900 dark:text-white tracking-tight">
                            <Money amount={income} />
                        </p>
                    </div>

                    {/* Expenses */}
                    <div className="group min-w-0 rounded-2xl bg-white/40 dark:bg-black/20 backdrop-blur-md p-3 sm:p-4 border border-white/60 dark:border-white/10 transition-all duration-300 hover:bg-white/70 dark:hover:bg-black/40 hover:shadow-lg hover:-translate-y-1 cursor-default">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-rd-danger/20">
                                <ArrowDownRight className="h-3.5 w-3.5 text-rd-danger" />
                            </div>
                            <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-rd-gray-600/80 dark:text-rd-gray-400">Gastos</p>
                        </div>
                        <p className="text-base sm:text-xl font-bold text-rd-gray-900 dark:text-white tracking-tight">
                            <Money amount={expenses} />
                        </p>
                    </div>

                    {/* Savings */}
                    <div className="group min-w-0 rounded-2xl bg-white/40 dark:bg-black/20 backdrop-blur-md p-3 sm:p-4 border border-white/60 dark:border-white/10 transition-all duration-300 hover:bg-white/70 dark:hover:bg-black/40 hover:shadow-lg hover:-translate-y-1 cursor-default">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-500/20">
                                <TrendingUp className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-rd-gray-600/80 dark:text-rd-gray-400">Ahorro</p>
                        </div>
                        <p className="text-base sm:text-xl font-bold text-rd-gray-900 dark:text-white tracking-tight">
                            <Money amount={savings} />
                        </p>
                    </div>

                    {/* Investment */}
                    <div className="group min-w-0 rounded-2xl bg-white/40 dark:bg-black/20 backdrop-blur-md p-3 sm:p-4 border border-white/60 dark:border-white/10 transition-all duration-300 hover:bg-white/70 dark:hover:bg-black/40 hover:shadow-lg hover:-translate-y-1 cursor-default">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-purple-500/20">
                                <TrendingUp className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
                            </div>
                            <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-rd-gray-600/80 dark:text-rd-gray-400">Inversión</p>
                        </div>
                        <p className="text-base sm:text-xl font-bold text-rd-gray-900 dark:text-white tracking-tight">
                            <Money amount={investment} />
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
