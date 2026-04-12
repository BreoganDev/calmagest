'use client';

import { useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';

interface Category {
    name: string;
    icon: string;
    color: string;
    importance: string;
}

interface CategorySelectorProps {
    value: string;
    onChange: (category: string) => void;
    categories: Category[];
    showBudgetInfo?: boolean;
    budgetRemaining?: number;
    className?: string;
}

export function CategorySelector({
    value,
    onChange,
    categories,
    showBudgetInfo = false,
    budgetRemaining,
    className = '',
}: CategorySelectorProps) {
    const [isOpen, setIsOpen] = useState(false);

    const selectedCategory = categories.find((c) => c.name === value);

    const colorClasses: Record<string, string> = {
        blue: 'bg-blue-100 text-blue-700 border-blue-200',
        green: 'bg-green-100 text-green-700 border-green-200',
        purple: 'bg-purple-100 text-purple-700 border-purple-200',
        yellow: 'bg-yellow-100 text-yellow-700 border-yellow-200',
        cyan: 'bg-cyan-100 text-cyan-700 border-cyan-200',
        red: 'bg-red-100 text-red-700 border-red-200',
        indigo: 'bg-indigo-100 text-indigo-700 border-indigo-200',
        slate: 'bg-slate-100 text-slate-700 border-slate-200',
        amber: 'bg-amber-100 text-amber-700 border-amber-200',
        emerald: 'bg-emerald-100 text-emerald-700 border-emerald-200',
        gray: 'bg-gray-100 text-gray-700 border-gray-200',
        pink: 'bg-pink-100 text-pink-700 border-pink-200',
        violet: 'bg-violet-100 text-violet-700 border-violet-200',
        rose: 'bg-rose-100 text-rose-700 border-rose-200',
        orange: 'bg-orange-100 text-orange-700 border-orange-200',
        lime: 'bg-lime-100 text-lime-700 border-lime-200',
        sky: 'bg-sky-100 text-sky-700 border-sky-200',
    };

    return (
        <div className={`relative ${className}`}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between gap-3 rounded-2xl border-2 border-slate-200 bg-white p-4 text-left transition-all hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-500"
            >
                {selectedCategory ? (
                    <div className="flex items-center gap-3 flex-1">
                        <span className="text-2xl">{selectedCategory.icon}</span>
                        <div className="flex-1">
                            <p className="font-semibold text-slate-900">{selectedCategory.name}</p>
                            {showBudgetInfo && budgetRemaining !== undefined && (
                                <p className={`text-xs ${budgetRemaining >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    Disponible: {(budgetRemaining / 100).toFixed(2)}€
                                </p>
                            )}
                        </div>
                    </div>
                ) : (
                    <span className="text-slate-500">Selecciona una categoría</span>
                )}
                <ChevronDown className={`h-5 w-5 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <>
                    <div
                        className="fixed inset-0 z-10"
                        onClick={() => setIsOpen(false)}
                    />
                    <div className="absolute z-20 mt-2 w-full max-h-96 overflow-y-auto rounded-2xl border-2 border-slate-200 bg-white shadow-2xl">
                        <div className="p-2">
                            {/* Vitales */}
                            <div className="mb-2">
                                <p className="px-3 py-2 text-xs font-bold text-slate-500 uppercase">Vitales</p>
                                {categories
                                    .filter((c) => c.importance === 'VITAL')
                                    .map((category) => (
                                        <button
                                            key={category.name}
                                            type="button"
                                            onClick={() => {
                                                onChange(category.name);
                                                setIsOpen(false);
                                            }}
                                            className={`w-full flex items-center gap-3 rounded-xl p-3 transition-all hover:bg-slate-50 ${value === category.name ? 'bg-slate-100' : ''
                                                }`}
                                        >
                                            <span className="text-2xl">{category.icon}</span>
                                            <span className="flex-1 text-left font-medium text-slate-900">
                                                {category.name}
                                            </span>
                                            {value === category.name && (
                                                <Check className="h-5 w-5 text-green-600" />
                                            )}
                                        </button>
                                    ))}
                            </div>

                            {/* Neutras */}
                            <div className="mb-2">
                                <p className="px-3 py-2 text-xs font-bold text-slate-500 uppercase">Neutras</p>
                                {categories
                                    .filter((c) => c.importance === 'NEUTRO')
                                    .map((category) => (
                                        <button
                                            key={category.name}
                                            type="button"
                                            onClick={() => {
                                                onChange(category.name);
                                                setIsOpen(false);
                                            }}
                                            className={`w-full flex items-center gap-3 rounded-xl p-3 transition-all hover:bg-slate-50 ${value === category.name ? 'bg-slate-100' : ''
                                                }`}
                                        >
                                            <span className="text-2xl">{category.icon}</span>
                                            <span className="flex-1 text-left font-medium text-slate-900">
                                                {category.name}
                                            </span>
                                            {value === category.name && (
                                                <Check className="h-5 w-5 text-green-600" />
                                            )}
                                        </button>
                                    ))}
                            </div>

                            {/* Superfluas */}
                            <div>
                                <p className="px-3 py-2 text-xs font-bold text-slate-500 uppercase">Superfluas</p>
                                {categories
                                    .filter((c) => c.importance === 'SUPERFLUO')
                                    .map((category) => (
                                        <button
                                            key={category.name}
                                            type="button"
                                            onClick={() => {
                                                onChange(category.name);
                                                setIsOpen(false);
                                            }}
                                            className={`w-full flex items-center gap-3 rounded-xl p-3 transition-all hover:bg-slate-50 ${value === category.name ? 'bg-slate-100' : ''
                                                }`}
                                        >
                                            <span className="text-2xl">{category.icon}</span>
                                            <span className="flex-1 text-left font-medium text-slate-900">
                                                {category.name}
                                            </span>
                                            {value === category.name && (
                                                <Check className="h-5 w-5 text-green-600" />
                                            )}
                                        </button>
                                    ))}
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
