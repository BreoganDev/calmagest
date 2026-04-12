'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Money } from '@/components/ui/money';
import Link from 'next/link';

interface Expense {
    id: string;
    name: string;
    amount: number;
    date: string;
    type?: 'variable' | 'fijo';
}

interface CategoryBudgetCardProps {
    category: string;
    icon: string;
    color: string;
    budget: number;
    spent: number;
    remaining: number;
    percentage: number;
    isOverBudget: boolean;
    expenses: Expense[];
}

export function CategoryBudgetCard({
    category,
    icon,
    budget,
    spent,
    remaining,
    percentage,
    isOverBudget,
    expenses,
}: CategoryBudgetCardProps) {
    const [isExpanded, setIsExpanded] = useState(false);

    return (
        <div
            className={`rounded-2xl border-2 p-6 shadow-sm transition-all ${isOverBudget
                ? 'border-red-200 bg-red-50'
                : 'border-slate-200 bg-white hover:shadow-md'
                }`}
        >
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3 flex-1">
                    <span className="text-3xl">{icon}</span>
                    <div className="flex-1">
                        <h3 className="text-lg font-bold text-slate-900">{category}</h3>
                        <p className="text-xs text-slate-500">
                            {isOverBudget ? '¡Presupuesto excedido!' : 'Dentro del presupuesto'}
                        </p>
                    </div>
                </div>
                <div className="text-right">
                    <p className="text-2xl font-bold text-slate-900">
                        <Money amount={spent} />
                    </p>
                    <p className="text-xs text-slate-500">
                        de <Money amount={budget} />
                    </p>
                </div>
            </div>

            {/* Progress Bar */}
            <div className="mb-3">
                <div className="h-3 w-full rounded-full bg-slate-200 overflow-hidden">
                    <div
                        className={`h-full rounded-full transition-all ${isOverBudget
                            ? 'bg-red-500'
                            : percentage > 80
                                ? 'bg-amber-500'
                                : 'bg-green-500'
                            }`}
                        style={{ width: `${Math.min(percentage, 100)}%` }}
                    />
                </div>
            </div>

            <div className="flex items-center justify-between text-sm mb-4">
                <span className={`font-semibold ${isOverBudget ? 'text-red-600' : 'text-slate-600'}`}>
                    {percentage.toFixed(1)}% usado
                </span>
                <span className={`font-semibold ${remaining >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {remaining >= 0 ? 'Quedan' : 'Excedido'}{' '}
                    <Money amount={Math.abs(remaining)} />
                </span>
            </div>

            {/* Expandable Expenses List */}
            {expenses.length > 0 && (
                <>
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="w-full flex items-center justify-between rounded-xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-200"
                    >
                        <span>Ver {expenses.length} gastos</span>
                        {isExpanded ? (
                            <ChevronUp className="h-4 w-4" />
                        ) : (
                            <ChevronDown className="h-4 w-4" />
                        )}
                    </button>

                    {isExpanded && (
                        <div className="mt-4 space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-4">
                            {expenses.map((expense) => (
                                <div
                                    key={expense.id}
                                    className="flex items-center justify-between rounded-lg bg-white px-3 py-2 text-sm"
                                >
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <p className="font-medium text-slate-900">{expense.name}</p>
                                            {expense.type === 'fijo' && (
                                                <span className="rounded-md bg-blue-100 px-1.5 py-0.5 text-[10px] font-bold text-blue-700 uppercase">
                                                    Fijo
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-xs text-slate-500">
                                            {new Date(expense.date).toLocaleDateString('es-ES', {
                                                day: 'numeric',
                                                month: 'short',
                                                year: 'numeric',
                                            })}
                                        </p>
                                    </div>
                                    <p className="font-bold text-slate-900">
                                        <Money amount={expense.amount} />
                                    </p>
                                </div>
                            ))}
                            <div className="mt-3 flex items-center justify-between border-t border-slate-200 pt-3">
                                <span className="text-sm font-semibold text-slate-700">Total</span>
                                <span className="text-lg font-bold text-slate-900">
                                    <Money amount={spent} />
                                </span>
                            </div>
                        </div>
                    )}
                </>
            )}

            {expenses.length === 0 && (
                <div className="rounded-xl bg-slate-100 px-4 py-3 text-center text-sm text-slate-500">
                    No hay gastos registrados en esta categoría
                </div>
            )}
        </div>
    );
}
